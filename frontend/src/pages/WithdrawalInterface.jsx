// import React, { useState, useEffect } from "react";
// import {
//   CreditCard,
//   Wallet,
//   AlertCircle,
//   CheckCircle,
//   Clock,
//   X,
//   ArrowRight,
//   DollarSign,
//   Building2,
// } from "lucide-react";
// import api from "../constant/api";

// const WithdrawalInterface = () => {
//   const [user, setUser] = useState(null);
//   const [walletBalance, setWalletBalance] = useState(0);
//   const [banks, setBanks] = useState([]);
//   const [withdrawalHistory, setWithdrawalHistory] = useState([]);
//   const [loading, setLoading] = useState({
//     banks: false,
//     withdrawal: false,
//     history: false,
//     balance: false,
//   });

//   // Form states
//   const [formData, setFormData] = useState({
//     amount: "",
//     bankCode: "",
//     accountNumber: "",
//     accountName: "",
//   });
//   const [accountResolution, setAccountResolution] = useState(null);
//   const [errors, setErrors] = useState({});
//   const [success, setSuccess] = useState("");

//   // Modal state
//   const [showConfirmModal, setShowConfirmModal] = useState(false);

//   useEffect(() => {
//     fetchUserData();
//     fetchBanks();
//     fetchWalletBalance();
//     fetchWithdrawalHistory();
//   }, []);

//   const fetchUserData = async () => {
//     try {
//       const response = await api.get("/user/profile/");
//       if (response.ok) {
//         setUser(response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//     }
//   };

//   const fetchBanks = async () => {
//     setLoading((prev) => ({ ...prev, banks: true }));
//     try {
//       const response = await api.get("/withdrawal/banks/");
//       if (response.ok) {
//         setBanks(response.data.banks);
//       } else {
//         setErrors((prev) => ({ ...prev, general: "Failed to load banks" }));
//       }
//     } catch (error) {
//       setErrors((prev) => ({
//         ...prev,
//         general: "Network error loading banks",
//       }));
//         console.error("Error fetching banks:", error);  
//   };
//     } finally {
//       setLoading((prev) => ({ ...prev, banks: false }));
//     }   
//   };

//   const fetchWalletBalance = async () => {
//     setLoading((prev) => ({ ...prev, balance: true }));
//     try {
//       const response = await api.get("/wallet/balance/");
//       if (response.ok) {
//         setWalletBalance(response.data.balance);
//       }
//     } catch (error) {
//       console.error("Error fetching wallet balance:", error);
//     } finally {
//       setLoading((prev) => ({ ...prev, balance: false }));
//     }
//   };

//   const fetchWithdrawalHistory = async () => {
//     setLoading((prev) => ({ ...prev, history: true }));
//     try {
//       const response = await api.get("/withdrawal/");
//       if (response.ok) {
//         setWithdrawalHistory(response.data.withdrawals);
//       }
//     } catch (error) {
//       console.error("Error fetching withdrawal history:", error);
//     } finally {
//       setLoading((prev) => ({ ...prev, history: false }));
//     }
//   };

//   const fetchWithdrawalHistory = async () => {
//     setLoading((prev) => ({ ...prev, history: true }));
//     try {
//       const response = await fetch("/api/withdrawal/", {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setWithdrawalHistory(data.withdrawals);
//       }
//     } catch (error) {
//       console.error("Error fetching withdrawal history:", error);
//     } finally {
//       setLoading((prev) => ({ ...prev, history: false }));
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));

//     // Clear specific error when user starts typing
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }));
//     }

//     // Reset account resolution when account details change
//     if (name === "accountNumber" || name === "bankCode") {
//       setAccountResolution(null);
//       setFormData((prev) => ({ ...prev, accountName: "" }));
//     }
//   };

//   const resolveAccount = async () => {
//     if (!formData.accountNumber || !formData.bankCode) return;

//     try {
//       const response = await fetch("/api/resolve-account/", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify({
//           account_number: formData.accountNumber,
//           bank_code: formData.bankCode,
//         }),
//       });

