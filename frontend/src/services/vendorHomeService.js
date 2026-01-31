import api from "../constant/api";

export const getVendorsByCategory = async (params) => {
  const { data } = await api.get("all-vendors/school/", { params });
  return data;
};

export const getProductsByCategory = async (params) => {
  const { data } = await api.get("/products/category/", { params });
  return data;
};

export const getCategoryLatestProducts = async () => {
  const { data } = await api.get("/categories/products/latest/");
  return data;
};

export const getVendorsBySchool = async (school) => {
  const { data } = await api.get("/vendors/school/", {
    params: { school },
  });
  return data;
};
