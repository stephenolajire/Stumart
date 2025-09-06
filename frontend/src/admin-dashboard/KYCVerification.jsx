// KYCVerification.jsx
import React, { useState, useMemo, useCallback } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { MEDIA_BASE_URL } from "../constant/api";
import {
  useKYCVerifications,
  useUpdateKYCStatus,
} from "./hooks/useKYCVerification";

const KYCVerification = () => {
  const [status, setStatus] = useState("");
  const [userType, setUserType] = useState("");
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      status,
      user_type: userType,
    }),
    [status, userType]
  );

  // Fetch KYC verifications with current filters
  const {
    data: verifications = [],
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
    isRefetching,
  } = useKYCVerifications(filters);

  // Mutations
  const updateStatusMutation = useUpdateKYCStatus();

  const handleViewDetails = useCallback((verification) => {
    setSelectedVerification(verification);
    setUpdateStatus(verification.verification_status);
    setRejectionReason(verification.rejection_reason || "");
    setShowModal(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setShowModal(false);
    setSelectedVerification(null);
    setUpdateStatus("");
    setRejectionReason("");
  }, []);

  const handleStatusUpdate = useCallback(async () => {
    if (!selectedVerification) return;

    try {
      const payload = {
        verification_status: updateStatus,
      };

      if (updateStatus === "rejected" && rejectionReason) {
        payload.rejection_reason = rejectionReason;
      }

      await updateStatusMutation.mutateAsync({
        id: selectedVerification.id,
        ...payload,
      });

      handleCloseDetails();
      // Success feedback could be added here (toast notification)
    } catch (err) {
      console.error("Error updating verification status:", err);
      alert("Failed to update verification status. Please try again.");
    }
  }, [
    selectedVerification,
    updateStatus,
    rejectionReason,
    updateStatusMutation,
    handleCloseDetails,
  ]);

  const clearFilters = useCallback(() => {
    setStatus("");
    setUserType("");
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading && !verifications.length) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4">
            <p className="font-medium">Failed to load KYC verifications</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold text-gray-900">
              KYC Verifications
            </h2>
            {verifications.length > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {verifications.length}
              </span>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            disabled={isFetching}
          >
            {isRefetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All User Types</option>
              <option value="vendor">Vendors</option>
              <option value="picker">Pickers</option>
              <option value="student_picker">Student Pickers</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isFetching && !isRefetching && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg">
            <span className="text-gray-700">Loading verifications...</span>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission Date
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
              {verifications.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {isFetching ? "Loading..." : "No KYC verifications found"}
                  </td>
                </tr>
              ) : (
                verifications.map((verification) => (
                  <tr
                    key={verification.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {verification.user_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {verification.user_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {verification.user_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {verification.id_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(verification.submission_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                          verification.verification_status
                        )}`}
                      >
                        {verification.verification_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                        onClick={() => handleViewDetails(verification)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KYC Verification Details Modal */}
      {showModal && selectedVerification && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseDetails}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                KYC Verification Details
              </h3>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                onClick={handleCloseDetails}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-8">
              {/* User Information */}
              <div>
                <h5 className="text-lg font-semibold text-gray-900 mb-4">
                  User Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="text-gray-900">
                      {selectedVerification.user_name}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="text-gray-900">
                      {selectedVerification.user_email}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">
                      User Type:
                    </span>
                    <span className="text-gray-900 capitalize">
                      {selectedVerification.user_type}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">ID Type:</span>
                    <span className="text-gray-900 capitalize">
                      {selectedVerification.id_type}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">
                      Submission Date:
                    </span>
                    <span className="text-gray-900">
                      {formatDate(selectedVerification.submission_date)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">
                      Verification Date:
                    </span>
                    <span className="text-gray-900">
                      {formatDate(selectedVerification.verification_date)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">
                      Current Status:
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                        selectedVerification.verification_status
                      )}`}
                    >
                      {selectedVerification.verification_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <h5 className="text-lg font-semibold text-gray-900 mb-4">
                  Verification Documents
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h6 className="font-medium text-gray-900 mb-3">
                      Selfie Image
                    </h6>
                    {selectedVerification.selfie_image ? (
                      <img
                        src={selectedVerification.selfie_image}
                        alt="Selfie"
                        className="w-full h-48 object-cover rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                        No selfie image provided
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h6 className="font-medium text-gray-900 mb-3">
                      ID Document
                    </h6>
                    {selectedVerification.id_image ? (
                      <img
                        src={selectedVerification.id_image}
                        alt="ID Document"
                        className="w-full h-48 object-cover rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                        No ID image provided
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Update Section */}
              <div>
                <h5 className="text-lg font-semibold text-gray-900 mb-4">
                  Update Status
                </h5>
                <div className="space-y-4">
                  <div>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      disabled={updateStatusMutation.isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {updateStatus === "rejected" && (
                    <div>
                      <label
                        htmlFor="rejectionReason"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Rejection Reason:
                      </label>
                      <textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a reason for rejection"
                        disabled={updateStatusMutation.isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                        rows="3"
                      />
                    </div>
                  )}

                  <button
                    className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                    onClick={handleStatusUpdate}
                    disabled={
                      updateStatusMutation.isLoading ||
                      updateStatus ===
                        selectedVerification.verification_status ||
                      (updateStatus === "rejected" && !rejectionReason.trim())
                    }
                  >
                    {updateStatusMutation.isLoading
                      ? "Updating..."
                      : "Update Status"}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t bg-gray-50">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={handleCloseDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerification;
