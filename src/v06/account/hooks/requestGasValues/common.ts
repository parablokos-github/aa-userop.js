import { PublicClient, Hex } from "viem";
import { JsonRpcProvider } from "ethers";
import { RequestGasValuesFunc } from "../types";
import { toRawUserOperation } from "../../../entryPoint";

interface GasEstimate {
  preVerificationGas: Hex | number;
  verificationGasLimit: Hex | number;
  callGasLimit: Hex | number;
}

export const withEthClient = (
  ethClient: PublicClient | JsonRpcProvider,
): RequestGasValuesFunc => {
  if (ethClient instanceof JsonRpcProvider) {
    return async (userop, entryPoint, stateOverrideSet) => {
      const est = (await ethClient.send(
        "eth_estimateUserOperationGas",
        stateOverrideSet !== undefined
          ? [toRawUserOperation(userop), entryPoint, stateOverrideSet]
          : [toRawUserOperation(userop), entryPoint],
      )) as GasEstimate;

      return {
        preVerificationGas: BigInt(est.preVerificationGas),
        verificationGasLimit: BigInt(est.verificationGasLimit),
        callGasLimit: BigInt(est.callGasLimit),
      };
    };
  }

  return async (userop, entryPoint, stateOverrideSet) => {
    const est = (await ethClient.transport.request({
      method: "eth_estimateUserOperationGas",
      params:
        stateOverrideSet !== undefined
          ? [userop, entryPoint, stateOverrideSet]
          : [userop, entryPoint],
    })) as GasEstimate;

    return {
      preVerificationGas: BigInt(est.preVerificationGas),
      verificationGasLimit: BigInt(est.verificationGasLimit),
      callGasLimit: BigInt(est.callGasLimit),
    };
  };
};
