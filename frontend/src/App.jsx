import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import Home from "./pages/Home";
import ShopDetails from "./pages/ShopDetails";
import ProductDetails from "./pages/ProductDetails";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop/:shopId" element={<ShopDetails />} />
          <Route path="product/:productId" element={<ProductDetails />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
