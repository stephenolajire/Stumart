import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./css/AddProduct.module.css";
import api from "../constant/api";

const AddProduct = () => {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    in_stock: 0,
    image: null,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [imagePreview, setImagePreview] = useState(null);

  // New states for the additional requirements
  const [businessCategory, setBusinessCategory] = useState("");
  const [sizes, setSizes] = useState([{ size: "", quantity: 0 }]);
  // Updated colors state to match size structure with quantity
  const [colors, setColors] = useState([{ color: "", quantity: 0 }]);
  const [additionalImages, setAdditionalImages] = useState([
    { image: null, preview: null },
  ]);
  const [gender, setGender] = useState("");

  // Fetch business category on component mount
  useEffect(() => {
    const fetchBusinessCategory = async () => {
      try {
        setLoadingCategory(true);
        const response = await api.get("create-products");
        setBusinessCategory(response.data.business_category || "");
      } catch (error) {
        console.error("Failed to fetch business category:", error);
        setMessage({
          text: "Failed to load vendor information. Please refresh the page.",
          type: "error",
        });
      } finally {
        setLoadingCategory(false);
      }
    };

    fetchBusinessCategory();
  }, []);

  // Validation rules
  const validate = () => {
    const newErrors = {};

    // Name validation
    if (!product.name.trim()) {
      newErrors.name = "Product name is required";
    } else if (product.name.length > 100) {
      newErrors.name = "Product name must be less than 100 characters";
    }

    // Description validation
    if (!product.description.trim()) {
      newErrors.description = "Product description is required";
    }

    // Price validation
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

    // In stock validation (only if category is not food)
    if (businessCategory !== "food") {
      if (product.in_stock === "") {
        newErrors.in_stock = "Stock quantity is required";
      } else if (parseInt(product.in_stock) < 0) {
        newErrors.in_stock = "Stock quantity cannot be negative";
      } else if (!Number.isInteger(Number(product.in_stock))) {
        newErrors.in_stock = "Stock quantity must be a whole number";
      }
    }

    // Image validation - optional but validate if provided
    if (product.image) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(product.image.type)) {
        newErrors.image = "Only JPG, PNG, GIF, and WEBP images are allowed";
      } else if (product.image.size > 5 * 1024 * 1024) {
        newErrors.image = "Image size must be less than 5MB";
      }
    }

    // Fashion specific validations
    if (businessCategory === "fashion") {
      // Validate sizes
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

      if (hasEmptySize || sizeErrors.length > 0) {
        newErrors.sizes = sizeErrors;
      }

      // Validate colors - updated to match size validation including quantity
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

      if (hasEmptyColor || colorErrors.length > 0) {
        newErrors.colors = colorErrors;
      }

      // Validate gender selection
      if (!gender) {
        newErrors.gender = "Please select a gender category";
      }
    }

    // Validate additional images
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Clear previous error
      if (errors.image) {
        setErrors((prev) => ({
          ...prev,
          image: "",
        }));
      }

      // Image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      setProduct((prev) => ({
        ...prev,
        image: file,
      }));
    } else {
      setImagePreview(null);
      setProduct((prev) => ({
        ...prev,
        image: null,
      }));
    }
  };

  // Handle additional images
  const handleAdditionalImageChange = (e, index) => {
    const file = e.target.files[0];

    if (file) {
      // Clear previous error if exists
      if (errors.additionalImages && errors.additionalImages[index]) {
        const newErrors = { ...errors };
        if (newErrors.additionalImages) {
          newErrors.additionalImages[index] = "";
        }
        setErrors(newErrors);
      }

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAdditionalImages = [...additionalImages];
        newAdditionalImages[index] = {
          image: file,
          preview: reader.result,
        };
        setAdditionalImages(newAdditionalImages);
      };
      reader.readAsDataURL(file);
    } else {
      const newAdditionalImages = [...additionalImages];
      newAdditionalImages[index] = { image: null, preview: null };
      setAdditionalImages(newAdditionalImages);
    }
  };

  // Add a new additional image field
  const addImageField = () => {
    setAdditionalImages([...additionalImages, { image: null, preview: null }]);
  };

  // Handle size changes
  const handleSizeChange = (index, field, value) => {
    const newSizes = [...sizes];
    newSizes[index][field] = value;
    setSizes(newSizes);

    // Clear errors if they exist
    if (errors.sizes && errors.sizes[index]) {
      const newErrors = { ...errors };
      if (newErrors.sizes) {
        newErrors.sizes[index] = "";
      }
      setErrors(newErrors);
    }
  };

  // Add a new size field
  const addSizeField = () => {
    setSizes([...sizes, { size: "", quantity: 0 }]);
  };

  // Modified: Handle color changes to match size change handler
  const handleColorChange = (index, field, value) => {
    const newColors = [...colors];
    newColors[index][field] = value;
    setColors(newColors);

    // Clear errors if they exist
    if (errors.colors && errors.colors[index]) {
      const newErrors = { ...errors };
      if (newErrors.colors) {
        newErrors.colors[index] = "";
      }
      setErrors(newErrors);
    }
  };

  // Add a new color field
  const addColorField = () => {
    setColors([...colors, { color: "", quantity: 0 }]);
  };

  // Handle gender selection
  const handleGenderChange = (e) => {
    setGender(e.target.value);

    // Clear error if exists
    if (errors.gender) {
      setErrors((prev) => ({
        ...prev,
        gender: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run validation
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      // Create form data to handle file upload
      const formData = new FormData();
      formData.append("name", product.name.trim());
      formData.append("description", product.description.trim());
      formData.append("price", product.price);

      // Only append in_stock if the business category is not food
      if (businessCategory !== "food") {
        formData.append("in_stock", product.in_stock);
      }

      // Add main image if available
      if (product.image) {
        formData.append("image", product.image);
      }

      // Add fashion-specific attributes if applicable
      if (businessCategory === "fashion") {
        formData.append("gender", gender);

        // Add sizes as JSON
        // Add sizes as JSON - keep only size and quantity fields
        const sizesData = sizes
          .filter((s) => s.size.trim() !== "")
          .map(({ size, quantity }) => ({ size, quantity }));
        formData.append("sizes", JSON.stringify(sizesData));

        // Add colors as JSON - keep only color and quantity fields
        const colorsData = colors
          .filter((c) => c.color.trim() !== "")
          .map(({ color, quantity }) => ({ color, quantity }));
        formData.append("colors", JSON.stringify(colorsData));
      }

      // Add additional images
      // Add additional images - with clearer naming
      additionalImages.forEach((item, index) => {
        if (item.image) {
          // Use a consistent name pattern
          formData.append(`additional_images_${index}`, item.image);
          console.log(
            `Appending image: additional_images_${index}`,
            item.image.name
          );
        }
      });

      // Include CSRF token if using Django's CSRF protection
      const csrfToken = document.querySelector(
        "[name=csrfmiddlewaretoken]"
      )?.value;
      const headers = {
        "Content-Type": "multipart/form-data",
      };

      if (csrfToken) {
        headers["X-CSRFToken"] = csrfToken;
      }

      // Send API request
      const response = await api.post("vendor-products/", formData, {
        headers,
      });

      // Reset form on success
      resetForm();

      setMessage({
        text: "Product added successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);

      // Handle different types of errors
      if (error.response?.status === 400) {
        // Extract server validation errors and display them
        const serverErrors = error.response.data.errors;
        if (serverErrors) {
          const fieldErrors = {};
          Object.keys(serverErrors).forEach((field) => {
            // Handle errors that might be arrays or strings
            fieldErrors[field] = Array.isArray(serverErrors[field])
              ? serverErrors[field][0]
              : serverErrors[field];
          });
          setErrors(fieldErrors);
        }

        setMessage({
          text: "Please correct the errors in the form.",
          type: "error",
        });
      } else if (error.response?.status === 403) {
        setMessage({
          text: "You don't have permission to add products. Please make sure your account is registered as a vendor.",
          type: "error",
        });
      } else if (error.response?.status === 401) {
        setMessage({
          text: "You must be logged in to add products.",
          type: "error",
        });
      } else {
        setMessage({
          text: "Failed to add product. Please try again later.",
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setProduct({
      name: "",
      description: "",
      price: "",
      in_stock: 0,
      image: null,
    });
    setErrors({});
    setImagePreview(null);
    setMessage({ text: "", type: "" });

    // Reset fashion specific fields
    setSizes([{ size: "", quantity: 0 }]);
    setColors([{ color: "", quantity: 0 }]); // Updated with quantity
    setAdditionalImages([{ image: null, preview: null }]);
    setGender("");

    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => {
      if (input) input.value = "";
    });
  };

  // Calculate total variations
  const getTotalVariations = () => {
    if (businessCategory !== "fashion") return 0;

    const validSizes = sizes.filter((s) => s.size.trim() !== "").length;
    const validColors = colors.filter((c) => c.color.trim() !== "").length;

    if (validSizes === 0 || validColors === 0) return 0;
    return validSizes * validColors;
  };

  // Calculate total inventory - updated to include color quantities
  const getTotalInventory = () => {
    if (businessCategory !== "fashion") return product.in_stock;

    // Calculate total from size quantities
    const sizeTotal = sizes.reduce((total, size) => {
      return total + (size.quantity ? parseInt(size.quantity) : 0);
    }, 0);

    // Calculate total from color quantities
    const colorTotal = colors.reduce((total, color) => {
      return total + (color.quantity ? parseInt(color.quantity) : 0);
    }, 0);

    // Return the sum
    return sizeTotal + colorTotal;
  };

  if (loadingCategory) {
    return <div className={styles.loading}>Loading product form...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Add New Product</h2>

      {businessCategory && (
        <div className={styles.categoryInfo}>
          Category: <strong>{businessCategory}</strong>
        </div>
      )}

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
        encType="multipart/form-data"
      >
        {/* Include CSRF token if using Django's CSRF protection */}
        {document.querySelector("[name=csrfmiddlewaretoken]") && (
          <input
            type="hidden"
            name="csrfmiddlewaretoken"
            value={document.querySelector("[name=csrfmiddlewaretoken]")?.value}
          />
        )}

        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Product Name*
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={product.name}
            onChange={handleChange}
            className={`${styles.input} ${
              errors.name ? styles.inputError : ""
            }`}
            placeholder="Enter product name"
          />
          {errors.name && (
            <span className={styles.errorText}>{errors.name}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Description*
          </label>
          <textarea
            id="description"
            name="description"
            value={product.description}
            onChange={handleChange}
            className={`${styles.textarea} ${
              errors.description ? styles.inputError : ""
            }`}
            rows="4"
            placeholder="Describe your product"
          />
          {errors.description && (
            <span className={styles.errorText}>{errors.description}</span>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.label}>
              Price ($)*
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={product.price}
              onChange={handleChange}
              className={`${styles.input} ${
                errors.price ? styles.inputError : ""
              }`}
              step="0.01"
              min="0"
              placeholder="0.00"
            />
            {errors.price && (
              <span className={styles.errorText}>{errors.price}</span>
            )}
          </div>

          {/* Show in_stock only for non-food categories */}
          {businessCategory !== "food" && (
            <div className={styles.formGroup}>
              <label htmlFor="in_stock" className={styles.label}>
                Quantity in Stock*
              </label>
              <input
                type="number"
                id="in_stock"
                name="in_stock"
                value={product.in_stock}
                onChange={handleChange}
                className={`${styles.input} ${
                  errors.in_stock ? styles.inputError : ""
                }`}
                min="0"
                placeholder="0"
              />
              {errors.in_stock && (
                <span className={styles.errorText}>{errors.in_stock}</span>
              )}
            </div>
          )}
        </div>

        {/* Main product image */}
        <div className={styles.formGroup}>
          <label htmlFor="product-image" className={styles.label}>
            Product Image
          </label>
          <input
            type="file"
            id="product-image"
            name="image"
            onChange={handleImageChange}
            className={`${styles.fileInput} ${
              errors.image ? styles.inputError : ""
            }`}
            accept="image/jpeg,image/png,image/gif,image/webp"
          />
          <p className={styles.helpText}>
            Upload a high-quality image of your product (JPG, PNG, GIF, WEBP
            formats)
          </p>
          {errors.image && (
            <span className={styles.errorText}>{errors.image}</span>
          )}

          {imagePreview && (
            <div className={styles.imagePreview}>
              <img src={imagePreview} alt="Product preview" />
            </div>
          )}
        </div>

        {/* Additional images section */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Additional Images</label>

          {additionalImages.map((item, index) => (
            <div
              key={`additional-image-${index}`}
              className={styles.additionalImageItem}
            >
              <input
                type="file"
                id={`additional-image-${index}`}
                onChange={(e) => handleAdditionalImageChange(e, index)}
                className={`${styles.fileInput} ${
                  errors.additionalImages && errors.additionalImages[index]
                    ? styles.inputError
                    : ""
                }`}
                accept="image/jpeg,image/png,image/gif,image/webp"
              />
              {errors.additionalImages && errors.additionalImages[index] && (
                <span className={styles.errorText}>
                  {errors.additionalImages[index]}
                </span>
              )}

              {item.preview && (
                <div className={styles.imagePreview}>
                  <img
                    src={item.preview}
                    alt={`Additional image ${index + 1}`}
                  />
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            className={styles.addButton}
            onClick={addImageField}
          >
            + Add Another Image
          </button>
        </div>

        {/* Fashion specific fields */}
        {businessCategory === "fashion" && (
          <>
            {/* Gender selection */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Gender Category*</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="gender"
                    value="men"
                    checked={gender === "men"}
                    onChange={handleGenderChange}
                  />
                  Men
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="gender"
                    value="women"
                    checked={gender === "women"}
                    onChange={handleGenderChange}
                  />
                  Women
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="gender"
                    value="unisex"
                    checked={gender === "unisex"}
                    onChange={handleGenderChange}
                  />
                  Unisex
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="gender"
                    value="kids"
                    checked={gender === "kids"}
                    onChange={handleGenderChange}
                  />
                  Kids
                </label>
              </div>
              {errors.gender && (
                <span className={styles.errorText}>{errors.gender}</span>
              )}
            </div>

            {/* Size section */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Available Sizes*</label>

              {sizes.map((item, index) => (
                <div key={`size-${index}`} className={styles.variationRow}>
                  <input
                    type="text"
                    value={item.size}
                    onChange={(e) =>
                      handleSizeChange(index, "size", e.target.value)
                    }
                    className={`${styles.input} ${styles.sizeInput} ${
                      errors.sizes && errors.sizes[index]
                        ? styles.inputError
                        : ""
                    }`}
                    placeholder="Size (e.g., S, M, L, XL, 42, 44)"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleSizeChange(index, "quantity", e.target.value)
                    }
                    className={`${styles.input} ${styles.quantityInput}`}
                    min="0"
                    placeholder="Quantity"
                  />
                  {errors.sizes && errors.sizes[index] && (
                    <span className={styles.errorText}>
                      {errors.sizes[index]}
                    </span>
                  )}
                </div>
              ))}

              <button
                type="button"
                className={styles.addButton}
                onClick={addSizeField}
              >
                + Add Another Size
              </button>
            </div>

            {/* Color section - Modified to match size section structure */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Available Colors*</label>

              {colors.map((item, index) => (
                <div key={`color-${index}`} className={styles.variationRow}>
                  <input
                    type="text"
                    value={item.color}
                    onChange={(e) =>
                      handleColorChange(index, "color", e.target.value)
                    }
                    className={`${styles.input} ${styles.sizeInput} ${
                      errors.colors && errors.colors[index]
                        ? styles.inputError
                        : ""
                    }`}
                    placeholder="Color name (e.g., Red, Blue, Green)"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleColorChange(index, "quantity", e.target.value)
                    }
                    className={`${styles.input} ${styles.quantityInput}`}
                    min="0"
                    placeholder="Quantity"
                  />
                  {errors.colors && errors.colors[index] && (
                    <span className={styles.errorText}>
                      {errors.colors[index]}
                    </span>
                  )}
                </div>
              ))}

              <button
                type="button"
                className={styles.addButton}
                onClick={addColorField}
              >
                + Add Another Color
              </button>
            </div>

            {/* Variations summary */}
            <div className={styles.variationsSummary}>
              <div className={styles.summaryItem}>
                <span>Total Variations:</span>
                <strong>{getTotalVariations()}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Total Inventory:</span>
                <strong>{getTotalInventory()}</strong>
              </div>
            </div>
          </>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.resetButton}
            onClick={resetForm}
          >
            Reset Form
          </button>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Adding Product..." : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
