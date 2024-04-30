import { WalletClient, Account, Transport, Chain } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { RequestSignatureFunc } from "../types";

export function withViemWalletClient(
  client: WalletClient<Transport, Chain | undefined, Account>,
): RequestSignatureFunc {
  const dummy = privateKeyToAccount(generatePrivateKey());
  return async (type, message) => {
    switch (type) {
      case "dummy": {
        return dummy.signMessage({ message: { raw: message } });
      }

      case "final": {
        return (
          client as WalletClient<Transport, Chain | undefined, Account>
        ).signMessage({
          message: { raw: message },
        });
      }
    }
  };
}
