import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  History,
  TrendingUp,
  Building2,
  Search,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
} from "lucide-react";
import api from "../constant/api";
import WithdrawalForm from "./WithdrawalForm";
import WithdrawalHistory from "./WithdrawalHistory";
import WithdrawalStats from "./WithdrawalStats";
import BankList from "./BankList";
import WithdrawalStatus from "./WithdrawalStatus";

const WithdrawalDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user limits and balance
  const { data: limitsData, isLoading: limitsLoading } = useQuery({
    queryKey: ["withdrawal-limits"],
    queryFn: async () => {
      const response = await api.get("limits/");
      return response.data;
    },
  });

  // Fetch recent withdrawals
  const { data: recentWithdrawals } = useQuery({
    queryKey: ["recent-withdrawals"],
    queryFn: async () => {
      const response = await api.get("history/?per_page=5");
      return response.data;
    },
  });

  // Fetch withdrawal stats
  const { data: statsData } = useQuery({
    queryKey: ["withdrawal-stats", "30"],
    queryFn: async () => {
      const response = await api.get("stats/?period=30");
      return response.data;
    },
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "processing":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "pending":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Wallet },
    { id: "withdraw", label: "Withdraw", icon: CreditCard },
    { id: "history", label: "History", icon: History },
    { id: "stats", label: "Statistics", icon: TrendingUp },
    { id: "banks", label: "Banks", icon: Building2 },
    { id: "status", label: "Check Status", icon: Search },
  ];

  if (limitsLoading) {
    return (
      <div className="w-full mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Withdrawal Center
        </h1>
        <p className="text-gray-600">
          Manage your withdrawals and view transaction history
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-yellow-500 text-yellow-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Balance and Limits Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wallet Balance */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Available Balance</p>
                  <p className="text-2xl font-bold">
                    ₦{limitsData?.wallet_balance?.toLocaleString() || "0"}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-yellow-200" />
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setActiveTab("withdraw")}
                  disabled={!limitsData?.can_withdraw}
                  className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-2 px-4 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {limitsData?.can_withdraw
                    ? "Withdraw Now"
                    : "Withdraw Disabled"}
                </button>
              </div>
            </div>

            {/* Daily Usage */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Daily Usage
                </h3>
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Used Today</span>
                  <span className="font-medium">
                    ₦{limitsData?.usage?.daily_used?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((limitsData?.usage?.daily_used || 0) /
                          (limitsData?.limits?.daily_limit || 1)) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>₦0</span>
                  <span>
                    ₦{limitsData?.limits?.daily_limit?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Usage */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Monthly Usage
                </h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Used This Month</span>
                  <span className="font-medium">
                    ₦{limitsData?.usage?.monthly_used?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((limitsData?.usage?.monthly_used || 0) /
                          (limitsData?.limits?.monthly_limit || 1)) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>₦0</span>
                  <span>
                    ₦{limitsData?.limits?.monthly_limit?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {limitsData?.has_pending_withdrawal && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div>
                  <h4 className="font-medium text-yellow-800">
                    Pending Withdrawal
                  </h4>
                  <p className="text-sm text-yellow-700">
                    You have a pending withdrawal. Please wait for it to
                    complete before making another request.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {statsData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-gray-800">
                  ₦{statsData.stats?.successful_amount?.toLocaleString() || "0"}
                </p>
                <p className="text-sm text-gray-600">Total Withdrawn (30d)</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-gray-800">
                  {statsData.stats?.successful_withdrawals || 0}
                </p>
                <p className="text-sm text-gray-600">Successful</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-gray-800">
                  {statsData.stats?.failed_withdrawals || 0}
                </p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-gray-800">
                  {statsData.stats?.pending_withdrawals || 0}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          )}

          {/* Recent Withdrawals */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Recent Withdrawals
              </h3>
              <button
                onClick={() => setActiveTab("history")}
                className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
              >
                View All →
              </button>
            </div>

            {recentWithdrawals?.withdrawals?.length > 0 ? (
              <div className="space-y-3">
                {recentWithdrawals.withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(withdrawal.status)}
                      <div>
                        <p className="font-medium text-gray-800">
                          ₦{withdrawal.amount?.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {withdrawal.bank_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm capitalize font-medium text-gray-800">
                        {withdrawal.status}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(withdrawal.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No withdrawals yet</p>
                <button
                  onClick={() => setActiveTab("withdraw")}
                  className="mt-2 text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  Make your first withdrawal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other tabs would render different components */}
      {activeTab !== "overview" && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === "withdraw" && <WithdrawalForm />}
          {activeTab === "history" && <WithdrawalHistory />}
          {activeTab === "stats" && <WithdrawalStats />}
          {activeTab === "banks" && <BankList />}
          {activeTab === "status" && <WithdrawalStatus />}
        </div>
      )}
    </div>
  );
};

export default WithdrawalDashboard;
