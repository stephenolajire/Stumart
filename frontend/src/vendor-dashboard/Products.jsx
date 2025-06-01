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
    if (stock < 10) return styles.statusLowStock;
    return styles.statusInStock;
  };

  return (
    <div className={styles.productsSection}>
      {/* <h2 style={{marginBottom:"2rem"}}>Product Management</h2> */}
      <div className={styles.flex}>
        <div className={styles.sectionHeader}>
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
        </div>
        <div className={styles.searchContainer}> 
          <input
            style={{width:"100%"}}
            type="search"
            placeholder="Search products..."
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
                <td>₦{product.price}</td>
                <td>{product.category}</td>
                <td>{product.in_stock}</td>
                <td>
                  <span
                    className={`${styles.status} ${getStatusClass(
                      product.in_stock
                    )}`}
                  >
                    {getStatusLabel(product.in_stock)}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.viewButton}>
                      <FaEye />
                    </button>
                    <Link to={`/edit-product/${product.id}`}>
                      <button className={styles.editButton}>
                        <FaEdit />
                      </button>
                    </Link>
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
