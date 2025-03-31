import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBox,
  FaShoppingCart,
  FaBoxes,
  FaCreditCard,
  FaStar,
  FaCog,
  FaChartBar,
  FaEye,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import styles from "./VendorDashboard.module.css";
import Swal from "sweetalert2";

// Placeholder for API (replace with your actual API)
const api = {
  get: async (url) => {
    // Mock data for example purposes
    const mockData = {
      "dashboard/stats": {
        totalSales: 45620,
        totalOrders: 278,
        totalProducts: 64,
        lowStock: 12,
        totalRevenue: 45620,
        pendingReviews: 8,
        revenueData: [
          { month: "Jan", value: 3200 },
          { month: "Feb", value: 4500 },
          { month: "Mar", value: 4200 },
          { month: "Apr", value: 5100 },
          { month: "May", value: 6200 },
          { month: "Jun", value: 5800 },
        ],
        salesData: [
          { month: "Jan", value: 42 },
          { month: "Feb", value: 53 },
          { month: "Mar", value: 48 },
          { month: "Apr", value: 62 },
          { month: "May", value: 73 },
          { month: "Jun", value: 65 },
        ],
      },
      products: [
        {
          id: 1,
          name: "Handcrafted Vase",
          price: 59.99,
          stock: 18,
          category: "Home Decor",
          status: "active",
        },
        {
          id: 2,
          name: "Wooden Cutting Board",
          price: 34.95,
          stock: 24,
          category: "Kitchen",
          status: "active",
        },
        {
          id: 3,
          name: "Ceramic Coffee Mug",
          price: 19.99,
          stock: 8,
          category: "Kitchen",
          status: "low-stock",
        },
        {
          id: 4,
          name: "Leather Journal",
          price: 29.95,
          stock: 32,
          category: "Stationery",
          status: "active",
        },
        {
          id: 5,
          name: "Woven Basket",
          price: 44.99,
          stock: 5,
          category: "Home Decor",
          status: "low-stock",
        },
      ],
      orders: [
        {
          id: 1001,
          customer: "John Doe",
          total: 94.94,
          date: "2025-03-25",
          status: "Delivered",
          items: 2,
        },
        {
          id: 1002,
          customer: "Sarah Miller",
          total: 149.97,
          date: "2025-03-28",
          status: "Processing",
          items: 3,
        },
        {
          id: 1003,
          customer: "David Johnson",
          total: 59.99,
          date: "2025-03-29",
          status: "Shipped",
          items: 1,
        },
        {
          id: 1004,
          customer: "Emma Wilson",
          total: 124.88,
          date: "2025-03-30",
          status: "Pending",
          items: 4,
        },
        {
          id: 1005,
          customer: "Michael Brown",
          total: 79.98,
          date: "2025-03-31",
          status: "Processing",
          items: 2,
        },
      ],
    };

    return { data: mockData[url] };
  },
};

// Component for statistics cards
const StatCard = ({ title, value, icon, color }) => (
  <div className={styles.statCard}>
    <div
      className={styles.statIcon}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {icon}
    </div>
    <div className={styles.statInfo}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  </div>
);

// Component for revenue chart
const RevenueChart = ({ data }) => (
  <div className={styles.chartCard}>
    <h3>Revenue Trend</h3>
    <div className={styles.chartPlaceholder}>
      {data.map((item, index) => (
        <div
          key={index}
          className={styles.chartBar}
          style={{
            height: `${
              (item.value / Math.max(...data.map((d) => d.value))) * 100
            }%`,
            backgroundColor: "var(--primary-500)",
          }}
        >
          <span className={styles.barValue}>${item.value}</span>
        </div>
      ))}
    </div>
    <div className={styles.chartLabels}>
      {data.map((item, index) => (
        <div key={index} className={styles.chartLabel}>
          {item.month}
        </div>
      ))}
    </div>
  </div>
);

// Component for sales chart
const SalesChart = ({ data }) => (
  <div className={styles.chartCard}>
    <h3>Monthly Orders</h3>
    <div className={styles.chartPlaceholder}>
      {data.map((item, index) => (
        <div
          key={index}
          className={styles.chartBar}
          style={{
            height: `${
              (item.value / Math.max(...data.map((d) => d.value))) * 100
            }%`,
            backgroundColor: "var(--secondary-700)",
          }}
        >
          <span className={styles.barValue}>{item.value}</span>
        </div>
      ))}
    </div>
    <div className={styles.chartLabels}>
      {data.map((item, index) => (
        <div key={index} className={styles.chartLabel}>
          {item.month}
        </div>
      ))}
    </div>
  </div>
);

