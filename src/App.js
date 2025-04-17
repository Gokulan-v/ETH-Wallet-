import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Wallet, Send, Loader2 } from "lucide-react";
import ABI from "./contractJson/EtherTransaction.json";
import './App.css';

function App() {
  const initialState = {
    contractAddress: "0xBE46bA58D315f0d6cD37bd7F313ccBfdC760e891",
    contractAbi: ABI.abi,
  };

  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState("0");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTransacting, setIsTransacting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    initializeWallet();
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleReload);
        window.ethereum.removeListener("chainChanged", handleReload);
      }
    };
  }, []);

  const handleReload = () => window.location.reload();

  const initializeWallet = async () => {
    try {
      if (window.ethereum) {
        const _provider = new ethers.providers.Web3Provider(window.ethereum);
        await _provider.send("eth_requestAccounts", []);
        const _signer = _provider.getSigner();
        const _walletAddress = await _signer.getAddress();
        const _balance = await _provider.getBalance(_walletAddress);

        setProvider(_provider);
        setSigner(_signer);
        setWalletAddress(_walletAddress);
        setBalance(ethers.utils.formatEther(_balance));
        setIsLoading(false);

        window.ethereum.on("accountsChanged", handleReload);
        window.ethereum.on("chainChanged", handleReload);
      } else {
        setToastMsg("MetaMask not detected.");
      }
    } catch (error) {
      setToastMsg(error.message);
      setIsLoading(false);
    }
  };

  const sendTransaction = async () => {
    if (!receiverAddress || !amount) {
      setToastMsg("Please enter address and amount.");
      return;
    }

    try {
      setIsTransacting(true);
      const tx = await signer.sendTransaction({
        to: receiverAddress,
        value: ethers.utils.parseEther(amount)
      });

      await tx.wait();
      setToastMsg("✅ Transaction Successful!");
      setReceiverAddress("");
      setAmount("");

      const updatedBalance = await provider.getBalance(walletAddress);
      setBalance(ethers.utils.formatEther(updatedBalance));
    } catch (error) {
      setToastMsg("❌ Transaction Failed: " + error.message);
    } finally {
      setIsTransacting(false);
      setTimeout(() => setToastMsg(""), 4000);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <Wallet size={28} />
          <h1>ETH Wallet</h1>
        </div>
        {walletAddress && (
          <div className="wallet-info">
            <div className="address">Address: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</div>
            <div className="balance">Balance: {balance} ETH</div>
          </div>
        )}
      </header>

      <main className="main-content">
        {isLoading ? (
          <div className="loader">
            <Loader2 className="spinner" />
            <p>Loading Wallet...</p>
          </div>
        ) : (
          <div className="card">
            <h2>Send ETH</h2>
            <input
              type="text"
              placeholder="Receiver Address"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount (ETH)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={sendTransaction} disabled={isTransacting}>
              {isTransacting ? (
                <>
                  <Loader2 className="spinner" /> Sending...
                </>
              ) : (
                <>
                  <Send size={16} /> Send ETH
                </>
              )}
            </button>
            {toastMsg && <div className="toast">{toastMsg}</div>}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
