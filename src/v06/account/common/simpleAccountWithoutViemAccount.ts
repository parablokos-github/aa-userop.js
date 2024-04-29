import { JsonRpcProvider } from "ethers";
import { PublicClient, WalletClient, Transport, Chain, Account } from "viem";
import { RequestSignature } from "../hooks";
import { RequiredAccountOpts } from "../types";
import { AccountAbi, FactoryAbi } from "./abi/simpleAccount";
import { FACTORY_ADDRESS } from "./factoryAddress";

export function baseWithoutHoistedViemAccount(
  ethClient: PublicClient | JsonRpcProvider,
  eoa: WalletClient<Transport, Chain | undefined, undefined>,
  account: Account,
): RequiredAccountOpts<typeof AccountAbi, typeof FactoryAbi> {
  return {
    accountAbi: AccountAbi,
    factoryAbi: FactoryAbi,
    factoryAddress: FACTORY_ADDRESS,
    ethClient,
    async setFactoryData(salt, encoder) {
      if (account !== undefined) {
        return encoder("createAccount", [account.address, salt]);
      } else {
        return encoder("createAccount", [(await eoa.getAddresses())[0], salt]);
      }
    },
    requestSignature:
      "getAddresses" in eoa
        ? RequestSignature.withoutViemWalletClient(
            eoa as WalletClient<Transport, Chain | undefined, undefined>,
            account,
          )
        : RequestSignature.withEthersSigner(eoa),
  };
}
