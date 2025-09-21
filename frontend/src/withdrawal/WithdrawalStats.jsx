import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react";
import api from "../constant/api";

const WithdrawalStats = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  // Fetch withdrawal statistics
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["withdrawal-stats", selectedPeriod],
    queryFn: async () => {
      const response = await api.get(
        `stats/?period=${selectedPeriod}`
      );
      return response.data;
    },
  });

  // Fetch withdrawal limits for current info
  const { data: limitsData } = useQuery({
    queryKey: ["withdrawal-limits"],
    queryFn: async () => {
      const response = await api.get("limits/");
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="w-full mx-auto space-y-6">
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Failed to load statistics
          </h3>
          <p className="text-gray-500">Please try again later</p>
        </div>
      </div>
    );
  }

  const { stats, monthly_breakdown } = statsData;

  // Prepare data for pie chart
  const pieData = [
    {
      name: "Successful",
      value: stats.successful_withdrawals,
      color: "#10B981",
    },
    { name: "Failed", value: stats.failed_withdrawals, color: "#EF4444" },
    { name: "Pending", value: stats.pending_withdrawals, color: "#F59E0B" },
  ];

  // Prepare monthly data for bar chart
  const chartData = monthly_breakdown.map((item) => ({
    month: item.month.split(" ")[0], // Get just the month name
    amount: item.total_amount,
    count: item.total_count,
  }));

  const formatCurrency = (value) => {
    return `₦${value?.toLocaleString() || 0}`;
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "yellow",
  }) => (
    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-800">
            Withdrawal Statistics
          </h2>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          title="Total Withdrawn"
          value={formatCurrency(stats.successful_amount)}
          subtitle={`From ${stats.successful_withdrawals} transactions`}
        />

        <StatCard
          icon={CheckCircle}
          title="Success Rate"
          value={`${stats.success_rate?.toFixed(1)}%`}
          subtitle={`${stats.successful_withdrawals} successful`}
          color="green"
        />

        <StatCard
          icon={TrendingUp}
          title="Average Withdrawal"
          value={formatCurrency(stats.average_withdrawal)}
          subtitle="Per successful transaction"
        />

        <StatCard
          icon={Clock}
          title="Total Transactions"
          value={stats.total_withdrawals}
          subtitle={`${stats.pending_withdrawals} pending`}
          color="blue"
        />
      </div>

      {/* Current Balance and Limits */}
      {limitsData && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Current Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Wallet Balance</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(limitsData.wallet_balance)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Daily Used</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatCurrency(limitsData.usage?.daily_used)} /{" "}
                {formatCurrency(limitsData.limits?.daily_limit)}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (limitsData.usage?.daily_used /
                        limitsData.limits?.daily_limit) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Monthly Used</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatCurrency(limitsData.usage?.monthly_used)} /{" "}
                {formatCurrency(limitsData.limits?.monthly_limit)}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (limitsData.usage?.monthly_used /
                        limitsData.limits?.monthly_limit) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Monthly Withdrawal Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === "amount" ? formatCurrency(value) : value,
                  name === "amount" ? "Amount" : "Count",
                ]}
              />
              <Bar dataKey="amount" fill="#EAB308" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Withdrawal Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, "Withdrawals"]} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Summary for Last {selectedPeriod} Days
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-xl font-bold text-green-700">
              {stats.successful_withdrawals}
            </p>
            <p className="text-sm text-green-600">
              {formatCurrency(stats.successful_amount)}
            </p>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-xl font-bold text-red-700">
              {stats.failed_withdrawals}
            </p>
            <p className="text-sm text-red-600">
              {(
                (stats.failed_withdrawals / stats.total_withdrawals) *
                100
              ).toFixed(1)}
              % failure rate
            </p>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-xl font-bold text-yellow-700">
              {stats.pending_withdrawals}
            </p>
            <p className="text-sm text-yellow-600">In progress</p>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Total Volume</p>
            <p className="text-xl font-bold text-blue-700">
              {stats.total_withdrawals}
            </p>
            <p className="text-sm text-blue-600">
              {formatCurrency(stats.total_amount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalStats;
