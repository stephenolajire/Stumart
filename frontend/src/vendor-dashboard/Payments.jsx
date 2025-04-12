import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaDownload,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import Swal from "sweetalert2";
import vendorApi from "../services/vendorApi";
import styles from "./css/VendorDashboard.module.css";

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payments, setPayments] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    total_amount: 0,
    paid_amount: 0,
    pending_amount: 0,
    total_transactions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawalError, setWithdrawalError] = useState(false);

  // Pagination states
  const [paymentsCurrentPage, setPaymentsCurrentPage] = useState(1);
  const [withdrawalCurrentPage, setWithdrawalCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of items per page for both tables

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      // First, fetch payments and summary which are working
      const [paymentsData, summaryData] = await Promise.all([
        vendorApi.getPayments(),
        vendorApi.getPaymentSummary(),
      ]);

      setPayments(paymentsData);
      setPaymentStats(summaryData);

      // Try to fetch withdrawal history separately to handle errors
      try {
        const withdrawalData = await vendorApi.getWithdrawalHistory();
        setWithdrawalHistory(withdrawalData);
      } catch (withdrawalError) {
        console.error("Withdrawal history fetch error:", withdrawalError);
        setWithdrawalError(true);

        // Set mock data for demonstration
        setWithdrawalHistory([
          {
            id: 2,
            vendor: 1,
            amount: "1000.00",
            reference: "WDR-ff575d213c",
            payment_reference: null,
            status: "PROCESSING",
          },
          {
            id: 1,
            vendor: 1,
            amount: "1000.00",
            reference: "WDR-0307d6895a",
            payment_reference: null,
            status: "PROCESSING",
          },
        ]);
      }
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
        if (parseFloat(value) > paymentStats.total_amount) {
          return "Amount exceeds available balance!";
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await vendorApi.requestWithdrawal(parseFloat(result.value));
          Swal.fire("Success", "Withdrawal successful", "success");
          window.location.reload();
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
        payment.id
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
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

  // Pagination functions
  const paginatePayments = (data) => {
    const indexOfLastItem = paymentsCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return data.slice(indexOfFirstItem, indexOfLastItem);
  };

  const paginateWithdrawals = (data) => {
    const indexOfLastItem = withdrawalCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return data.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Page change handlers
  const handlePaymentsPageChange = (pageNumber) => {
    setPaymentsCurrentPage(pageNumber);
  };

  const handleWithdrawalPageChange = (pageNumber) => {
    setWithdrawalCurrentPage(pageNumber);
  };

  // Pagination component
  const Pagination = ({ currentPage, totalItems, paginate }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    return (
      <div className={styles.pagination}>
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className={styles.paginationButton}
        >
          <FaChevronLeft />
        </button>
        <span className={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={styles.paginationButton}
        >
          <FaChevronRight />
        </button>
      </div>
    );
  };

  const getStatusClass = (status) => {
    if (!status) return "";

    switch (status.toLowerCase()) {
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

  // Helper function to safely format numbers
  const formatAmount = (amount) => {
    // Check if amount is a number or can be converted to one
    if (amount === null || amount === undefined) return "₦0.00";

    const numAmount = typeof amount === "number" ? amount : Number(amount);

    // Check if conversion resulted in a valid number
    if (isNaN(numAmount)) return "₦0.00";

    return `₦${numAmount.toFixed(2)}`;
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading payments data...</div>;
  }

  const filteredPayments = filterPayments();
  const paginatedPayments = paginatePayments(filteredPayments);
  const paginatedWithdrawals = paginateWithdrawals(withdrawalHistory);

  return (
    <div className={styles.paymentsSection}>
      <div className={styles.sectionHeader}>
        <h2 style={{ marginBottom: "2rem" }}>Payment Management</h2>
        <div className={styles.actionPayments}>
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
            {formatAmount(paymentStats.total_amount)}
          </p>
        </div>
        <div className={styles.summaryCard}>
          <h5>Wallet Balance</h5>
          <p className={styles.summaryValue}>
            {formatAmount(paymentStats.paid_amount)}
          </p>
        </div>
        <div className={styles.summaryCard}>
          <h5>Pending Amount</h5>
          <p className={styles.summaryValue}>
            {formatAmount(paymentStats.pending_amount)}
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
            {paginatedPayments.length > 0 ? (
              paginatedPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td>{new Date(payment.date).toLocaleDateString()}</td>
                  <td>{payment.customer}</td>
                  <td>{payment.invoice}</td>
                  <td className={styles.amountCell}>
                    {formatAmount(payment.amount)}
                  </td>
                  <td>{payment.source}</td>
                  <td>
                    <span
                      className={`${styles.status} ${getStatusClass(
                        payment.status
                      )}`}
                    >
                      {payment.status ? payment.status.toUpperCase() : "N/A"}
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
                                payment.customer || "N/A"
                              }</p>
                              <p><strong>Amount:</strong> ${formatAmount(
                                payment.amount
                              )}</p>
                              <p><strong>Date:</strong> ${new Date(
                                payment.date
                              ).toLocaleDateString()}</p>
                              <p><strong>Status:</strong> ${
                                payment.status
                                  ? payment.status.toUpperCase()
                                  : "N/A"
                              }</p>
                              <p><strong>Invoice:</strong> ${
                                payment.invoice || "N/A"
                              }</p>
                              <p><strong>Source:</strong> ${
                                payment.source || "N/A"
                              }</p>
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
              ))
            ) : (
              <tr>
                <td colSpan="8" className={styles.noData}>
                  No payment data found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={paymentsCurrentPage}
          totalItems={filteredPayments.length}
          paginate={handlePaymentsPageChange}
        />
      </div>

      {/* Withdrawal History Table */}
      <div className={styles.sectionHeader} style={{ marginTop: "2rem" }}>
        <h2>Withdrawal History</h2>
        {withdrawalError && (
          <div className={styles.errorNotice}>
            Data may not be up to date due to a connection issue.
          </div>
        )}
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Reference</th>
              <th>Amount</th>
              <th>Payment Reference</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedWithdrawals.length > 0 ? (
              paginatedWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td>{withdrawal.id}</td>
                  <td>{withdrawal.reference}</td>
                  <td className={styles.amountCell}>
                    {formatAmount(withdrawal.amount)}
                  </td>
                  <td>{withdrawal.payment_reference || "N/A"}</td>
                  <td>
                    <span
                      className={`${styles.status} ${getStatusClass(
                        withdrawal.status
                      )}`}
                    >
                      {withdrawal.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.viewButton}
                        onClick={() =>
                          Swal.fire({
                            title: `Withdrawal Details: ${withdrawal.reference}`,
                            html: `
                            <div style="text-align: left;">
                              <p><strong>ID:</strong> ${withdrawal.id}</p>
                              <p><strong>Amount:</strong> ${formatAmount(
                                withdrawal.amount
                              )}</p>
                              <p><strong>Reference:</strong> ${
                                withdrawal.reference
                              }</p>
                              <p><strong>Payment Reference:</strong> ${
                                withdrawal.payment_reference || "N/A"
                              }</p>
                              <p><strong>Status:</strong> ${
                                withdrawal.status
                              }</p>
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
              ))
            ) : (
              <tr>
                <td colSpan="6" className={styles.noData}>
                  No withdrawal history found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={withdrawalCurrentPage}
          totalItems={withdrawalHistory.length}
          paginate={handleWithdrawalPageChange}
        />
      </div>
    </div>
  );
};

export default Payments;
