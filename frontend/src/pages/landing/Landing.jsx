import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero";
import FeaturedShops from "../components/FeaturedShops";
import { GlobalContext } from "../../constant/GlobalContext";

const GuestNoticePopup = ({ onClose }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
          <div
            className="h-full bg-yellow-400 transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 10) * 100}%` }}
          />
        </div>

        {/* Close + countdown */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <span className="text-xs text-gray-400">Closes in {countdown}s</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-6">
          {/* Icon */}
          <div className="w-14 h-14 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏪</span>
          </div>

          <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
            You're browsing as a guest
          </h3>
          <p className="text-sm text-gray-500 text-center mb-5">
            You're currently seeing vendors and products from{" "}
            <strong className="text-gray-700">all institutions</strong>. Sign in
            to see vendors closest to you.
          </p>

          {/* What you're missing */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-5 space-y-2">
            {[
              {
                icon: "📍",
                title: "Campus-specific vendors",
                desc: "See only vendors in your school or nearest campus",
              },
              {
                icon: "🚀",
                title: "Faster delivery",
                desc: "Orders fulfilled by vendors on your campus",
              },
              {
                icon: "🏘️",
                title: "Not a student? No problem",
                desc: "Register with your nearest campus to shop locally",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{icon}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/login")}
              className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-xl transition-colors"
            >
              Create Account
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Continue browsing as guest
          </button>
        </div>
      </div>
    </div>
  );
};

const Landing = () => {
  const { isAuthenticated } = useContext(GlobalContext);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      const hasSeenPopup = localStorage.getItem("guest_popup_seen");
      if (!hasSeenPopup) {
        const delay = setTimeout(() => setShowPopup(true), 1000);
        return () => clearTimeout(delay);
      }
    }
  }, [isAuthenticated]);

  const handleClose = () => {
    setShowPopup(false);
    localStorage.setItem("guest_popup_seen", "true");
  };

  return (
    <main className="mt-7 overflow-x-hidden w-screen lg:w-[calc(100vw-272px)]">
      {showPopup && <GuestNoticePopup onClose={handleClose} />}

      <section>
        <Hero />
      </section>
      <section>
        <FeaturedShops />
      </section>
    </main>
  );
};

export default Landing;
