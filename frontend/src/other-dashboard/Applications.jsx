import React, { useState, useEffect } from "react";
import ApplicationCard from "./ApplicationCard";
import api from "../constant/api";
import {
  Search,
  Filter,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

const Applications = ({ vendor }) => {
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  const fetchApplications = async (page = 1, status = null) => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit: 10,
        ...(status && status !== "all" && { status }),
      };

      const response = await api.get("applications/", { params });
      setApplications(response.data.results);
      console.log(response.data.results);
      setFilteredApps(response.data.results);
      setTotalPages(response.data.pages);
      setCurrentPage(response.data.current_page);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch applications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = applications.filter(
        (app) =>
          app.name.toLowerCase().includes(term) ||
          app.email.toLowerCase().includes(term) ||
          app.description.toLowerCase().includes(term)
      );
      setFilteredApps(filtered);
    } else {
      setFilteredApps(applications);
    }
  }, [searchTerm, applications]);

  const handleStatusChange = async (id, newStatus, vendorResponse = "") => {
    try {
      await api.put(`applications/${id}/status/`, {
        status: newStatus,
        vendor_response: vendorResponse,
      });

      // Refresh applications after status update
      fetchApplications(currentPage, statusFilter);
    } catch (err) {
      console.error("Failed to update status:", err);
      // Handle error (show notification, etc.)
    }
  };

  const statusOptions = [
    { key: "all", label: "All", color: "bg-gray-100 text-gray-800" },
    {
      key: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      key: "accepted",
      label: "Accepted",
      color: "bg-green-100 text-green-800",
    },
    {
      key: "completed",
      label: "Completed",
      color: "bg-blue-100 text-blue-800",
    },
    { key: "declined", label: "Declined", color: "bg-red-100 text-red-800" },
    {
      key: "cancelled",
      label: "Cancelled",
      color: "bg-gray-100 text-gray-600",
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Applications
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchApplications(1, statusFilter)}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Service Applications
              </h1>
              <p className="text-gray-600 mt-1">
                Manage all your service requests from customers
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              />
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400 mr-2" />
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status.key}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      statusFilter === status.key
                        ? "bg-yellow-500 text-white shadow-lg transform scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      setStatusFilter(status.key);
                      setCurrentPage(1); // Reset to first page when changing filter
                    }}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mb-4" />
            <p className="text-lg text-gray-600 font-medium">
              Loading applications...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please wait while we fetch your service requests
            </p>
          </div>
        ) : (
          <>
            {/* Applications List */}
            {filteredApps.length > 0 ? (
              <div className="space-y-6 mb-8">
                {filteredApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Applications Found
                </h3>
                <p className="text-gray-600 text-center max-w-md mx-auto">
                  {searchTerm
                    ? "No applications found matching your search criteria. Try adjusting your search terms or filters."
                    : "No applications found matching your criteria. Applications will appear here when customers request your services."}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{" "}
                    <span className="font-medium">{totalPages}</span>
                  </span>
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Applications;
