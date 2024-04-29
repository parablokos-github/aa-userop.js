import { PublicClient } from "viem";
import { RequestGasPriceFunc } from "../types";

export const withEthPublicClient = (
  ethClient: PublicClient,
): RequestGasPriceFunc => {
  return async () => {
    const gp = await ethClient.getGasPrice();
    const maxPriorityFeePerGas = await ethClient.estimateMaxPriorityFeePerGas();
    const maxFeePerGas = gp * 2n + maxPriorityFeePerGas;

    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  };
};
