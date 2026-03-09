import React, { useState } from "react";
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
import PromotionModal from "./PromotionalModal";
import BulkDiscountModal from "./BulkDiscountModal";
import {
  useUpdateStock,
  useUpdatePromotion,
  useApplyBulkDiscount,
  useRemoveBulkDiscount,
  useStockDetails,
} from "../hooks/useVendor";

const Inventory = ({ products = [], businessCategory = "fashion" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [selectedProductForPromotion, setSelectedProductForPromotion] =
    useState(null);
  const [isBulkDiscountModalOpen, setIsBulkDiscountModalOpen] = useState(false);

  const { mutate: updateStock, isPending: isUpdatingStock } = useUpdateStock();
  const { mutate: updatePromotion, isPending: isUpdatingPromotion } =
    useUpdatePromotion();
  const { mutate: applyBulkDiscount, isPending: isApplyingBulkDiscount } =
    useApplyBulkDiscount();
  const { mutate: removeBulkDiscount, isPending: isRemovingBulkDiscount } =
    useRemoveBulkDiscount();

  const { data: stockDetails } = useStockDetails(selectedProduct?.id);

  const totalItems = products.length;
  const lowStockItems = products.filter(
    (p) => p.in_stock < 10 && p.in_stock > 0,
  ).length;
  const outOfStockItems = products.filter((p) => p.in_stock === 0).length;

  const handlePromotionClick = (product) => {
    setSelectedProductForPromotion(product);
    setIsPromotionModalOpen(true);
  };

  const handleUpdatePromotion = (productId, promotionPrice) => {
    updatePromotion(
      { productId, promotionalPrice: promotionPrice },
      {
        onSuccess: () => {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Promotion price updated successfully",
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: "#eab308",
          });
          setIsPromotionModalOpen(false);
        },
        onError: (error) => {
          throw new Error(
            error.response?.data?.message || "Failed to update promotion price",
          );
        },
      },
    );
  };

  const handleBulkDiscount = (discountData) => {
    applyBulkDiscount(
      { discount_type: discountData.type, discount_value: discountData.value },
      {
        onSuccess: () => {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Bulk discount applied successfully",
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: "#eab308",
          });
          setIsBulkDiscountModalOpen(false);
        },
        onError: (error) => {
          throw new Error(
            error.response?.data?.message || "Failed to apply bulk discount",
          );
        },
      },
    );
  };

  const handleClearAllDiscounts = async () => {
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

    if (!result.isConfirmed) return;

    removeBulkDiscount(undefined, {
      onSuccess: () => {
        Swal.fire({
          icon: "success",
          title: "Discounts Cleared!",
          text: "All promotional prices have been removed",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#eab308",
        });
      },
      onError: (error) => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to clear discounts",
          confirmButtonColor: "#eab308",
        });
      },
    });
  };

  const handleOpenUpdateStock = (product) => {
    if (!product?.id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Invalid product selected",
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

  const handleStockUpdate = (stockData) => {
    const formData = new FormData();
    formData.append("in_stock", stockData.in_stock || stockData.stock || 0);
    formData.append("price", stockData.price);

    if (stockData.sizes?.length > 0) {
      const validSizes = stockData.sizes.filter(
        (s) => s?.size && typeof s.quantity === "number" && s.quantity >= 0,
      );
      if (validSizes.length > 0)
        formData.append("sizes", JSON.stringify(validSizes));
    }

    if (stockData.colors?.length > 0) {
      const validColors = stockData.colors.filter(
        (c) => c?.color && typeof c.quantity === "number" && c.quantity >= 0,
      );
      if (validColors.length > 0)
        formData.append("colors", JSON.stringify(validColors));
    }

    if (stockData.newImages?.length > 0) {
      stockData.newImages
        .filter((img) => img?.image)
        .forEach((img) => formData.append("new_images", img.image));
    }

    updateStock(
      { productId: stockData.productId, data: formData },
      {
        onSuccess: async () => {
          await Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Stock updated successfully",
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: "#eab308",
          });
          handleModalClose();
        },
        onError: async (error) => {
          const errorMessage =
            error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to update stock. Please try again.";
          await Swal.fire({
            icon: "error",
            title: "Update Failed",
            text: errorMessage,
            confirmButtonColor: "#eab308",
          });
        },
      },
    );
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const getSortedProducts = () => {
    const filtered = products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const stock = product.in_stock ?? product.stock ?? 0;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "low-stock" && stock < 10 && stock > 0) ||
        (filterStatus === "in-stock" && stock >= 10) ||
        (filterStatus === "out-of-stock" && stock === 0);
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = a.price - b.price;
          break;
        case "stock":
          comparison =
            (a.in_stock ?? a.stock ?? 0) - (b.in_stock ?? b.stock ?? 0);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  const getStockStatus = (stock) => {
    if (stock === 0)
      return { label: "OUT OF STOCK", className: "bg-red-100 text-red-800" };
    if (stock < 10)
      return { label: "LOW STOCK", className: "bg-orange-100 text-orange-800" };
    return { label: "IN STOCK", className: "bg-green-100 text-green-800" };
  };

  const SortIcon = ({ col }) =>
    sortBy === col ? (
      sortDirection === "asc" ? (
        <FaChevronUp size={12} />
      ) : (
        <FaChevronDown size={12} />
      )
    ) : null;

  return (
    <div className="space-y-6 px-4 lg:px-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-600">Total Products</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalItems}</p>
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

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsBulkDiscountModalOpen(true)}
              disabled={isApplyingBulkDiscount}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
            >
              <FaEdit className="mr-2" size={14} />
              All Products Discount
            </button>
            <button
              onClick={handleClearAllDiscounts}
              disabled={isRemovingBulkDiscount}
              className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
            >
              <FaTrash className="mr-2" size={14} />
              {isRemovingBulkDiscount ? "Clearing..." : "Clear All Discounts"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[
                  ["name", "Product Name"],
                  ["price", "Price"],
                  [null, "Discount Price"],
                  ["stock", "Stock Level"],
                ].map(([col, label]) => (
                  <th
                    key={label}
                    onClick={col ? () => handleSort(col) : undefined}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col ? "cursor-pointer hover:bg-gray-100 transition-colors duration-150" : ""}`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{label}</span>
                      {col && <SortIcon col={col} />}
                    </div>
                  </th>
                ))}
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
              {getSortedProducts().length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No products found matching your search criteria.
                  </td>
                </tr>
              ) : (
                getSortedProducts().map((product) => {
                  const stock = product.in_stock ?? product.stock ?? 0;
                  const stockStatus = getStockStatus(stock);
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ₦{product.price?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {product.promotion_price
                          ? `₦${product.promotion_price?.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {stock === 0 ? (
                            <span className="flex items-center text-red-600">
                              <FaExclamationTriangle
                                className="mr-1"
                                size={14}
                              />
                              {stock}
                            </span>
                          ) : stock < 10 ? (
                            <span className="flex items-center text-orange-600">
                              <FaExclamationTriangle
                                className="mr-1"
                                size={14}
                              />
                              {stock}
                            </span>
                          ) : (
                            <span className="flex items-center text-green-600">
                              <FaCheck className="mr-1" size={14} />
                              {stock}
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
                          onClick={() => handleOpenUpdateStock(product)}
                          disabled={
                            isUpdatingStock &&
                            selectedProduct?.id === product.id
                          }
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors duration-200"
                        >
                          <FaEdit className="mr-1" size={12} />
                          Update Stock
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handlePromotionClick(product)}
                          disabled={
                            isUpdatingPromotion &&
                            selectedProductForPromotion?.id === product.id
                          }
                          className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 disabled:opacity-50 rounded-full transition-colors duration-200"
                          title="Edit Discount"
                        >
                          <FaEdit size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BulkDiscountModal
        isOpen={isBulkDiscountModalOpen}
        onClose={() => setIsBulkDiscountModalOpen(false)}
        onApplyDiscount={handleBulkDiscount}
        isLoading={isApplyingBulkDiscount}
      />

      <PromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        product={selectedProductForPromotion}
        onUpdatePromotion={handleUpdatePromotion}
        isLoading={isUpdatingPromotion}
      />

      <UpdateStockModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        product={selectedProduct}
        onUpdateStock={handleStockUpdate}
        businessCategory={businessCategory}
        details={stockDetails}
        isLoading={isUpdatingStock}
      />
    </div>
  );
};

export default Inventory;
