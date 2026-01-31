// ThemeToggle.jsx
import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative bg-surface border border-border p-2 rounded-radius-lg hover:bg-surface-hover transition-colors w-10 h-10 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      <Sun
        className={`absolute h-5 w-5 text-text-primary transition-all duration-300 ${
          theme === "dark"
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 text-text-primary transition-all duration-300 ${
          theme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </button>
  );
}
export default ThemeToggle;