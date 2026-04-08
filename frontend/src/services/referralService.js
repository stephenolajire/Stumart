import api from "../constant/api";

export const referralService = {
  create: () => api.post("/referrals/create/"),
  getByEmail: (email) => api.get(`/referrals/email/${email}/`),
  getStats: (referralCode) => api.get(`/referrals/${referralCode}/stats/`),
  getPayoutHistory: (referralCode) =>
    api.get(`/referrals/${referralCode}/payout-history/`),
  validate: (referralCode) =>
    api.post("/referrals/validate/", { referral_code: referralCode }),
};
