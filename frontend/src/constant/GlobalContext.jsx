import { createContext, useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import api from "./api";
import { jwtDecode } from "jwt-decode";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const user_type = localStorage.getItem("user_type")

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
    auth()
  }, [])


  return (
    <GlobalContext.Provider
      value={{
       isAuthenticated,
       auth,
       user_type,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
