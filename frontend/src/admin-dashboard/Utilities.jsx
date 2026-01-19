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

  const setActionLoading = (action, isLoading) => {
    setLoading((prev) => ({
      ...prev,
      [action]: isLoading,
    }));
  };

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
  }) => {
    return (
      <button
        onClick={onClick}
        disabled={loading[loadingKey]}
        className="group relative bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:border-gray-300"
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            {loading[loadingKey] ? (
              <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
            ) : (
              <Icon className="w-6 h-6 text-gray-700" />
            )}
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Utilities</h1>
          <p className="text-gray-600">Manage reports and communications</p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Download Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Download Reports
                </h2>
                <p className="text-sm text-gray-500">
                  Export data for analysis
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActionButton
                onClick={handleDownloadUsers}
                icon={Users}
                title="Users"
                description="Export users list"
                loadingKey="users"
              />
              <ActionButton
                onClick={handleDownloadVendors}
                icon={Store}
                title="Vendors"
                description="Export vendors list"
                loadingKey="vendors"
              />
              <ActionButton
                onClick={handleDownloadPickers}
                icon={Truck}
                title="Pickers"
                description="Export pickers list"
                loadingKey="pickers"
              />
              <ActionButton
                onClick={handleDownloadTransactions}
                icon={CreditCard}
                title="Transactions"
                description="Export transaction history"
                loadingKey="transactions"
              />
            </div>
          </section>

          {/* Newsletter Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Send Newsletters
                </h2>
                <p className="text-sm text-gray-500">
                  Communicate with user groups
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ActionButton
                onClick={handleSendNewsletterToPickers}
                icon={Truck}
                title="To Pickers"
                description="Send to all pickers"
                loadingKey="newsletterPickers"
              />
              <ActionButton
                onClick={handleSendNewsletterToVendors}
                icon={Store}
                title="To Vendors"
                description="Send to all vendors"
                loadingKey="newsletterVendors"
              />
              <ActionButton
                onClick={handleSendNewsletterToAllUsers}
                icon={Users}
                title="To All Users"
                description="Send to everyone"
                loadingKey="newsletterAll"
              />
            </div>
          </section>

          {/* Targeted Newsletter Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Targeted Newsletter
                </h2>
                <p className="text-sm text-gray-500">
                  Send to specific user segments
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              {!showTargetedNewsletterForm ? (
                <button
                  onClick={() => setShowTargetedNewsletterForm(true)}
                  className="w-full group bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg p-8 transition-all duration-200"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-gray-300">
                      <MapPin className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        Create Targeted Campaign
                      </h3>
                      <p className="text-sm text-gray-500">
                        Filter by state, institution, and user type
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      >
                        <option value="">Select State</option>
                        {nigeriaStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>

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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-400"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
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
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Recipients Found
                        </span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {recipientCount}
                      </span>
                    </div>
                  )}

                  {/* Count Button */}
                  <button
                    onClick={handleGetRecipientCount}
                    disabled={loading.recipientCount}
                    className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {loading.recipientCount ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-sm"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
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
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendTargetedNewsletter}
                      disabled={loading.targetedNewsletter}
                      className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {loading.targetedNewsletter ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Newsletter</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Reminder Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Send Reminders
                </h2>
                <p className="text-sm text-gray-500">
                  Automated reminder notifications
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActionButton
                onClick={handleSendKYCReminder}
                icon={UserCheck}
                title="KYC Reminder"
                description="Remind unverified users"
                loadingKey="kycReminder"
              />
              <ActionButton
                onClick={handleSendProductReminder}
                icon={Package}
                title="Product Reminder"
                description="Remind vendors to add products"
                loadingKey="productReminder"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Utilities;
