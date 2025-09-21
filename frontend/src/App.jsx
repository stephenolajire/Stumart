import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Layouts
import Layout from "./layout/Layout";
import DashboardLayout from "./picker-dashboard/DashoardLayout";
import CompanyLayout from "./company/CompanyLayout";

// Public Pages
import Landing from "./pages/landing/Landing";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/ContactUs";
import Vendors from "./pages/Vendor";
import Rider from "./pages/Rider";
import ShopDetails from "./pages/ShopDetails";
import ProductDetails from "./pages/ProductDetails";
import AllProducts from "./pages/AllProducts";
import OtherService from "./pages/OtherService";
import SearchPage from "./pages/SearchPage";
import Category from "./pages/Category";
import ServiceApplicationSuccess from "./pages/ServiceApplicationSuccess";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import PaymentVerification from "./pages/PaymentVerification";
import OrderDetails from "./pages/OrderDetails";
import Chatbot from "./chatbot/Chatbot";

// Authentication & User Management
import Login from "./user/Login";
import Signup from "./user/Registration";
import CompanyRegistration from "./user/CompanyRegistration";
import VerifyEmail from "./user/VerifyEmail";
import KYCVerification from "./user/KYCVerification";
import KYCStatus from "./user/KYCStatus";

// Forgot Password Flow
import RequestOTPForm from "./forgot password/RequestOTPForm";
import VerifyOTPForm from "./forgot password/VerifyOTPForm";
import SetNewPasswordForm from "./forgot password/SetNewPasswordForm";

// Student Pages
import ShoppingCart from "./pages/ShoppingCart";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";
import StudentProfile from "./user/StudentProfile";
import Service from "./pages/Service";
import Message from "./pages/Message";

// Vendor Dashboard
import VendorDashboard from "./vendor-dashboard/VendorDashboard";
import AddProduct from "./vendor-dashboard/AddProduct";
import OtherDashboard from "./other-dashboard/OtherDashboard";

// Picker Dashboard Pages
import HomePage from "./picker-dashboard/Dashboard";
import AvailableOrders from "./picker-dashboard/AvailableOrders";
import MyDeliveries from "./picker-dashboard/MyDeliveries";
import Earnings from "./picker-dashboard/Earnings";
import DeliveryDetail from "./picker-dashboard/DeliveryDetail";

// Admin Dashboard
import AdminDashboard from "./admin-dashboard/AdminDashboard";
import AdminOrderDetail from "./admin-dashboard/OrderDetail";

// Company Dashboard Pages
import DeliveryPartnerDashboard from "./company/CDashboard";
import ManagePickersInterface from "./company/CPicker";
import AnalyticsReportsInterface from "./company/CAnalytics";
import OrderAssignmentInterface from "./company/COrder";

