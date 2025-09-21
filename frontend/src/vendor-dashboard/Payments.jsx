import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaDownload,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import Swal from "sweetalert2";
import vendorApi from "../user/services/vendorApi";
import { useNavigate } from "react-router-dom";

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

        // Handle both paginated response and direct array response
        let withdrawalArray;
        if (withdrawalData && typeof withdrawalData === "object") {
          // If it's a paginated response, extract results
          if (withdrawalData.results && Array.isArray(withdrawalData.results)) {
            withdrawalArray = withdrawalData.results;
          }
          // If it's already an array
          else if (Array.isArray(withdrawalData)) {
            withdrawalArray = withdrawalData;
          }
          // If it's neither, default to empty array
          else {
            withdrawalArray = [];
          }
        } else {
          withdrawalArray = [];
        }

        setWithdrawalHistory(withdrawalArray);
        setWithdrawalError(false); // Reset error state on success
      } catch (withdrawalError) {
        console.error("Withdrawal history fetch error:", withdrawalError);
        setWithdrawalError(true);
        setWithdrawalHistory([]); // Set empty array on error
      }
    } catch (error) {
      console.error("Main fetch error:", error);
      // Handle main fetch errors here
      setPayments([]);
      setPaymentStats({
        total_amount: 0,
        paid_amount: 0,
        pending_amount: 0,
        total_transactions: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Move handleWithdraw outside of fetchPayments - it should be a separate function
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
          // Instead of window.location.reload(), consider calling fetchPayments()
          fetchPayments();
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
    if (!Array.isArray(payments)) return [];

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

  const navigate = useNavigate();

  const withdraw = () => {
    navigate("/withdrawal");
  }

  // Pagination functions
  const paginatePayments = (data) => {
    if (!Array.isArray(data)) return [];

    const indexOfLastItem = paymentsCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return data.slice(indexOfFirstItem, indexOfLastItem);
  };

  const paginateWithdrawals = (data) => {
    if (!Array.isArray(data)) return [];

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
      <div className="flex items-center justify-center space-x-4 mt-6">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-yellow-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:hover:text-gray-700 transition-colors"
        >
          <FaChevronLeft />
        </button>
        <span className="text-gray-600 font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-yellow-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:hover:text-gray-700 transition-colors"
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
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading payments data...</div>
      </div>
    );
  }

  const filteredPayments = filterPayments();
  const paginatedPayments = paginatePayments(filteredPayments);
  const paginatedWithdrawals = paginateWithdrawals(withdrawalHistory);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex space-x-4">
          <button
            className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            onClick={() =>
              Swal.fire(
                "Export",
                "Export functionality will be implemented soon",
                "info"
              )
            }
          >
            <FaDownload className="mr-2" /> Export Payments
          </button>
          <button
            className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            onClick={withdraw}
          >
            <FaDownload className="mr-2" /> Withdraw
          </button>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h5 className="text-sm font-medium text-gray-600 mb-2">
            Total Payments
          </h5>
          <p className="text-3xl font-bold text-gray-900">
            {paymentStats.total_transactions}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h5 className="text-sm font-medium text-gray-600 mb-2">
            Wallet Balance
          </h5>
          <p className="text-3xl font-bold text-gray-900">
            {formatAmount(paymentStats.paid_amount)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <h5 className="text-sm font-medium text-gray-600 mb-2">
            Pending Amount
          </h5>
          <p className="text-3xl font-bold text-gray-900">
            {formatAmount(paymentStats.pending_amount)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.invoice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatAmount(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                          payment.status
                        )}`}
                      >
                        {payment.status ? payment.status.toUpperCase() : "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="flex items-center px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
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
                        <FaEye className="mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No payment data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={paymentsCurrentPage}
          totalItems={filteredPayments.length}
          paginate={handlePaymentsPageChange}
        />
      </div>

      {/* Withdrawal History Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Withdrawal History</h2>
        {withdrawalError && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
            Data may not be up to date due to a connection issue.
          </div>
        )}
      </div>

      {/* Withdrawal History Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedWithdrawals.length > 0 ? (
                paginatedWithdrawals.map((withdrawal) => (
                  <tr
                    key={withdrawal.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatAmount(withdrawal.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.payment_reference || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                          withdrawal.status
                        )}`}
                      >
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="flex items-center px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
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
                        <FaEye className="mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No withdrawal history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
