import { Address, PublicClient, Hash } from "viem";
import { JsonRpcProvider } from "ethers";
import * as EntryPoint from "../entryPoint";
import { UserOperationReceipt } from "./types";

export const SendUserOperationWithEthClient = async (
  userOp: EntryPoint.UserOperation,
  entryPoint: Address,
  ethClient: PublicClient | JsonRpcProvider,
): Promise<Hash> => {
  return ethClient instanceof JsonRpcProvider
    ? ethClient.send("eth_sendUserOperation", [
        EntryPoint.toRawUserOperation(userOp),
        entryPoint,
      ])
    : ethClient.transport.request({
        method: "eth_sendUserOperation",
        params: [userOp, entryPoint],
      });
};

export const GetUserOperationReceiptWithEthClient = async (
  userOpHash: Hash,
  ethClient: PublicClient | JsonRpcProvider,
): Promise<UserOperationReceipt | null> => {
  return ethClient instanceof JsonRpcProvider
    ? ethClient.send("eth_getUserOperationReceipt", [userOpHash])
    : ethClient.transport.request({
        method: "eth_getUserOperationReceipt",
        params: [userOpHash],
      });
};
