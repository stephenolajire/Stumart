import { useNavigate } from "react-router-dom";
import {
  FaCamera,
  FaUpload,
  FaTimesCircle,
  FaCheckCircle,
  FaShieldAlt,
  FaIdCard,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { useSubmitKyc } from "../hooks/useUser";

const ID_TYPES = [
  { value: "student_id", label: "Student ID Card" },
  { value: "course_form", label: "Student Course Form" },
  { value: "national_id", label: "National ID Card" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "voters_card", label: "Voter's Card" },
  { value: "passport", label: "International Passport" },
];

const KYCVerification = () => {
  const navigate = useNavigate();
  const userType = localStorage.getItem("userType");
  const { mutate: submitKyc, isPending } = useSubmitKyc();

  const [formData, setFormData] = useState({
    selfie_image: null,
    id_type: "",
    id_image: null,
  });
  const [preview, setPreview] = useState({ selfie: null, id: null });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  /* ── Camera ── */
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      setFormData((p) => ({ ...p, selfie_image: file }));
      setPreview((p) => ({ ...p, selfie: URL.createObjectURL(blob) }));
      stopCamera();
    }, "image/jpeg");
  };

  const stopCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    setIsCameraOpen(false);
  };

  /* ── ID image ── */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File Too Large",
        text: "Please select an image less than 5MB",
        confirmButtonColor: "#eab308",
      });
      return;
    }
    setFormData((p) => ({ ...p, id_image: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreview((p) => ({ ...p, id: reader.result }));
    reader.readAsDataURL(file);
  };

  /* ── Submit ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.selfie_image || !formData.id_type || !formData.id_image) {
      Swal.fire({
        icon: "error",
        title: "Incomplete Form",
        text: "Please complete all three steps",
        confirmButtonColor: "#eab308",
      });
      return;
    }
    const fd = new FormData();
    fd.append("selfie_image", formData.selfie_image, "selfie.jpg");
    fd.append("id_image", formData.id_image, "id.jpg");
    fd.append("id_type", formData.id_type);

    submitKyc(fd, {
      onSuccess: () => {
        Swal.fire({
          icon: "success",
          title: "Verification Submitted!",
          text: "Your KYC has been submitted successfully.",
          confirmButtonColor: "#eab308",
        }).then(() => {
          if (userType === "vendor") navigate("/add-product");
          else navigate("/kyc-status");
        });
      },
      onError: (err) => {
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: err.response?.data?.error || "Please try again later",
          confirmButtonColor: "#eab308",
        });
      },
    });
  };

  /* ── Step tracker ── */
  const steps = [
    { label: "Take Selfie", done: !!preview.selfie },
    { label: "Select ID Type", done: !!formData.id_type },
    { label: "Upload ID", done: !!preview.id },
  ];
  const completedSteps = steps.filter((s) => s.done).length;

  /* ── Shared styles ── */
  const sectionClass = "border border-border rounded-xl p-5 space-y-4";
  const sectionTitle =
    "flex items-center gap-2 text-sm font-semibold text-text-primary";

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="bg-surface rounded-2xl shadow-xl border border-border overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-background-tertiary">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(completedSteps / 3) * 100}%`,
                backgroundColor: "var(--color-primary)",
              }}
            />
          </div>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "rgba(234,179,8,0.12)" }}
              >
                <FaShieldAlt
                  className="text-2xl"
                  style={{ color: "var(--color-primary)" }}
                />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                Account Verification
              </h2>
              <p className="text-text-secondary text-sm">
                Complete all three steps to verify your identity
              </p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                      style={{
                        backgroundColor: step.done
                          ? "var(--color-primary)"
                          : "var(--color-background-tertiary)",
                        color: step.done
                          ? "white"
                          : "var(--color-text-tertiary)",
                      }}
                    >
                      {step.done ? (
                        <FaCheckCircle className="text-xs" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className="text-xs font-medium hidden sm:block"
                      style={{
                        color: step.done
                          ? "var(--color-primary)"
                          : "var(--color-text-tertiary)",
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="h-px w-8 shrink-0"
                      style={{
                        backgroundColor: step.done
                          ? "var(--color-primary)"
                          : "var(--color-border)",
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ── Step 1: Selfie ── */}
              <div className={sectionClass}>
                <p className={sectionTitle}>
                  <FaCamera style={{ color: "var(--color-primary)" }} />
                  Step 1 — Take a Selfie
                </p>

                {!isCameraOpen && !preview.selfie && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full py-10 border-2 border-dashed rounded-xl flex flex-col items-center gap-3 transition-all duration-200 group"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-background-secondary)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--color-primary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--color-border)")
                    }
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(234,179,8,0.12)" }}
                    >
                      <FaCamera
                        className="text-xl"
                        style={{ color: "var(--color-primary)" }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm text-text-primary">
                        Open Camera
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        Click to take your selfie
                      </p>
                    </div>
                  </button>
                )}

                {isCameraOpen && (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-xl"
                      />
                      {/* oval guide */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-36 h-44 border-2 border-dashed border-white/60 rounded-full" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={captureSelfie}
                        className="py-2.5 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2"
                        style={{ backgroundColor: "var(--color-success)" }}
                      >
                        <FaCheckCircle /> Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="py-2.5 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2"
                        style={{ backgroundColor: "var(--color-error)" }}
                      >
                        <FaTimesCircle /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                {preview.selfie && (
                  <div
                    className="relative rounded-xl overflow-hidden border-2"
                    style={{ borderColor: "var(--color-success)" }}
                  >
                    <img
                      src={preview.selfie}
                      alt="Selfie"
                      className="w-full h-56 object-cover"
                    />
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: "var(--color-success)" }}
                    >
                      <FaCheckCircle /> Captured
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPreview((p) => ({ ...p, selfie: null }));
                        setFormData((p) => ({ ...p, selfie_image: null }));
                      }}
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                    >
                      Retake
                    </button>
                  </div>
                )}
              </div>

              {/* ── Step 2: ID Type ── */}
              <div className={sectionClass}>
                <p className={sectionTitle}>
                  <FaIdCard style={{ color: "var(--color-primary)" }} />
                  Step 2 — Select ID Type
                </p>
                <select
                  value={formData.id_type}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, id_type: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200"
                  style={{
                    borderColor: formData.id_type
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                    backgroundColor: "var(--color-background-secondary)",
                    color: "var(--color-text-primary)",
                    boxShadow: formData.id_type
                      ? "0 0 0 3px rgba(234,179,8,0.15)"
                      : "none",
                  }}
                  required
                >
                  <option value="">Select ID Type</option>
                  {ID_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Step 3: ID Image ── */}
              <div className={sectionClass}>
                <p className={sectionTitle}>
                  <FaUpload style={{ color: "var(--color-primary)" }} />
                  Step 3 — Upload ID Image
                </p>

                <div className="relative">
                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer"
                    style={{
                      borderColor: preview.id
                        ? "var(--color-success)"
                        : "var(--color-border)",
                      backgroundColor: preview.id
                        ? "rgba(16,185,129,0.05)"
                        : "var(--color-background-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      if (!preview.id)
                        e.currentTarget.style.borderColor =
                          "var(--color-primary)";
                    }}
                    onMouseLeave={(e) => {
                      if (!preview.id)
                        e.currentTarget.style.borderColor =
                          "var(--color-border)";
                    }}
                  >
                    {preview.id ? (
                      <div className="relative">
                        <img
                          src={preview.id}
                          alt="ID Preview"
                          className="max-w-full h-52 object-contain mx-auto rounded-lg"
                        />
                        <div
                          className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: "var(--color-success)" }}
                        >
                          <FaCheckCircle /> Uploaded
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "rgba(234,179,8,0.12)" }}
                        >
                          <FaUpload
                            className="text-xl"
                            style={{ color: "var(--color-primary)" }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-text-primary">
                            Click to upload your ID
                          </p>
                          <p className="text-xs text-text-tertiary mt-1">
                            PNG, JPG, JPEG — max 5MB
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

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 rounded-xl font-semibold text-white text-base transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                style={{
                  backgroundColor: isPending
                    ? "var(--color-border-dark)"
                    : "var(--color-primary)",
                  cursor: isPending ? "not-allowed" : "pointer",
                  boxShadow: !isPending
                    ? "0 4px 14px rgba(234,179,8,0.35)"
                    : "none",
                }}
              >
                {isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting Verification...
                  </>
                ) : (
                  <>
                    <FaShieldAlt />
                    Submit Verification
                    {completedSteps < 3 && (
                      <span className="text-xs font-normal opacity-70">
                        ({completedSteps}/3 done)
                      </span>
                    )}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-text-tertiary">
                🔒 Your information is secure and only used for verification
                purposes.
              </p>
            </form>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default KYCVerification;
