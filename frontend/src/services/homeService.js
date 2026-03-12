import api from "../constant/api";

export const homeService = {
  getVendorsByCategory: (params) =>
    api.get("/home/vendors/by-category/", { params }),

  getProductsByCategory: (params) =>
    api.get("/home/products/by-category/", { params }),

  getCategoriesLastFive: () => api.get("/home/categories/last-five/"),

  getVendorsBySchool: (institution = "") =>
    api.get("/home/vendors/by-school/", {
      params: institution ? { school: institution } : {},
    }),

  getAllVendorNames: (params) =>
    api.get("/home/vendors/all-names/", { params }),

  getHeroProducts: () => api.get("/home/hero-products/"),
};
