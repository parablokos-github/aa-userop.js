import { WalletClient, Transport, Chain, Account } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { RequestSignatureFunc } from "../types";

export function withoutViemWalletClient(
  client: WalletClient<Transport, Chain | undefined, undefined>,
  account: Account,
): RequestSignatureFunc {
  const dummy = privateKeyToAccount(generatePrivateKey());
  return async (type, message) => {
    switch (type) {
      case "dummy": {
        return dummy.signMessage({ message: { raw: message } });
      }

      case "final": {
        return client.signMessage({ account, message: { raw: message } });
      }
    }
  };
}