// Components & Contexts
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./constant/ProtectedRoute";
import { GlobalProvider } from "./constant/GlobalContext";
import { ThemeProvider } from "./constant/ThemeContext";
import ServiceApplication from "./pages/ServiceApplication";
import CDeliveries from "./company/CDeliveries";
import DeliveryDetails from "./pages/DeliveryDetails";
import AcceptDelivery from "./pages/AcceptDelivery";
import DeliveryConfirmation from "./pages/DeliveryConfirmation";
import CustomerOrderConfirmation from "./pages/CustomerOrderConfirmation";
import WithdrawalDashboard from "./withdrawal/WithdrawalDashboard";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes default
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* =================== PUBLIC ROUTES =================== */}

            {/* Authentication Routes */}

            <Route
              path="/delivery-details/:uniqueCode"
              element={<DeliveryDetails />}
            />
            <Route
              path="/confirm-delivery/:deliveryCode"
              element={<DeliveryConfirmation />}
            />
            <Route
              path="/accept-delivery/:uniqueCode"
              element={<AcceptDelivery />}
            />

            <Route
              path="/confirm-order-received/:customerConfirmationCode"
              element={<CustomerOrderConfirmation />}
            />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/company-signup" element={<CompanyRegistration />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route path="/withdrawal" element={<WithdrawalDashboard />} />

            {/* Forgot Password Flow */}
            <Route path="/forgot-password" element={<RequestOTPForm />} />
            <Route path="/verify-otp" element={<VerifyOTPForm />} />
            <Route path="/reset-password" element={<SetNewPasswordForm />} />

            {/* Public Pages with Main Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Landing />} />
              <Route path="about" element={<About />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="rider" element={<Rider />} />
              <Route path="contact" element={<Contact />} />
              <Route path="shop/:shopId" element={<ShopDetails />} />
              <Route path="product/:productId" element={<ProductDetails />} />
              <Route path="other-services" element={<OtherService />} />
              <Route path="search-results" element={<SearchPage />} />
              <Route path="category" element={<Category />} />
              <Route path="products" element={<AllProducts />} />
              <Route
                path="subscription-plans"
                element={<SubscriptionPlans />}
              />
              <Route
                path="service-application-success/:serviceId"
                element={<ServiceApplicationSuccess />}
              />
              <Route path="payment/verify" element={<PaymentVerification />} />
              <Route path="orders/:orderNumber" element={<OrderDetails />} />
              <Route path="chatbot" element={<Chatbot />} />

              {/* =================== STUDENT PROTECTED ROUTES =================== */}
              <Route
                path="shopping-cart"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <ShoppingCart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="checkout"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="order-history"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <OrderHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="service"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <Service />
                  </ProtectedRoute>
                }
              />
              <Route
                path="messages"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <Message />
                  </ProtectedRoute>
                }
              />
              <Route
                path="service-application/:serviceId"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <ServiceApplication />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* =================== SHARED PROTECTED ROUTES (All Authenticated Users) =================== */}
            <Route
              path="/verify-account"
              element={
                <ProtectedRoute>
                  <KYCVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kyc-status"
              element={
                <ProtectedRoute>
                  <KYCStatus />
                </ProtectedRoute>
              }
            />

            {/* =================== VENDOR PROTECTED ROUTES =================== */}
            <Route
              path="/vendor-dashboard"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-product"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <AddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/other-dashboard"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <OtherDashboard />
                </ProtectedRoute>
              }
            />

            {/* =================== PICKER PROTECTED ROUTES (Both picker and student_picker) =================== */}
            <Route
              path="/picker"
              element={
                <ProtectedRoute allowedRoles={["picker", "student_picker"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/picker/dashboard"
              element={
                <ProtectedRoute allowedRoles={["picker", "student_picker"]}>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/picker/available-orders"
              element={
                <ProtectedRoute allowedRoles={["picker", "student_picker"]}>
                  <AvailableOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/picker/my-deliveries"
              element={
                <ProtectedRoute allowedRoles={["picker", "student_picker"]}>
                  <MyDeliveries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/earnings"
              element={
                <ProtectedRoute allowedRoles={["picker", "student_picker"]}>
                  <Earnings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery-detail/:orderId"
              element={
                <ProtectedRoute allowedRoles={["picker", "student_picker"]}>
                  <DeliveryDetail />
                </ProtectedRoute>
              }
            />

            {/* =================== ADMIN PROTECTED ROUTES =================== */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-order-detail/:orderId"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminOrderDetail />
                </ProtectedRoute>
              }
            />


            {/* =================== COMPANY PROTECTED ROUTES =================== */}
            <Route
              path="/company/"
              element={
                <ProtectedRoute allowedRoles={["company"]}>
                  <CompanyLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DeliveryPartnerDashboard />} />
              <Route path="picker" element={<ManagePickersInterface />} />
              <Route path="analytics" element={<AnalyticsReportsInterface />} />
              <Route path="order" element={<OrderAssignmentInterface />} />
              <Route path="deliveries" element={<CDeliveries />} />
            </Route>
          </Routes>
        </Router>
      </GlobalProvider>

      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}

export default App;
