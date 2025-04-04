import { createContext, useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import api from "./api";
import { jwtDecode } from "jwt-decode";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const user_type = localStorage.getItem("user_type");
  const [shopsData, setShopsData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState([])
  const [details, setDetails] = useState({})

  const auth = async () => {
    const token = localStorage.getItem("access");

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const expiryDate = decoded.exp;
      const currentTime = Date.now() / 1000;

      if (expiryDate > currentTime) {
        setIsAuthenticated(true); // Token is still valid
      } else {
        setIsAuthenticated(false); // Token has expired
        localStorage.removeItem("access"); // Optionally remove expired token
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      setIsAuthenticated(false); // Set as false if decoding fails
    }
  };

  useEffect(() => {
    auth();
  }, []);

  const fetchShopData = async () => {
    setLoading(true)
    try {
      const response = await api.get("/vendors");
      if (response.data) {
        setShopsData(response.data);
        // console.log(response.data);
      }
    } catch (error) {
      console.log(error);
    }finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchProducts = async (shopId) => {
    console.log("Fetching products for shopId:", shopId);
    try {
      const response = await api.get(`vendor-products/${shopId}`);
      if (response.status === 200) {
        // console.log(response.data);
        setProducts(response.data);
        setDetails(response.data.vendor_details)
        // console.log(response.data.vendor_details)
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchShopsBySchool = async (schoolName) => {
    setLoading(true);
    try {
      const response = await api.get("shops-by-school/", {
        params: { school: schoolName },
      });
      // Return the data for immediate use and also update the global state
      setShopsData(response.data);
      // console.log(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      setError("Failed to fetch shops for this school");
      console.error("Error fetching shops by school:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchProduct = async(productId) => {
    const response = await api.get(`product/${productId}`)
    try{
      setLoading(true)
      if (response.data) {
        setProduct(response.data)
      }
    }catch(error){
      console.log(error)
    }finally{
      setLoading(false)
    }
  }


  return (
    <GlobalContext.Provider
      value={{
        isAuthenticated,
        auth,
        user_type,
        shopsData,
        fetchProducts,
        products,
        fetchShopsBySchool,
        // fetchShopsByCategory,
        // fetchShopsBySchoolAndCategory,
        loading,
        error,
        fetchProduct,
        product,
        details,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
