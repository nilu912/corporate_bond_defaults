import React, { createContext, useContext, useState, useEffect } from "react";

interface WalletContextType {
  account: string | null;
  wallet: any | null;
  balance: number | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wallet, setWallet] = useState<any | null>(null);

  const connectWallet = async () => {
    if ("aptos" in window) {
      try {
 setIsConnecting(true);

      // Request accounts from any wallet adapter (Petra, Martian, Pontem)
      const wallets = (window as any).aptos; // or use proper adapter hook
      if (!wallets) throw new Error("No wallet found");

      // example using Petra adapter
      const response = await wallets.connect();
      setAccount(response.address);
      setWallet(wallets);

      // fetch balance via REST API
      const res = await fetch(`https://fullnode.mainnet.aptoslabs.com/v1/accounts/${response.address}`);
      const data = await res.json();
      setBalance(Number(data?.coin?.value || 0) / 1e8);

      } catch (error) {
        console.error("Failed to connect Petra wallet:", error);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert("Please install Petra Wallet to use this application");
    }
  };

  const disconnectWallet = async () => {
    if ("aptos" in window) {
      try {
        await (window as any).aptos.disconnect();
      } finally {
        setAccount(null);
        setBalance(null);
      }
    } else {
      setAccount(null);
      setBalance(null);
    }
  };

  // auto-reconnect if wallet already connected
  useEffect(() => {
    if ("aptos" in window) {
      (window as any).aptos
        .account()
        .then((acct: any) => {
          if (acct?.address) {
            setAccount(acct.address);
          }
        })
        .catch(console.error);
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        balance,
        isConnecting,
        connectWallet,
        disconnectWallet,
        wallet
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
