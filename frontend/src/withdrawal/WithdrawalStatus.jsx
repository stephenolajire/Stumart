import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";
import api from "../constant/api";

const WithdrawalStatus = () => {
  const [withdrawalId, setWithdrawalId] = useState("");
  const [statusData, setStatusData] = useState(null);

  // Status check mutation
  const statusMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.get(`status/${id}/`);
      return response.data;
    },
    onSuccess: (data) => {
      setStatusData(data);
    },
    onError: (error) => {
      setStatusData(null);
      alert(error.response?.data?.error || "Failed to fetch withdrawal status");
    },
  });

  const handleCheckStatus = () => {
    if (!withdrawalId.trim()) {
      alert("Please enter a withdrawal ID");
      return;
    }
    statusMutation.mutate(withdrawalId.trim());
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-6 h-6 text-red-500" />;
      case "processing":
        return <Clock className="w-6 h-6 text-blue-500" />;
      case "pending":
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
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

  const getStatusMessage = (status) => {
    switch (status) {
      case "completed":
        return "Your withdrawal has been completed successfully.";
      case "failed":
        return "Your withdrawal has failed. The amount has been refunded to your wallet.";
      case "cancelled":
        return "Your withdrawal was cancelled. The amount has been refunded to your wallet.";
      case "processing":
        return "Your withdrawal is being processed. Please wait for completion.";
      case "pending":
        return "Your withdrawal is pending approval and processing.";
      default:
        return "Unknown status";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Search className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-800">
          Check Withdrawal Status
        </h2>
      </div>

      {/* Search Form */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Withdrawal ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={withdrawalId}
            onChange={(e) => setWithdrawalId(e.target.value)}
            placeholder="Enter your withdrawal ID"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
          <button
            onClick={handleCheckStatus}
            disabled={statusMutation.isPending}
            className="px-6 py-2 bg-yellow-500 text-white font-medium rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {statusMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "Check Status"
            )}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          You can find your withdrawal ID in your withdrawal history or
          confirmation email.
        </p>
      </div>

      {/* Status Result */}
      {statusData && (
        <div className="border border-gray-200 rounded-lg p-6">
          {/* Status Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(statusData.withdrawal.status)}
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Withdrawal #{statusData.withdrawal.id.slice(0, 8)}
                </h3>
                <p className="text-sm text-gray-600">
                  ₦{statusData.withdrawal.amount?.toLocaleString()}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                statusData.withdrawal.status
              )}`}
            >
              {statusData.withdrawal.status.charAt(0).toUpperCase() +
                statusData.withdrawal.status.slice(1)}
            </span>
          </div>

          {/* Status Message */}
          <div
            className={`p-4 rounded-lg mb-4 ${
              statusData.withdrawal.status === "completed"
                ? "bg-green-50 border border-green-200"
                : statusData.withdrawal.status === "failed" ||
                  statusData.withdrawal.status === "cancelled"
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <p
              className={`text-sm ${
                statusData.withdrawal.status === "completed"
                  ? "text-green-700"
                  : statusData.withdrawal.status === "failed" ||
                    statusData.withdrawal.status === "cancelled"
                  ? "text-red-700"
                  : "text-blue-700"
              }`}
            >
              {getStatusMessage(statusData.withdrawal.status)}
            </p>
          </div>

          {/* Withdrawal Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Bank Details</p>
                <p className="font-medium text-gray-800">
                  {statusData.withdrawal.bank_name}
                </p>
                <p className="text-sm text-gray-600">
                  ****{statusData.withdrawal.account_number}
                </p>
                <p className="text-sm text-gray-600">
                  {statusData.withdrawal.account_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Amount Details</p>
                <p className="font-medium text-gray-800">
                  ₦{statusData.withdrawal.amount?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Final: ₦{statusData.withdrawal.final_amount?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Timeline</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">Request Created</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(statusData.withdrawal.created_at)}
                    </p>
                  </div>
                </div>

                {statusData.withdrawal.processed_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        Processing Started
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(statusData.withdrawal.processed_at)}
                      </p>
                    </div>
                  </div>
                )}

                {statusData.withdrawal.completed_at && (
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        statusData.withdrawal.status === "completed"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        {statusData.withdrawal.status === "completed"
                          ? "Completed"
                          : "Failed/Cancelled"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(statusData.withdrawal.completed_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reference Number */}
            {statusData.withdrawal.paystack_reference && (
              <div>
                <p className="text-sm text-gray-600">Reference Number</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                    {statusData.withdrawal.paystack_reference}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(statusData.withdrawal.paystack_reference)
                    }
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy reference"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Failure Reason */}
            {statusData.withdrawal.failure_reason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">
                  Failure Reason
                </p>
                <p className="text-sm text-red-700">
                  {statusData.withdrawal.failure_reason}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => statusMutation.mutate(withdrawalId)}
                disabled={statusMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    statusMutation.isPending ? "animate-spin" : ""
                  }`}
                />
                Refresh Status
              </button>

              {statusData.withdrawal.paystack_reference && (
                <button
                  onClick={() =>
                    copyToClipboard(statusData.withdrawal.paystack_reference)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy Reference
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Need Help?</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Completed:</strong> Funds have been successfully
              transferred to your bank account.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Processing:</strong> Your withdrawal is being processed by
              our payment provider. This usually takes 1-3 business days.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Pending:</strong> Your withdrawal request is waiting for
              approval and processing.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Failed/Cancelled:</strong> The withdrawal was
              unsuccessful. Funds have been refunded to your wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => (window.location.href = "/withdrawal-history")}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View All Withdrawals
        </button>
        <button
          onClick={() => (window.location.href = "/withdraw")}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Make New Withdrawal
        </button>
      </div>
    </div>
  );
};

export default WithdrawalStatus;
