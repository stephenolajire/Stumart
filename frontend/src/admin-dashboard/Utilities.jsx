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
import styles from "./css/Utilities.module.css";

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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In real implementation, you'd call your API here
      // const response = await fetch('/api/admin/export/users');
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = 'users_list.csv';
      // a.click();

      Swal.fire({
        title: "Success!",
        text: "Users list has been downloaded successfully",
        icon: "success",
        confirmButtonColor: "var(--primary-500)",
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to download users list",
        icon: "error",
        confirmButtonColor: "var(--error)",
      });
    } finally {
      setActionLoading("users", false);
    }
  };

  const handleDownloadVendors = async () => {
    setActionLoading("vendors", true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Swal.fire({
        title: "Success!",
        text: "Vendors list has been downloaded successfully",
        icon: "success",
        confirmButtonColor: "var(--primary-500)",
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to download vendors list",
        icon: "error",
        confirmButtonColor: "var(--error)",
      });
    } finally {
      setActionLoading("vendors", false);
    }
  };

  const handleDownloadPickers = async () => {
    setActionLoading("pickers", true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Swal.fire({
        title: "Success!",
        text: "Pickers list has been downloaded successfully",
        icon: "success",
        confirmButtonColor: "var(--primary-500)",
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to download pickers list",
        icon: "error",
        confirmButtonColor: "var(--error)",
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
        confirmButtonColor: "var(--primary-500)",
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Failed to download transaction history",
        icon: "error",
        confirmButtonColor: "var(--error)",
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
      confirmButtonColor: "var(--primary-500)",
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
        await new Promise((resolve) => setTimeout(resolve, 2000));
        Swal.fire({
          title: "Success!",
          text: "Newsletter sent to all pickers successfully",
          icon: "success",
          confirmButtonColor: "var(--primary-500)",
        });
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to send newsletter to pickers",
          icon: "error",
          confirmButtonColor: "var(--error)",
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
      confirmButtonColor: "var(--primary-500)",
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
        await new Promise((resolve) => setTimeout(resolve, 2000));
        Swal.fire({
          title: "Success!",
          text: "Newsletter sent to all vendors successfully",
          icon: "success",
          confirmButtonColor: "var(--primary-500)",
        });
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to send newsletter to vendors",
          icon: "error",
          confirmButtonColor: "var(--error)",
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
      confirmButtonColor: "var(--primary-500)",
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
        await new Promise((resolve) => setTimeout(resolve, 2000));
        Swal.fire({
          title: "Success!",
          text: "Newsletter sent to all users successfully",
          icon: "success",
          confirmButtonColor: "var(--primary-500)",
        });
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to send newsletter to all users",
          icon: "error",
          confirmButtonColor: "var(--error)",
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
      confirmButtonColor: "var(--primary-500)",
      cancelButtonColor: "var(--text-secondary)",
    });

    if (result.isConfirmed) {
      setActionLoading("kycReminder", true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        Swal.fire({
          title: "Success!",
          text: "KYC reminder sent to all unverified users",
          icon: "success",
          confirmButtonColor: "var(--primary-500)",
        });
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to send KYC reminder",
          icon: "error",
          confirmButtonColor: "var(--error)",
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
      confirmButtonColor: "var(--primary-500)",
      cancelButtonColor: "var(--text-secondary)",
    });

    if (result.isConfirmed) {
      setActionLoading("productReminder", true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        Swal.fire({
          title: "Success!",
          text: "Product reminder sent to vendors without products",
          icon: "success",
          confirmButtonColor: "var(--primary-500)",
        });
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: "Failed to send product reminder",
          icon: "error",
          confirmButtonColor: "var(--error)",
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
  }) => (
    <button
      className={`${styles.actionButton} ${styles[variant]}`}
      onClick={onClick}
      disabled={loading[loadingKey]}
    >
      <div className={styles.buttonIcon}>
        {loading[loadingKey] ? (
          <Loader2 className={styles.spinIcon} />
        ) : (
          <Icon />
        )}
      </div>
      <div className={styles.buttonContent}>
        <h3 className={styles.buttonTitle}>{title}</h3>
        <p className={styles.buttonDescription}>{description}</p>
      </div>
    </button>
  );

  return (
    <div className={styles.utilitiesContainer}>
      <div className={styles.utilitiesHeader}>
        <h1>Utilities</h1>
        <p>Download reports and send communications to users</p>
      </div>

      <div className={styles.utilitiesGrid}>
        {/* Download Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Download className={styles.sectionIcon} />
            <h2>Download Reports</h2>
          </div>

          <div className={styles.sectionGrid}>
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
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Send className={styles.sectionIcon} />
            <h2>Send Newsletters</h2>
          </div>

          <div className={styles.sectionGrid}>
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
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <AlertCircle className={styles.sectionIcon} />
            <h2>Send Reminders</h2>
          </div>

          <div className={styles.sectionGrid}>
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
  );
};

export default Utilities;
