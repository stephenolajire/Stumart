import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Navigate, useLocation } from "react-router-dom";
import api from "./api";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const refresh = localStorage.getItem("refresh");
    try {
      const response = await api.post("/token/refresh/", {
        refresh: refresh,
      });
      if (response.status === 200) {
        localStorage.setItem("access", response.data.access);
        setIsAuthenticated(true);

        // Decode the new token to get user role
        const decoded = jwtDecode(response.data.access);
        const role =
          decoded.role || decoded.access || localStorage.getItem("user_type");
        setUserRole(role);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        clearTokens();
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      setIsAuthenticated(false);
      setUserRole(null);
      clearTokens();
    }
  };

  const clearTokens = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user_type");
  };

  const auth = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      setIsAuthenticated(false);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const expiryDate = decoded.exp;
      const currentTime = Date.now() / 1000;

      // Extract user role from token or localStorage
      const role =
        decoded.role || decoded.user_type || localStorage.getItem("user_type");
      setUserRole(role);

      if (currentTime > expiryDate) {
        await refresh();
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      setIsAuthenticated(false);
      setUserRole(null);
      clearTokens();
    }

    setLoading(false);
  };

  // Call authentication on component mount
  useEffect(() => {
    auth();
  }, []);

  // Check if user has required role
  const hasRequiredRole = () => {
    if (!allowedRoles || allowedRoles.length === 0) {
      return true; // No role restriction
    }

    if (!userRole) {
      return false; // No user role available
    }

    return allowedRoles.includes(userRole.toLowerCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (!hasRequiredRole()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-red-500 mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
