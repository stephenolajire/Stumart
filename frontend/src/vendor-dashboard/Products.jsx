import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaEdit, FaTrash, FaSearch, FaPlus } from "react-icons/fa";

const Products = ({ products, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filterProducts = () => {
    if (!products) return [];
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "low-stock" && product.in_stock < 10) ||
        (filterStatus === "active" && product.in_stock >= 10);
      return matchesSearch && matchesStatus;
    });
  };

  const getStatusLabel = (stock) => {
    if (stock < 10) return "LOW STOCK";
    return "IN STOCK";
  };

  const getStatusClass = (stock) => {
    if (stock < 10) return "bg-red-100 text-red-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Add Product Button */}
        <div>
          <Link to="/add-product">
            <button className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg shadow-sm transition-colors duration-200">
              <FaPlus className="mr-2" size={14} />
              Add New Product
            </button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-gray-700"
          >
            <option value="all">All Products</option>
            <option value="active">In Stock</option>
            <option value="low-stock">Low Stock</option>
          </select>

          {/* Search Input */}
          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Product Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Price
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Discount Price
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Category
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Stock
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filterProducts().length > 0 ? (
              filterProducts().map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    ₦{product.price?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    ₦{product.promotion_price?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {product.category}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {product.in_stock}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(
                        product.in_stock
                      )}`}
                    >
                      {getStatusLabel(product.in_stock)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors duration-200"
                        onClick={() => onDeleteProduct(product.id)}
                        title="Delete Product"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-8 px-4 text-center text-gray-500">
                  No products found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
