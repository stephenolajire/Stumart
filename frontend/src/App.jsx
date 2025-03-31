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
import VendorDashboard from "./dashboard/VendorDashboard";
import AddProduct from "./dashboard/AddProduct";

function App() {
  return (
    <GlobalProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="rider" element={<Rider />} />
            <Route path="contact" element={<Contact />} />
            <Route path="shop/:shopId" element={<ShopDetails />} />
            <Route path="product/:productId" element={<ProductDetails />} />
            <Route path="other-services" element={<OtherService />} />
          </Route>
          <Route path="/login" element={<Login />} />
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
          <Route
            path="/vendor-dashboard"
            element={
              <ProtectedRoute>
                <VendorDashboard />
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
        </Routes>
      </Router>
    </GlobalProvider>
  );
}

export default App;
