import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../constant/api";
import {
  FileText,
  Calendar,
  Clock,
  MessageCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  User,
  Package,
} from "lucide-react";

const Service = () => {
  const navigate = useNavigate();

  const {
    data: applications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-applications"],
    queryFn: async () => {
      const response = await api.get("my-submitted-applications");
      return response.data.applications || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleChatClick = (serviceId, serviceName) => {
    // Navigate to messages page with service details
    navigate(
      `/messages?serviceId=${serviceId}&serviceName=${encodeURIComponent(
        serviceName
      )}`
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">
            Loading your applications...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please wait while we fetch your data
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message || "Failed to fetch applications. Please try again."}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Service Applications</h1>
              <p className="text-yellow-100 mt-2">
                {applications.length > 0
                  ? `You have ${applications.length} submitted application${
                      applications.length > 1 ? "s" : ""
                    }`
                  : "Track and manage your service requests"}
              </p>
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Applications Yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't submitted any service applications yet. Browse our
              available services to get started.
            </p>
            <button
              className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200 transform hover:scale-105 active:scale-95"
              onClick={() => navigate("/services")}
            >
              <Package className="w-5 h-5 mr-2" />
              Browse Services
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Card Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">
                      {app.service_name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(
                        app.status
                      )}`}
                    >
                      {getStatusIcon(app.status)}
                      <span className="ml-1 capitalize">{app.status}</span>
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  {/* Category */}
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                      <Package className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Category
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {app.service_category.replace("_", " ").toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Description
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {app.description}
                    </p>
                  </div>

                  {/* Additional Details */}
                  {app.additional_details && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Additional Details
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {app.additional_details}
                      </p>
                    </div>
                  )}

                  {/* Date Information */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Preferred Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(app.preferred_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Submitted</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(app.created_at)}
                        </p>
                      </div>
                    </div>

                    {app.response_date && (
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 text-green-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Response Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(app.response_date)}
                          </p>
                        </div>
                      </div>
                    )}

                    {app.completion_date && (
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-blue-400 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Completion Date
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(app.completion_date)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vendor Response */}
                  {app.vendor_response && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <User className="w-4 h-4 text-blue-600 mr-2" />
                        <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">
                          Provider Response
                        </p>
                      </div>
                      <p className="text-sm text-blue-800">
                        {app.vendor_response}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Service;
