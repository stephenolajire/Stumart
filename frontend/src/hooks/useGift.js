// hooks/useGift.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { giftService } from "../services/giftService";

export const WHEEL_ITEMS_KEY = ["gift", "wheel-items"];
export const CAN_SPIN_KEY = ["gift", "can-spin"];
export const MY_SPINS_KEY = ["gift", "my-spins"];

// ── response unwrappers (matches selectCart pattern in useCart) ───────────────

const selectWheelItems = (res) => {
  const body = res?.data ?? res;
  return body ?? [];
};

const selectEligibility = (res) => {
  const body = res?.data ?? res;
  return body;
};

const selectSpinHistory = (res) => {
  const body = res?.data ?? res;
  return body ?? [];
};

// ─────────────────────────────────────────────────────────────────────────────

export const useGift = () => {
  const queryClient = useQueryClient();
  const isLoggedIn = !!localStorage.getItem("access");

  // ── wheel items ───────────────────────────────────────────────────────────
  const wheelQuery = useQuery({
    queryKey: WHEEL_ITEMS_KEY,
    queryFn: giftService.getWheelItems,
    enabled: isLoggedIn,
    select: selectWheelItems,
    staleTime: 1000 * 60 * 10,
  });

  // ── eligibility ───────────────────────────────────────────────────────────
  const eligibilityQuery = useQuery({
    queryKey: CAN_SPIN_KEY,
    queryFn: giftService.canSpin,
    enabled: isLoggedIn,
    select: selectEligibility,
    refetchInterval: 1000 * 60,
    staleTime: 0,
  });

  // ── spin history ──────────────────────────────────────────────────────────
  const historyQuery = useQuery({
    queryKey: MY_SPINS_KEY,
    queryFn: giftService.mySpins,
    enabled: isLoggedIn,
    select: selectSpinHistory,
    staleTime: 1000 * 60 * 2,
  });

  // ── spin mutation ─────────────────────────────────────────────────────────
  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await giftService.spin();
      const body = res?.data ?? res;
      return body;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAN_SPIN_KEY });
      queryClient.invalidateQueries({ queryKey: MY_SPINS_KEY });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const doSpin = () => {
    if (!isLoggedIn) return false;
    if (spinMutation.isPending) return false;
    spinMutation.mutate();
    return true;
  };

  return {
    // wheel data
    wheelItems: wheelQuery.data ?? [],
    isLoadingWheel: wheelQuery.isLoading,

    // eligibility
    canSpin: eligibilityQuery.data?.can_spin ?? false,
    nextSpin: eligibilityQuery.data?.next_spin ?? null,
    isLoadingEligibility: eligibilityQuery.isLoading,

    // history
    spinHistory: historyQuery.data ?? [],
    isLoadingHistory: historyQuery.isLoading,

    // spin action
    doSpin,
    isSpinning: spinMutation.isPending,
    spinResult: spinMutation.data ?? null,
    spinError: spinMutation.error,
    resetSpin: spinMutation.reset,

    isLoggedIn,
  };
};
