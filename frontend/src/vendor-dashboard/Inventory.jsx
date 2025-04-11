import React, { useState } from "react";
import {
  FaSearch,
  FaExclamationTriangle,
  FaCheck,
  FaEdit,
} from "react-icons/fa";
import Swal from "sweetalert2";
import styles from "./css/VendorDashboard.module.css";

const Inventory = ({ products, onUpdateStock }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

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

  const handleUpdateStock = (productId, currentStock) => {
    Swal.fire({
      title: "Update Stock",
      input: "number",
      inputLabel: "Enter new stock quantity",
      inputValue: currentStock,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || parseInt(value) < 0) {
          return "Please enter a valid stock quantity";
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onUpdateStock(productId, parseInt(result.value));
      }
    });
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
      <div className={styles.sectionHeader}>
        <h2>Inventory Management</h2>
        {/* <button className={styles.addButton}>Bulk Update</button> */}
      </div>

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
      </div>

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
                onClick={() => handleSort("category")}
                className={styles.sortableHeader}
              >
                Category{" "}
                {sortBy === "category" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("price")}
                className={styles.sortableHeader}
              >
                Price{" "}
                {sortBy === "price" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("stock")}
                className={styles.sortableHeader}
              >
                Stock Level{" "}
                {sortBy === "stock" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {getSortedProducts().map((product) => {
              const stockStatus = getStockStatus(product.stock);
              return (
                <tr key={product.id}>
                  <td className={styles.productName}>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price}</td>
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
                        onClick={() =>
                          handleUpdateStock(product.id, product.stock)
                        }
                      >
                        <FaEdit /> Update Stock
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
