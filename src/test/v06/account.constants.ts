import { createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";
import { ethers } from "ethers";
import {
  ETH_RPC,
  STACKUP_V1_PM_RPC,
  VIEM_PUBLIC_CLIENT,
  VIEM_NODE_PUBLIC_CLIENT,
  VIEM_BUNDLER_PUBLIC_CLIENT,
  ETHERS_JSON_RPC_PROVIDER,
  ETHERS_NODE_JSON_RPC_PROVIDER,
  ETHERS_BUNDLER_JSON_RPC_PROVIDER,
} from "../helpers";
import { V06 } from "../..";

const EOA_PK = generatePrivateKey();
const VIEM_ACC = privateKeyToAccount(EOA_PK);
const VIEM_WALLET_CLIENT = createWalletClient({
  account: VIEM_ACC,
  chain: localhost,
  transport: http(ETH_RPC),
});
const VIEM_WALLET_CLIENT_NO_HOIST = createWalletClient({
  chain: localhost,
  transport: http(ETH_RPC),
});
const ETHERS_WALLET = new ethers.BaseWallet(new ethers.SigningKey(EOA_PK));

export const ACCOUNTS = [
  {
    type: "SimpleAccount, withViemWalletClient (account hoisted)",
    instance: new V06.Account.Instance({
      ...V06.Account.Common.SimpleAccount.base(
        VIEM_PUBLIC_CLIENT,
        VIEM_WALLET_CLIENT,
      ),
    }),
  },
  {
    type: "SimpleAccount, withViemWalletClient (account not hoisted)",
    instance: new V06.Account.Instance({
      ...V06.Account.Common.SimpleAccount.base(
        VIEM_PUBLIC_CLIENT,
        VIEM_WALLET_CLIENT_NO_HOIST,
        VIEM_ACC,
      ),
    }),
  },
  {
    type: "SimpleAccount, with JsonRpcProvider",
    instance: new V06.Account.Instance({
      ...V06.Account.Common.SimpleAccount.base(
        ETHERS_JSON_RPC_PROVIDER,
        VIEM_WALLET_CLIENT,
      ),
    }),
  },
  {
    type: "SimpleAccount, withEthersSigner",
    instance: new V06.Account.Instance({
      ...V06.Account.Common.SimpleAccount.base(
        VIEM_PUBLIC_CLIENT,
        ETHERS_WALLET,
      ),
    }),
  },
  {
    type: "SimpleAccount, with separate viem node and bundler PublicClients",
    instance: new V06.Account.Instance({
      ...V06.Account.Common.SimpleAccount.base(
        VIEM_NODE_PUBLIC_CLIENT,
        VIEM_WALLET_CLIENT,
      ),

      bundlerClient: VIEM_BUNDLER_PUBLIC_CLIENT,
    }),
  },
  {
    type: "SimpleAccount, with separate ethers node and bundler JsonRpcProviders",
    instance: new V06.Account.Instance({
      ...V06.Account.Common.SimpleAccount.base(
        ETHERS_NODE_JSON_RPC_PROVIDER,
        VIEM_WALLET_CLIENT,
      ),

      bundlerClient: ETHERS_BUNDLER_JSON_RPC_PROVIDER,
    }),
  },
  {
    type: "SimpleAccount, with Stackup V1 PAYG paymaster",
    instance: new V06.Account.Instance({
      ...V06.Account.Common.SimpleAccount.base(
        VIEM_PUBLIC_CLIENT,
        VIEM_WALLET_CLIENT,
      ),

      requestPaymaster: V06.Account.Hooks.RequestPaymaster.withCommon({
        variant: "stackupV1",
        parameters: { rpcUrl: STACKUP_V1_PM_RPC, type: "payg" },
      }),
    }),
  },
];
