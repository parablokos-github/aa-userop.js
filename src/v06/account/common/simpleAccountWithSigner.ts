import { Address } from "abitype";
import { JsonRpcProvider, Signer } from "ethers";
import { PublicClient, Account } from "viem";
import { RequestSignature } from "../hooks";
import { RequiredAccountOpts } from "../types";
import { AccountAbi, FactoryAbi } from "./abi/simpleAccount";
import { FACTORY_ADDRESS } from "./factoryAddress";

export function base(
  ethClient: PublicClient | JsonRpcProvider,
  eoa: Signer,
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
      } else {
        return encoder("createAccount", [
          (await eoa.getAddress()) as Address,
          salt,
        ]);
      }
    },
    requestSignature: RequestSignature.withEthersSigner(eoa),
  };
}
