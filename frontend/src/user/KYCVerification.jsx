import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../constant/api";
import styles from "../css/KYCVerification.module.css";

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
    // { value: "student_id", label: "Student ID Card" },
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
        confirmButtonColor: "var(--primary-500)",
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
          confirmButtonColor: "var(--primary-500)",
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
        confirmButtonColor: "var(--primary-500)",
      });
      return;
    }

    setIsLoading(true);
    const submitData = new FormData();
    submitData.append("selfie_image", formData.selfie_image);
    submitData.append("id_type", formData.id_type);
    submitData.append("id_image", formData.id_image);

    try {
      await api.post("/kyc/", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await Swal.fire({
        icon: "success",
        title: "Verification Submitted!",
        text: "Your KYC verification has been submitted successfully.",
        confirmButtonColor: "var(--primary-500)",
      });

      navigate("/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.response?.data?.error || "Please try again",
        confirmButtonColor: "var(--primary-500)",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.kycContainer}>
      <div className={styles.kycBox}>
        <h2>Account Verification</h2>
        <p>Please provide the following documents to verify your identity</p>

        <form onSubmit={handleSubmit} className={styles.kycForm}>
          <div className={styles.imageSection}>
            <label>Selfie Image</label>

            {!isCameraOpen && !preview.selfie && (
              <button
                type="button"
                className={styles.cameraButton}
                onClick={startCamera}
              >
                Take a Selfie
              </button>
            )}

            {isCameraOpen && (
              <div className={styles.cameraContainer}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={styles.videoPreview}
                />
                <button
                  type="button"
                  onClick={captureSelfie}
                  className={styles.captureButton}
                >
                  Capture Selfie
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className={styles.closeCameraButton}
                >
                  Close Camera
                </button>
              </div>
            )}

            {preview.selfie && (
              <div
                className={styles.uploadBox}
                style={{ backgroundImage: `url(${preview.selfie})` }}
              />
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

          <div className={styles.formGroup}>
            <label>
              ID Type
              <select
                value={formData.id_type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, id_type: e.target.value }))
                }
              >
                <option value="">Select ID Type</option>
                {ID_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.imageSection}>
            <label>ID Image</label>
            <div
              className={`${styles.uploadBox} ${
                preview.id ? styles.hasImage : ""
              }`}
              style={
                preview.id ? { backgroundImage: `url(${preview.id})` } : {}
              }
            >
              {!preview.id && <span>Click to upload ID</span>}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Verification"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default KYCVerification;
