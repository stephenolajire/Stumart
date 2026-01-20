import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaBox,
  FaStore,
  FaStar,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTag,
  FaImage,
} from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner";
import { MEDIA_BASE_URL } from "../constant/api";
import { useVendorProducts } from "./hooks/useManageVendors";

const VendorProducts = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: productsData,
    isLoading,
    error,
    isError,
  } = useVendorProducts(parseInt(vendorId));

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <FaExclamationTriangle className="w-10 h-10 text-red-600" />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md text-center">
            <p className="font-semibold text-gray-900 mb-2">
              Failed to load vendor products
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {error?.message || "Unknown error"}
            </p>
            <button
              onClick={() => navigate("/admin-dashboard/vendors")}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              Back to Vendors
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!productsData) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-96">
          <FaBox className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-600 text-base sm:text-lg mb-4">
            No data available
          </p>
          <button
            onClick={() => navigate("/admin-dashboard/vendors")}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  const { vendor, products = [], total_products } = productsData;

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/admin-dashboard/vendors")}
              className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              title="Go back"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                {vendor?.name || "Vendor Products"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                All products for this vendor
              </p>
            </div>
          </div>
          <span className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap self-start">
            {total_products} Products
          </span>
        </div>

        {/* Vendor Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm mb-1">Category</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                {vendor?.category || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs sm:text-sm mb-1">Rating</p>
              <div className="flex items-center gap-1">
                <FaStar className="w-4 h-4 text-yellow-500" />
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  {vendor?.rating || 0}
                </p>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs sm:text-sm mb-1">Status</p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${
                  vendor?.verified
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {vendor?.verified ? (
                  <>
                    <FaCheckCircle className="w-3 h-3" />
                    Verified
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle className="w-3 h-3" />
                    Unverified
                  </>
                )}
              </span>
            </div>
            <div>
              <p className="text-gray-500 text-xs sm:text-sm mb-1">Products</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">
                {total_products}
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="relative">
            <FaSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Products Content */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
          <FaBox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-base sm:text-lg">
            {products.length === 0
              ? "No products found for this vendor"
              : "No products match your search"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Promo Price
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={`${MEDIA_BASE_URL}${product.image}`}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <FaImage className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      ₦{parseFloat(product.price).toLocaleString()}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm whitespace-nowrap">
                      {product.promotion_price > 0 ? (
                        <span className="text-green-600 font-semibold">
                          ₦
                          {parseFloat(product.promotion_price).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          product.in_stock > 0
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {product.in_stock}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm">
                      <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                        {product.gender || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(product.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex gap-3 mb-3">
                  {product.image ? (
                    <img
                      src={`${MEDIA_BASE_URL}${product.image}`}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-centershrink-0">
                      <FaImage className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 wrap-break-words">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        ₦{parseFloat(product.price).toLocaleString()}
                      </span>
                      {product.promotion_price > 0 && (
                        <span className="text-xs font-semibold text-green-600">
                          ₦
                          {parseFloat(product.promotion_price).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Stock:</span>
                    <span
                      className={`ml-2 font-semibold ${
                        product.in_stock > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {product.in_stock}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Gender:</span>
                    <span className="ml-2 text-gray-900">
                      {product.gender || "N/A"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(product.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Results Summary */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 text-xs sm:text-sm text-gray-600">
            Showing {filteredProducts.length} of {total_products} products
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProducts;
