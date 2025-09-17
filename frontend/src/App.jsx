import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import Home from "./pages/Home";
import ShopDetails from "./pages/ShopDetails";
import ProductDetails from "./pages/ProductDetails";
import Login from "./user/Login";
import Signup from "./user/Registration";
import VerifyEmail from "./user/VerifyEmail";
import KYCVerification from "./user/KYCVerification";
import KYCStatus from "./user/KYCStatus";
import About from "./pages/About";
import Vendors from "./pages/Vendor";
import Rider from "./pages/Rider";
import Contact from "./pages/ContactUs";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./constant/ProtectedRoute";
import { GlobalProvider } from "./constant/GlobalContext";
import OtherService from "./pages/OtherService";
import VendorDashboard from "./vendor-dashboard/VendorDashboard";
import AddProduct from "./vendor-dashboard/AddProduct";
import RequestOTPForm from "./forgot password/RequestOTPForm";
import VerifyOTPForm from "./forgot password/VerifyOTPForm";
import SetNewPasswordForm from "./forgot password/SetNewPasswordForm";
import ShoppingCart from "./pages/ShoppingCart";
import Checkout from "./pages/Checkout";
import OrderDetails from "./pages/OrderDetails";
import PaymentVerification from "./pages/PaymentVerification";
import OrderHistory from "./pages/OrderHistory";
import StudentProfile from "./user/StudentProfile";
import DashboardLayout from "./picker-dashboard/DashoardLayout";
import HomePage from "./picker-dashboard/Dashboard";
import AvailableOrders from "./picker-dashboard/AvailableOrders";
import MyDeliveries from "./picker-dashboard/MyDeliveries";
import Earnings from "./picker-dashboard/Earnings";
// import OrderDetail from "./picker-dashboard/DeliveryDetail";
import AdminDashboard from "./admin-dashboard/AdminDashboard";
import AdminOrderDetail from "./admin-dashboard/OrderDetail";
import ServiceApplicationSuccess from "./pages/ServiceApplicationSuccess";
import ServiceApplication from "./pages/ServiceApplication";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import Dashboard from "./other-dashboard/OtherDashboard";
import OtherDashboard from "./other-dashboard/OtherDashboard";
import SearchPage from "./pages/SearchPage";
import DeliveryDetail from "./picker-dashboard/DeliveryDetail";
import AllProducts from "./pages/AllProducts";
import Chatbot from "./chatbot/Chatbot";
import ThemeToggle from "./components/ThemeToggle";
import { ThemeProvider } from "./constant/ThemeContext";
// import NotificationPage from "./pages/Notification";
import Service from "./pages/Service";
import Message from "./pages/Message";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Landing from "./pages/landing/Landing";
import Category from "./pages/Category";
import DeliveryPartnerDashboard from "./company/CDashboard";
import ManagePickersInterface from "./company/CPicker";
import AnalyticsReportsInterface from "./company/CAnalytics";
import OrderAssignmentInterface from "./company/COrder";
import CompanyLayout from "./company/CompanyLayout";
import CompanyRegistration from "./user/CompanyRegistration";
// import UnifiedMessages from "./components/UnifiedMessage";

// Create a client
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
      <ThemeProvider>
        <GlobalProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Landing />} />
                <Route path="about" element={<About />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="rider" element={<Rider />} />
                <Route path="contact" element={<Contact />} />
                <Route path="shop/:shopId" element={<ShopDetails />} />
                <Route path="product/:productId" element={<ProductDetails />} />
                <Route path="other-services" element={<OtherService />} />
                <Route path="shopping-cart" element={<ShoppingCart />} />
                <Route path="search-results" element={<SearchPage />} />
                <Route path="category" element={<Category />} />

                <Route
                  path="service"
                  element={
                    <ProtectedRoute>
                      <Service />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="messages"
                  element={
                    <ProtectedRoute>
                      <Message />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="order-history"
                  element={
                    <ProtectedRoute>
                      <OrderHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route path="order-details" element={<OrderDetails />} />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <StudentProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/service-application/:serviceId"
                  element={
                    <ProtectedRoute>
                      <ServiceApplication />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/service-application-success/:serviceId"
                  element={<ServiceApplicationSuccess />}
                />
                <Route
                  path="/subscription-plans"
                  element={<SubscriptionPlans />}
                />
                <Route path="/products" element={<AllProducts />} />
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/company-signup" element={<CompanyRegistration />} />
              <Route path="/register" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
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

              <Route path="/payment/verify" element={<PaymentVerification />} />
              <Route path="/orders/:orderNumber" element={<OrderDetails />} />

              <Route
                path="/vendor-dashboard"
                element={
                  <ProtectedRoute>
                    <VendorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/other-dashboard"
                element={
                  <ProtectedRoute>
                    <OtherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-product"
                element={
                  <ProtectedRoute>
                    <AddProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/picker"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/picker/dashboard" element={<HomePage />} />
              <Route
                path="/picker/available-orders"
                element={<AvailableOrders />}
              />
              <Route path="/picker/my-deliveries" element={<MyDeliveries />} />
              <Route path="/earnings" element={<Earnings />} />
              <Route
                path="/delivery-detail/:orderId"
                element={<DeliveryDetail />}
              />
              <Route
                path="/admin-order-detail/:orderId"
                element={<AdminOrderDetail />}
              />

              <Route path="/forgot-password" element={<RequestOTPForm />} />
              <Route path="/verify-otp" element={<VerifyOTPForm />} />
              <Route path="/reset-password" element={<SetNewPasswordForm />} />
              <Route path="/chatbot" element={<Chatbot />} />

              <Route path="/company/" element={<CompanyLayout />}>
                <Route index element={<DeliveryPartnerDashboard />} />
                <Route path="picker" element={<ManagePickersInterface />} />
                <Route
                  path="analytics"
                  element={<AnalyticsReportsInterface />}
                />
                <Route path="order" element={<OrderAssignmentInterface />} />
              </Route>
            </Routes>
          </Router>
        </GlobalProvider>
      </ThemeProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}

export default App;
