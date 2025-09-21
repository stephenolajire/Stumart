import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  Search,
} from "lucide-react";
import api from "../constant/api";

const WithdrawalForm = () => {
  const [formData, setFormData] = useState({
    amount: "",
    bank_code: "",
    account_number: "",
  });
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBankList, setShowBankList] = useState(false);
  const queryClient = useQueryClient();

  // Fetch banks
  const { data: banksData, isLoading: banksLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const response = await api.get("banks/");
      return response.data;
    },
  });

  // Fetch withdrawal limits
  const { data: limitsData } = useQuery({
    queryKey: ["withdrawal-limits"],
    queryFn: async () => {
      const response = await api.get("limits/");
      return response.data;
    },
  });

  // Search banks
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["bank-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { banks: [] };
      const response = await api.get(
        `banks/search/?q=${encodeURIComponent(searchTerm)}`
      );
      return response.data;
    },
    enabled: searchTerm.length > 2,
  });

  // Account verification mutation
  const verifyAccountMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("verify-account/", data);
      return response.data;
    },
    onSuccess: (data) => {
      setVerifiedAccount(data);
    },
    onError: (error) => {
      setVerifiedAccount(null);
      console.error(
        "Account verification failed:",
        error.response?.data?.error
      );
    },
  });

  // Withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("withdraw/", data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["withdrawal-history"]);
      queryClient.invalidateQueries(["withdrawal-limits"]);
      setFormData({ amount: "", bank_code: "", account_number: "" });
      setVerifiedAccount(null);
      alert("Withdrawal request submitted successfully!");
    },
    onError: (error) => {
      alert(error.response?.data?.error || "Withdrawal failed");
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear verified account when account details change
    if (name === "account_number" || name === "bank_code") {
      setVerifiedAccount(null);
    }
  };

  const handleBankSelect = (bank) => {
    setFormData((prev) => ({ ...prev, bank_code: bank.code }));
    setShowBankList(false);
    setSearchTerm(bank.name);
    setVerifiedAccount(null);
  };

  const handleVerifyAccount = () => {
    if (!formData.account_number || !formData.bank_code) {
      alert("Please enter account number and select a bank");
      return;
    }
    verifyAccountMutation.mutate({
      account_number: formData.account_number,
      bank_code: formData.bank_code,
    });
  };

  const handleSubmit = () => {
    if (!verifiedAccount) {
      alert("Please verify your account first");
      return;
    }
    withdrawalMutation.mutate(formData);
  };

  const filteredBanks =
    searchTerm.length > 2 ? searchResults?.banks : banksData?.banks;

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-800">Withdraw Funds</h2>
      </div>

      {/* Wallet Balance & Limits */}
      {limitsData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Available Balance:</span>
            <span className="font-semibold text-gray-800">
              ₦{limitsData.wallet_balance?.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Min/Max Withdrawal:</span>
            <span className="text-gray-800">
              ₦{limitsData.limits?.min_withdrawal?.toLocaleString()} - ₦
              {limitsData.limits?.max_withdrawal?.toLocaleString()}
            </span>
          </div>
          {limitsData.has_pending_withdrawal && (
            <div className="flex items-center gap-2 mt-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">You have a pending withdrawal</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (₦)
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            min={limitsData?.limits?.min_withdrawal || 100}
            max={limitsData?.limits?.max_withdrawal || 500000}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="Enter amount"
            required
          />
        </div>

        {/* Bank Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Bank
          </label>
          <div className="relative">
            <div className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowBankList(true);
                }}
                onFocus={() => setShowBankList(true)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Search for bank..."
              />
              <button
                type="button"
                onClick={() => setShowBankList(!showBankList)}
                className="px-3 py-2 bg-yellow-500 text-white border border-yellow-500 rounded-r-md hover:bg-yellow-600"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {showBankList && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {banksLoading || searchLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">
                      Loading banks...
                    </p>
                  </div>
                ) : filteredBanks?.length > 0 ? (
                  filteredBanks.map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => handleBankSelect(bank)}
                      className="w-full text-left px-4 py-2 hover:bg-yellow-50 focus:bg-yellow-50 focus:outline-none"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{bank.name}</span>
                        <span className="text-sm text-gray-500 capitalize">
                          {bank.type}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No banks found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleInputChange}
              maxLength="10"
              pattern="[0-9]{10}"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter 10-digit account number"
              required
            />
            <button
              type="button"
              onClick={handleVerifyAccount}
              disabled={
                !formData.account_number ||
                !formData.bank_code ||
                verifyAccountMutation.isPending
              }
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {verifyAccountMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </button>
          </div>
        </div>

        {/* Account Verification Result */}
        {verifyAccountMutation.error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">
              {verifyAccountMutation.error.response?.data?.error ||
                "Account verification failed"}
            </span>
          </div>
        )}

        {verifiedAccount && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <div className="text-sm">
              <p className="font-medium text-green-800">
                {verifiedAccount.account_name}
              </p>
              <p className="text-green-600">{verifiedAccount.bank_name}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            !verifiedAccount ||
            withdrawalMutation.isPending ||
            !limitsData?.can_withdraw
          }
          className="w-full py-2 px-4 bg-yellow-500 text-white font-medium rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {withdrawalMutation.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </div>
          ) : (
            "Withdraw Funds"
          )}
        </button>
      </div>

      {/* Click outside to close bank list */}
      {showBankList && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowBankList(false)}
        />
      )}
    </div>
  );
};

export default WithdrawalForm;
