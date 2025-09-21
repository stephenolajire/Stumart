import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search, Filter, Loader2, AlertCircle } from "lucide-react";
import api from "../constant/api";

const BankList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [sortBy, setSortBy] = useState("name");

  // Fetch banks
  const {
    data: banksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const response = await api.get("banks/");
      return response.data;
    },
  });

  // Filter and sort banks
  const filteredAndSortedBanks = useMemo(() => {
    if (!banksData?.banks) return [];

    let filtered = banksData.banks;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (bank) =>
          bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bank.code.includes(searchTerm)
      );
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter((bank) => bank.type === selectedType);
    }

    // Sort banks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.type.localeCompare(b.type);
        case "code":
          return a.code.localeCompare(b.code);
        default:
          return 0;
      }
    });

    return filtered;
  }, [banksData?.banks, searchTerm, selectedType, sortBy]);

  // Get unique bank types for filter
  const bankTypes = useMemo(() => {
    if (!banksData?.banks) return [];
    const types = [...new Set(banksData.banks.map((bank) => bank.type))];
    return types.sort();
  }, [banksData?.banks]);

  const getBankTypeColor = (type) => {
    switch (type) {
      case "commercial":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "microfinance":
        return "bg-green-100 text-green-800 border-green-200";
      case "merchant":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "payment_service":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "other":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatBankType = (type) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <p className="ml-3 text-gray-600">Loading banks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Failed to load banks
          </h3>
          <p className="text-gray-500">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-800">Supported Banks</h2>
        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
          {banksData?.total_count || 0} Banks
        </span>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search banks by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {bankTypes.map((type) => (
              <option key={type} value={type}>
                {formatBankType(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        >
          <option value="name">Sort by Name</option>
          <option value="type">Sort by Type</option>
          <option value="code">Sort by Code</option>
        </select>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredAndSortedBanks.length} of{" "}
          {banksData?.total_count || 0} banks
          {searchTerm && ` for "${searchTerm}"`}
          {selectedType && ` in ${formatBankType(selectedType)} category`}
        </p>
      </div>

      {/* Bank List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedBanks.map((bank) => (
          <div
            key={bank.code}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">
                  {bank.name}
                </h3>
                <p className="text-sm text-gray-600">Code: {bank.code}</p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBankTypeColor(
                  bank.type
                )}`}
              >
                {formatBankType(bank.type)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 capitalize">
                {bank.type} Bank
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* No results */}
      {filteredAndSortedBanks.length === 0 && banksData?.banks?.length > 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            No banks found
          </h3>
          <p className="text-gray-400">
            Try adjusting your search term or filters
          </p>
        </div>
      )}

      {/* Bank Type Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Bank Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {bankTypes.map((type) => {
            const count =
              banksData?.banks?.filter((bank) => bank.type === type).length ||
              0;
            return (
              <div key={type} className="text-center">
                <div
                  className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getBankTypeColor(
                    type
                  )} mb-2`}
                >
                  {formatBankType(type)}
                </div>
                <p className="text-xs text-gray-600">{count} banks</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-lg font-bold text-blue-600">
            {banksData?.banks?.filter((bank) => bank.type === "commercial")
              .length || 0}
          </p>
          <p className="text-xs text-blue-600">Commercial</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-600">
            {banksData?.banks?.filter((bank) => bank.type === "microfinance")
              .length || 0}
          </p>
          <p className="text-xs text-green-600">Microfinance</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-lg font-bold text-purple-600">
            {banksData?.banks?.filter((bank) => bank.type === "merchant")
              .length || 0}
          </p>
          <p className="text-xs text-purple-600">Merchant</p>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg">
          <p className="text-lg font-bold text-yellow-600">
            {banksData?.banks?.filter((bank) => bank.type === "payment_service")
              .length || 0}
          </p>
          <p className="text-xs text-yellow-600">Payment Service</p>
        </div>
      </div>
    </div>
  );
};

export default BankList;
