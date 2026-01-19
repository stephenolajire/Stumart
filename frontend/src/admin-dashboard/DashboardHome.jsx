import React from "react";
import {
  FaMoneyBillWave,
  FaChartLine,
  FaUsers,
  FaCalendarWeek,
  FaCalendarAlt,
  FaGraduationCap,
  FaStore,
  FaTruck,
  FaBox,
  FaSync,
  FaClock,
  FaShoppingBag,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import StatCard from "./StatCard";
import LoadingSpinner from "./LoadingSpinner";
import { useDashboardStats } from "./hooks/useDashboardStats";

const DashboardHome = () => {
  const {
    data: stats,
    isLoading,
    error,
    isError,
    refetch,
  } = useDashboardStats();

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 bg-white border border-gray-200 rounded-xl p-8">
        <div className="text-gray-400 mb-4">
          <FaExclamationTriangle size={48} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-gray-500 mb-6 text-center">
          Failed to load dashboard statistics
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Prepare chart data
  const userBreakdownData = [
    {
      name: "Students",
      value: stats.user_stats.breakdown.students,
      color: "#60a5fa",
    },
    {
      name: "Vendors",
      value: stats.user_stats.breakdown.vendors,
      color: "#34d399",
    },
    {
      name: "Pickers",
      value: stats.user_stats.breakdown.pickers,
      color: "#a78bfa",
    },
  ];

  const orderStatusData = [
    {
      name: "Completed",
      value: stats.order_stats.total - stats.order_stats.pending,
      color: "#34d399",
    },
    { name: "Pending", value: stats.order_stats.pending, color: "#fbbf24" },
  ];

  const productStockData = [
    {
      name: "In Stock",
      value: stats.product_stats.total - stats.product_stats.out_of_stock,
    },
    { name: "Out of Stock", value: stats.product_stats.out_of_stock },
  ];

  const userGrowthData = [
    { name: "This Week", value: stats.user_stats.new_week },
    { name: "This Month", value: stats.user_stats.new_month },
    { name: "Total", value: stats.user_stats.total },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xl">
          <p className="text-gray-900 font-semibold">{payload[0].name}</p>
          <p className="text-gray-600">{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Overview of your platform
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium rounded-lg transition-colors shadow-sm"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin mr-2" size={14} />
              Refreshing...
            </>
          ) : (
            <>
              <FaSync className="mr-2" size={14} />
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Financial Overview Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gray-900 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900">
            Financial Overview
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Revenue"
            value={`₦${stats.financial_stats.total_sales.toLocaleString()}`}
            icon={<FaMoneyBillWave size={20} />}
          />
          <StatCard
            title="Total Profit"
            value={`₦${stats.financial_stats.total_profit.toLocaleString()}`}
            icon={<FaChartLine size={20} />}
          />
          <StatCard
            title="Weekly Sales"
            value={`₦${stats.financial_stats.recent_sales.toLocaleString()}`}
            icon={<FaMoneyBillWave size={20} />}
          />
        </div>
      </section>

      {/* User Statistics Section with Charts */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gray-900 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900">
            User Statistics
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* User Growth Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-gray-900 font-semibold mb-4">User Growth</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  style={{ fontSize: "14px" }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: "14px" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* User Breakdown Pie Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-gray-900 font-semibold mb-4">
              User Distribution
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: "14px" }}
                >
                  {userBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Users"
            value={stats?.user_stats?.total}
            icon={<FaUsers size={20} />}
          />
          <StatCard
            title="New This Week"
            value={stats?.user_stats?.new_week}
            icon={<FaCalendarWeek size={20} />}
          />
          <StatCard
            title="New This Month"
            value={stats?.user_stats?.new_month}
            icon={<FaCalendarAlt size={20} />}
          />
        </div>
      </section>

      {/* Orders & Products Section with Charts */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gray-900 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900">
            Orders & Products
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Order Status Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-gray-900 font-semibold mb-4">Order Status</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: "14px" }}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Product Stock Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-gray-900 font-semibold mb-4">
              Product Stock Status
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productStockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  style={{ fontSize: "14px" }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: "14px" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order & Product Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Orders"
            value={stats.order_stats.total}
            icon={<FaBox size={20} />}
          />
          <StatCard
            title="Recent Orders"
            value={stats.order_stats.recent}
            icon={<FaSync size={20} />}
          />
          <StatCard
            title="Pending Orders"
            value={stats.order_stats.pending}
            icon={<FaClock size={20} />}
          />
          <StatCard
            title="Total Products"
            value={stats.product_stats.total}
            icon={<FaShoppingBag size={20} />}
          />
          <StatCard
            title="Out of Stock"
            value={stats.product_stats.out_of_stock}
            icon={<FaExclamationTriangle size={20} />}
          />
        </div>
      </section>
    </div>
  );
};

export default DashboardHome;
