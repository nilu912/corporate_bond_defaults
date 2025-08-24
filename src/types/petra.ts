// Type definitions for Petra Wallet

declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<PetraAccount>;
      disconnect: () => Promise<void>;
      isConnected: () => Promise<boolean>;
      account: () => Promise<PetraAccount>;
      signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
      signTransaction: (transaction: any) => Promise<any>;
      signMessage: (message: any) => Promise<any>;
    };
  }
}

export interface PetraAccount {
  address: string;
  publicKey: string;
  authKey?: string;
  minKeysRequired?: number;
  numOfKeys?: number;
}