//       const data = await response.json();
//       if (response.ok && data.success) {
//         setAccountResolution(data);
//         setFormData((prev) => ({ ...prev, accountName: data.account_name }));
//         setErrors((prev) => ({ ...prev, accountNumber: "", bankCode: "" }));
//       } else {
//         setErrors((prev) => ({
//           ...prev,
//           accountNumber: data.message || "Account resolution failed",
//         }));
//         setAccountResolution(null);
//       }
//     } catch (error) {
//       setErrors((prev) => ({
//         ...prev,
//         accountNumber: "Network error resolving account",
//       }));
//       setAccountResolution(null);
//     }
//   };

//   // Auto-resolve account when both fields are filled
//   useEffect(() => {
//     if (formData.accountNumber.length === 10 && formData.bankCode) {
//       const timer = setTimeout(resolveAccount, 500);
//       return () => clearTimeout(timer);
//     }
//   }, [formData.accountNumber, formData.bankCode]);

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.amount || parseFloat(formData.amount) <= 0) {
//       newErrors.amount = "Please enter a valid amount";
//     } else if (parseFloat(formData.amount) < 100) {
//       newErrors.amount = "Minimum withdrawal amount is ₦100";
//     } else if (parseFloat(formData.amount) > walletBalance) {
//       newErrors.amount = "Amount exceeds available balance";
//     }

//     if (!formData.bankCode) {
//       newErrors.bankCode = "Please select a bank";
//     }

//     if (!formData.accountNumber) {
//       newErrors.accountNumber = "Please enter account number";
//     } else if (formData.accountNumber.length !== 10) {
//       newErrors.accountNumber = "Account number must be 10 digits";
//     }

//     if (!formData.accountName) {
//       newErrors.accountName = "Account name is required";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleWithdrawal = async () => {
//     if (!validateForm()) return;

//     setLoading((prev) => ({ ...prev, withdrawal: true }));
//     setErrors({});
//     setSuccess("");

//     try {
//       const response = await fetch("/api/withdrawal/", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify({
//           amount: formData.amount,
//           bank_code: formData.bankCode,
//           account_number: formData.accountNumber,
//         }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setSuccess(
//           `Withdrawal request submitted successfully! Reference: ${data.reference}`
//         );
//         setFormData({
//           amount: "",
//           bankCode: "",
//           accountNumber: "",
//           accountName: "",
//         });
//         setAccountResolution(null);
//         setShowConfirmModal(false);

//         // Refresh data
//         fetchWalletBalance();
//         fetchWithdrawalHistory();
//       } else {
//         setErrors({ general: data.error || "Withdrawal failed" });
//       }
//     } catch (error) {
//       setErrors({ general: "Network error. Please try again." });
//     } finally {
//       setLoading((prev) => ({ ...prev, withdrawal: false }));
//     }
//   };

//   const formatCurrency = (amount) => {
//     return `₦${parseFloat(amount).toLocaleString()}`;
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString("en-NG", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "completed":
//         return "bg-green-100 text-green-800";
//       case "processing":
//         return "bg-yellow-100 text-yellow-800";
//       case "failed":
//       case "cancelled":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "completed":
//         return <CheckCircle className="w-4 h-4" />;
//       case "processing":
//         return <Clock className="w-4 h-4" />;
//       case "failed":
//       case "cancelled":
//         return <X className="w-4 h-4" />;
//       default:
//         return <AlertCircle className="w-4 h-4" />;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8 px-4">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <Wallet className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawal</h1>
//           <p className="text-gray-600">
//             Withdraw your earnings to your bank account
//           </p>
//         </div>

//         <div className="grid lg:grid-cols-3 gap-6">
//           {/* Wallet Balance Card */}
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//               <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
//                 <DollarSign className="w-5 h-5 text-yellow-500 mr-2" />
//                 Available Balance
//               </h3>
//               <div className="text-center">
//                 {loading.balance ? (
//                   <div className="animate-pulse">
//                     <div className="h-8 bg-gray-300 rounded mb-2"></div>
//                   </div>
//                 ) : (
//                   <div className="text-3xl font-bold text-yellow-600 mb-2">
//                     {formatCurrency(walletBalance)}
//                   </div>
//                 )}
//                 <p className="text-gray-600 text-sm">
//                   {user &&
//                     `${
//                       user.user_type.charAt(0).toUpperCase() +
//                       user.user_type.slice(1)
//                     } Earnings`}
//                 </p>
//               </div>
//             </div>

//             {/* Quick Stats */}
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <h3 className="text-lg font-semibold mb-4 text-gray-800">
//                 Quick Stats
//               </h3>
//               <div className="space-y-3">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Total Withdrawals:</span>
//                   <span className="font-medium">
//                     {
//                       withdrawalHistory.filter((w) => w.status === "completed")
//                         .length
//                     }
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Pending:</span>
//                   <span className="font-medium">
//                     {
//                       withdrawalHistory.filter((w) => w.status === "processing")
//                         .length
//                     }
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">This Month:</span>
//                   <span className="font-medium">
//                     {formatCurrency(
//                       withdrawalHistory
//                         .filter(
//                           (w) =>
//                             w.status === "completed" &&
//                             new Date(w.completed_at).getMonth() ===
//                               new Date().getMonth()
//                         )
//                         .reduce((sum, w) => sum + w.final_amount, 0)
//                     )}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Withdrawal Form */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//               <h3 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
//                 <CreditCard className="w-6 h-6 text-yellow-500 mr-2" />
//                 Request Withdrawal
//               </h3>

//               {/* Error/Success Messages */}
//               {errors.general && (
//                 <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
//                   <div className="flex items-center">
//                     <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
//                     <span className="text-red-700">{errors.general}</span>
//                   </div>
//                 </div>
//               )}

//               {success && (
//                 <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
//                   <div className="flex items-center">
//                     <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
//                     <span className="text-green-700">{success}</span>
//                   </div>
//                 </div>
//               )}

//               <div className="space-y-6">
//                 {/* Amount Input */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Withdrawal Amount
//                   </label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-3 text-gray-500">
//                       ₦
//                     </span>
//                     <input
//                       type="number"
//                       name="amount"
//                       value={formData.amount}
//                       onChange={handleInputChange}
//                       placeholder="0.00"
//                       className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
//                         errors.amount ? "border-red-300" : "border-gray-300"
//                       }`}
//                       min="100"
//                       max={walletBalance}
//                     />
//                   </div>
//                   {errors.amount && (
//                     <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
//                   )}
//                   <p className="text-gray-500 text-sm mt-1">
//                     Minimum: ₦100 • Available: {formatCurrency(walletBalance)}
//                   </p>
//                 </div>

//                 {/* Bank Selection */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Select Bank
//                   </label>
//                   <select
//                     name="bankCode"
//                     value={formData.bankCode}
//                     onChange={handleInputChange}
//                     className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
//                       errors.bankCode ? "border-red-300" : "border-gray-300"
//                     }`}
//                     disabled={loading.banks}
//                   >
//                     <option value="">Choose your bank</option>
//                     {banks.map((bank) => (
//                       <option key={bank.code} value={bank.code}>
//                         {bank.name}
//                       </option>
//                     ))}
//                   </select>
//                   {errors.bankCode && (
//                     <p className="text-red-600 text-sm mt-1">
//                       {errors.bankCode}
//                     </p>
//                   )}
//                 </div>

//                 {/* Account Number */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Account Number
//                   </label>
//                   <input
//                     type="text"
//                     name="accountNumber"
//                     value={formData.accountNumber}
//                     onChange={handleInputChange}
//                     placeholder="Enter 10-digit account number"
//                     className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
//                       errors.accountNumber
//                         ? "border-red-300"
//                         : "border-gray-300"
//                     }`}
//                     maxLength="10"
//                   />
//                   {errors.accountNumber && (
//                     <p className="text-red-600 text-sm mt-1">
//                       {errors.accountNumber}
//                     </p>
//                   )}
//                 </div>

//                 {/* Account Name */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Account Name
//                   </label>
//                   <input
//                     type="text"
//                     name="accountName"
//                     value={formData.accountName}
//                     readOnly
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
//                     placeholder="Account name will appear automatically"
//                   />
//                   {accountResolution && (
//                     <div className="flex items-center mt-2">
//                       <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
//                       <span className="text-green-600 text-sm">
//                         Account verified
//                       </span>
//                     </div>
//                   )}
//                 </div>

//                 {/* Submit Button */}
//                 <button
//                   onClick={() => setShowConfirmModal(true)}
//                   disabled={!validateForm() || loading.withdrawal}
//                   className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
//                 >
//                   {loading.withdrawal ? (
//                     <>
//                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
//                       Processing...
//                     </>
//                   ) : (
//                     <>
//                       Request Withdrawal
//                       <ArrowRight className="w-5 h-5 ml-2" />
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Withdrawal History */}
//             <div className="bg-white rounded-lg shadow-md p-6">
//               <h3 className="text-xl font-semibold mb-6 text-gray-800">
//                 Withdrawal History
//               </h3>

//               {loading.history ? (
//                 <div className="space-y-3">
//                   {[...Array(3)].map((_, i) => (
//                     <div key={i} className="animate-pulse">
//                       <div className="h-16 bg-gray-200 rounded"></div>
//                     </div>
//                   ))}
//                 </div>
//               ) : withdrawalHistory.length === 0 ? (
//                 <div className="text-center py-8">
//                   <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                   <p className="text-gray-500">No withdrawal history yet</p>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   {withdrawalHistory.map((withdrawal) => (
//                     <div
//                       key={withdrawal.id}
//                       className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
//                     >
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center space-x-3">
//                           <div
//                             className={`p-2 rounded-full ${getStatusColor(
//                               withdrawal.status
//                             )}`}
//                           >
//                             {getStatusIcon(withdrawal.status)}
//                           </div>
//                           <div>
//                             <div className="font-medium text-gray-900">
//                               {formatCurrency(withdrawal.amount)}
//                             </div>
//                             <div className="text-sm text-gray-500">
//                               {withdrawal.bank_name} • ****
//                               {withdrawal.account_number}
//                             </div>
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <div
//                             className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
//                               withdrawal.status
//                             )}`}
//                           >
//                             {withdrawal.status.toUpperCase()}
//                           </div>
//                           <div className="text-xs text-gray-500 mt-1">
//                             {formatDate(withdrawal.created_at)}
//                           </div>
//                         </div>
//                       </div>
//                       {withdrawal.failure_reason && (
//                         <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
//                           {withdrawal.failure_reason}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Confirmation Modal */}
//         {showConfirmModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-lg max-w-md w-full p-6">
//               <h3 className="text-lg font-semibold mb-4">Confirm Withdrawal</h3>
//               <div className="space-y-3 mb-6">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Amount:</span>
//                   <span className="font-medium">
//                     {formatCurrency(formData.amount)}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Bank:</span>
//                   <span className="font-medium">
//                     {banks.find((b) => b.code === formData.bankCode)?.name}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Account:</span>
//                   <span className="font-medium">{formData.accountName}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Account Number:</span>
//                   <span className="font-medium">{formData.accountNumber}</span>
//                 </div>
//               </div>

//               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
//                 <p className="text-yellow-800 text-sm">
//                   Please verify all details are correct. This action cannot be
//                   undone once processed.
//                 </p>
//               </div>

//               <div className="flex space-x-3">
//                 <button
//                   onClick={() => setShowConfirmModal(false)}
//                   className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleWithdrawal}
//                   disabled={loading.withdrawal}
//                   className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 transition-colors"
//                 >
//                   Confirm Withdrawal
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default WithdrawalInterface;
