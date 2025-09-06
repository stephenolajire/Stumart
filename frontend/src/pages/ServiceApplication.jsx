import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import api from "../constant/api";
import { MEDIA_BASE_URL } from "../constant/api";
import Header from "../components/Header";
import {
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  MapPin,
  Star,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building,
} from "lucide-react";

const ServiceApplication = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(GlobalContext);

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: user ? `${user.first_name} ${user.last_name}` : "",
    email: user ? user.email : "",
    phone: user ? user.phone_number : "",
    description: "",
    preferredDate: "",
    additionalDetails: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const response = await api.get(`/service-detail/${serviceId}/`);
        setService(response.data);
      } catch (error) {
        console.error("Error fetching service details:", error);
        setError("Could not load service details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // You would need to create this endpoint on your backend
      await api.post("/service-application/", {
        service_id: serviceId,
        ...formData,
      });

      setSubmitSuccess(true);
      // Reset form after successful submission
      setFormData({
        ...formData,
        description: "",
        preferredDate: "",
        additionalDetails: "",
      });

      // Redirect to success page or show success message
      setTimeout(() => {
        navigate(`/service-application-success/${serviceId}`);
      }, 3000);
    } catch (error) {
      console.error("Error submitting application:", error);
      setError("Failed to submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToServices = () => {
    navigate("/other-services");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600 font-medium">
            Loading service details...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please wait while we fetch the information
          </p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Service Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "Service not found. Please try again."}
          </p>
          <button
            onClick={handleBackToServices}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-lg">
        <Header title="Apply for Service" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Service Information Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="md:flex">
            {/* Service Image */}
            <div className="md:w-1/3">
              <div className="h-64 md:h-full relative">
                <img
                  src={
                    `${MEDIA_BASE_URL}${service.shop_image}` ||
                    "/default-service.jpg"
                  }
                  alt={service.business_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/default-service.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            </div>

            {/* Service Details */}
            <div className="md:w-2/3 p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {service.business_name}
                  </h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    {service.specific_category.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                {service.rating > 0 && (
                  <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-current mr-1" />
                    <span className="font-semibold text-gray-800">
                      {service.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({service.total_ratings} reviews)
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">
                    <span className="font-medium">Provider:</span>{" "}
                    {service.user.first_name} {service.user.last_name}
                  </span>
                </div>

                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">
                    <span className="font-medium">Location:</span>{" "}
                    {service.user.institution}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-8 py-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Service Application Form
                </h3>
                <p className="text-yellow-100">
                  Fill out the details below to apply for this service
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <h4 className="text-green-800 font-semibold">
                      Application Submitted!
                    </h4>
                    <p className="text-green-700 text-sm mt-1">
                      Your application was submitted successfully! We'll notify
                      the service provider.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                  <div>
                    <h4 className="text-red-800 font-semibold">Error</h4>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={!!user}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                      !!user ? "bg-gray-50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={!!user}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                      !!user ? "bg-gray-50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={!!user}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                      !!user ? "bg-gray-50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="preferredDate"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Preferred Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="preferredDate"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>

              {/* Service Description */}
              <div>
                <label
                  htmlFor="description"
                  className="flex items-center text-sm font-medium text-gray-700 mb-2"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  What service do you need?
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  required
                  placeholder="Please describe what you need help with..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
                />
              </div>

              {/* Additional Details */}
              <div>
                <label
                  htmlFor="additionalDetails"
                  className="flex items-center text-sm font-medium text-gray-700 mb-2"
                >
                  <Building className="w-4 h-4 mr-2" />
                  Additional Details (Optional)
                </label>
                <textarea
                  id="additionalDetails"
                  name="additionalDetails"
                  value={formData.additionalDetails}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any additional information the service provider should know..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceApplication;
