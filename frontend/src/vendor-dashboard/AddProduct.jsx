import React, { useState, useEffect } from "react";
import api from "../constant/api";
import Swal from "sweetalert2";
import Header from "./Header";
import { useCreateVendorProduct } from "../hooks/useStumart";

const Toast = Swal.mixin({
  toast: true,
  position: "top-right",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const AddProduct = () => {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    in_stock: 0,
    image: null,
    keyword: "",
    delivery_day: "",
  });
  const [errors, setErrors] = useState({});
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [businessCategory, setBusinessCategory] = useState("");
  const [sizes, setSizes] = useState([{ size: "", quantity: 0 }]);
  const [colors, setColors] = useState([{ color: "", quantity: 0 }]);
  const [additionalImages, setAdditionalImages] = useState([
    { image: null, preview: null },
  ]);
  const [gender, setGender] = useState("");

  const { mutate: createVendorProduct, isPending } = useCreateVendorProduct();

  useEffect(() => {
    const fetchBusinessCategory = async () => {
      try {
        setLoadingCategory(true);
        const response = await api.get("stumart/products/create");
        setBusinessCategory(response.data.business_category || "");
      } catch (error) {
        console.error("Failed to fetch business category:", error);
        Toast.fire({
          icon: "error",
          title: "Failed to load vendor information. Please refresh.",
        });
      } finally {
        setLoadingCategory(false);
      }
    };

    fetchBusinessCategory();
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!product.name.trim()) {
      newErrors.name = "Product name is required";
    } else if (product.name.length > 100) {
      newErrors.name = "Product name must be less than 100 characters";
    }

    if (!product.description.trim()) {
      newErrors.description = "Product description is required";
    }

    if (!product.price) {
      newErrors.price = "Price is required";
    } else if (
      isNaN(parseFloat(product.price)) ||
      parseFloat(product.price) < 0
    ) {
      newErrors.price = "Price must be a valid positive number";
    } else if (parseFloat(product.price) > 99999.99) {
      newErrors.price = "Price cannot exceed 99,999.99";
    }

    if (businessCategory !== "food") {
      if (product.in_stock === "") {
        newErrors.in_stock = "Stock quantity is required";
      } else if (parseInt(product.in_stock) < 0) {
        newErrors.in_stock = "Stock quantity cannot be negative";
      } else if (!Number.isInteger(Number(product.in_stock))) {
        newErrors.in_stock = "Stock quantity must be a whole number";
      }
    }

    if (businessCategory !== "food") {
      if (product.delivery_day.trim() === "") {
        newErrors.delivery_day = "Product delivery day is required";
      } else if (product.delivery_day.length > 100) {
        newErrors.delivery_day = "Product delivery day should be specific";
      }
    } else {
      product.delivery_day = "1 day";
    }

    if (product.image) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/avif",
      ];
      if (!allowedTypes.includes(product.image.type)) {
        newErrors.image = "Only JPG, PNG, GIF, and WEBP images are allowed";
      } else if (product.image.size > 5 * 1024 * 1024) {
        newErrors.image = "Image size must be less than 5MB";
      }
    }

    if (businessCategory === "fashion") {
      const sizeErrors = [];
      let hasEmptySize = false;
      sizes.forEach((item, index) => {
        if (!item.size.trim()) {
          hasEmptySize = true;
          sizeErrors[index] = "Size name is required";
        }
        if (item.quantity < 0 || !Number.isInteger(Number(item.quantity))) {
          sizeErrors[index] =
            sizeErrors[index] || "Quantity must be a valid whole number";
        }
      });
      if (hasEmptySize || sizeErrors.length > 0) newErrors.sizes = sizeErrors;

      const colorErrors = [];
      let hasEmptyColor = false;
      colors.forEach((item, index) => {
        if (!item.color.trim()) {
          hasEmptyColor = true;
          colorErrors[index] = "Color name is required";
        }
        if (item.quantity < 0 || !Number.isInteger(Number(item.quantity))) {
          colorErrors[index] =
            colorErrors[index] || "Quantity must be a valid whole number";
        }
      });
      if (hasEmptyColor || colorErrors.length > 0)
        newErrors.colors = colorErrors;

      if (!gender) newErrors.gender = "Please select a gender category";
    }

    additionalImages.forEach((item, index) => {
      if (item.image) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!allowedTypes.includes(item.image.type)) {
          newErrors.additionalImages = newErrors.additionalImages || [];
          newErrors.additionalImages[index] =
            "Only JPG, PNG, GIF, and WEBP images are allowed";
        } else if (item.image.size > 5 * 1024 * 1024) {
          newErrors.additionalImages = newErrors.additionalImages || [];
          newErrors.additionalImages[index] =
            "Image size must be less than 5MB";
        }
      }
    });

    if (!product.keyword.trim()) {
      newErrors.keywords = "Keywords are required";
    } else if (product.keyword.length > 200) {
      newErrors.keywords = "Keywords must be less than 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (errors.image) setErrors((prev) => ({ ...prev, image: "" }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      setProduct((prev) => ({ ...prev, image: file }));
    } else {
      setImagePreview(null);
      setProduct((prev) => ({ ...prev, image: null }));
    }
  };

  const handleAdditionalImageChange = (e, index) => {
    const file = e.target.files[0];
    if (errors.additionalImages?.[index]) {
      const newErrors = { ...errors };
      newErrors.additionalImages[index] = "";
      setErrors(newErrors);
    }
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = [...additionalImages];
        updated[index] = { image: file, preview: reader.result };
        setAdditionalImages(updated);
      };
      reader.readAsDataURL(file);
    } else {
      const updated = [...additionalImages];
      updated[index] = { image: null, preview: null };
      setAdditionalImages(updated);
    }
  };

  const addImageField = () =>
    setAdditionalImages([...additionalImages, { image: null, preview: null }]);

  const handleSizeChange = (index, field, value) => {
    const updated = [...sizes];
    updated[index][field] = value;
    setSizes(updated);
    if (errors.sizes?.[index]) {
      const newErrors = { ...errors };
      newErrors.sizes[index] = "";
      setErrors(newErrors);
    }
  };

  const addSizeField = () => setSizes([...sizes, { size: "", quantity: 0 }]);

  const handleColorChange = (index, field, value) => {
    const updated = [...colors];
    updated[index][field] = value;
    setColors(updated);
    if (errors.colors?.[index]) {
      const newErrors = { ...errors };
      newErrors.colors[index] = "";
      setErrors(newErrors);
    }
  };

  const addColorField = () =>
    setColors([...colors, { color: "", quantity: 0 }]);

  const handleGenderChange = (e) => {
    setGender(e.target.value);
    if (errors.gender) setErrors((prev) => ({ ...prev, gender: "" }));
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.append("name", product.name.trim());
    formData.append("description", product.description.trim());
    formData.append("price", product.price);
    formData.append("delivery_day", product.delivery_day.trim());

    if (businessCategory !== "food") {
      formData.append("in_stock", product.in_stock);
    }

    if (product.image) {
      formData.append("image", product.image);
    }

    if (businessCategory === "fashion") {
      formData.append("gender", gender);
      const sizesData = sizes
        .filter((s) => s.size.trim() !== "")
        .map(({ size, quantity }) => ({ size, quantity }));
      formData.append("sizes", JSON.stringify(sizesData));
      const colorsData = colors
        .filter((c) => c.color.trim() !== "")
        .map(({ color, quantity }) => ({ color, quantity }));
      formData.append("colors", JSON.stringify(colorsData));
    }

    additionalImages.forEach((item, index) => {
      if (item.image) {
        formData.append(`additional_images_${index}`, item.image);
      }
    });

    formData.append("keyword", product.keyword.trim());
    return formData;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    createVendorProduct(buildFormData(), {
      onSuccess: (res) => {
        if (res.status === 201) {
          Toast.fire({ icon: "success", title: "Product added successfully" });
          resetForm();
        }
      },
      onError: (error) => {
        if (error.response?.status === 400) {
          const serverErrors = error.response.data.errors;
          if (serverErrors) {
            const fieldErrors = {};
            Object.keys(serverErrors).forEach((field) => {
              fieldErrors[field] = Array.isArray(serverErrors[field])
                ? serverErrors[field][0]
                : serverErrors[field];
            });
            setErrors(fieldErrors);
          }
          Toast.fire({
            icon: "error",
            title: "Please correct the form errors",
          });
        } else if (error.response?.status === 403) {
          Toast.fire({
            icon: "error",
            title: "Permission denied",
            text: "Your account must be registered as a vendor",
          });
        } else if (error.response?.status === 401) {
          Toast.fire({
            icon: "error",
            title: "Authentication required",
            text: "Please log in to add products",
          });
        } else {
          Toast.fire({
            icon: "error",
            title: "Failed to add product",
            text: "Please try again later",
          });
        }
      },
    });
  };

  const resetForm = () => {
    setProduct({
      name: "",
      description: "",
      price: "",
      in_stock: 0,
      image: null,
      keyword: "",
      delivery_day: "",
    });
    setErrors({});
    setImagePreview(null);
    setSizes([{ size: "", quantity: 0 }]);
    setColors([{ color: "", quantity: 0 }]);
    setAdditionalImages([{ image: null, preview: null }]);
    setGender("");
    document.querySelectorAll('input[type="file"]').forEach((input) => {
      input.value = "";
    });
  };

  const getTotalVariations = () => {
    if (businessCategory !== "fashion") return 0;
    const validSizes = sizes.filter((s) => s.size.trim() !== "").length;
    const validColors = colors.filter((c) => c.color.trim() !== "").length;
    if (validSizes === 0 || validColors === 0) return 0;
    return validSizes * validColors;
  };

  const getTotalInventory = () => {
    if (businessCategory !== "fashion") return product.in_stock;
    const sizeTotal = sizes.reduce(
      (t, s) => t + (s.quantity ? parseInt(s.quantity) : 0),
      0,
    );
    const colorTotal = colors.reduce(
      (t, c) => t + (c.quantity ? parseInt(c.quantity) : 0),
      0,
    );
    return sizeTotal + colorTotal;
  };

  if (loadingCategory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <Header />

      {businessCategory && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Category:{" "}
            <strong className="text-yellow-900">{businessCategory}</strong>
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-8">
        <form
          onSubmit={handleSubmit}
          noValidate
          encType="multipart/form-data"
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Product Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={product.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.name ? "border-red-500 bg-red-50" : "border-gray-300"}`}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description*
            </label>
            <textarea
              id="description"
              name="description"
              value={product.description}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.description ? "border-red-500 bg-red-50" : "border-gray-300"}`}
              rows="4"
              placeholder="Describe your product"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Price (₦)*
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={product.price}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.price ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            {businessCategory !== "food" && (
              <div>
                <label
                  htmlFor="in_stock"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Quantity in Stock*
                </label>
                <input
                  type="number"
                  id="in_stock"
                  name="in_stock"
                  value={product.in_stock}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.in_stock ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  min="0"
                  placeholder="0"
                />
                {errors.in_stock && (
                  <p className="mt-1 text-sm text-red-600">{errors.in_stock}</p>
                )}
              </div>
            )}
          </div>

          {businessCategory !== "food" && (
            <div>
              <label
                htmlFor="delivery_day"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Delivery Day*
              </label>
              <input
                type="text"
                id="delivery_day"
                name="delivery_day"
                value={product.delivery_day}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.delivery_day ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                placeholder="e.g., 1 day, 2 days etc."
              />
              {errors.delivery_day && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.delivery_day}
                </p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="product-image"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Product Image
            </label>
            <input
              type="file"
              id="product-image"
              name="image"
              onChange={handleImageChange}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.image ? "border-red-500 bg-red-50" : "border-gray-300"}`}
              accept="image/jpeg,image/png,image/gif,image/webp"
            />
            <p className="mt-1 text-sm text-gray-500">
              Upload a high-quality image of your product (JPG, PNG, GIF, WEBP
              formats)
            </p>
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">{errors.image}</p>
            )}
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Images
            </label>
            <div className="space-y-4">
              {additionalImages.map((item, index) => (
                <div key={`additional-image-${index}`} className="space-y-2">
                  <input
                    type="file"
                    id={`additional-image-${index}`}
                    onChange={(e) => handleAdditionalImageChange(e, index)}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.additionalImages?.[index] ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                  />
                  {errors.additionalImages?.[index] && (
                    <p className="text-sm text-red-600">
                      {errors.additionalImages[index]}
                    </p>
                  )}
                  {item.preview && (
                    <img
                      src={item.preview}
                      alt={`Additional image ${index + 1}`}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                + Add Another Image
              </button>
            </div>
          </div>

          {businessCategory === "fashion" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender Category*
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["men", "women", "unisex", "kids"].map((genderOption) => (
                    <label key={genderOption} className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value={genderOption}
                        checked={gender === genderOption}
                        onChange={handleGenderChange}
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {genderOption}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Available Sizes*
                </label>
                <div className="space-y-3">
                  {sizes.map((item, index) => (
                    <div
                      key={`size-${index}`}
                      className="flex flex-col gap-2 md:flex-row space-x-3"
                    >
                      <input
                        type="text"
                        value={item.size}
                        onChange={(e) =>
                          handleSizeChange(index, "size", e.target.value)
                        }
                        className={`flex-1 px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.sizes?.[index] ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                        placeholder="Size (e.g., S, M, L, XL, 42, 44)"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleSizeChange(index, "quantity", e.target.value)
                        }
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        min="0"
                        placeholder="Qty"
                      />
                    </div>
                  ))}
                  {errors.sizes?.some((e) => e) && (
                    <p className="text-sm text-red-600">
                      Please fix size errors above
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addSizeField}
                  className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  + Add Another Size
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Available Colors*
                </label>
                <div className="space-y-3">
                  {colors.map((item, index) => (
                    <div
                      key={`color-${index}`}
                      className="flex flex-col gap-2 md:flex-row space-x-3"
                    >
                      <input
                        type="text"
                        value={item.color}
                        onChange={(e) =>
                          handleColorChange(index, "color", e.target.value)
                        }
                        className={`flex-1 px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.colors?.[index] ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                        placeholder="Color name (e.g., Red, Blue, Green)"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleColorChange(index, "quantity", e.target.value)
                        }
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        min="0"
                        placeholder="Qty"
                      />
                    </div>
                  ))}
                  {errors.colors?.some((e) => e) && (
                    <p className="text-sm text-red-600">
                      Please fix color errors above
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addColorField}
                  className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  + Add Another Color
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Variations:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {getTotalVariations()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Inventory:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {getTotalInventory()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="keyword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Keywords*
            </label>
            <input
              type="text"
              id="keyword"
              name="keyword"
              value={product.keyword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${errors.keyword ? "border-red-500 bg-red-50" : "border-gray-300"}`}
              placeholder="e.g., shoes, jeans, shirts"
            />
            <p className="mt-1 text-sm text-gray-500">
              Add keywords separated by commas to help customers find your
              product
            </p>
            {errors.keyword && (
              <p className="mt-1 text-sm text-red-600">{errors.keyword}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors duration-200"
            >
              {isPending ? "Adding Product..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
