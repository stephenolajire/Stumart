import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/stumart.jpeg";

const userTypes = [
  {
    type: "Student",
    route: "/signup/student",
    icon: "🎓",
    tagline: "Shop, order & get delivered on campus",
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  {
    type: "Vendor",
    route: "/signup/vendor",
    icon: "🏪",
    tagline: "Sell your products to students nearby",
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    type: "Picker",
    route: "/signup/picker",
    icon: "🛵",
    tagline: "Deliver orders and earn on your schedule",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    type: "Student Picker",
    route: "/signup/student-picker",
    icon: "🎒",
    tagline: "Earn by delivering within your hostel",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
];

const SelectUserType = () => {
  const [selected, setSelected] = useState(null);
  const [hovering, setHovering] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) return;
    const found = userTypes.find((u) => u.type === selected);
    if (found) navigate(found.route);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-yellow-50 via-orange-50 to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <img
            src={logo}
            alt="StuMart"
            className="w-16 h-16 rounded-full object-cover mx-auto mb-4 shadow-md"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join StuMart
          </h1>
          <p className="text-gray-500 text-sm">
            Who are you? Select your role to get started.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {userTypes.map((u) => {
            const isSelected = selected === u.type;
            return (
              <button
                key={u.type}
                onClick={() => setSelected(u.type)}
                onMouseEnter={() => setHovering(u.type)}
                onMouseLeave={() => setHovering(null)}
                className="w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 flex items-center gap-4"
                style={{
                  backgroundColor: isSelected ? u.bg : "white",
                  borderColor: isSelected
                    ? u.color
                    : hovering === u.type
                      ? u.border
                      : "#e5e7eb",
                  boxShadow: isSelected
                    ? `0 0 0 3px ${u.color}22`
                    : "0 1px 3px rgba(0,0,0,0.06)",
                  transform:
                    isSelected || hovering === u.type
                      ? "translateY(-1px)"
                      : "none",
                }}
              >
                <div
                  className="text-3xl w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: u.bg }}
                >
                  {u.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-base">
                      {u.type}
                    </span>
                    {isSelected && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: u.color,
                          color: "white",
                        }}
                      >
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{u.tagline}</p>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
                  style={{
                    borderColor: isSelected ? u.color : "#d1d5db",
                    backgroundColor: isSelected ? u.color : "white",
                  }}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full py-4 rounded-xl font-semibold text-white text-base transition-all duration-200"
          style={{
            backgroundColor: selected ? "#f59e0b" : "#d1d5db",
            cursor: selected ? "pointer" : "not-allowed",
            boxShadow: selected ? "0 4px 14px rgba(245,158,11,0.4)" : "none",
            transform: selected ? "scale(1.01)" : "scale(1)",
          }}
        >
          Continue as {selected || "..."}
        </button>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-yellow-600 font-medium hover:text-yellow-700"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export default SelectUserType;
