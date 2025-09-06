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
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../constant/api";

const Utilities = () => {
  const [loading, setLoading] = useState({});

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
      link.setAttribute("download", "users_list.csv"); // Changed from .xlsx to .csv
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
      link.setAttribute("download", "vendors_list.csv"); // Changed from .xlsx to .csv
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
        text: "Failed to download users list",
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
      link.setAttribute("download", "pickers_list.csv"); // Changed from .xlsx to .csv
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
        text: "Failed to download users list",
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
      primary:
        "bg-yellow-50 border-yellow-200 hover:border-yellow-300 hover:bg-yellow-100 text-yellow-800",
    };

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]}`}
        onClick={onClick}
        disabled={loading[loadingKey]}
      >
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm">
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
      <div className="w-full mx-auto">
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
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 flex items-center space-x-4">
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
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6 flex items-center space-x-4">
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

          {/* Reminder Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 flex items-center space-x-4">
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
