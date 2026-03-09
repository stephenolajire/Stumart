import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userService from "../services/userService";

// ── Query Keys ───────────────────────────────────────────
export const userKeys = {
  all: ["users"],
  lists: () => [...userKeys.all, "list"],
  detail: (id) => [...userKeys.all, "detail", id],

  students: ["students"],
  studentDetail: (id) => ["students", "detail", id],
  studentDetails: ["student-details"],

  vendors: ["vendors"],
  vendorDetail: (id) => ["vendors", "detail", id],
  vendorProfile: ["vendor-profile"],

  pickers: ["pickers"],
  pickerDetail: (id) => ["pickers", "detail", id],

  studentPickers: ["student-pickers"],
  studentPickerDetail: (id) => ["student-pickers", "detail", id],

  companies: ["companies"],
  companyDetail: (id) => ["companies", "detail", id],

  kyc: ["kyc"],
  kycStatus: (userType, userId) => ["kyc-status", userType, userId],

  subscriptions: ["subscriptions"],
  currentSubscription: ["subscriptions", "current"],
  subscriptionPlans: ["subscription-plans"],
};

// ── User Hooks ───────────────────────────────────────────
export const useGetUsers = () =>
  useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => userService.getUsers().then((res) => res.data),
  });

export const useGetUserById = (id) =>
  useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUserById(id).then((res) => res.data),
    enabled: !!id,
  });

// ── Student Hooks ────────────────────────────────────────
export const useRegisterStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      userService.registerStudent(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.students });
    },
  });
};

export const useGetStudents = () =>
  useQuery({
    queryKey: userKeys.students,
    queryFn: () => userService.getStudents().then((res) => res.data),
  });

export const useGetStudentById = (id) =>
  useQuery({
    queryKey: userKeys.studentDetail(id),
    queryFn: () => userService.getStudentById(id).then((res) => res.data),
    enabled: !!id,
  });

export const useGetStudentDetails = () =>
  useQuery({
    queryKey: userKeys.studentDetails,
    queryFn: () => userService.getStudentDetails().then((res) => res.data),
  });

export const useUpdateStudentProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      userService.updateStudentProfile(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.studentDetails });
    },
  });
};

// ── Vendor Hooks ─────────────────────────────────────────
export const useRegisterVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      userService.registerVendor(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.vendors });
    },
  });
};

export const useGetVendors = (params) =>
  useQuery({
    queryKey: [...userKeys.vendors, params],
    queryFn: () => userService.getVendors(params).then((res) => res.data),
  });

export const useGetVendorById = (id) =>
  useQuery({
    queryKey: userKeys.vendorDetail(id),
    queryFn: () => userService.getVendorById(id).then((res) => res.data),
    enabled: !!id,
  });

export const useGetVendorProfile = () =>
  useQuery({
    queryKey: userKeys.vendorProfile,
    queryFn: () => userService.getVendorProfile().then((res) => res.data),
  });

// ── Picker Hooks ─────────────────────────────────────────
export const useRegisterPicker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      userService.registerPicker(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.pickers });
    },
  });
};

export const useGetPickers = (params) =>
  useQuery({
    queryKey: [...userKeys.pickers, params],
    queryFn: () => userService.getPickers(params).then((res) => res.data),
  });

export const useGetPickerById = (id) =>
  useQuery({
    queryKey: userKeys.pickerDetail(id),
    queryFn: () => userService.getPickerById(id).then((res) => res.data),
    enabled: !!id,
  });

// ── Student Picker Hooks ──────────────────────────────────
export const useRegisterStudentPicker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      userService.registerStudentPicker(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.studentPickers });
    },
  });
};

export const useGetStudentPickers = (params) =>
  useQuery({
    queryKey: [...userKeys.studentPickers, params],
    queryFn: () =>
      userService.getStudentPickers(params).then((res) => res.data),
  });

export const useGetStudentPickerById = (id) =>
  useQuery({
    queryKey: userKeys.studentPickerDetail(id),
    queryFn: () => userService.getStudentPickerById(id).then((res) => res.data),
    enabled: !!id,
  });

// ── Company Hooks ─────────────────────────────────────────
export const useRegisterCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      userService.registerCompany(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.companies });
    },
  });
};

export const useGetCompanies = () =>
  useQuery({
    queryKey: userKeys.companies,
    queryFn: () => userService.getCompanies().then((res) => res.data),
  });

export const useGetCompanyById = (id) =>
  useQuery({
    queryKey: userKeys.companyDetail(id),
    queryFn: () => userService.getCompanyById(id).then((res) => res.data),
    enabled: !!id,
  });

// ── Auth / OTP Hooks ─────────────────────────────────────
export const useVerifyEmail = () =>
  useMutation({
    mutationFn: (data) => userService.verifyEmail(data).then((res) => res.data),
  });

export const useResendOtp = () =>
  useMutation({
    mutationFn: (data) => userService.resendOtp(data).then((res) => res.data),
  });

export const useRequestOtp = () =>
  useMutation({
    mutationFn: (data) => userService.requestOtp(data).then((res) => res.data),
  });

export const useVerifyOtp = () =>
  useMutation({
    mutationFn: (data) => userService.verifyOtp(data).then((res) => res.data),
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: (data) =>
      userService.resetPassword(data).then((res) => res.data),
  });

// ── KYC Hooks ─────────────────────────────────────────────
export const useSubmitKyc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => userService.submitKyc(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.kyc });
    },
  });
};

export const useGetKyc = () =>
  useQuery({
    queryKey: userKeys.kyc,
    queryFn: () => userService.getKyc().then((res) => res.data),
  });

export const useGetKycStatus = (userType, userId) =>
  useQuery({
    queryKey: userKeys.kycStatus(userType, userId),
    queryFn: () =>
      userService.getKycStatus(userType, userId).then((res) => res.data),
    enabled: !!userType && !!userId,
  });

// ── Subscription Hooks ────────────────────────────────────
export const useGetSubscriptions = () =>
  useQuery({
    queryKey: userKeys.subscriptions,
    queryFn: () => userService.getSubscriptions().then((res) => res.data),
  });

export const useGetCurrentSubscription = () =>
  useQuery({
    queryKey: userKeys.currentSubscription,
    queryFn: () => userService.getCurrentSubscription().then((res) => res.data),
  });

export const useSubscribe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => userService.subscribe(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.subscriptions });
      queryClient.invalidateQueries({ queryKey: userKeys.currentSubscription });
    },
  });
};

export const useGetAllPlans = () =>
  useQuery({
    queryKey: userKeys.subscriptionPlans,
    queryFn: () => userService.getAllPlans().then((res) => res.data),
  });
