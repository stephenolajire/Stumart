import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaClock, FaSpinner} from "react-icons/fa";
import pendingIcon from "../assets/stumart.jpeg";
import api from "../constant/api";
import Swal from "sweetalert2";

const KYCStatus = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState({
    status: "pending",
    business_category: null,
  });

  const user_id = localStorage.getItem("user_id");
  const user_type = localStorage.getItem("user_type");

  useEffect(() => {
    if (user_id && user_type) {
      handleRefreshKYC();
    }
  }, []);

  const handleRefreshKYC = async () => {
    setLoading(true);
    try {
      const response = await api.get(`kyc-status/${user_type}/${user_id}/`);

      if (response.data) {
        setKycStatus(response.data);
        console.log(response.data);

        if (response.data.status === "approved") {
          // Handle picker types
          if (["picker", "student_picker"].includes(user_type)) {
            Swal.fire({
              icon: "success",
              title: "Verification approved",
              confirmButtonColor: "#eab308",
            });
            navigate("/picker");
          }
          // Handle vendor types
          else if (user_type === "vendor") {
            if (response.data.business_category === "other") {
              Swal.fire({
                icon: "success",
                title: "Verification approved",
                confirmButtonColor: "#eab308",
              });
              navigate("/other-dashboard");
            }
          } else if (user_type === "vendor") {
            if (response.data.business_category !== "other") {
              Swal.fire({
                icon: "success",
                title: "Verification approved",
                confirmButtonColor: "#eab308",
              });
              navigate("/other-dashboard");
            }
          }
        } else {
          Swal.fire({
            icon: "info",
            title: "Verification pending",
            text: "Please check back later",
            confirmButtonColor: "#eab308",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching KYC status:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to fetch status",
        text: "Please try again later",
        confirmButtonColor: "#eab308",
      });
    } finally {
      setLoading(false);
    }
  };

  const isApproved = kycStatus.status === "approved";

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          {/* Status Icon */}
          <div className="relative mb-8">
            <div
              className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                isApproved ? "bg-green-100" : "bg-yellow-100"
              }`}
            >
              {isApproved ? (
                <FaCheckCircle className="text-green-600 text-4xl" />
              ) : (
                <FaClock className="text-yellow-600 text-4xl" />
              )}
            </div>

            {/* Company Logo/Icon */}
            <div className="absolute -bottom-2 -right-2">
              <img
                src={pendingIcon}
                alt="Company Logo"
                className="w-12 h-12 rounded-full border-4 border-white shadow-lg object-cover"
              />
            </div>
          </div>

          {/* Main Title */}
          <h2
            className={`text-3xl font-bold mb-4 ${
              isApproved ? "text-green-800" : "text-yellow-800"
            }`}
          >
            {isApproved ? "Verification Approved" : "Verification In Progress"}
          </h2>

          {/* Status Message */}
          <p className="text-lg text-gray-600 mb-8">
            {isApproved
              ? "Your account has been verified successfully"
              : "Your account verification is currently under review"}
          </p>

          {/* Progress Bar for Pending Status */}
          {!isApproved && (
            <div className="mb-8">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full animate-pulse"
                  style={{ width: "60%" }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Review in progress...
              </p>
            </div>
          )}

          {/* Information Box for Pending Status */}
          {!isApproved && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                <FaClock className="mr-2" />
                What happens next?
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Our team is reviewing your submitted documents</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>This process typically takes 24-48 hours</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>
                    You'll receive an email once the review is complete
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>You can check back here anytime for updates</span>
                </li>
              </ul>
            </div>
          )}

          {/* Success Message for Approved Status */}
          {isApproved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center text-green-800">
                <FaCheckCircle className="mr-2 text-xl" />
                <span className="text-lg font-medium">
                  Account successfully verified!
                </span>
              </div>
              <p className="text-green-600 mt-2">
                You can now access all platform features.
              </p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleRefreshKYC}
            disabled={loading}
            className={`inline-flex items-center justify-center px-8 py-4 rounded-xl font-medium text-lg transition-all duration-200 ${
              loading
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-3" />
                Checking Status...
              </>
            ) : (
              <>
                {/* <FaRefresh className="mr-3" /> */}
                Check Status Again
              </>
            )}
          </button>

          {/* Help Text */}
          <p className="text-sm text-gray-500 mt-6">
            Need help? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KYCStatus;
