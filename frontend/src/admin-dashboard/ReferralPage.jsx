import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Search,
  Copy,
  DollarSign,
  TrendingUp,
  Mail,
  RotateCcw,
  Calendar,
  Award,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  Filter,
  Download,
} from "lucide-react";
import api from "../constant/api";
import Swal from "sweetalert2";

const ReferralManagement = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterActive, setFilterActive] = useState("all"); // all, active, inactive
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();

  // Fetch all referrals
  const { data: referralsData, isLoading } = useQuery({
    queryKey: ["referrals-list"],
    queryFn: async () => {
      const response = await api.get("referrals/list/");
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Create referral mutation
  const createReferralMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("referrals/create/", data);
      return response.data;
    },
    onSuccess: (data) => {
      Swal.fire({
        icon: "success",
        title: "Referral Code Created!",
        html: `
          <p>Referral code for <strong>${formData.firstName} ${formData.lastName}</strong></p>
          <p class="text-3xl font-bold text-gray-900 my-4">${data.referral.referral_code}</p>
        `,
        confirmButtonColor: "#111827",
      });

      setFormData({ firstName: "", lastName: "", email: "" });
      setShowCreateForm(false);
      queryClient.invalidateQueries(["referrals-list"]);
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.details?.email?.[0] ||
        error.response?.data?.error ||
        "Failed to create referral code.";

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#ef4444",
      });
    },
  });

  // Reset earnings mutation
  const resetEarningsMutation = useMutation({
    mutationFn: async (referralCode) => {
      const response = await api.post(`referrals/${referralCode}/reset/`);
      return response.data;
    },
    onSuccess: (data) => {
      Swal.fire({
        icon: "success",
        title: "Payout Processed!",
        html: `
          <p>Payout for ${data.referral.name}</p>
          <p class="text-2xl font-bold text-green-600 my-4">₦${data.payout_info.payout_amount.toLocaleString()}</p>
        `,
        confirmButtonColor: "#111827",
      });
      queryClient.invalidateQueries(["referrals-list"]);
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to process payout",
        confirmButtonColor: "#ef4444",
      });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (referralCode) => {
      const response = await api.post(`referrals/${referralCode}/send-email/`);
      return response.data;
    },
    onSuccess: (data) => {
      Swal.fire({
        icon: "success",
        title: "Email Sent!",
        text: `Notification sent to ${data.email}`,
        confirmButtonColor: "#111827",
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to send email",
        confirmButtonColor: "#ef4444",
      });
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createReferralMutation.mutate({
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
    });
  };

  const handleResetEarnings = (referral) => {
    if (referral.total_earnings <= 0) {
      Swal.fire({
        icon: "warning",
        title: "No Earnings",
        text: "This referral has no pending earnings.",
        confirmButtonColor: "#111827",
      });
      return;
    }

    Swal.fire({
      title: "Process Payout",
      html: `
        <p>Process payout for:</p>
        <p class="font-bold mt-2">${referral.first_name} ${referral.last_name}</p>
        <p class="text-2xl font-bold text-green-600 my-4">₦${referral.total_earnings.toLocaleString()}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#111827",
      cancelButtonColor: "#d33",
      confirmButtonText: "Process Payout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        resetEarningsMutation.mutate(referral.referral_code);
      }
    });
  };

  const handleSendEmail = (referral) => {
    Swal.fire({
      title: "Send Email",
      text: `Send payout notification to ${referral.email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#111827",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Send",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        sendEmailMutation.mutate(referral.referral_code);
      }
    });
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    Swal.fire({
      icon: "success",
      title: "Copied!",
      text: "Referral code copied to clipboard",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const formatCurrency = (amount) => {
    return `₦${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter referrals
  const filteredReferrals = referralsData?.referrals?.filter((ref) => {
    const matchesSearch =
      ref.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.referral_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterActive === "all" ||
      (filterActive === "active" && ref.is_active) ||
      (filterActive === "inactive" && !ref.is_active);

    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Referral Management
          </h1>
          <p className="text-gray-600">
            Manage referral codes, track earnings, and process payouts
          </p>
        </div>

        {/* Summary Statistics */}
        {referralsData?.summary && (
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Referrals
                  </p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {referralsData.summary.total_referrals}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {referralsData.summary.total_active} active
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Payout
                  </p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(referralsData.summary.total_pending_payout)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {referralsData.summary.total_completed_orders} orders
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Paid Out
                  </p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(referralsData.summary.total_paid_out)}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    Lifetime Earnings
                  </p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(referralsData.summary.total_lifetime_earnings)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {referralsData.summary.total_lifetime_orders} total orders
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Actions Bar */}
        <section className="mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email or code..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>

                {/* Create Button */}
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Create New
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Create Form */}
        {showCreateForm && (
          <section className="mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Create New Referral Code
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-3 flex gap-3">
                  <button
                    type="submit"
                    disabled={createReferralMutation.isPending}
                    className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {createReferralMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Referrals Table */}
        <section>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referral Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending Payout
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lifetime
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Payout
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReferrals && filteredReferrals.length > 0 ? (
                    filteredReferrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {referral.first_name} {referral.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {referral.email}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Created: {formatDate(referral.created_at)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              {referral.referral_code}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(referral.referral_code)
                              }
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </button>
                            {!referral.is_active && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="font-semibold">
                              {referral.total_referrals}
                            </div>
                            <div className="text-xs text-gray-500">
                              Lifetime: {referral.lifetime_referrals}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-yellow-600">
                            {formatCurrency(referral.total_earnings)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-purple-600">
                            {formatCurrency(referral.lifetime_earnings)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {formatCurrency(referral.total_paid_out)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {referral.last_payout_date ? (
                            <div className="text-xs">
                              <div className="font-semibold text-gray-900">
                                {formatCurrency(referral.last_payout_amount)}
                              </div>
                              <div className="text-gray-500">
                                {formatDate(referral.last_payout_date)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleResetEarnings(referral)}
                              disabled={
                                resetEarningsMutation.isPending ||
                                referral.total_earnings <= 0
                              }
                              className="p-1.5 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Process Payout"
                            >
                              <RotateCcw className="w-4 h-4 text-red-600" />
                            </button>
                            <button
                              onClick={() => handleSendEmail(referral)}
                              disabled={sendEmailMutation.isPending}
                              className="p-1.5 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Send Email"
                            >
                              <Mail className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        {searchTerm || filterActive !== "all"
                          ? "No referrals match your filters"
                          : "No referrals created yet"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReferralManagement;