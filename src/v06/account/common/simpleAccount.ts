import {
  Account,
  Address,
  Chain,
  PublicClient,
  Transport,
  WalletClient,
} from "viem";
import { JsonRpcProvider, Signer } from "ethers";
import { AccountAbi, FactoryAbi } from "./abi/simpleAccount";
import { RequiredAccountOpts } from "../types";
import { RequestSignature } from "../hooks";

const FACTORY_ADDRESS = "0x9406Cc6185a346906296840746125a0E44976454";

export function base(
  ethClient: PublicClient | JsonRpcProvider,
  eoa: WalletClient<Transport, Chain | undefined, undefined>,
  account: Account,
): RequiredAccountOpts<typeof AccountAbi, typeof FactoryAbi>;
export function base(
  ethClient: PublicClient | JsonRpcProvider,
  eoa: WalletClient<Transport, Chain | undefined, Account> | Signer,
): RequiredAccountOpts<typeof AccountAbi, typeof FactoryAbi>;
export function base(
  ethClient: PublicClient | JsonRpcProvider,
  eoa: Signer | WalletClient,
  account?: Account,
): RequiredAccountOpts<typeof AccountAbi, typeof FactoryAbi> {
  return {
    accountAbi: AccountAbi,
    factoryAbi: FactoryAbi,
    factoryAddress: FACTORY_ADDRESS,
    ethClient,
    async setFactoryData(salt, encoder) {
      if (account !== undefined) {
        return encoder("createAccount", [account.address, salt]);
      } else if ("getAddresses" in eoa) {
        return encoder("createAccount", [(await eoa.getAddresses())[0], salt]);
      } else {
        return encoder("createAccount", [
          (await eoa.getAddress()) as Address,
          salt,
        ]);
      }
    },
    requestSignature:
      "getAddresses" in eoa
        ? account !== undefined
          ? RequestSignature.withViemWalletClient(
              eoa as WalletClient<Transport, Chain | undefined, undefined>,
              account,
            )
          : RequestSignature.withViemWalletClient(
              eoa as WalletClient<Transport, Chain | undefined, Account>,
            )
        : RequestSignature.withEthersSigner(eoa),
  };
}
