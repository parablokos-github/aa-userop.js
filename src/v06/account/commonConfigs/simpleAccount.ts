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

type SimpleAccountArgsWithViemEOA<E extends WalletClient> = [
  ethClient: PublicClient | JsonRpcProvider,
  eoa: E,
];
type SimpleAccountArgsWithViemEOANoHoist<E extends WalletClient> = [
  ethClient: PublicClient | JsonRpcProvider,
  eoa: E,
  account: Account,
];
type SimpleAccountArgsWithEthersSigner<E extends Signer> = [
  ethClient: PublicClient | JsonRpcProvider,
  eoa: E,
];

export const base = <E extends WalletClient | Signer>(
  ...args: E extends WalletClient
    ? E["account"] extends Account
      ? SimpleAccountArgsWithViemEOA<E>
      : SimpleAccountArgsWithViemEOANoHoist<E>
    : E extends Signer
      ? SimpleAccountArgsWithEthersSigner<E>
      : never
): RequiredAccountOpts<typeof AccountAbi, typeof FactoryAbi> => {
  const [ethClient, eoa, account] = args;

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
          ? RequestSignature.withViemWalletClient(eoa, account)
          : RequestSignature.withViemWalletClient(
              eoa as WalletClient<Transport, Chain | undefined, Account>,
            )
        : RequestSignature.withEthersSigner(eoa),
  };
};
