// VendorWallets.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./css/VendorWallets.module.css";

const VendorWallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWallets, setSelectedWallets] = useState([]);
  const [processingPayout, setProcessingPayout] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/payments/vendor-wallets/");
      setWallets(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch vendor wallets. Please try again later.");
      console.error("Error fetching wallets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectWallet = (walletId) => {
    if (selectedWallets.includes(walletId)) {
      setSelectedWallets(selectedWallets.filter((id) => id !== walletId));
    } else {
      setSelectedWallets([...selectedWallets, walletId]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedWallets(filteredWallets.map((wallet) => wallet.id));
    } else {
      setSelectedWallets([]);
    }
  };

  const handleProcessPayouts = async () => {
    // This would be implemented based on your backend API
    setProcessingPayout(true);
    try {
      // Example API call - replace with actual endpoint
      // await axios.post('/api/admin/payments/process-payouts/', { wallet_ids: selectedWallets });

      // For now, just show a success alert
      setTimeout(() => {
        alert("Payouts processed successfully!");
        setSelectedWallets([]);
        fetchWallets(); // Refresh wallet data
        setProcessingPayout(false);
      }, 2000);
    } catch (err) {
      setError("Failed to process payouts. Please try again later.");
      console.error("Error processing payouts:", err);
      setProcessingPayout(false);
    }
  };

  // Filter wallets based on search query
  const filteredWallets = wallets.filter(
    (wallet) =>
      wallet.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.vendor_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.account_number.includes(searchQuery)
  );

  // Calculate total amount to be paid
  const totalPayoutAmount = selectedWallets.reduce((total, walletId) => {
    const wallet = wallets.find((w) => w.id === walletId);
    return total + (wallet ? wallet.balance : 0);
  }, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Vendor Wallets</h3>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by vendor name, email or account number..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
      </div>

      {selectedWallets.length > 0 && (
        <div className={styles.payoutSection}>
          <div className={styles.payoutInfo}>
            <p>
              Selected: <strong>{selectedWallets.length}</strong> vendors
            </p>
            <p>
              Total Amount:{" "}
              <strong>₦{totalPayoutAmount.toLocaleString()}</strong>
            </p>
          </div>
          <button
            className={styles.payoutButton}
            onClick={handleProcessPayouts}
            disabled={processingPayout}
          >
            {processingPayout ? "Processing..." : "Process Payouts"}
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading vendor wallets...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.walletsTable}>
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      selectedWallets.length === filteredWallets.length &&
                      filteredWallets.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Vendor</th>
                <th>Email</th>
                <th>Balance</th>
                <th>Bank Details</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredWallets.length > 0 ? (
                filteredWallets.map((wallet) => (
                  <tr key={wallet.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedWallets.includes(wallet.id)}
                        onChange={() => handleSelectWallet(wallet.id)}
                      />
                    </td>
                    <td className={styles.vendorName}>{wallet.vendor_name}</td>
                    <td>{wallet.vendor_email}</td>
                    <td className={styles.balance}>
                      ₦{wallet.balance.toLocaleString()}
                    </td>
                    <td>
                      <div className={styles.bankDetails}>
                        <p>
                          <strong>{wallet.bank_name}</strong>
                        </p>
                        <p>{wallet.account_number}</p>
                        <p>{wallet.account_name}</p>
                      </div>
                    </td>
                    <td>{new Date(wallet.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.noWallets}>
                    No vendor wallets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorWallets;
