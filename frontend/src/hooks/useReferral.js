import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { referralService } from "../services/referralService";

export const REFERRAL_PROFILE_KEY = (email) => ["referral", "profile", email];
export const REFERRAL_STATS_KEY = (code) => ["referral", "stats", code];
export const REFERRAL_PAYOUT_HISTORY_KEY = (code) => [
  "referral",
  "payout-history",
  code,
];

const getStoredEmail = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.email ?? null;
  } catch {
    return null;
  }
};

const selectReferralProfile = (res) => {
  const body = res?.data ?? res;
  return body ?? null;
};

const selectStats = (res) => {
  const body = res?.data ?? res;
  return body ?? null;
};

const selectPayoutHistory = (res) => {
  const body = res?.data ?? res;
  return body ?? null;
};

export const useReferral = () => {
  const queryClient = useQueryClient();
  const isLoggedIn = !!localStorage.getItem("access");
  const email = getStoredEmail();
  const profileKey = REFERRAL_PROFILE_KEY(email ?? "current");

  const profileQuery = useQuery({
    queryKey: profileKey,
    queryFn: () => referralService.getByEmail(email ?? "current"),
    enabled: isLoggedIn,
    select: selectReferralProfile,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const referralCode = profileQuery.data?.referral_code ?? null;

  const statsQuery = useQuery({
    queryKey: REFERRAL_STATS_KEY(referralCode ?? ""),
    queryFn: () => referralService.getStats(referralCode),
    enabled: isLoggedIn && !!referralCode,
    select: selectStats,
    staleTime: 1000 * 60 * 2,
  });

  const payoutHistoryQuery = useQuery({
    queryKey: REFERRAL_PAYOUT_HISTORY_KEY(referralCode ?? ""),
    queryFn: () => referralService.getPayoutHistory(referralCode),
    enabled: isLoggedIn && !!referralCode,
    select: selectPayoutHistory,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await referralService.create();
      const body = res?.data ?? res;
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileKey,
      });
    },
  });

  const createReferral = () => {
    if (!isLoggedIn || createMutation.isPending) return false;
    createMutation.mutate();
    return true;
  };

  return {
    hasReferral: profileQuery.isSuccess && !!profileQuery.data,
    isLoadingProfile: profileQuery.isLoading,
    profileError: profileQuery.error,

    referralCode,
    profile: profileQuery.data ?? null,

    stats: statsQuery.data?.stats ?? null,
    isLoadingStats: statsQuery.isLoading,

    pendingPayout: profileQuery.data?.total_earnings ?? 0,
    lifetimeEarnings: profileQuery.data?.lifetime_earnings ?? 0,
    totalReferrals: profileQuery.data?.total_referrals ?? 0,
    lifetimeReferrals: profileQuery.data?.lifetime_referrals ?? 0,

    payoutHistory: payoutHistoryQuery.data?.payout_history ?? [],
    totalAmountPaid: payoutHistoryQuery.data?.total_amount_paid ?? 0,
    totalPayouts: payoutHistoryQuery.data?.total_payouts ?? 0,
    isLoadingHistory: payoutHistoryQuery.isLoading,

    createReferral,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    createSuccess: createMutation.isSuccess,
    resetCreate: createMutation.reset,

    isLoggedIn,
  };
};
