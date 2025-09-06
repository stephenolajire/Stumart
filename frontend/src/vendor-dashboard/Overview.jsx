import React from "react";
import StatCard from "./StatCard";
import RevenueChart from "./RevenueChart";
import SalesChart from "./SalesChart";
import {
  FaChartBar,
  FaShoppingCart,
  FaBox,
  FaBoxes,
  FaStar,
} from "react-icons/fa";

const Overview = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {/* Stats Cards Row */}
      <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={`₦${stats.totalRevenue?.toLocaleString() || "0"}`}
          icon={<FaChartBar className="text-yellow-500" />}
          color="yellow"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={<FaShoppingCart className="text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts || 0}
          icon={<FaBox className="text-yellow-600" />}
          color="yellow"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock || 0}
          icon={<FaBoxes className="text-orange-500" />}
          color="orange"
        />
        {/* <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews || 0}
          icon={<FaStar className="text-cyan-500" />}
          color="cyan"
        /> */}
      </div>

      {/* Charts Row */}
      <div className="lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <RevenueChart data={stats.revenueData || []} />
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <SalesChart data={stats.salesData || []} />
        </div>
      </div>
    </div>
  );
};

export default Overview;
