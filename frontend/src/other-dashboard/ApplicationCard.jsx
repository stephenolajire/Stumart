// ApplicationCard.jsx
import React, { useState } from "react";
import api from "../constant/api";

const ApplicationCard = ({ application, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [response, setResponse] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(application.id, newStatus);
    setShowStatusMenu(false);
  };

  const handleSendResponse = async () => {
    if (!response.trim()) return;

    setIsSending(true);
    setSendError(null);

    try {
      await api.post(`applications/${application.id}/respond/`, {
        response: response.trim(),
      });

      // Clear response field and show success message
      setResponse("");
      // You might want to add a success notification here

      // Refresh application data
      onStatusChange(application.id, application.status);
    } catch (err) {
      setSendError(err.response?.data?.error || "Failed to send response");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6">
      {/* Card Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {application.name}
            </h3>
            <p className="text-sm text-gray-500">
              Submitted: {formatDate(application.created_at)}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <span
              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                application.status
              )}`}
            >
              {application.status}
            </span>

            {/* Status Dropdown */}
            <div className="relative">
              <button
                className="px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
              >
                Update Status
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {[
                      { value: "pending", label: "Pending" },
                      { value: "accepted", label: "Accept" },
                      { value: "completed", label: "Complete" },
                      { value: "declined", label: "Decline" },
                      { value: "cancelled", label: "Cancel" },
                    ].map((status) => (
                      <button
                        key={status.value}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => handleStatusChange(status.value)}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Preview */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Service Requested:
            </p>
            <p className="text-gray-900">{application.description}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Requested Date:
            </p>
            <p className="text-gray-900">
              {formatDate(application.preferred_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="px-6 pb-6">
        <button
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Email:</p>
              <p className="text-gray-900">{application.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Phone:</p>
              <p className="text-gray-900">{application.phone}</p>
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Additional Details:
              </p>
              <p className="text-gray-900">
                {application.additional_details ||
                  "No additional details provided."}
              </p>
            </div>
          </div>

          {/* Response Section - Currently commented out */}
          {/* 
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Response</h4>
            {sendError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {sendError}
              </div>
            )}
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              placeholder="Enter your response to the customer..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
            />
            <button
              className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              onClick={handleSendResponse}
              disabled={isSending || !response.trim()}
            >
              {isSending ? "Sending..." : "Send Response"}
            </button>
          </div>
          */}
        </div>
      )}
    </div>
  );
};

export default ApplicationCard;