const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStock: 0,
    totalRevenue: 0,
    pendingReviews: 0,
    revenueData: [],
    salesData: [],
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const navigate = useNavigate();

  const sidebarItems = [
    { id: "overview", label: "Home", icon: <FaHome /> },
    { id: "products", label: "Products", icon: <FaBox /> },
    { id: "orders", label: "Orders", icon: <FaShoppingCart /> },
    { id: "inventory", label: "Inventory", icon: <FaBoxes /> },
    { id: "payments", label: "Payments", icon: <FaCreditCard /> },
    { id: "reviews", label: "Reviews & Ratings", icon: <FaStar /> },
    { id: "settings", label: "Settings", icon: <FaCog /> },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        api.get("dashboard/stats"),
        api.get("products"),
        api.get("orders"),
      ]);

      setStats(statsRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      Swal.fire("Error", "Failed to fetch dashboard data", "error");
    }
  };

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

  const handleDeleteProduct = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--error)",
      cancelButtonColor: "var(--neutral-gray-400)",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        // Simulate deletion
        setProducts(products.filter((product) => product.id !== id));
        Swal.fire("Deleted!", "Your product has been deleted.", "success");
      }
    });
  };

  const getOrderStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return styles.statusDelivered;
      case "processing":
        return styles.statusProcessing;
      case "shipped":
        return styles.statusShipped;
      case "pending":
        return styles.statusPending;
      default:
        return "";
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className={styles.overviewGrid}>
            <StatCard
              title="Total Sales"
              value={`$${stats.totalSales.toLocaleString()}`}
              icon={<FaChartBar />}
              color="var(--primary-500)"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={<FaShoppingCart />}
              color="var(--secondary-600)"
            />
            <StatCard
              title="Total Products"
              value={stats.totalProducts}
              icon={<FaBox />}
              color="var(--primary-600)"
            />
            <StatCard
              title="Low Stock Items"
              value={stats.lowStock}
              icon={<FaBoxes />}
              color="var(--warning)"
            />
            <RevenueChart data={stats.revenueData || []} />
            <SalesChart data={stats.salesData || []} />
          </div>
        );

      case "products":
        return (
          <div className={styles.productsSection}>
            <div className={styles.sectionHeader}>
              <h2>Product Management</h2>
              <button className={styles.addButton}>Add New Product</button>
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
                          className={`${styles.status} ${
                            styles[product.status]
                          }`}
                        >
                          {product.status === "low-stock"
                            ? "LOW STOCK"
                            : "IN STOCK"}
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
                            onClick={() => handleDeleteProduct(product.id)}
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

      case "orders":
        return (
          <div className={styles.ordersSection}>
            <div className={styles.sectionHeader}>
              <h2>Order Management</h2>
              <div className={styles.orderFilters}>
                <select className={styles.filterSelect}>
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
                <input
                  type="search"
                  placeholder="Search orders..."
                  className={styles.searchInput}
                />
              </div>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className={styles.orderId}>#{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{new Date(order.date).toLocaleDateString()}</td>
                      <td>${order.total}</td>
                      <td>{order.items}</td>
                      <td>
                        <span
                          className={`${styles.status} ${getOrderStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.viewButton}>
                            <FaEye />
                          </button>
                          <button className={styles.updateButton}>
                            Update
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

      case "inventory":
      case "payments":
      case "reviews":
      case "settings":
        return (
          <div className={styles.placeholderSection}>
            <h2>{sidebarItems.find((item) => item.id === activeTab).label}</h2>
            <p>This section is under development.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <h2 className={styles.logo}>Vendor Dashboard</h2>
        </div>
        <div className={styles.navigation}>
          {sidebarItems.map((item) => (
            <div
              key={item.id}
              className={`${styles.sidebarItem} ${
                activeTab === item.id ? styles.active : ""
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.mainContent}>
        <div className={styles.topBar}>
          <h1>{sidebarItems.find((item) => item.id === activeTab).label}</h1>
          <div className={styles.vendorProfile}>
            <img src="https://via.placeholder.com/40" alt="Vendor" />
            <span>Vendor Name</span>
          </div>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default VendorDashboard;
