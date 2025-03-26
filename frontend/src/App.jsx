import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import Home from "./pages/Home";
import ShopDetails from "./pages/ShopDetails";
import ProductDetails from "./pages/ProductDetails";
import Login from "./user/Login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop/:shopId" element={<ShopDetails />} />
          <Route path="product/:productId" element={<ProductDetails />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
