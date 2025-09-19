import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Filter,
  Download,
  Loader,
  ChevronDown,
  X,
} from "lucide-react";
import AddRider from "./AddRider";
import { useAllRiders } from "../constant/GlobalContext";

export default function ManageRidersInterface() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRiders, setSelectedRiders] = useState([]);
  const [expandedRider, setExpandedRider] = useState(null);

  const {data: riders, isLoading, error} = useAllRiders()
  const riderList = Array.isArray(riders) ? riders : riders?.results || [];

  console.log(riderList);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-10 h-10 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading riders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load
          </h2>
          <p className="text-gray-600">
            Unable to load riders. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "busy":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "offline":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case "active":
        return "bg-green-400";
      case "busy":
        return "bg-yellow-400";
      case "offline":
        return "bg-gray-400";
      case "inactive":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  const handleSelectRider = (riderId) => {
    setSelectedRiders((prev) =>
      prev.includes(riderId)
        ? prev.filter((id) => id !== riderId)
        : [...prev, riderId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRiders(
      selectedRiders.length === riders.length ? [] : riders.map((r) => r.id)
    );
  };


  const filteredRiders = riderList.filter((rider) => {
    const name = rider.name || "";
    const email = rider.email || "";
    const phone = rider.phone || "";

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery);

    const matchesFilter =
      selectedFilter === "all" || rider.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const MobileRiderCard = ({ rider }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={selectedRiders.includes(rider.id)}
            onChange={() => handleSelectRider(rider.id)}
            className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
          />
          <div
            className={`w-3 h-3 rounded-full ${getStatusDot(rider.status)}`}
          ></div>
          <div>
            <h3 className="font-semibold text-gray-900">{rider.name}</h3>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                rider.status
              )}`}
            >
              {rider.status}
            </span>
          </div>
        </div>
        <button
          onClick={() =>
            setExpandedRider(expandedRider === rider.id ? null : rider.id)
          }
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${
              expandedRider === rider.id ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-600">
          <Mail className="w-4 h-4 mr-2" />
          <span className="truncate">{rider.email}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Phone className="w-4 h-4 mr-2" />
          <span>{rider.phone}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="truncate">{rider.location}</span>
        </div>
      </div>

      {expandedRider === rider.id && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="font-medium">{rider.rating}</span>
              </div>
              <p className="text-gray-500">
                {rider.completed_deliveries} deliveries
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {formatCurrency(rider.monthly_earnings)}
              </p>
              <p className="text-gray-500">This month</p>
            </div>
            <div className="col-span-2">
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span>{rider.last_active_display}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 mt-4">
            <button className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Manage Riders
              </h1>
              <p className="text-gray-600">
                Manage your delivery team and track performance
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add New Rider</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm sm:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Total Riders
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {riders.length}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm sm:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Active Now
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {riderList.filter((r) => r.status === "active").length}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm sm:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Avg Rating
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {riders.length > 0
                    ? (
                        riders.reduce((sum, r) => sum + r.rating, 0) /
                        riders.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm sm:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Total Deliveries
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {riderList.reduce(
                    (sum, rider) => sum + rider.completed_deliveries,
                    0
                  )}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search riders by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm sm:text-base"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {["all", "active", "busy", "offline", "inactive"].map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        selectedFilter === filter
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  )
                )}
              </div>

              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors flex items-center space-x-2 text-xs sm:text-sm">
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View - Card Layout */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Riders ({filteredRiders.length})
            </h2>
            {selectedRiders.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedRiders.length} selected
                </span>
                <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                  Actions
                </button>
              </div>
            )}
          </div>

          {filteredRiders.length > 0 ? (
            filteredRiders.map((rider) => (
              <MobileRiderCard key={rider.id} rider={rider} />
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No riders found matching your criteria.
              </p>
            </div>
          )}
        </div>

        {/* Desktop View - Table Layout */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Riders ({filteredRiders.length})
              </h2>
              {selectedRiders.length > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {selectedRiders.length} selected
                  </span>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Bulk Actions
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedRiders.length === filteredRiders.length &&
                        filteredRiders.length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Rider
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Performance
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Monthly Earnings
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRiders.length > 0 ? (
                  filteredRiders.map((rider) => (
                    <tr key={rider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRiders.includes(rider.id)}
                          onChange={() => handleSelectRider(rider.id)}
                          className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusDot(
                              rider.status
                            )}`}
                          ></div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {rider.name}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {rider.location}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-900 flex items-center">
                            <Mail className="w-3 h-3 mr-2 text-gray-400" />
                            {rider.email}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone className="w-3 h-3 mr-2 text-gray-400" />
                            {rider.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              rider.status
                            )}`}
                          >
                            {rider.status}
                          </span>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {rider.last_active_display}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium text-gray-900">
                              {rider.rating}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {rider.completed_deliveries} deliveries
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(rider.monthly_earnings)}
                        </p>
                        <p className="text-sm text-gray-600">This month</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No riders found matching your criteria.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedFilter("all");
                        }}
                        className="mt-2 text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                      >
                        Clear filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAddModal && <AddRider setShowAddModal={setShowAddModal} />}
      </div>
    </div>
  );
}
