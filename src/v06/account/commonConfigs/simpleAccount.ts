import { Address, PublicClient } from "viem";
import { JsonRpcProvider } from "ethers";
import { AccountAbi, FactoryAbi } from "./abi/simpleAccount";
import { RequiredAccountOpts } from "../types";
import { RequestSignatureFunc } from "../hooks";

export const base = (
  owner: Address,
  requestSignature: RequestSignatureFunc,
  ethClient: PublicClient | JsonRpcProvider,
): RequiredAccountOpts<typeof AccountAbi, typeof FactoryAbi> => {
  return {
    accountAbi: AccountAbi,
    factoryAbi: FactoryAbi,
    factoryAddress: "0x9406Cc6185a346906296840746125a0E44976454",
    ethClient,
    setFactoryData(salt, encoder) {
      return encoder("createAccount", [owner, salt]);
    },
    requestSignature,
  };
};
