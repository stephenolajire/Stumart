import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import Home from "./pages/Home";
import ShopDetails from "./pages/ShopDetails";
import ProductDetails from "./pages/ProductDetails";
import Login from "./user/Login";
import Signup from "./user/Registration";
import About from "./pages/About";
import Vendors from "./pages/Vendor";
import Rider from "./pages/Rider";
import Contact from "./pages/ContactUs";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
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
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
