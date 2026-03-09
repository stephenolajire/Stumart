import api from "../constant/api";

const userService = {
  // ── Auth / OTP ───────────────────────────────────────────
  verifyEmail: (data) => api.post("/user/verify-email/", data),

  resendOtp: (data) => api.post("/user/resend-otp/", data),

  requestOtp: (data) => api.post("/user/request-otp/", data),

  verifyOtp: (data) => api.post("/user/verify-otp/", data),

  resetPassword: (data) => api.post("/user/reset-password/", data),

  // ── User ────────────────────────────────────────────────
  getUsers: () => api.get("/user/users/"),

  getUserById: (id) => api.get(`/user/users/${id}/`),

  // ── Student ─────────────────────────────────────────────
  registerStudent: (data) => api.post("/user/students/", data),

  getStudents: () => api.get("/user/students/"),

  getStudentById: (id) => api.get(`/user/students/${id}/`),

  getStudentDetails: () => api.get("/user/student-details/"),

  updateStudentProfile: (data) =>
    api.patch("/user/update-student-profile/", data),

  // ── Vendor ──────────────────────────────────────────────
  registerVendor: (data) => api.post("/user/vendors/", data),

  getVendors: (params) => api.get("/user/vendors/", { params }),

  getVendorById: (id) => api.get(`/user/vendors/${id}/`),

  getVendorProfile: () => api.get("/user/vendor/profile/"),

  // ── Picker ──────────────────────────────────────────────
  registerPicker: (data) => api.post("/user/pickers/", data),

  getPickers: (params) => api.get("/user/pickers/", { params }),

  getPickerById: (id) => api.get(`/user/pickers/${id}/`),

  // ── Student Picker ───────────────────────────────────────
  registerStudentPicker: (data) => api.post("/user/student-pickers/", data),

  getStudentPickers: (params) => api.get("/user/student-pickers/", { params }),

  getStudentPickerById: (id) => api.get(`/user/student-pickers/${id}/`),

  // ── Company ─────────────────────────────────────────────
  registerCompany: (data) => api.post("/user/company/signup/", data),

  getCompanies: () => api.get("/user/companies/"),

  getCompanyById: (id) => api.get(`/user/company/${id}/`),

  // ── KYC ─────────────────────────────────────────────────
  submitKyc: (data) => api.post("/user/kyc/", data),

  getKyc: () => api.get("/user/kyc/"),

  getKycStatus: (userType, userId) =>
    api.get(`/user/kyc-status/${userType}/${userId}/`),

  // ── Subscription ─────────────────────────────────────────
  getSubscriptions: () => api.get("/user/subscription/"),

  getCurrentSubscription: () => api.get("/user/subscriptions/current/"),

  subscribe: (data) => api.post("/user/subscriptions/subscribe/", data),

  getAllPlans: () => api.get("/user/subscriptions/plans/"),
};

export default userService;
