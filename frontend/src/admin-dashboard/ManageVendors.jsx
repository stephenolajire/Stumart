import React, { useState, useEffect } from "react";
import styles from "./css/ManageVendors.module.css";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";
import api, { MEDIA_BASE_URL } from "../constant/api";

const ManageVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [verified, setVerified] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, [query, category, verified]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      let url = "admin/vendors/";
      const params = new URLSearchParams();

      if (query) params.append("query", query);
      if (category) params.append("category", category);
      if (verified) params.append("verified", verified);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      setVendors(response.data);
      console.log(response.data)
      setLoading(false);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError("Failed to load vendors");
      setLoading(false);
    }
  };

  const toggleVerificationStatus = async (vendorId, currentStatus) => {
    try {
      await api.put(`vendors/${vendorId}/`, {
        is_verified: !currentStatus,
      });

      // Update local state
      setVendors(
        vendors.map((vendor) =>
          vendor.id === vendorId
            ? { ...vendor, is_verified: !currentStatus }
            : vendor
        )
      );
    } catch (err) {
      console.error("Error updating verification status:", err);
      alert("Failed to update verification status");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVendors();
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setVerified("");
  };

  const handleShowDetails = (vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedVendor(null);
  };

  const businessCategories = [
    "Food",
    "Clothing",
    "Electronics",
    "Books",
    "Services",
    "Health",
    "Beauty",
    "Accessories",
    "Other",
  ];

  if (loading && vendors.length === 0) return <LoadingSpinner />;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.vendorsContainer}>
      <div className={styles.headerSection}>
        <h2 className={styles.sectionTitle}>Manage Vendors</h2>
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

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.vendorsTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Business Name</th>
                  {/* <th>Owner</th> */}
                  <th>Category</th>
                  {/* <th>Products</th> */}
                  {/* <th>Sales</th> */}
                  <th>Rating</th>
                  <th>Joined</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan="10" className={styles.noData}>
                      No vendors found
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td>{vendor.id}</td>
                      <td className={styles.businessName}>
                        {vendor.business_name}
                      </td>
                      {/* <td>{vendor.user_name}</td> */}
                      <td>
                        <span className={styles.categoryBadge}>
                          {vendor.business_category}
                        </span>
                      </td>
                      {/* <td>{vendor.total_products}</td> */}
                      {/* <td>₦{vendor?.total_sales?.toLocaleString()}</td> */}
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
                      <td>
                        {new Date(vendor.date_joined).toLocaleDateString()}
                      </td>
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
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

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
                    />
                  )}
                  {/* {selectedVendor.user?.image_url && (
                    <img
                      src={selectedVendor.user.image_url}
                      alt={`${selectedVendor.user.first_name} ${selectedVendor.user.last_name}`}
                      className={styles.userImage}
                    />
                  )} */}
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
                      {selectedVendor.rating} ({selectedVendor.total_ratings}{" "}
                      reviews)
                    </span>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <h5 className={styles.sectionTitle}>Contact Information</h5>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Email:</span>
                    <span className={styles.value}>
                      {selectedVendor.email}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Phone:</span>
                    <span className={styles.value}>
                      {selectedVendor.phone_number}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>State:</span>
                    <span className={styles.value}>
                      {selectedVendor.state}
                    </span>
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
