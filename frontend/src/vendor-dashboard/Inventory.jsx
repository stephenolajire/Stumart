import React, { useEffect, useState } from "react";
import {
  FaSearch,
  FaExclamationTriangle,
  FaCheck,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import Swal from "sweetalert2";
import UpdateStockModal from "./UpdateStockModal";
import styles from "./css/Inventory.module.css";
import api from "../constant/api";
import PromotionModal from "./PromotionalModal";
import BulkDiscountModal from "./BulkDiscountModal";

const Inventory = ({
  products,
  onUpdateStock,
  businessCategory = "fashion",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [details, setDetails] = useState({});
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [selectedProductForPromotion, setSelectedProductForPromotion] =
    useState(null);
  const [isBulkDiscountModalOpen, setIsBulkDiscountModalOpen] = useState(false);
  const handlePromotionClick = (product) => {
    setSelectedProductForPromotion(product);
    setIsPromotionModalOpen(true);
  };

  const handleUpdatePromotion = async (productId, promotionPrice) => {
    try {
      const response = await api.post(
        `products/${productId}/update-promotion/`,
        {
          promotional_price: promotionPrice,
        }
      );

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Promotion price updated successfully",
        timer: 2000,
        showConfirmButton: false,
      });

      // Update local state or trigger refresh
      if (onUpdateStock) {
        onUpdateStock(response.data.product);
      }
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update promotion price"
      );
    }
  };

  const handleBulkDiscount = async (discountData) => {
    try {
      const response = await api.post("products/bulk-discount/", {
        discount_type: discountData.type,
        discount_value: discountData.value,
      });

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Bulk discount applied successfully",
        timer: 2000,
        showConfirmButton: false,
      });

      // Update local state or trigger refresh
      if (onUpdateStock) {
        onUpdateStock(response.data.products);
      }
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to apply bulk discount"
      );
    }
  };

  // Add this new function after your other handler functions
  const handleClearAllDiscounts = async () => {
    try {
      const result = await Swal.fire({
        title: "Clear All Discounts?",
        text: "This will remove promotional prices from all products. This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "var(--primary-500)",
        cancelButtonColor: "var(--error)",
        confirmButtonText: "Yes, clear all",
        cancelButtonText: "No, keep discounts",
      });

      if (result.isConfirmed) {
        // Send delete request
        await api.delete("products/bulk-discount/");

        // Show success message
        await Swal.fire({
          icon: "success",
          title: "Discounts Cleared!",
          text: "All promotional prices have been removed",
          timer: 2000,
          showConfirmButton: false,
        });

        // Update local state or trigger refresh
        if (onUpdateStock) {
          // Fetch fresh data or update local state
          const response = await api.get("products/");
          onUpdateStock(response.data);
        }
      }
    } catch (error) {
      console.error("Error clearing discounts:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to clear discounts",
      });
    }
  };

  // Calculate inventory metrics
  const totalItems = products ? products.length : 0;
  const lowStockItems = products
    ? products.filter((p) => p.stock < 10 && p.stock > 0).length
    : 0;
  const outOfStockItems = products
    ? products.filter((p) => p.stock === 0).length
    : 0;

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const handleUpdateStock = (product) => {
    // Debug: Log the product to ensure it has the correct structure
    console.log("Selected product for update:", product);
    console.log("Product ID:", product?.id, typeof product?.id);

    // Validate product data
    if (!product) {
      console.error("No product provided");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No product selected for update",
      });
      return;
    }

    if (!product.id) {
      console.error("Product ID is missing:", product);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Product ID is missing",
      });
      return;
    }

    // Ensure ID is a number
    const productId = parseInt(product.id);
    if (isNaN(productId)) {
      console.error("Invalid product ID:", product.id);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Invalid product ID",
      });
      return;
    }

    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Fixed stock update handler with proper error handling and field mapping
  const handleStockUpdate = async (stockData) => {
    try {
      // console.log("Raw stock data received:", stockData);

      const formData = new FormData();

      // Map the correct field name - your backend expects 'in_stock'
      formData.append("in_stock", stockData.in_stock || stockData.stock || 0);
      formData.append("price", stockData.price);

      // Add sizes as JSON string if they exist
      if (
        stockData.sizes &&
        Array.isArray(stockData.sizes) &&
        stockData.sizes.length > 0
      ) {
        // Filter out invalid sizes
        const validSizes = stockData.sizes.filter(
          (size) =>
            size &&
            size.size &&
            typeof size.quantity === "number" &&
            size.quantity >= 0
        );

        if (validSizes.length > 0) {
          formData.append("sizes", JSON.stringify(validSizes));
          // console.log("Sending sizes:", validSizes);
        }
      }

      // Add colors as JSON string if they exist
      if (
        stockData.colors &&
        Array.isArray(stockData.colors) &&
        stockData.colors.length > 0
      ) {
        // Filter out invalid colors
        const validColors = stockData.colors.filter(
          (color) =>
            color &&
            color.color &&
            typeof color.quantity === "number" &&
            color.quantity >= 0
        );

        if (validColors.length > 0) {
          formData.append("colors", JSON.stringify(validColors));
          // console.log("Sending colors:", validColors);
        }
      }

      // Add new images if they exist
      if (stockData.newImages && Array.isArray(stockData.newImages)) {
        const validImages = stockData.newImages.filter(
          (imageObj) => imageObj && imageObj.image
        );

        validImages.forEach((imageObj, index) => {
          formData.append("new_images", imageObj.image);
        });

        if (validImages.length > 0) {
          console.log(`Sending ${validImages.length} new images`);
        }
      }

      // Debug: Log all FormData entries
      console.log("FormData entries:");
      for (let [key, value] of formData.entries()) {
        // console.log(`${key}:`, value);
      }

      const response = await api.post(
        `products/${stockData.productId}/update-stock/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Stock update response:", response.data);

      // Show success message
      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Stock updated successfully",
        timer: 2000,
        showConfirmButton: false,
      });

      // Close modal
      handleModalClose();

      // Call the parent update function if provided
      if (onUpdateStock && typeof onUpdateStock === "function") {
        onUpdateStock(response.data.product);
      }

      return response.data;
    } catch (error) {
      console.error("Error updating stock:", error);

      // Extract error message
      let errorMessage = "Failed to update stock. Please try again.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Show error message
      await Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: errorMessage,
      });

      throw error;
    }
  };

  const fetchDetails = async (productId) => {
    const response = await api.get(`products/${productId}/update-stock`);
    try {
      if (response.data) {
        setDetails(response.data);
        // console.log(response.data)
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getSortedProducts = () => {
    if (!products) return [];

    const filteredProducts = products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "low-stock" &&
          product.stock < 10 &&
          product.stock > 0) ||
        (filterStatus === "in-stock" && product.stock >= 10) ||
        (filterStatus === "out-of-stock" && product.stock === 0);
      return matchesSearch && matchesStatus;
    });

    return filteredProducts.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "price":
          comparison = a.price - b.price;
          break;
        case "stock":
          comparison = a.stock - b.stock;
          break;
        default:
          comparison = 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { label: "OUT OF STOCK", className: styles.statusOutOfStock };
    } else if (stock < 10) {
      return { label: "LOW STOCK", className: styles.statusLowStock };
    } else {
      return { label: "IN STOCK", className: styles.statusInStock };
    }
  };

  return (
    <div className={styles.inventorySection}>
      <div className={styles.inventorySummary}>
        <div className={styles.summaryCard}>
          <h3>Total Products</h3>
          <p className={styles.summaryValue}>{totalItems}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Low Stock Items</h3>
          <p className={styles.summaryValue}>{lowStockItems}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Out of Stock</h3>
          <p className={styles.summaryValue}>{outOfStockItems}</p>
        </div>
      </div>

      <div className={styles.filters}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Items</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.actions}>
          <button
            className={styles.updateStockButton}
            onClick={() => setIsBulkDiscountModalOpen(true)}
          >
            <FaEdit /> All Products Discount
          </button>
        </div>
        <div className={styles.actions} style={{ background: "red" }}>
          <button
            className={styles.updateStockButton}
            style={{ background: "red" }}
            onClick={handleClearAllDiscounts}
          >
            <FaTrash /> Clear All discounts
          </button>
        </div>
      </div>

      <BulkDiscountModal
        isOpen={isBulkDiscountModalOpen}
        onClose={() => setIsBulkDiscountModalOpen(false)}
        onApplyDiscount={handleBulkDiscount}
      />

      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th
                onClick={() => handleSort("name")}
                className={styles.sortableHeader}
              >
                Product Name{" "}
                {sortBy === "name" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("price")}
                className={styles.sortableHeader}
              >
                Price{" "}
                {sortBy === "price" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th>Discount Price</th>
              <th
                onClick={() => handleSort("stock")}
                className={styles.sortableHeader}
              >
                Stock Level{" "}
                {sortBy === "stock" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th>Status</th>
              <th>Actions</th>
              <th>Discount</th>
            </tr>
          </thead>
          <tbody>
            {getSortedProducts().map((product) => {
              const stockStatus = getStockStatus(product.stock);
              return (
                <tr key={product.id}>
                  <td className={styles.productName}>{product.name}</td>
                  <td>₦{product.price}</td>
                  <td>₦{product.promotion_price}</td>
                  <td>
                    {product.stock === 0 ? (
                      <span className={styles.outOfStock}>
                        <FaExclamationTriangle /> {product.stock}
                      </span>
                    ) : product.stock < 10 ? (
                      <span className={styles.lowStock}>
                        <FaExclamationTriangle /> {product.stock}
                      </span>
                    ) : (
                      <span className={styles.inStock}>
                        <FaCheck /> {product.stock}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`${styles.status} ${stockStatus.className}`}
                    >
                      {stockStatus.label}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.updateStockButton}
                        onClick={() => [
                          handleUpdateStock(product),
                          fetchDetails(product.id),
                        ]}
                      >
                        <FaEdit /> Update Stock
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      className={styles.editButton}
                      onClick={() => handlePromotionClick(product)}
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        product={selectedProductForPromotion}
        onUpdatePromotion={handleUpdatePromotion}
      />

      {/* Update Stock Modal */}
      <UpdateStockModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        product={selectedProduct}
        onUpdateStock={handleStockUpdate}
        businessCategory={businessCategory}
        details={details}
      />
    </div>
  );
};

export default Inventory;
