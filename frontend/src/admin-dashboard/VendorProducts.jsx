import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import { MEDIA_BASE_URL } from "../constant/api";
import { useVendorProducts } from "./hooks/useManageVendors";

const VendorProducts = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch vendor products
  const {
    data: productsData,
    isLoading,
    error,
    isError,
  } = useVendorProducts(parseInt(vendorId));

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4">
            <p className="font-medium">Failed to load vendor products</p>
            <p className="text-sm mt-1">{error?.message || "Unknown error"}</p>
          </div>
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!productsData) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-600 text-lg">No data available</p>
          <button
            onClick={() => navigate("/admin-dashboard/vendors")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { vendor, products = [], total_products } = productsData;

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="py-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8 px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/admin-dashboard/vendors")}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Go back to dashboard"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {vendor?.name || "Vendor Products"}
              </h1>
              <p className="text-gray-600 mt-1">
                Viewing all products for this vendor
              </p>
            </div>
          </div>
          <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
            {total_products} Products
          </span>
        </div>

        {/* Vendor Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-gray-600 text-sm">Business Category</p>
              <p className="text-lg font-semibold text-gray-900">
                {vendor?.category || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Rating</p>
              <p className="text-lg font-semibold text-gray-900">
                {vendor?.rating || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Verified Status</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  vendor?.verified
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {vendor?.verified ? "✓ Verified" : "⚠ Unverified"}
              </span>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Products</p>
              <p className="text-lg font-semibold text-gray-900">
                {total_products}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="px-6">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">
              {products.length === 0
                ? "No products found for this vendor"
                : "No products match your filters"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promotion Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      In Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keyword
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      {/* Product Name with Image */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {product.image && (
                            <img
                              src={`${MEDIA_BASE_URL}${product.image}`}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                              loading="lazy"
                            />
                          )}
                          <span className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {product.name}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ₦{parseFloat(product.price).toFixed(2)}
                      </td>

                      {/* Promotion Price */}
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.promotion_price > 0 ? (
                          <span className="text-green-600 font-semibold">
                            ₦{parseFloat(product.promotion_price).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>

                      {/* In Stock */}
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            product.in_stock > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.in_stock}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {product.gender || "N/A"}
                        </span>
                      </td>

                      {/* Keyword */}
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="text-gray-700">
                          {product.keyword || "N/A"}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Results Summary */}
            <div className="px-6 py-4 bg-gray-50 border-t text-sm text-gray-600">
              Showing {filteredProducts.length} of {total_products} products
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProducts;
