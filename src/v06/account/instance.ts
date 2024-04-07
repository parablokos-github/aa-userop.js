import {
  Abi,
  ExtractAbiFunctionNames,
  ExtractAbiFunction,
  AbiParametersToPrimitiveTypes,
} from "abitype";
import {
  Address,
  concat,
  encodeFunctionData,
  PublicClient,
  RpcStateOverride,
  Hex,
  zeroAddress,
  isAddress,
} from "viem";
import { JsonRpcProvider, Contract } from "ethers";
import {
  AccountOpts,
  BuildUserOperationResponse,
  SendUserOperationResponse,
} from "./types";
import * as Hooks from "./hooks";
import * as Bundler from "../bundler";
import * as EntryPoint from "../entryPoint";

export class Instance<A extends Abi, F extends Abi> {
  private readonly accountAbi: A;
  private readonly factoryAbi: F;
  private readonly factoryAddress: Address;
  private readonly entryPointAddress: Address;
  private readonly ethClient: PublicClient | JsonRpcProvider;
  private readonly bundlerClient: PublicClient | JsonRpcProvider;

  private salt: bigint;
  private waitTimeoutMs: number;
  private waitIntervalMs: number;
  private sender: `0x${string}` = zeroAddress;
  private initCode: Hex = "0x";
  private callData: Hex = "0x";
  private nonceKey = 0n;
  private stateOverrideSet?: RpcStateOverride;

  private setFactoryData: Hooks.SetFactoryDataFunc<F>;
  private requestSignature: Hooks.RequestSignatureFunc;
  private requestGasPrice: Hooks.RequestGasPriceFunc;
  private requestGasValues: Hooks.RequestGasValuesFunc;
  private requestPaymaster?: Hooks.RequestPaymasterFunc;
  private onBuild?: Hooks.OnBuildFunc;

  constructor(opts: AccountOpts<A, F>) {
    this.accountAbi = opts.accountAbi;
    this.factoryAbi = opts.factoryAbi;
    this.factoryAddress = opts.factoryAddress;
    this.entryPointAddress =
      opts.entryPointAddress ?? EntryPoint.DEFAULT_ADDRESS;
    this.ethClient = opts.ethClient;
    this.bundlerClient = opts.bundlerClient ?? this.ethClient;

    this.salt = opts.salt ?? 0n;
    this.waitTimeoutMs = opts.waitTimeoutMs ?? 60000;
    this.waitIntervalMs = opts.waitIntervalMs ?? 3000;

    this.setFactoryData = opts.setFactoryData;
    this.requestSignature = opts.requestSignature;
    this.requestGasPrice =
      opts.requestGasPrice ??
      Hooks.RequestGasPrice.withEthClient(this.ethClient);
    this.requestGasValues =
      opts.requestGasValues ??
      Hooks.RequestGasValues.withEthClient(this.bundlerClient);
    this.requestPaymaster = opts.requestPaymaster;
    this.onBuild = opts.onBuild;
  }

  private async getInitCode(): Promise<Hex> {
    if (this.initCode === "0x") {
      this.initCode = concat([
        this.factoryAddress,
        await this.setFactoryData(this.salt, (method, inputs) => {
          return encodeFunctionData({
            abi: this.factoryAbi as Abi,
            functionName: method as string,
            args: inputs as unknown[],
          });
        }),
      ]);
    }

    return this.initCode;
  }

  private async getChainId(): Promise<number> {
    if (this.ethClient instanceof JsonRpcProvider) {
      const network = await this.ethClient.getNetwork();
      return Number(network.chainId);
    }
    return this.ethClient.getChainId();
  }

  private async getByteCode(address: Address): Promise<string | undefined> {
    if (this.ethClient instanceof JsonRpcProvider) {
      return this.ethClient.getCode(address);
    }
    return this.ethClient.getBytecode({ address });
  }

  private async resolveSenderMeta(): Promise<
    Pick<EntryPoint.UserOperation, "nonce" | "initCode">
  > {
    const sender = await this.getSender();
    const [nonce, code] = await Promise.all([
      this.getNonce(),
      this.getByteCode(sender),
    ]);

    return {
      nonce,
      initCode: code === undefined ? await this.getInitCode() : "0x",
    };
  }

  getWaitTimeoutMs(): number {
    return this.waitTimeoutMs;
  }

  setWaitTimeoutMs(time: number): Instance<A, F> {
    this.waitTimeoutMs = time;
    return this;
  }

  getWaitIntervalMs(): number {
    return this.waitIntervalMs;
  }

  setWaitIntervalMs(time: number): Instance<A, F> {
    this.waitIntervalMs = time;
    return this;
  }

  getSalt(): bigint {
    return this.salt;
  }

