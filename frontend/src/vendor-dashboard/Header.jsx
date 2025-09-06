import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 mb-6">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center space-x-2 cursor-pointer text-gray-600 hover:text-yellow-600 transition-colors duration-200 group"
          onClick={() => navigate("/vendor-dashboard")}
        >
          <FaArrowLeft
            size={20}
            className="group-hover:transform group-hover:-translate-x-1 transition-transform duration-200"
          />
          <span className="font-medium">Back</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Add Product</h2>
      </div>
    </div>
  );
};

export default Header;
