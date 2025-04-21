import React, { useState, useEffect } from "react";
import styles from "./css/ManageVendors.module.css";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";
import api from "../constant/api";

const ManageVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [verified, setVerified] = useState("");

  useEffect(() => {
    fetchVendors();
  }, [query, category, verified]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      let url = "vendors/";
      const params = new URLSearchParams();

      if (query) params.append("query", query);
      if (category) params.append("category", category);
      if (verified) params.append("verified", verified);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      setVendors(response.data);
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
                  <th>Owner</th>
                  <th>Category</th>
                  <th>Products</th>
                  <th>Sales</th>
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
                      <td>{vendor.user_name}</td>
                      <td>
                        <span className={styles.categoryBadge}>
                          {vendor.business_category}
                        </span>
                      </td>
                      <td>{vendor.total_products}</td>
                      <td>₦{vendor?.total_sales?.toLocaleString()}</td>
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
                            onClick={() =>
                              toggleVerificationStatus(
                                vendor.id,
                                vendor.is_verified
                              )
                            }
                            className={`${styles.actionButton} ${styles.verify}`}
                          >
                            {vendor.is_verified ? "Unverify" : "Verify"}
                          </button>
                          <button
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
    </div>
  );
};

export default ManageVendors;
