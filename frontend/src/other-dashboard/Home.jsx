// Home.jsx
import React, { useState, useEffect } from "react";
import api from "../constant/api";

const Home = ({ vendor }) => {
  const [statistics, setStatistics] = useState({
    totalApplications: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    cancelled: 0,
    declined: 0,
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch dashboard statistics and monthly data
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("other/dashboard/stats/");
        setStatistics(response.data.statistics);
        setMonthlyData(response.data.monthlyData);
        console.log(response.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard statistics");
      }
    };

    // Fetch recent applications
    const fetchRecentApplications = async () => {
      try {
        const response = await api.get("applications/recent/");
        setRecentApplications(response.data);
      } catch (err) {
        console.error("Error fetching recent applications:", err);
        setError("Failed to load recent applications");
      } finally {
        setIsLoading(false);
      }
    };

    // Call both fetch functions
    fetchDashboardData();
    fetchRecentApplications();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate the maximum application count for chart scaling
  const maxApplications = Math.max(
    ...monthlyData.map((item) => item.applications)
  );

  // Format date to readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status class for styling
  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800";
      case "accepted":
        return "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800";
      case "completed":
        return "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800";
      case "cancelled":
        return "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800";
      case "declined":
        return "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800";
      default:
        return "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {vendor?.business_name}
        </h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {/* Statistics Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Service Applications Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Total Applications
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {statistics.totalApplications}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-400">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-gray-900">
              {statistics.pending}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Accepted</h3>
            <p className="text-3xl font-bold text-gray-900">
              {statistics.accepted}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Completed
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {statistics.completed}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Cancelled
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {statistics.cancelled}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Declined</h3>
            <p className="text-3xl font-bold text-gray-900">
              {statistics.declined}
            </p>
          </div>
        </div>
      </section>

      {/* Chart Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Monthly Applications
        </h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-end justify-between space-x-2 h-64">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="relative flex-1 w-full flex items-end justify-center">
                  <div
                    className="bg-yellow-500 hover:bg-yellow-600 transition-colors rounded-t min-h-[20px] w-full max-w-12 flex items-start justify-center pt-2"
                    style={{
                      height: `${Math.max(
                        (data.applications / (maxApplications || 1)) * 100,
                        8
                      )}%`,
                    }}
                  >
                    <span className="text-white text-xs font-semibold">
                      {data.applications}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 font-medium">
                  {data.month}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Applications Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Recent Applications
          </h2>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {recentApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentApplications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() =>
                        (window.location.href = `/applications/${app.id}`)
                      }
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.description.substring(0, 30)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusClass(app.status)}>
                          {app.status.charAt(0).toUpperCase() +
                            app.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No recent applications to display.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
