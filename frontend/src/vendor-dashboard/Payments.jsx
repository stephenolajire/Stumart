import React, { useState, useEffect } from "react";
import { FaSearch, FaDownload, FaEye } from "react-icons/fa";
import Swal from "sweetalert2";
import vendorApi from "../services/vendorApi";
import styles from "./css/VendorDashboard.module.css";

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    total_amount: 0,
    paid_amount: 0,
    pending_amount: 0,
    total_transactions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const [paymentsData, summaryData] = await Promise.all([
        vendorApi.getPayments(),
        vendorApi.getPaymentSummary(),
      ]);

      setPayments(paymentsData);
      setPaymentStats(summaryData);
    } catch (error) {
      console.error("Payments data fetch error:", error);
      Swal.fire("Error", "Failed to fetch payment data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = () => {
    Swal.fire({
      title: "Request Withdrawal",
      input: "number",
      inputLabel: "Enter amount to withdraw",
      inputPlaceholder: "Enter amount",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to enter an amount!";
        }
        if (parseFloat(value) <= 0) {
          return "Amount must be greater than zero!";
        }
        if (parseFloat(value) > paymentStats.paid_amount) {
          return "Amount exceeds available balance!";
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await vendorApi.requestWithdrawal(parseFloat(result.value));
          Swal.fire(
            "Success",
            "Withdrawal request submitted successfully",
            "success"
          );
        } catch (error) {
          console.error("Withdrawal error:", error);
          Swal.fire(
            "Error",
            error.response?.data?.error || "Failed to process withdrawal",
            "error"
          );
        }
      }
    });
  };

  const filterPayments = () => {
    if (!payments) return [];

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    return payments.filter((payment) => {
      const paymentDate = new Date(payment.date);
      const matchesSearch =
        payment.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoice?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPeriod =
        periodFilter === "all" ||
        (periodFilter === "last7days" && paymentDate >= sevenDaysAgo) ||
        (periodFilter === "last30days" && paymentDate >= thirtyDaysAgo);

      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;

      return matchesSearch && matchesPeriod && matchesStatus;
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "paid":
        return styles.statusDelivered;
      case "processing":
        return styles.statusProcessing;
      case "pending":
        return styles.statusPending;
      case "failed":
        return styles.statusFailed;
      default:
        return "";
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading payments data...</div>;
  }

  return (
    <div className={styles.paymentsSection}>
      <div className={styles.sectionHeader}>
        <h2>Payment Management</h2>
        <div>
          <button
            style={{ backgroundColor: "black" }}
            className={styles.addButton}
            onClick={() =>
              Swal.fire(
                "Export",
                "Export functionality will be implemented soon",
                "info"
              )
            }
          >
            <FaDownload /> Export Payments
          </button>
          <button
            style={{ marginLeft: "1rem" }}
            className={styles.addButton}
            onClick={handleWithdraw}
          >
            <FaDownload /> Withdraw
          </button>
        </div>
      </div>

      <div className={styles.paymentSummary}>
        <div className={styles.summaryCard}>
          <h5>Total Payments</h5>
          <p className={styles.summaryValue}>
            {paymentStats.total_transactions}
          </p>
        </div>
        <div className={styles.summaryCard}>
          <h5>Total Revenue</h5>
          <p className={styles.summaryValue}>
            ${paymentStats.total_amount.toFixed(2)}
          </p>
        </div>
        <div className={styles.summaryCard}>
          <h5>Paid Amount</h5>
          <p className={styles.summaryValue}>
            ${paymentStats.paid_amount.toFixed(2)}
          </p>
        </div>
        <div className={styles.summaryCard}>
          <h5>Pending Amount</h5>
          <p className={styles.summaryValue}>
            ${paymentStats.pending_amount.toFixed(2)}
          </p>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Time</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Invoice</th>
              <th>Amount</th>
              <th>Source</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filterPayments().map((payment) => (
              <tr key={payment.id}>
                <td>{payment.id}</td>
                <td>{new Date(payment.date).toLocaleDateString()}</td>
                <td>{payment.customer}</td>
                <td>{payment.invoice}</td>
                <td className={styles.amountCell}>
                  ${payment.amount.toFixed(2)}
                </td>
                <td>{payment.source}</td>
                <td>
                  <span
                    className={`${styles.status} ${getStatusClass(
                      payment.status
                    )}`}
                  >
                    {payment.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.viewButton}
                      onClick={() =>
                        Swal.fire({
                          title: `Payment Details: ${payment.id}`,
                          html: `
                          <div style="text-align: left;">
                            <p><strong>Customer:</strong> ${
                              payment.customer
                            }</p>
                            <p><strong>Amount:</strong> $${payment.amount.toFixed(
                              2
                            )}</p>
                            <p><strong>Date:</strong> ${new Date(
                              payment.date
                            ).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> ${payment.status.toUpperCase()}</p>
                            <p><strong>Invoice:</strong> ${payment.invoice}</p>
                            <p><strong>Source:</strong> ${payment.source}</p>
                          </div>
                        `,
                          icon: "info",
                        })
                      }
                    >
                      <FaEye /> View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
