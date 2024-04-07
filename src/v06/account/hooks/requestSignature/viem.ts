import { WalletClient, Account, Transport, Chain } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { RequestSignatureFunc } from "../types";

export function withViemWalletClient(
  client: WalletClient<Transport, Chain | undefined, undefined>,
  account: Account,
): RequestSignatureFunc;
export function withViemWalletClient(
  client: WalletClient<Transport, Chain | undefined, Account>,
): RequestSignatureFunc;
export function withViemWalletClient(
  client: WalletClient,
  account?: Account,
): RequestSignatureFunc {
  const dummy = privateKeyToAccount(generatePrivateKey());
  return async (type, message) => {
    switch (type) {
      case "dummy": {
        return dummy.signMessage({ message: { raw: message } });
      }

      case "final": {
        if (account) {
          return client.signMessage({ account, message: { raw: message } });
        }
        return (
          client as WalletClient<Transport, Chain | undefined, Account>
        ).signMessage({
          message: { raw: message },
        });
      }
    }
  };
}
