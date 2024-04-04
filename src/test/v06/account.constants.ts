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
const OWNER_ADDR = VIEM_ACC.address;
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
      ...V06.Account.CommonConfigs.SimpleAccount.base(
        OWNER_ADDR,
        V06.Account.Hooks.RequestSignature.withViemWalletClient(
          VIEM_WALLET_CLIENT,
        ),
        VIEM_PUBLIC_CLIENT,
      ),
    }),
  },
  {
    type: "SimpleAccount, withViemWalletClient (account not hoisted)",
    instance: new V06.Account.Instance({
      ...V06.Account.CommonConfigs.SimpleAccount.base(
        OWNER_ADDR,
        V06.Account.Hooks.RequestSignature.withViemWalletClient(
          VIEM_WALLET_CLIENT_NO_HOIST,
          VIEM_ACC,
        ),
        VIEM_PUBLIC_CLIENT,
      ),
    }),
  },
  {
    type: "SimpleAccount, with JsonRpcProvider",
    instance: new V06.Account.Instance({
      ...V06.Account.CommonConfigs.SimpleAccount.base(
        OWNER_ADDR,
        V06.Account.Hooks.RequestSignature.withViemWalletClient(
          VIEM_WALLET_CLIENT,
        ),
        ETHERS_JSON_RPC_PROVIDER,
      ),
    }),
  },
  {
    type: "SimpleAccount, withEthersSigner",
    instance: new V06.Account.Instance({
      ...V06.Account.CommonConfigs.SimpleAccount.base(
        OWNER_ADDR,
        V06.Account.Hooks.RequestSignature.withEthersSigner(ETHERS_WALLET),
        VIEM_PUBLIC_CLIENT,
      ),
    }),
  },
  {
    type: "SimpleAccount, with separate viem node and bundler PublicClients",
    instance: new V06.Account.Instance({
      ...V06.Account.CommonConfigs.SimpleAccount.base(
        OWNER_ADDR,
        V06.Account.Hooks.RequestSignature.withViemWalletClient(
          VIEM_WALLET_CLIENT,
        ),
        VIEM_NODE_PUBLIC_CLIENT,
      ),

      bundlerClient: VIEM_BUNDLER_PUBLIC_CLIENT,
    }),
  },
  {
    type: "SimpleAccount, with separate ethers node and bundler JsonRpcProviders",
    instance: new V06.Account.Instance({
      ...V06.Account.CommonConfigs.SimpleAccount.base(
        OWNER_ADDR,
        V06.Account.Hooks.RequestSignature.withViemWalletClient(
          VIEM_WALLET_CLIENT,
        ),
        ETHERS_NODE_JSON_RPC_PROVIDER,
      ),

      bundlerClient: ETHERS_BUNDLER_JSON_RPC_PROVIDER,
    }),
  },
  {
    type: "SimpleAccount, with Stackup V1 PAYG paymaster",
    instance: new V06.Account.Instance({
      ...V06.Account.CommonConfigs.SimpleAccount.base(
        OWNER_ADDR,
        V06.Account.Hooks.RequestSignature.withViemWalletClient(
          VIEM_WALLET_CLIENT,
        ),
        VIEM_PUBLIC_CLIENT,
      ),

      requestPaymaster: V06.Account.Hooks.RequestPaymaster.withCommon({
        variant: "stackupV1",
        parameters: { rpcUrl: STACKUP_V1_PM_RPC, type: "payg" },
      }),
    }),
  },
];
