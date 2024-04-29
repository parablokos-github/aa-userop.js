import { JsonRpcProvider } from "ethers";
import { RequestGasPriceFunc } from "../types";

export const withEthJsonRpcProvider = (
  ethClient: JsonRpcProvider,
): RequestGasPriceFunc => {
  return async () => {
    const feeData = await ethClient.getFeeData();
    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
      return {
        maxFeePerGas: feeData.gasPrice || 0n,
        maxPriorityFeePerGas: feeData.gasPrice || 0n,
      };
    }

    return {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };
  };
};
