import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../constant/api";
import {
  CheckCircle,
  Loader2,
  Search,
  Home,
  Clock,
  Phone,
  UserCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const ServiceApplicationSuccess = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const response = await api.get(`/service-detail/${serviceId}/`);
        setService(response.data);
      } catch (error) {
        console.error("Error fetching service details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId]);

  const handleBackToServices = () => {
    navigate("/other-services");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header with animated background */}
          <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIi8+CiAgPC9nPgo8L3N2Zz4=')] opacity-30"></div>

            {/* Success Icon */}
            <div className="relative">
              <div className="mx-auto w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>

              {/* Sparkle effects */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <div className="absolute bottom-4 left-8">
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse delay-75" />
              </div>
              <div className="absolute bottom-4 right-8">
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse delay-150" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              Application Submitted!
            </h1>
            <p className="text-green-100 text-lg leading-relaxed">
              Your application for{" "}
              <span className="font-semibold">
                {service?.specific_category?.replace("_", " ")}
              </span>{" "}
              from{" "}
              <span className="font-semibold">{service?.business_name}</span>{" "}
              has been submitted successfully.
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* What happens next section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  What happens next?
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-0.5">
                    1
                  </div>
                  <div className="flex items-center">
                    <UserCheck className="w-5 h-5 text-blue-500 mr-3" />
                    <p className="text-gray-700">
                      The service provider will review your application
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-0.5">
                    2
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                    <p className="text-gray-700">
                      The service provider will accept or decline your request
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-0.5">
                    3
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-blue-500 mr-3" />
                    <p className="text-gray-700">
                      You will receive a call from them
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleBackToServices}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                <Search className="w-5 h-5" />
                <span>Browse More Services</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleBackToHome}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98] border border-gray-200"
              >
                <Home className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                You can track your application status in your{" "}
                <button
                  onClick={() => navigate("/services")}
                  className="text-yellow-600 hover:text-yellow-700 font-medium underline"
                >
                  service applications
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-75"></div>
      </div>
    </div>
  );
};

export default ServiceApplicationSuccess;
