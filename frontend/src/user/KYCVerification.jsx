import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCamera,
  FaUpload,
  FaTimesCircle,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";
import Swal from "sweetalert2";
import api from "../constant/api";

const KYCVerification = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    selfie_image: null,
    id_type: "",
    id_image: null,
  });
  const [preview, setPreview] = useState({ selfie: null, id: null });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const ID_TYPES = [
    { value: "student_id", label: "Student ID Card" },
    { value: "course_form", label: "Student Course Form" },
    { value: "national_id", label: "National ID Card" },
    { value: "drivers_license", label: "Driver's License" },
    { value: "voters_card", label: "Voter's Card" },
    { value: "passport", label: "International Passport" },
  ];

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Camera Access Denied",
        text: "Please allow camera access to take a selfie.",
        confirmButtonColor: "#eab308",
      });
      setIsCameraOpen(false);
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });

      setFormData((prev) => ({ ...prev, selfie_image: file }));
      setPreview((prev) => ({ ...prev, selfie: URL.createObjectURL(blob) }));

      stopCamera();
    }, "image/jpeg");
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "File Too Large",
          text: "Please select an image less than 5MB",
          confirmButtonColor: "#eab308",
        });
        return;
      }

      setFormData((prev) => ({ ...prev, id_image: file }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview((prev) => ({ ...prev, id: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.selfie_image || !formData.id_type || !formData.id_image) {
      Swal.fire({
        icon: "error",
        title: "Incomplete Form",
        text: "Please fill all required fields",
        confirmButtonColor: "#eab308",
      });
      return;
    }

    setIsLoading(true);
    const submitData = new FormData();

    // Ensure files are properly appended with correct names
    if (formData.selfie_image instanceof File) {
      submitData.append("selfie_image", formData.selfie_image, "selfie.jpg");
    }
    if (formData.id_image instanceof File) {
      submitData.append("id_image", formData.id_image, "id.jpg");
    }
    submitData.append("id_type", formData.id_type);

    try {
      const response = await api.post("/kyc/", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
        },
      });

      await Swal.fire({
        icon: "success",
        title: "Verification Submitted!",
        text: "Your KYC verification has been submitted successfully.",
        confirmButtonColor: "#eab308",
      });

      navigate("/add-product");
    } catch (error) {
      console.error("KYC Submission Error:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.response?.data?.message || "Please try again later",
        confirmButtonColor: "#eab308",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Account Verification
            </h2>
            <p className="text-gray-600">
              Please provide the following documents to verify your identity
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Selfie Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selfie Image *
              </label>

              {!isCameraOpen && !preview.selfie && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
                  >
                    <FaCamera className="mr-2" />
                    Take a Selfie
                  </button>
                </div>
              )}

              {isCameraOpen && (
                <div className="bg-gray-100 rounded-lg p-6 space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                  <div className="flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={captureSelfie}
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      <FaCheckCircle className="mr-2" />
                      Capture Selfie
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      <FaTimesCircle className="mr-2" />
                      Close Camera
                    </button>
                  </div>
                </div>
              )}

              {preview.selfie && (
                <div className="relative">
                  <div
                    className="w-full h-64 bg-cover bg-center rounded-lg border-2 border-green-300 shadow-md"
                    style={{ backgroundImage: `url(${preview.selfie})` }}
                  />
                  <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    <FaCheckCircle className="inline mr-1" />
                    Captured
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* ID Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                ID Type *
              </label>
              <select
                value={formData.id_type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, id_type: e.target.value }))
                }
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                required
              >
                <option value="">Select ID Type</option>
                {ID_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ID Image Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                ID Image *
              </label>

              <div className="relative">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                    preview.id
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-yellow-400 bg-gray-50 hover:bg-yellow-50"
                  }`}
                >
                  {preview.id ? (
                    <div className="relative">
                      <img
                        src={preview.id}
                        alt="ID Preview"
                        className="max-w-full h-64 object-contain mx-auto rounded-lg shadow-md"
                      />
                      <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        <FaCheckCircle className="inline mr-1" />
                        Uploaded
                      </div>
                    </div>
                  ) : (
                    <div>
                      <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-yellow-600 hover:text-yellow-500 cursor-pointer">
                          Click to upload your ID
                        </span>
                        <p className="mt-1">or drag and drop</p>
                        <p className="mt-2 text-xs text-gray-500">
                          PNG, JPG, JPEG up to 5MB
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-lg font-medium text-lg transition-all duration-200 ${
                  isLoading
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {isLoading ? (
                  <span className="inline-flex items-center">
                    <FaSpinner className="animate-spin mr-3" />
                    Submitting Verification...
                  </span>
                ) : (
                  "Submit Verification"
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Your information is secure and will only be used for
                verification purposes.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default KYCVerification;
