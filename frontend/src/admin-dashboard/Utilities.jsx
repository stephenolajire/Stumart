import React, { useState } from "react";
import {
  Download,
  Mail,
  Users,
  Truck,
  Store,
  CreditCard,
  UserCheck,
  Package,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  MapPin,
  Target,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../constant/api";
import { nigeriaInstitutions, nigeriaStates } from "../constant/data";

const Utilities = () => {
  const [loading, setLoading] = useState({});
  const [showTargetedNewsletterForm, setShowTargetedNewsletterForm] =
    useState(false);
  const [targetedNewsletterData, setTargetedNewsletterData] = useState({
    state: "",
    institution: "",
    user_type: "",
    subject: "",
    message: "",
  });
  const [recipientCount, setRecipientCount] = useState(null);

  // Helper function to set loading state for specific actions
  const setActionLoading = (action, isLoading) => {
    setLoading((prev) => ({
      ...prev,
      [action]: isLoading,
    }));
  };

  // Download functions
  const handleDownloadUsers = async () => {
    setActionLoading("users", true);
    try {
      const response = await api.get("/admin/download/users", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "users_list.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire({
        title: "Success!",
        text: "Users list has been downloaded successfully",
        icon: "success",
        confirmButtonColor: "#eab308",
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to download users list",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setActionLoading("users", false);
    }
  };

  const handleDownloadVendors = async () => {
    setActionLoading("vendors", true);
    try {
      const response = await api.get("/admin/download/vendors", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "vendors_list.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire({
        title: "Success!",
        text: "Vendors list has been downloaded successfully",
        icon: "success",
        confirmButtonColor: "#eab308",
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to download vendors list",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setActionLoading("vendors", false);
    }
  };

  const handleDownloadPickers = async () => {
    setActionLoading("pickers", true);
    try {
      const response = await api.get("/admin/download/pickers", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "pickers_list.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire({
        title: "Success!",
        text: "Pickers list has been downloaded successfully",
        icon: "success",
        confirmButtonColor: "#eab308",
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to download pickers list",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setActionLoading("pickers", false);
    }
  };

  const handleDownloadTransactions = async () => {
    setActionLoading("transactions", true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Swal.fire({
        title: "Success!",
        text: "Transaction history has been downloaded successfully",
        icon: "success",
        confirmButtonColor: "#eab308",
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to download transaction history",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setActionLoading("transactions", false);
    }
  };

  // Email functions
  const handleSendNewsletterToPickers = async () => {
    const { value: newsletter } = await Swal.fire({
      title: "Send Newsletter to Pickers",
      html: `
        <input id="subject" class="swal2-input" placeholder="Subject" style="margin-bottom: 10px;">
        <textarea id="message" class="swal2-textarea" placeholder="Newsletter content" rows="5"></textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Send Newsletter",
      confirmButtonColor: "#eab308",
      preConfirm: () => {
        const subject = document.getElementById("subject").value;
        const message = document.getElementById("message").value;
        if (!subject || !message) {
          Swal.showValidationMessage("Please fill in both subject and message");
          return false;
        }
        return { subject, message };
      },
    });

    if (newsletter) {
      setActionLoading("newsletterPickers", true);
      try {
        const response = await api.post("admin/send/newsletter/", {
          subject: newsletter.subject,
          message: newsletter.message,
          recipient_type: "pickers",
        });
        if (response.status == 200) {
          Swal.fire({
            title: "Success!",
            text: "Newsletter sent to all pickers successfully",
            icon: "success",
            confirmButtonColor: "#eab308",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to send newsletter to pickers",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setActionLoading("newsletterPickers", false);
      }
    }
  };

  const handleSendNewsletterToVendors = async () => {
    const { value: newsletter } = await Swal.fire({
      title: "Send Newsletter to Vendors",
      html: `
        <input id="subject" class="swal2-input" placeholder="Subject" style="margin-bottom: 10px;">
        <textarea id="message" class="swal2-textarea" placeholder="Newsletter content" rows="5"></textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Send Newsletter",
      confirmButtonColor: "#eab308",
      preConfirm: () => {
        const subject = document.getElementById("subject").value;
        const message = document.getElementById("message").value;
        if (!subject || !message) {
          Swal.showValidationMessage("Please fill in both subject and message");
          return false;
        }
        return { subject, message };
      },
    });

    if (newsletter) {
      setActionLoading("newsletterVendors", true);
      try {
        const response = await api.post("admin/send/newsletter/", {
          subject: newsletter.subject,
          message: newsletter.message,
          recipient_type: "vendors",
        });
        if (response.status == 200) {
          Swal.fire({
            title: "Success!",
            text: "Newsletter sent to all vendors successfully",
            icon: "success",
            confirmButtonColor: "#eab308",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to send newsletter to vendors",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setActionLoading("newsletterVendors", false);
      }
    }
  };

  const handleSendNewsletterToAllUsers = async () => {
    const { value: newsletter } = await Swal.fire({
      title: "Send Newsletter to All Users",
      html: `
        <input id="subject" class="swal2-input" placeholder="Subject" style="margin-bottom: 10px;">
        <textarea id="message" class="swal2-textarea" placeholder="Newsletter content" rows="5"></textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Send Newsletter",
      confirmButtonColor: "#eab308",
      preConfirm: () => {
        const subject = document.getElementById("subject").value;
        const message = document.getElementById("message").value;
        if (!subject || !message) {
          Swal.showValidationMessage("Please fill in both subject and message");
          return false;
        }
        return { subject, message };
      },
    });

    if (newsletter) {
      setActionLoading("newsletterAll", true);
      try {
        const response = await api.post("admin/send/newsletter/", {
          subject: newsletter.subject,
          message: newsletter.message,
          recipient_type: "all",
        });
        if (response.status == 200) {
          Swal.fire({
            title: "Success!",
            text: "Newsletter sent to all users successfully",
            icon: "success",
            confirmButtonColor: "#eab308",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to send newsletter to all users",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setActionLoading("newsletterAll", false);
      }
    }
  };

  const handleSendKYCReminder = async () => {
    const result = await Swal.fire({
      title: "Send KYC Reminder",
      text: "Send reminder email to all users without KYC verification?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send Reminder",
      confirmButtonColor: "#eab308",
      cancelButtonColor: "#64748b",
    });

    if (result.isConfirmed) {
      setActionLoading("kycReminder", true);
      try {
        const response = await api.post("admin/send/kyc-reminder/");
        if (response.status === 200) {
          Swal.fire({
            title: "Success!",
            text: "KYC reminder sent to all unverified users",
            icon: "success",
            confirmButtonColor: "#eab308",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to send KYC reminder",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setActionLoading("kycReminder", false);
      }
    }
  };

  const handleSendProductReminder = async () => {
    const result = await Swal.fire({
      title: "Send Product Reminder",
      text: "Send reminder email to all vendors without products?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send Reminder",
      confirmButtonColor: "#eab308",
      cancelButtonColor: "#64748b",
    });

    if (result.isConfirmed) {
      setActionLoading("productReminder", true);
      try {
        const response = await api.post("admin/send/product-reminder/");
        if (response.status === 200) {
          Swal.fire({
            title: "Success!",
            text: "Product reminder sent to vendors without products",
            icon: "success",
            confirmButtonColor: "#eab308",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to send product reminder",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setActionLoading("productReminder", false);
      }
    }
  };

  // Targeted Newsletter Functions
  const handleGetRecipientCount = async () => {
    const { state, institution, user_type } = targetedNewsletterData;

    if (!state || !institution || !user_type) {
      Swal.fire({
        title: "Missing Information",
        text: "Please select state, institution, and user type",
        icon: "warning",
        confirmButtonColor: "#eab308",
      });
      return;
    }

    setActionLoading("recipientCount", true);
    try {
      const response = await api.get("/admin/user-targeted-count/", {
        params: {
          state,
          institution,
          user_type,
        },
      });

      setRecipientCount(response.data.count);

      if (response.data.count === 0) {
        Swal.fire({
          title: "No Recipients Found",
          text: "No users match the selected criteria",
          icon: "info",
          confirmButtonColor: "#eab308",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to get recipient count",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setActionLoading("recipientCount", false);
    }
  };

  const handleSendTargetedNewsletter = async () => {
    const { state, institution, user_type, subject, message } =
      targetedNewsletterData;

    if (!state || !institution || !user_type || !subject || !message) {
      Swal.fire({
        title: "Missing Information",
        text: "Please fill in all fields",
        icon: "warning",
        confirmButtonColor: "#eab308",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Confirm Send",
      html: `
        <p>You are about to send newsletter to:</p>
        <ul style="text-align: left; margin: 10px 0;">
          <li><strong>State:</strong> ${state}</li>
          <li><strong>Institution:</strong> ${institution}</li>
          <li><strong>User Type:</strong> ${user_type}</li>
          ${recipientCount !== null ? `<li><strong>Recipients:</strong> ${recipientCount} users</li>` : ""}
        </ul>
        <p>Continue?</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send Newsletter",
      confirmButtonColor: "#eab308",
      cancelButtonColor: "#64748b",
    });

    if (result.isConfirmed) {
      setActionLoading("targetedNewsletter", true);
      try {
        const response = await api.post("/admin/send-targeted-newsletter/", {
          state,
          institution,
          user_type,
          subject,
          message,
        });

        if (response.status === 200) {
          Swal.fire({
            title: "Success!",
            html: `Newsletter sent successfully to <strong>${response.data.count}</strong> users`,
            icon: "success",
            confirmButtonColor: "#eab308",
          });

          // Reset form
          setTargetedNewsletterData({
            state: "",
            institution: "",
            user_type: "",
            subject: "",
            message: "",
          });
          setRecipientCount(null);
          setShowTargetedNewsletterForm(false);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.error || "Failed to send targeted newsletter";
        Swal.fire({
          title: "Error!",
          text: errorMessage,
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setActionLoading("targetedNewsletter", false);
      }
    }
  };

  const handleTargetedNewsletterChange = (field, value) => {
    setTargetedNewsletterData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Reset recipient count when filters change
    if (field !== "subject" && field !== "message") {
      setRecipientCount(null);
    }
  };

  const ActionButton = ({
    onClick,
    icon: Icon,
    title,
    description,
    loadingKey,
    variant = "primary",
  }) => {
    const baseClasses =
      "w-full p-6 rounded-xl border-2 transition-all duration-200 flex items-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]";

    const variantClasses = {
      download:
        "bg-blue-50 border-blue-200 hover:border-blue-300 hover:bg-blue-100 text-blue-800",
      newsletter:
        "bg-green-50 border-green-200 hover:border-green-300 hover:bg-green-100 text-green-800",
      reminder:
        "bg-orange-50 border-orange-200 hover:border-orange-300 hover:bg-orange-100 text-orange-800",
      targeted:
        "bg-purple-50 border-purple-200 hover:border-purple-300 hover:bg-purple-100 text-purple-800",
      primary:
        "bg-yellow-50 border-yellow-200 hover:border-yellow-300 hover:bg-yellow-100 text-yellow-800",
    };

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]}`}
        onClick={onClick}
        disabled={loading[loadingKey]}
      >
        <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm">
          {loading[loadingKey] ? (
            <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
          ) : (
            <Icon className="w-6 h-6 text-gray-600" />
          )}
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Utilities</h1>
          <p className="text-xl text-gray-600">
            Download reports and send communications to users
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-8">
          {/* Download Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-linear-to-r from-blue-500 to-blue-600 px-8 py-6 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Download Reports
                </h2>
                <p className="text-blue-100">
                  Export data for analysis and record keeping
                </p>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ActionButton
                onClick={handleDownloadUsers}
                icon={Users}
                title="Download Users"
                description="Export complete list of registered users"
                loadingKey="users"
                variant="download"
              />

              <ActionButton
                onClick={handleDownloadVendors}
                icon={Store}
                title="Download Vendors"
                description="Export complete list of registered vendors"
                loadingKey="vendors"
                variant="download"
              />

              <ActionButton
                onClick={handleDownloadPickers}
                icon={Truck}
                title="Download Pickers"
                description="Export complete list of registered pickers"
                loadingKey="pickers"
                variant="download"
              />

              <ActionButton
                onClick={handleDownloadTransactions}
                icon={CreditCard}
                title="Download Transactions"
                description="Export complete transaction history"
                loadingKey="transactions"
                variant="download"
              />
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-linear-to-r from-green-500 to-green-600 px-8 py-6 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Send Newsletters
                </h2>
                <p className="text-green-100">
                  Communicate with your user base through newsletters
                </p>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ActionButton
                onClick={handleSendNewsletterToPickers}
                icon={Truck}
                title="Newsletter to Pickers"
                description="Send newsletter to all registered pickers"
                loadingKey="newsletterPickers"
                variant="newsletter"
              />

              <ActionButton
                onClick={handleSendNewsletterToVendors}
                icon={Store}
                title="Newsletter to Vendors"
                description="Send newsletter to all registered vendors"
                loadingKey="newsletterVendors"
                variant="newsletter"
              />

              <ActionButton
                onClick={handleSendNewsletterToAllUsers}
                icon={Users}
                title="Newsletter to All Users"
                description="Send newsletter to all registered users"
                loadingKey="newsletterAll"
                variant="newsletter"
              />
            </div>
          </div>

          {/* Targeted Newsletter Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-linear-to-r from-purple-500 to-purple-600 px-8 py-6 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">
                  Targeted Newsletter
                </h2>
                <p className="text-purple-100">
                  Send newsletters to specific user groups by location and type
                </p>
              </div>
            </div>

            <div className="p-8">
              {!showTargetedNewsletterForm ? (
                <ActionButton
                  onClick={() => setShowTargetedNewsletterForm(true)}
                  icon={MapPin}
                  title="Send Targeted Newsletter"
                  description="Target users by state, institution, and user type"
                  loadingKey=""
                  variant="targeted"
                />
              ) : (
                <div className="space-y-6">
                  {/* Filter Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* State Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <select
                        value={targetedNewsletterData.state}
                        onChange={(e) =>
                          handleTargetedNewsletterChange(
                            "state",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Select State</option>
                        {nigeriaStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Institution Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Institution
                      </label>
                      <select
                        value={targetedNewsletterData.institution}
                        onChange={(e) =>
                          handleTargetedNewsletterChange(
                            "institution",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!targetedNewsletterData.state}
                      >
                        <option value="">Select Institution</option>
                        {targetedNewsletterData.state &&
                          nigeriaInstitutions[
                            targetedNewsletterData.state
                          ]?.map((institution) => (
                            <option key={institution} value={institution}>
                              {institution}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* User Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Type
                      </label>
                      <select
                        value={targetedNewsletterData.user_type}
                        onChange={(e) =>
                          handleTargetedNewsletterChange(
                            "user_type",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Select User Type</option>
                        <option value="all">All Users</option>
                        <option value="student">Students</option>
                        <option value="vendor">Vendors</option>
                        <option value="picker">Pickers</option>
                        <option value="student_picker">Student Pickers</option>
                      </select>
                    </div>
                  </div>

                  {/* Recipient Count */}
                  {recipientCount !== null && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">
                          Recipients Found:
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">
                        {recipientCount}
                      </span>
                    </div>
                  )}

                  {/* Get Count Button */}
                  <button
                    onClick={handleGetRecipientCount}
                    disabled={loading.recipientCount}
                    className="w-full px-6 py-3 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading.recipientCount ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-5 h-5" />
                        <span>Check Recipient Count</span>
                      </>
                    )}
                  </button>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={targetedNewsletterData.subject}
                      onChange={(e) =>
                        handleTargetedNewsletterChange(
                          "subject",
                          e.target.value,
                        )
                      }
                      placeholder="Enter email subject"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={targetedNewsletterData.message}
                      onChange={(e) =>
                        handleTargetedNewsletterChange(
                          "message",
                          e.target.value,
                        )
                      }
                      placeholder="Enter newsletter message"
                      rows="6"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setShowTargetedNewsletterForm(false);
                        setTargetedNewsletterData({
                          state: "",
                          institution: "",
                          user_type: "",
                          subject: "",
                          message: "",
                        });
                        setRecipientCount(null);
                      }}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendTargetedNewsletter}
                      disabled={loading.targetedNewsletter}
                      className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {loading.targetedNewsletter ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Send Newsletter</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reminder Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-linear-to-r from-orange-500 to-orange-600 px-8 py-6 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Send Reminders
                </h2>
                <p className="text-orange-100">
                  Send targeted reminders to improve compliance
                </p>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActionButton
                onClick={handleSendKYCReminder}
                icon={UserCheck}
                title="KYC Reminder"
                description="Remind users without KYC to complete verification"
                loadingKey="kycReminder"
                variant="reminder"
              />

              <ActionButton
                onClick={handleSendProductReminder}
                icon={Package}
                title="Product Reminder"
                description="Remind vendors without products to add listings"
                loadingKey="productReminder"
                variant="reminder"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Utilities;
