import React, { useState, useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import LoadingSpinner from "./LoadingSpinner";
import { MEDIA_BASE_URL } from "../constant/api";
import {
  useVendors,
  useToggleVendorVerification,
  useBusinessCategories,
} from "./hooks/useManageVendors";

const ManageVendors = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [verified, setVerified] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Debounce search input for better performance
  const debouncedSearch = useDebouncedCallback((value) => {
    setDebouncedQuery(value);
  }, 500);

  // Update debounced query when query changes
  React.useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      query: debouncedQuery.trim(),
      category,
      verified,
    }),
    [debouncedQuery, category, verified]
  );

  // Fetch vendors with current filters
  const {
    data: vendors = [],
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
    isRefetching,
  } = useVendors(filters);

  // Get business categories
  const { data: businessCategories = [] } = useBusinessCategories();

  // Mutations
  const toggleVerificationMutation = useToggleVendorVerification();

  const handleToggleVerificationStatus = useCallback(
    async (vendorId, currentStatus) => {
      try {
        await toggleVerificationMutation.mutateAsync({
          vendorId,
          isVerified: currentStatus,
        });
        // Success feedback could be added here (toast notification)
      } catch (err) {
        console.error("Error updating verification status:", err);
        alert("Failed to update verification status. Please try again.");
      }
    },
    [toggleVerificationMutation]
  );

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    // The debounced search will handle the actual filtering
  }, []);

  const clearFilters = useCallback(() => {
    setQuery("");
    setCategory("");
    setVerified("");
    setDebouncedQuery("");
  }, []);

  const handleShowDetails = useCallback((vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedVendor(null);
  }, []);

  // Check if verification is being updated for a specific vendor
  const isVendorBeingUpdated = useCallback(
    (vendorId) => {
      return (
        toggleVerificationMutation.isLoading &&
        toggleVerificationMutation.variables?.vendorId === vendorId
      );
    },
    [toggleVerificationMutation]
  );

  if (isLoading && !vendors.length) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4">
            <p className="font-medium">Failed to load vendors</p>
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
            <h2 className="text-3xl font-bold text-gray-900">Manage Vendors</h2>
            {vendors.length > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {vendors.length}
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0 mb-4">
            <div className="flex-1 max-w-md">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  onClick={handleSearch}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-r-lg hover:bg-yellow-600 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {businessCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={verified}
              onChange={(e) => setVerified(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
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
            <span className="text-gray-700">Searching...</span>
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
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {isFetching ? "Searching..." : "No vendors found"}
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => {
                  const isUpdating = isVendorBeingUpdated(vendor.id);

                  return (
                    <tr
                      key={vendor.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isUpdating ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {vendor.business_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {vendor.business_category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">
                            {vendor.rating || 0}
                          </span>
                          <span className="text-gray-500">
                            ({vendor.total_ratings || 0})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(vendor.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            vendor.is_verified
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {vendor.is_verified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleShowDetails(vendor)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                            disabled={isUpdating}
                          >
                            Details
                          </button>
                          <button
                            onClick={() =>
                              handleToggleVerificationStatus(
                                vendor.id,
                                vendor.is_verified
                              )
                            }
                            className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors disabled:opacity-50"
                            disabled={isUpdating}
                          >
                            {toggleVerificationMutation.isLoading &&
                            toggleVerificationMutation.variables?.vendorId ===
                              vendor.id
                              ? "Updating..."
                              : vendor.is_verified
                              ? "Unverify"
                              : "Verify"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Details Modal */}
      {showModal && selectedVendor && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                Vendor Details
              </h3>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Vendor Profile */}
              <div className="flex items-start space-x-6 mb-8">
                <div className="flex-shrink-0">
                  {selectedVendor.shop_image && (
                    <img
                      src={`${MEDIA_BASE_URL}${selectedVendor.shop_image}`}
                      alt={selectedVendor.business_name}
                      className="w-24 h-24 rounded-lg object-cover"
                      loading="lazy"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedVendor.business_name}
                  </h4>
                  <p className="text-gray-600 mb-2">
                    {selectedVendor.user?.first_name}{" "}
                    {selectedVendor.user?.last_name}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-full ${
                      selectedVendor.is_verified
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedVendor.is_verified ? "✓ Verified" : "⚠ Unverified"}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-gray-900">
                    Business Information
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">
                        Business ID:
                      </span>
                      <span className="text-gray-900">{selectedVendor.id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">
                        Category:
                      </span>
                      <span className="text-gray-900">
                        {selectedVendor.business_category}
                      </span>
                    </div>
                    {selectedVendor.specific_category && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">
                          Specific Category:
                        </span>
                        <span className="text-gray-900">
                          {selectedVendor.specific_category}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Rating:</span>
                      <span className="text-gray-900">
                        {selectedVendor.rating || 0} (
                        {selectedVendor.total_ratings || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-gray-900">
                    Contact Information
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span className="text-gray-900">
                        {selectedVendor.email}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span className="text-gray-900">
                        {selectedVendor.phone_number}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">State:</span>
                      <span className="text-gray-900">
                        {selectedVendor.state}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">
                        Institution:
                      </span>
                      <span className="text-gray-900">
                        {selectedVendor.institution}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-gray-900">
                    Banking Information
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">
                        Account Name:
                      </span>
                      <span className="text-gray-900">
                        {selectedVendor.account_name}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">
                        Account Number:
                      </span>
                      <span className="text-gray-900">
                        {selectedVendor.account_number}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Bank:</span>
                      <span className="text-gray-900">
                        {selectedVendor.bank_name}
                      </span>
                    </div>
                    {selectedVendor.paystack_recipient_code && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">
                          Paystack Code:
                        </span>
                        <span className="text-gray-900">
                          {selectedVendor.paystack_recipient_code}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={() =>
                    handleToggleVerificationStatus(
                      selectedVendor.id,
                      selectedVendor.is_verified
                    )
                  }
                  className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                  disabled={isVendorBeingUpdated(selectedVendor.id)}
                >
                  {isVendorBeingUpdated(selectedVendor.id)
                    ? "Updating..."
                    : selectedVendor.is_verified
                    ? "Unverify Vendor"
                    : "Verify Vendor"}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t bg-gray-50">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={handleCloseModal}
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

export default ManageVendors;
