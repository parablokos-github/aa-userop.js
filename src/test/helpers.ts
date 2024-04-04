import { JsonRpcProvider } from "ethers";
import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
} from "viem";
import { localhost } from "viem/chains";

export const ETH_RPC = "http://localhost:8545";
export const NODE_RPC = "http://localhost:8546";
export const BUNDLER_RPC = "http://localhost:43370";
export const STACKUP_V1_PM_RPC = "http://localhost:43371";
export const VIEM_PUBLIC_CLIENT = createPublicClient({
  chain: localhost,
  transport: http(ETH_RPC),
});
export const VIEM_NODE_PUBLIC_CLIENT = createPublicClient({
  chain: localhost,
  transport: http(NODE_RPC),
});
export const VIEM_BUNDLER_PUBLIC_CLIENT = createPublicClient({
  transport: http(BUNDLER_RPC),
});
export const ETHERS_JSON_RPC_PROVIDER = new JsonRpcProvider(ETH_RPC);
export const ETHERS_NODE_JSON_RPC_PROVIDER = new JsonRpcProvider(NODE_RPC);
export const ETHERS_BUNDLER_JSON_RPC_PROVIDER = new JsonRpcProvider(
  BUNDLER_RPC,
);

export const maintainEthBalance = async (to: Address, balance: string) => {
  const curr = await VIEM_PUBLIC_CLIENT.getBalance({ address: to });
  const target = parseEther(balance);
  if (curr >= target) {
    return;
  }

  const value = target - curr;
  const signer = createWalletClient({
    chain: localhost,
    transport: http(ETH_RPC),
  });
  const [account] = await signer.getAddresses();
  return signer.sendTransaction({ account, to, value });
};
