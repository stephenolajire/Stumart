import React from "react";
import { FaTimes } from "react-icons/fa";

const PickerDetailsModal = ({ picker, onClose }) => {
  if (!picker) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          onClick={onClose}
        >
          <FaTimes className="text-xl" />
        </button>

        {/* Modal Content */}
        <div className="p-6">
          {/* Picker Profile Section */}
          <div className="flex flex-col items-center text-center">
            {/* Profile Image */}
            <div className="mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-500 mx-auto">
                <img
                  src={picker.profile_picture || "/default-avatar.png"}
                  alt={`${picker.first_name} ${picker.last_name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Picker Info */}
            <div className="w-full">
              {/* Name */}
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {picker.first_name} {picker.last_name}
              </h3>

              {/* Info Grid */}
              <div className="space-y-4 text-left">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email:
                  </label>
                  <p className="text-gray-900 font-medium">{picker.email}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Phone:
                  </label>
                  <p className="text-gray-900 font-medium">
                    {picker.phone_number}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickerDetailsModal;
