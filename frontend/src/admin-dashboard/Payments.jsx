// Payments.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./css/Payments.module.css";
import api from "../constant/api";

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    query: "",
    status: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.query) params.append("query", filter.query);
      if (filter.status) params.append("status", filter.status);

      const response = await api.get("admin-payments/", { params });
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch payment transactions. Please try again later.");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "success":
        return styles.statusSuccess;
      case "pending":
        return styles.statusPending;
      case "failed":
        return styles.statusFailed;
      default:
        return "";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterSection}>
        <h3>Payment Transactions</h3>
        <div className={styles.filters}>
          <div className={styles.searchInput}>
            <input
              type="text"
              name="query"
              placeholder="Search by transaction ID or order number..."
              value={filter.query}
              onChange={handleFilterChange}
            />
          </div>
          <div className={styles.statusFilter}>
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading transactions...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.transactionsTable}>
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.transaction_id}</td>
                    <td>{transaction.order_number}</td>
                    <td>{transaction.customer_name}</td>
                    <td>₦{transaction.amount.toLocaleString()}</td>
                    <td>{transaction.payment_method}</td>
                    <td>{formatDate(transaction.created_at)}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={styles.noTransactions}>
                    No transactions found
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

export default Payments;
