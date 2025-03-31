// components/AddProduct.js
import React, { useState } from "react";
import axios from "axios";
import styles from "./AddProduct.module.css";
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
  const [message, setMessage] = useState({ text: "", type: "" });
  const [imagePreview, setImagePreview] = useState(null);

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

    // In stock validation
    if (product.in_stock === "") {
      newErrors.in_stock = "Stock quantity is required";
    } else if (parseInt(product.in_stock) < 0) {
      newErrors.in_stock = "Stock quantity cannot be negative";
    } else if (!Number.isInteger(Number(product.in_stock))) {
      newErrors.in_stock = "Stock quantity must be a whole number";
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
      formData.append("in_stock", product.in_stock);

      // Ensure image is correctly appended with the right field name
      if (product.image) {
        // Explicitly set the field name to 'image' to match model field
        formData.append("image", product.image);
      }

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
      const response = await api.post("products/", formData, {
        headers,
      });

      // Reset form on success
      setProduct({
        name: "",
        description: "",
        price: "",
        in_stock: 0,
        image: null,
      });

      // Clear image preview
      setImagePreview(null);

      // Reset file input
      const fileInput = document.getElementById("product-image");
      if (fileInput) fileInput.value = "";

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

    // Reset file input
    const fileInput = document.getElementById("product-image");
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Add New Product</h2>

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
        </div>

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
