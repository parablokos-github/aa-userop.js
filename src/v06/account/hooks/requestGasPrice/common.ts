import { PublicClient } from "viem";
import { RequestGasPriceFunc } from "../types";
import { JsonRpcProvider } from "ethers";

export const withEthClient = (
  ethClient: PublicClient | JsonRpcProvider,
): RequestGasPriceFunc => {
  if (ethClient instanceof JsonRpcProvider) {
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
  }

  return async () => {
    const block = await ethClient.getBlock();
    if (!block.baseFeePerGas) {
      const gp = await ethClient.getGasPrice();
      return {
        maxFeePerGas: gp,
        maxPriorityFeePerGas: gp,
      };
    }

    const maxPriorityFeePerGas = await ethClient.estimateMaxPriorityFeePerGas();
    const maxFeePerGas = block.baseFeePerGas * 2n + maxPriorityFeePerGas;
    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  };
};
