import React, { useEffect, useState } from "react";
import {
  FaSearch,
  FaExclamationTriangle,
  FaCheck,
  FaEdit,
  FaTrash,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";
import Swal from "sweetalert2";
import UpdateStockModal from "./UpdateStockModal";
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
        confirmButtonColor: "#eab308",
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
        confirmButtonColor: "#eab308",
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
        confirmButtonColor: "#eab308",
        cancelButtonColor: "#ef4444",
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
          confirmButtonColor: "#eab308",
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
        confirmButtonColor: "#eab308",
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
        confirmButtonColor: "#eab308",
      });
      return;
    }

    if (!product.id) {
      console.error("Product ID is missing:", product);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Product ID is missing",
        confirmButtonColor: "#eab308",
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
        confirmButtonColor: "#eab308",
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
        confirmButtonColor: "#eab308",
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
        confirmButtonColor: "#eab308",
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
      return { label: "OUT OF STOCK", className: "bg-red-100 text-red-800" };
    } else if (stock < 10) {
      return { label: "LOW STOCK", className: "bg-orange-100 text-orange-800" };
    } else {
      return { label: "IN STOCK", className: "bg-green-100 text-green-800" };
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-0">
      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">
                Total Products
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {totalItems}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">
                Low Stock Items
              </h3>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {lowStockItems}
              </p>
            </div>
            <FaExclamationTriangle className="text-orange-500 text-2xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">
                Out of Stock
              </h3>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {outOfStockItems}
              </p>
            </div>
            <FaExclamationTriangle className="text-red-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Filter and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-gray-700"
            >
              <option value="all">All Items</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>

            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsBulkDiscountModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
            >
              <FaEdit className="mr-2" size={14} />
              All Products Discount
            </button>
            <button
              onClick={handleClearAllDiscounts}
              className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
            >
              <FaTrash className="mr-2" size={14} />
              Clear All Discounts
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-1">
                    <span>Product Name</span>
                    {sortBy === "name" &&
                      (sortDirection === "asc" ? (
                        <FaChevronUp size={12} />
                      ) : (
                        <FaChevronDown size={12} />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("price")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-1">
                    <span>Price</span>
                    {sortBy === "price" &&
                      (sortDirection === "asc" ? (
                        <FaChevronUp size={12} />
                      ) : (
                        <FaChevronDown size={12} />
                      ))}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount Price
                </th>
                <th
                  onClick={() => handleSort("stock")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-1">
                    <span>Stock Level</span>
                    {sortBy === "stock" &&
                      (sortDirection === "asc" ? (
                        <FaChevronUp size={12} />
                      ) : (
                        <FaChevronDown size={12} />
                      ))}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedProducts().map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ₦{product.price?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ₦{product.promotion_price?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.stock === 0 ? (
                          <span className="flex items-center text-red-600">
                            <FaExclamationTriangle className="mr-1" size={14} />
                            {product.stock}
                          </span>
                        ) : product.stock < 10 ? (
                          <span className="flex items-center text-orange-600">
                            <FaExclamationTriangle className="mr-1" size={14} />
                            {product.stock}
                          </span>
                        ) : (
                          <span className="flex items-center text-green-600">
                            <FaCheck className="mr-1" size={14} />
                            {product.stock}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.className}`}
                      >
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => [
                          handleUpdateStock(product),
                          fetchDetails(product.id),
                        ]}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                      >
                        <FaEdit className="mr-1" size={12} />
                        Update Stock
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePromotionClick(product)}
                        className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-full transition-colors duration-200"
                        title="Edit Discount"
                      >
                        <FaEdit size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {getSortedProducts().length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No products found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <BulkDiscountModal
        isOpen={isBulkDiscountModalOpen}
        onClose={() => setIsBulkDiscountModalOpen(false)}
        onApplyDiscount={handleBulkDiscount}
      />

      <PromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        product={selectedProductForPromotion}
        onUpdatePromotion={handleUpdatePromotion}
      />

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
