import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import styles from "./css/VendorDashboard.module.css";

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
        (filterStatus === "low-stock" && product.status === "low-stock") ||
        (filterStatus === "active" && product.status === "active");
      return matchesSearch && matchesStatus;
    });
  };

  return (
    <div className={styles.productsSection}>
      <div className={styles.sectionHeader}>
        <h2>Product Management</h2>
        <Link to="/add-product">
          <button className={styles.addButton}>Add New Product</button>
        </Link>
      </div>
      <div className={styles.filters}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Products</option>
          <option value="active">In Stock</option>
          <option value="low-stock">Low Stock</option>
        </select>
        <input
          type="search"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filterProducts().map((product) => (
              <tr key={product.id}>
                <td className={styles.productName}>{product.name}</td>
                <td>${product.price}</td>
                <td>{product.category}</td>
                <td>{product.stock}</td>
                <td>
                  <span
                    className={`${styles.status} ${styles[product.status]}`}
                  >
                    {product.status === "low-stock" ? "LOW STOCK" : "IN STOCK"}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.viewButton}>
                      <FaEye />
                    </button>
                    <button className={styles.editButton}>
                      <FaEdit />
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
