import React, { useState } from "react";
import { FaSearch, FaDownload, FaEye } from "react-icons/fa";
import styles from "./css/VendorDashboard.module.css";

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock payment data
  const payments = [
    {
      id: "PAY-001",
      date: "2025-03-28",
      amount: 1250.75,
      status: "paid",
      source: "Online Store",
      customer: "Jane Smith",
      invoice: "INV-2835",
    },
    {
      id: "PAY-002",
      date: "2025-03-20",
      amount: 850.5,
      status: "paid",
      source: "Mobile App",
      customer: "Robert Johnson",
      invoice: "INV-2830",
    },
    {
      id: "PAY-003",
      date: "2025-03-15",
      amount: 2100.0,
      status: "paid",
      source: "Online Store",
      customer: "Sarah Williams",
      invoice: "INV-2821",
    },
    {
      id: "PAY-004",
      date: "2025-03-10",
      amount: 320.25,
      status: "processing",
      source: "Mobile App",
      customer: "Thomas Brown",
      invoice: "INV-2819",
    },
    {
      id: "PAY-005",
      date: "2025-03-05",
      amount: 1580.9,
      status: "pending",
      source: "Online Store",
      customer: "Emily Davis",
      invoice: "INV-2812",
    },
    {
      id: "PAY-006",
      date: "2025-02-25",
      amount: 760.3,
      status: "failed",
      source: "Mobile App",
      customer: "Michael Wilson",
      invoice: "INV-2805",
    },
  ];

  // Calculate payment stats
  const totalAmount = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const pendingAmount = payments
    .filter(
      (payment) =>
        payment.status === "pending" || payment.status === "processing"
    )
    .reduce((sum, payment) => sum + payment.amount, 0);
  const paidAmount = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const totalPayments = payments.length;

  const filterPayments = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));

    return payments.filter((payment) => {
      const paymentDate = new Date(payment.date);
      const matchesSearch =
        payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoice.toLowerCase().includes(searchTerm.toLowerCase());

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

  return (
    <div className={styles.paymentsSection}>
      <div className={styles.sectionHeader}>
        <h2>Payment Management</h2>
        <div>
          <button style={{backgroundColor:"black"}} className={styles.addButton}>
            <FaDownload /> Export Payments
          </button>
          <button style={{marginLeft:"1rem"}} className={styles.addButton}>
            <FaDownload /> Withdraw 
          </button>
        </div>
      </div>

      <div className={styles.paymentSummary}>
        <div className={styles.summaryCard}>
          <h5>Total Payments</h5>
          <p className={styles.summaryValue}>{totalPayments}</p>
        </div>
        <div className={styles.summaryCard}>
          <h5>Total Revenue</h5>
          <p className={styles.summaryValue}>${totalAmount.toFixed(2)}</p>
        </div>
        <div className={styles.summaryCard}>
          <h5>Paid Amount</h5>
          <p className={styles.summaryValue}>${paidAmount.toFixed(2)}</p>
        </div>
        <div className={styles.summaryCard}>
          <h5>Pending Amount</h5>
          <p className={styles.summaryValue}>${pendingAmount.toFixed(2)}</p>
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
                    <button className={styles.viewButton}>
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