  setSalt(salt: bigint): Instance<A, F> {
    this.salt = salt;
    this.sender = zeroAddress;
    this.initCode = "0x";
    return this;
  }

  getNonceKey(): bigint {
    return this.nonceKey;
  }

  setNonceKey(key: bigint): Instance<A, F> {
    this.nonceKey = key;
    return this;
  }

  async getNonce(): Promise<bigint> {
    if (this.ethClient instanceof JsonRpcProvider) {
      return new Contract(
        this.entryPointAddress,
        EntryPoint.CONTRACT_ABI,
        this.ethClient,
      ).getNonce(await this.getSender(), this.nonceKey);
    }
    return this.ethClient.readContract({
      address: this.entryPointAddress,
      abi: EntryPoint.CONTRACT_ABI,
      functionName: "getNonce",
      args: [await this.getSender(), this.nonceKey],
    });
  }

  setStateOverrideSetForEstimate(
    stateOverrideSet: RpcStateOverride,
  ): Instance<A, F> {
    this.stateOverrideSet = stateOverrideSet;
    return this;
  }

  clearStateOverrideSetForEstimate(): Instance<A, F> {
    this.stateOverrideSet = undefined;
    return this;
  }

  async getSender(): Promise<Address> {
    if (this.sender !== zeroAddress) {
      return this.sender;
    }

    if (this.ethClient instanceof JsonRpcProvider) {
      try {
        await new Contract(
          this.entryPointAddress,
          EntryPoint.CONTRACT_ABI,
          this.ethClient,
        ).getSenderAddress.staticCall(this.getInitCode());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const addr = error?.revert?.args?.[0];
        if (!addr) throw error;
        this.sender = addr;
      }
    } else {
      try {
        await this.ethClient.simulateContract({
          address: this.entryPointAddress,
          abi: EntryPoint.CONTRACT_ABI,
          functionName: "getSenderAddress",
          args: [await this.getInitCode()],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const metaMessage = error?.metaMessages?.[1];
        if (typeof metaMessage !== "string") throw error;

        const addr = metaMessage.trim().slice(1, -1);
        if (!isAddress(addr)) throw error;

        this.sender = addr;
      }
    }

    return this.sender;
  }

  encodeCallData<M extends ExtractAbiFunctionNames<A>>(
    method: M,
    inputs: AbiParametersToPrimitiveTypes<ExtractAbiFunction<A, M>["inputs"]>,
  ): Instance<A, F> {
    this.callData = encodeFunctionData({
      abi: this.accountAbi as Abi,
      functionName: method as string,
      args: inputs as unknown[],
    });
    return this;
  }

  async buildUserOperation(): Promise<BuildUserOperationResponse> {
    const callData = this.callData;
    this.callData = "0x";

    const [sender, senderMeta, gasPrice, signature, chainId] =
      await Promise.all([
        this.getSender(),
        this.resolveSenderMeta(),
        this.requestGasPrice(),
        this.requestSignature("dummy", "0xdead"),
        this.getChainId(),
      ]);
    const init: EntryPoint.UserOperation = {
      ...EntryPoint.DEFAULT_USEROP,
      sender,
      ...senderMeta,
      ...gasPrice,
      callData,
      signature,
    };

    const est = await this.requestGasValues(
      init,
      this.entryPointAddress,
      this.stateOverrideSet,
    );
    const useropWithGas: EntryPoint.UserOperation = { ...init, ...est };

    const pm =
      this.requestPaymaster != undefined
        ? await this.requestPaymaster(useropWithGas, this.entryPointAddress)
        : {};
    const userOpWithPM: EntryPoint.UserOperation = {
      ...useropWithGas,
      ...pm,
    };

    const userOpHash = EntryPoint.calculateUserOpHash(
      userOpWithPM,
      this.entryPointAddress,
      chainId,
    );
    const userOperation = {
      ...userOpWithPM,
      signature: await this.requestSignature("final", userOpHash),
    };
    this.onBuild?.(userOperation);
    return { userOperation, userOpHash };
  }

  async sendUserOperation(): Promise<SendUserOperationResponse> {
    const build = await this.buildUserOperation();
    const userOpHash = await Bundler.SendUserOperationWithEthClient(
      build.userOperation,
      this.entryPointAddress,
      this.bundlerClient,
    );

    return {
      userOpHash,
      wait: async () => {
        let receipt = null;
        const end = Date.now() + this.waitTimeoutMs;
        while (Date.now() < end) {
          receipt = await Bundler.GetUserOperationReceiptWithEthClient(
            userOpHash,
            this.bundlerClient,
          );
          if (receipt != null) {
            return receipt;
          }

          await new Promise((resolve) =>
            setTimeout(resolve, this.waitIntervalMs),
          );
        }

        return receipt;
      },
    };
  }
}
