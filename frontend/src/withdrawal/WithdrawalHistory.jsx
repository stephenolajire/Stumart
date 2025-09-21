import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import api from "../constant/api";

const WithdrawalHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [perPage] = useState(10);

  // Fetch withdrawal history
  const { data, isLoading, error } = useQuery({
    queryKey: ["withdrawal-history", currentPage, statusFilter, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await api.get(`history/?${params}`);
      return response.data;
    },
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "processing":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Failed to load withdrawal history
          </h3>
          <p className="text-gray-500">Please try again later</p>
        </div>
      </div>
    );
  }

  const { withdrawals = [], pagination = {}, wallet_balance = 0 } = data || {};

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-800">
            Withdrawal History
          </h2>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Wallet Balance</p>
          <p className="text-xl font-bold text-gray-800">
            ₦{wallet_balance?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Filter by status:
          </span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Withdrawals List */}
      {withdrawals.length > 0 ? (
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(withdrawal.status)}
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      ₦{withdrawal.amount?.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {withdrawal.bank_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                      withdrawal.status
                    )}`}
                  >
                    {withdrawal.status.charAt(0).toUpperCase() +
                      withdrawal.status.slice(1)}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(withdrawal.created_at)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Account Number</p>
                  <p className="font-medium">****{withdrawal.account_number}</p>
                </div>
                <div>
                  <p className="text-gray-600">Account Name</p>
                  <p className="font-medium">
                    {withdrawal.account_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Reference</p>
                  <p className="font-medium text-xs">
                    {withdrawal.paystack_reference || "N/A"}
                  </p>
                </div>
              </div>

              {withdrawal.failure_reason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    <strong>Failure Reason:</strong> {withdrawal.failure_reason}
                  </p>
                </div>
              )}

              <div className="mt-3 flex justify-between text-xs text-gray-500">
                <span>Created: {formatDate(withdrawal.created_at)}</span>
                {withdrawal.completed_at && (
                  <span>Completed: {formatDate(withdrawal.completed_at)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            No withdrawals found
          </h3>
          <p className="text-gray-400">
            {statusFilter
              ? `No withdrawals with status "${statusFilter}"`
              : "You haven't made any withdrawals yet"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.per_page + 1} to{" "}
            {Math.min(
              pagination.page * pagination.per_page,
              pagination.total_count
            )}{" "}
            of {pagination.total_count} results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, pagination.total_pages))].map((_, i) => {
                const page =
                  pagination.page <= 3
                    ? i + 1
                    : pagination.page >= pagination.total_pages - 2
                    ? pagination.total_pages - 4 + i
                    : pagination.page - 2 + i;

                if (page < 1 || page > pagination.total_pages) return null;

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm rounded-md ${
                      page === pagination.page
                        ? "bg-yellow-500 text-white"
                        : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalHistory;
