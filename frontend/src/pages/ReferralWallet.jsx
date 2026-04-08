import { useState } from "react";
import { useReferral } from "../hooks/useReferral";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function ReferralWallet() {
  const {
    hasReferral,
    isLoadingProfile,
    profileError,
    referralCode,
    pendingPayout,
    lifetimeEarnings,
    totalReferrals,
    lifetimeReferrals,
    payoutHistory,
    totalAmountPaid,
    isLoadingHistory,
    createReferral,
    isCreating,
  } = useReferral();

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoadingProfile) {
    return (
      <div className="w-[95%] mx-auto p-6 animate-pulse bg-gray-100 h-64 rounded-2xl" />
    );
  }

  if (!hasReferral) {
    return (
      <div className="w-[95%] mx-auto py-16">
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900">Invite & Earn</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Join our referral program and get rewarded for every friend who
            joins.
          </p>
          <button
            onClick={createReferral}
            className="mt-6 bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-2.5 rounded-xl transition-all active:scale-95 text-sm"
          >
            {isCreating ? "Setting up..." : "Activate my referral link"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[95%]  mx-auto py-6 flex flex-col gap-3 box-border">
      {/* Balance card */}
      <div className="relative overflow-hidden bg-[#1a1a1a] rounded-2xl p-5 text-white mt-36 lg:mt-0">
        <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
          Pending payout
        </p>
        <h2 className="text-4xl font-medium text-amber-400 mt-1 leading-tight">
          {formatCurrency(pendingPayout)}
        </h2>
        <div className="flex items-start gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
              Total paid
            </p>
            <p className="text-sm font-medium text-gray-200 mt-0.5 truncate">
              {formatCurrency(totalAmountPaid)}
            </p>
          </div>
          <div className="w-px self-stretch bg-white/10 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
              Lifetime
            </p>
            <p className="text-sm font-medium text-gray-200 mt-0.5 truncate">
              {formatCurrency(lifetimeEarnings)}
            </p>
          </div>
        </div>
      </div>

      {/* Share card */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
        <h3 className="text-amber-900 font-medium text-sm">
          Your referral code
        </h3>
        <p className="text-amber-800/60 text-xs mt-0.5">
          Earn rewards for every user you bring in
        </p>
        <div className="mt-3 bg-amber-900/[0.07] border border-amber-900/10 px-4 py-2.5 rounded-xl">
          <span className="font-mono font-medium text-amber-900 tracking-widest text-sm block truncate">
            {referralCode}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`mt-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
            copied
              ? "bg-emerald-700 text-emerald-50"
              : "bg-amber-800 text-amber-50 hover:bg-amber-900"
          }`}
        >
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 truncate">
            Active referrals
          </p>
          <p className="text-2xl font-medium text-gray-900 mt-1">
            {totalReferrals}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 truncate">
            Lifetime referrals
          </p>
          <p className="text-2xl font-medium text-gray-900 mt-1">
            {lifetimeReferrals}
          </p>
        </div>
      </div>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-blue-700 text-xs font-medium text-center leading-relaxed">
          Share your code on social media to reach more people and earn faster
        </p>
      </div>

      {/* Payout history — card list on mobile, table on larger screens */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">Payout history</h3>
        </div>

        {payoutHistory.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-gray-400 italic">
            No payouts recorded yet.
          </p>
        ) : (
          <>
            {/* Mobile: card list */}
            <ul className="divide-y divide-gray-50 sm:hidden">
              {payoutHistory.map((payout) => (
                <li
                  key={payout.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {formatDate(payout.payout_date)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {payout.referral_count} referral
                      {payout.referral_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-gray-800">
                      {formatCurrency(payout.amount)}
                    </span>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                        payout.email_sent
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {payout.email_sent ? "Paid" : "Pending"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* sm+: full table */}
            <div className="hidden sm:block w-full overflow-x-auto">
              <table
                className="w-full text-left"
                style={{ tableLayout: "fixed" }}
              >
                <colgroup>
                  <col style={{ width: "34%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "22%" }} />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                      Date
                    </th>
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-400 text-right">
                      Refs
                    </th>
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-400 text-right">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-400 text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payoutHistory.map((payout) => (
                    <tr
                      key={payout.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
                        {formatDate(payout.payout_date)}
                      </td>
                      <td className="px-4 py-3 text-xs text-right text-gray-500 whitespace-nowrap">
                        {payout.referral_count}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-right text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide whitespace-nowrap ${
                            payout.email_sent
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {payout.email_sent ? "Paid" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
