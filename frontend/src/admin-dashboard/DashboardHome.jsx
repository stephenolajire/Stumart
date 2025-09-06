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
      <div className="flex flex-col items-center justify-center min-h-64 bg-white rounded-lg shadow-lg p-8">
        <div className="text-red-500 mb-4">
          <FaExclamationTriangle size={48} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-gray-600 mb-6 text-center">
          Failed to load dashboard statistics
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
        >
          {/* <FaRefresh className="mr-2" /> */}
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium rounded-lg shadow-sm transition-colors duration-200"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin mr-2" size={14} />
              Refreshing...
            </>
          ) : (
            <>
              {/* <FaRefresh className="mr-2" size={14} /> */}
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Financial Overview Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
          Financial Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Revenue"
            value={`₦${stats.financial_stats.total_sales.toLocaleString()}`}
            icon={<FaMoneyBillWave className="text-yellow-600" />}
            color="yellow"
          />
          <StatCard
            title="Total Profit"
            value={`₦${stats.financial_stats.total_profit.toLocaleString()}`}
            icon={<FaChartLine className="text-green-600" />}
            color="green"
          />
          <StatCard
            title="Weekly Sales"
            value={`₦${stats.financial_stats.recent_sales.toLocaleString()}`}
            icon={<FaMoneyBillWave className="text-blue-600" />}
            color="blue"
          />
        </div>
      </section>

      {/* User Statistics Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
          User Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.user_stats?.total}
            icon={<FaUsers className="text-purple-600" />}
            color="purple"
          />
          <StatCard
            title="New This Week"
            value={stats?.user_stats?.new_week}
            icon={<FaCalendarWeek className="text-green-600" />}
            color="green"
          />
          <StatCard
            title="New This Month"
            value={stats?.user_stats?.new_month}
            icon={<FaCalendarAlt className="text-blue-600" />}
            color="blue"
          />
        </div>
      </section>

      {/* User Breakdown Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
          User Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Students"
            value={stats.user_stats.breakdown.students}
            icon={<FaGraduationCap className="text-blue-600" />}
            color="blue"
          />
          <StatCard
            title="Vendors"
            value={stats.user_stats.breakdown.vendors}
            icon={<FaStore className="text-orange-600" />}
            color="orange"
          />
          <StatCard
            title="Pickers"
            value={stats.user_stats.breakdown.pickers}
            icon={<FaTruck className="text-cyan-600" />}
            color="cyan"
          />
        </div>
      </section>

      {/* Orders & Products Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
          Orders & Products
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <StatCard
            title="Total Orders"
            value={stats.order_stats.total}
            icon={<FaBox className="text-purple-600" />}
            color="purple"
          />
          <StatCard
            title="Recent Orders"
            value={stats.order_stats.recent}
            icon={<FaSync className="text-green-600" />}
            color="green"
          />
          <StatCard
            title="Pending Orders"
            value={stats.order_stats.pending}
            icon={<FaClock className="text-yellow-600" />}
            color="yellow"
          />
          <StatCard
            title="Total Products"
            value={stats.product_stats.total}
            icon={<FaShoppingBag className="text-blue-600" />}
            color="blue"
          />
          <StatCard
            title="Out of Stock"
            value={stats.product_stats.out_of_stock}
            icon={<FaExclamationTriangle className="text-red-600" />}
            color="red"
          />
        </div>
      </section>
    </div>
  );
};

export default DashboardHome;
