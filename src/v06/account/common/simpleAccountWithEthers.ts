import { Address } from "abitype";
import { JsonRpcProvider, Signer } from "ethers";
import { PublicClient, WalletClient, Transport, Chain, Account } from "viem";
import { RequestSignature } from "../hooks";
import { RequiredAccountOpts } from "../types";
import { AccountAbi, FactoryAbi } from "./abi/simpleAccount";
import { FACTORY_ADDRESS } from "./factoryAddress";

export function baseWithEthers(
  ethClient: PublicClient | JsonRpcProvider,
  eoa: WalletClient<Transport, Chain | undefined, Account> | Signer,
): RequiredAccountOpts<typeof AccountAbi, typeof FactoryAbi> {
  return {
    accountAbi: AccountAbi,
    factoryAbi: FactoryAbi,
    factoryAddress: FACTORY_ADDRESS,
    ethClient,
    async setFactoryData(salt, encoder) {
      if ("getAddresses" in eoa) {
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
        ? RequestSignature.withViemWalletClient(
            eoa as WalletClient<Transport, Chain | undefined, Account>,
          )
        : RequestSignature.withEthersSigner(eoa),
  };
}
