import React, { useState, useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import styles from "./css/ManageVendors.module.css";
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
      <div className={styles.error}>
        <p>Failed to load vendors</p>
        <button onClick={() => refetch()} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.vendorsContainer}>
      <div className={styles.headerSection}>
        <div className={styles.titleSection}>
          <h2 className={styles.sectionTitle}>
            Manage Vendors
            {vendors.length > 0 && (
              <span className={styles.vendorCount}>({vendors.length})</span>
            )}
          </h2>
          <button
            onClick={() => refetch()}
            className={styles.refreshButton}
            disabled={isFetching}
          >
            {isRefetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className={styles.filterSection}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Search vendors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>

          <div className={styles.filterControls}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.filterSelect}
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
              className={styles.filterSelect}
            >
              <option value="">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>

            <button onClick={clearFilters} className={styles.clearButton}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {isFetching && !isRefetching && (
        <div className={styles.loadingOverlay}>
          <span>Searching...</span>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.vendorsTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Business Name</th>
              <th>Category</th>
              <th>Rating</th>
              <th>Joined</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.noData}>
                  {isFetching ? "Searching..." : "No vendors found"}
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => {
                const isUpdating = isVendorBeingUpdated(vendor.id);

                return (
                  <tr
                    key={vendor.id}
                    className={isUpdating ? styles.updating : ""}
                  >
                    <td>{vendor.id}</td>
                    <td className={styles.businessName}>
                      {vendor.business_name}
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>
                        {vendor.business_category}
                      </span>
                    </td>
                    <td>
                      <div className={styles.ratingContainer}>
                        <span className={styles.ratingValue}>
                          {vendor.rating || 0}
                        </span>
                        <span className={styles.ratingCount}>
                          ({vendor.total_ratings || 0})
                        </span>
                      </div>
                    </td>
                    <td>{new Date(vendor.date_joined).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`${styles.verifiedBadge} ${
                          vendor.is_verified
                            ? styles.verified
                            : styles.unverified
                        }`}
                      >
                        {vendor.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleShowDetails(vendor)}
                          className={`${styles.actionButton} ${styles.view}`}
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
                          className={`${styles.actionButton} ${styles.verify}`}
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

      {/* Vendor Details Modal */}
      {showModal && selectedVendor && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Vendor Details</h3>
              <button
                className={styles.closeButton}
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.vendorProfile}>
                <div className={styles.profileImageSection}>
                  {selectedVendor.shop_image && (
                    <img
                      src={`${MEDIA_BASE_URL}${selectedVendor.shop_image}`}
                      alt={selectedVendor.business_name}
                      className={styles.shopImage}
                      loading="lazy"
                    />
                  )}
                </div>

                <div className={styles.businessInfo}>
                  <h4 className={styles.businessTitle}>
                    {selectedVendor.business_name}
                  </h4>
                  <p className={styles.ownerName}>
                    {selectedVendor.user?.first_name}{" "}
                    {selectedVendor.user?.last_name}
                  </p>
                  <span
                    className={`${styles.verificationStatus} ${
                      selectedVendor.is_verified
                        ? styles.verified
                        : styles.unverified
                    }`}
                  >
                    {selectedVendor.is_verified ? "✓ Verified" : "⚠ Unverified"}
                  </span>
                </div>
              </div>

              <div className={styles.detailsGrid}>
                <div className={styles.detailSection}>
                  <h5 className={styles.sectionTitle}>Business Information</h5>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Business ID:</span>
                    <span className={styles.value}>{selectedVendor.id}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Category:</span>
                    <span className={styles.value}>
                      {selectedVendor.business_category}
                    </span>
                  </div>
                  {selectedVendor.specific_category && (
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Specific Category:</span>
                      <span className={styles.value}>
                        {selectedVendor.specific_category}
                      </span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Rating:</span>
                    <span className={styles.value}>
                      {selectedVendor.rating || 0} (
                      {selectedVendor.total_ratings || 0} reviews)
                    </span>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <h5 className={styles.sectionTitle}>Contact Information</h5>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Email:</span>
                    <span className={styles.value}>{selectedVendor.email}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Phone:</span>
                    <span className={styles.value}>
                      {selectedVendor.phone_number}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>State:</span>
                    <span className={styles.value}>{selectedVendor.state}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Institution:</span>
                    <span className={styles.value}>
                      {selectedVendor.institution}
                    </span>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <h5 className={styles.sectionTitle}>Banking Information</h5>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Account Name:</span>
                    <span className={styles.value}>
                      {selectedVendor.account_name}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Account Number:</span>
                    <span className={styles.value}>
                      {selectedVendor.account_number}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Bank:</span>
                    <span className={styles.value}>
                      {selectedVendor.bank_name}
                    </span>
                  </div>
                  {selectedVendor.paystack_recipient_code && (
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Paystack Code:</span>
                      <span className={styles.value}>
                        {selectedVendor.paystack_recipient_code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() =>
                    handleToggleVerificationStatus(
                      selectedVendor.id,
                      selectedVendor.is_verified
                    )
                  }
                  className={`${styles.actionButton} ${styles.verify}`}
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

            <div className={styles.modalFooter}>
              <button
                className={styles.closeModalButton}
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
