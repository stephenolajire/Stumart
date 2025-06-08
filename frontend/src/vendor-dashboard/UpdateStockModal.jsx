import React, { useState, useEffect } from "react";
import { FaEdit, FaTimes, FaPlus, FaTrash, FaEye } from "react-icons/fa";
import styles from "./css/UpdateStockModal.module.css";
import api from "../constant/api";

const UpdateStockModal = ({
  isOpen,
  onClose,
  product,
  onUpdateStock,
  businessCategory,
  details,
}) => {
  const [formData, setFormData] = useState({
    in_stock: "",
    price: "",
    sizes: [],
    colors: [],
    additionalImages: [],
  });

  const [newImages, setNewImages] = useState([{ image: null, preview: null }]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Get product data from details (handling nested structure)
  const productData = details?.product || details || product;

  console.log(productData);

  // Initialize form data when product changes
  useEffect(() => {
    if (product && isOpen) {
      console.log("Initializing modal with product:", product);

      setFormData({
        in_stock: product.stock || 0, // Default to 0 instead of empty string
        price: product.price || "",
        sizes: product.sizes ? [...product.sizes] : [],
        colors: product.colors ? [...product.colors] : [],
        additionalImages: product.additional_images || [],
      });
      setNewImages([{ image: null, preview: null }]);
      setShowPreview(false);
      setErrors({});
    }
  }, [product, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...formData.sizes];
    if (!newSizes[index]) {
      newSizes[index] = { size: "", quantity: 0 };
    }
    newSizes[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      sizes: newSizes,
    }));
  };

  const handleColorChange = (index, field, value) => {
    const newColors = [...formData.colors];
    if (!newColors[index]) {
      newColors[index] = { color: "", quantity: 0 };
    }
    newColors[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      colors: newColors,
    }));
  };

  const addSizeField = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: "", quantity: 0 }],
    }));
  };

  const addColorField = () => {
    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, { color: "", quantity: 0 }],
    }));
  };

  const removeSizeField = (index) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      sizes: newSizes,
    }));
  };

  const removeColorField = (index) => {
    const newColors = formData.colors.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      colors: newColors,
    }));
  };

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [`image_${index}`]:
            "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
        }));
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [`image_${index}`]: "Image size must be less than 5MB",
        }));
        return;
      }

      // Clear any previous errors for this image
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`image_${index}`];
        return newErrors;
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedImages = [...newImages];
        updatedImages[index] = {
          image: file,
          preview: reader.result,
        };
        setNewImages(updatedImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const addImageField = () => {
    setNewImages([...newImages, { image: null, preview: null }]);
  };

  const removeImageField = (index) => {
    const updatedImages = newImages.filter((_, i) => i !== index);
    setNewImages(updatedImages);

    // Clear any errors for this image
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`image_${index}`];
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate price if provided
    if (
      formData.price !== "" &&
      formData.price !== null &&
      formData.price !== undefined
    ) {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue < 0) {
        newErrors.price = "Price must be a valid positive number";
      }
    }

    // Always validate stock - ensure it's a valid number
    const stockValue = parseInt(formData.in_stock);
    if (isNaN(stockValue) || stockValue < 0) {
      newErrors.in_stock = "Stock must be a valid non-negative number";
    }

    // For fashion items, validate sizes and colors
    if (businessCategory === "fashion") {
      formData.sizes.forEach((size, index) => {
        if (size.size && size.size.trim()) {
          if (size.quantity < 0) {
            newErrors[`size_quantity_${index}`] = "Quantity cannot be negative";
          }
        } else if (size.quantity > 0) {
          newErrors[`size_${index}`] =
            "Size name is required when quantity is provided";
        }
      });

      formData.colors.forEach((color, index) => {
        if (color.color && color.color.trim()) {
          if (color.quantity < 0) {
            newErrors[`color_quantity_${index}`] =
              "Quantity cannot be negative";
          }
        } else if (color.quantity > 0) {
          newErrors[`color_${index}`] =
            "Color name is required when quantity is provided";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalStock = () => {
    if (businessCategory === "fashion") {
      // Calculate total from sizes for fashion items
      const sizeTotal = formData.sizes.reduce(
        (total, size) => total + (parseInt(size.quantity) || 0),
        0
      );

      // If no sizes are provided, use the manual stock input
      return sizeTotal > 0 ? sizeTotal : parseInt(formData.in_stock) || 0;
    }
    return parseInt(formData.in_stock) || 0;
  };

  // Fixed hasChanges function
  const hasChanges = () => {
    const currentStock = parseInt(formData.in_stock) || 0;
    const originalStock = product?.stock || 0;

    const hasStockChange = currentStock !== originalStock;

    // Fixed price change detection
    let hasPriceChange = false;
    if (
      formData.price !== "" &&
      formData.price !== null &&
      formData.price !== undefined
    ) {
      const newPrice = parseFloat(formData.price);
      const currentPrice = product?.price || 0;
      hasPriceChange = !isNaN(newPrice) && newPrice !== currentPrice;
    }

    const hasSizeChanges = formData.sizes.some(
      (size) => size.size.trim() || size.quantity > 0
    );
    const hasColorChanges = formData.colors.some(
      (color) => color.color.trim() || color.quantity > 0
    );
    const hasNewImages = newImages.some((img) => img.image);

    console.log("Change detection:", {
      hasStockChange,
      hasPriceChange,
      hasSizeChanges,
      hasColorChanges,
      hasNewImages,
      formPrice: formData.price,
      productPrice: product?.price,
    });

    return (
      hasStockChange ||
      hasPriceChange ||
      hasSizeChanges ||
      hasColorChanges ||
      hasNewImages
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      console.log("Form validation failed:", errors);
      return;
    }

    if (!hasChanges()) {
      setErrors({
        general: "Please make at least one change before updating.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const productId = parseInt(product.id);

      if (!productId || isNaN(productId)) {
        throw new Error("Invalid product ID");
      }

      // Filter out empty sizes and colors
      const validSizes = formData.sizes.filter(
        (size) => size.size && size.size.trim() && size.quantity >= 0
      );

      const validColors = formData.colors.filter(
        (color) => color.color && color.color.trim() && color.quantity >= 0
      );

      // Calculate total stock
      let totalStock = calculateTotalStock();
      totalStock = Math.max(0, totalStock);

      const updateData = {
        productId: productId,
        in_stock: totalStock,
      };

      // DEBUG: Log form data
      console.log("Form data price:", formData.price, typeof formData.price);
      console.log("Current product price:", product?.price);

      // Fixed price logic - include price if it's provided and valid
      if (
        formData.price !== "" &&
        formData.price !== null &&
        formData.price !== undefined
      ) {
        const newPrice = parseFloat(formData.price);
        console.log(
          "Parsed price:",
          newPrice,
          "Is valid:",
          !isNaN(newPrice) && newPrice >= 0
        );

        if (!isNaN(newPrice) && newPrice >= 0) {
          updateData.price = newPrice;
          console.log("Price added to update data:", newPrice);
        }
      }

      // Add sizes if provided
      if (validSizes.length > 0) {
        updateData.sizes = validSizes;
      }

      // Add colors if provided
      if (validColors.length > 0) {
        updateData.colors = validColors;
      }

      // Add new images if provided
      const validNewImages = newImages.filter((img) => img.image);
      if (validNewImages.length > 0) {
        updateData.newImages = validNewImages;
      }

      console.log("Final update data being sent:", updateData);

      await onUpdateStock(updateData);
      setShowPreview(false);
    } catch (error) {
      console.error("Error updating stock:", error);
      setErrors({
        general: error.message || "Failed to update product. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const PreviewSection = () => (
    <div className={styles.previewSection}>
      <h3>Updated Product Summary</h3>

      {errors.general && (
        <div className={styles.errorMessage}>{errors.general}</div>
      )}

      <div className={styles.previewGrid}>
        {/* Price Preview */}
        {formData.price !== "" &&
          formData.price !== null &&
          formData.price !== undefined && (
            <div className={styles.previewCard}>
              <h4>Price</h4>
              <div className={styles.stockComparison}>
                <span className={styles.oldValue}>
                  Current: ${productData?.price || 0}
                </span>
                <span className={styles.arrow}>→</span>
                <span className={styles.newValue}>New: ${formData.price}</span>
              </div>
            </div>
          )}

        {/* Stock Preview */}
        <div className={styles.previewCard}>
          <h4>Total Stock</h4>
          <div className={styles.stockComparison}>
            <span className={styles.oldValue}>
              Current: {productData?.stock || 0}
            </span>
            <span className={styles.arrow}>→</span>
            <span className={styles.newValue}>
              New: {calculateTotalStock()}
            </span>
          </div>
        </div>

        {businessCategory === "fashion" &&
          formData.sizes.some((s) => s.size.trim()) && (
            <div className={styles.previewCard}>
              <h4>
                Sizes ({formData.sizes.filter((s) => s.size.trim()).length})
              </h4>
              <div className={styles.attributeList}>
                {formData.sizes
                  .filter((size) => size.size.trim())
                  .map((size, index) => (
                    <div key={index} className={styles.attributeItem}>
                      <span>{size.size}</span>
                      <span className={styles.quantity}>{size.quantity}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {businessCategory !== "food" &&
          formData.colors.some((c) => c.color.trim()) && (
            <div className={styles.previewCard}>
              <h4>
                Colors ({formData.colors.filter((c) => c.color.trim()).length})
              </h4>
              <div className={styles.attributeList}>
                {formData.colors
                  .filter((color) => color.color.trim())
                  .map((color, index) => (
                    <div key={index} className={styles.attributeItem}>
                      <span>{color.color}</span>
                      <span className={styles.quantity}>{color.quantity}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {newImages.filter((img) => img.image).length > 0 && (
          <div className={styles.previewCard}>
            <h4>New Images ({newImages.filter((img) => img.image).length})</h4>
            <div className={styles.imagePreviewGrid}>
              {newImages
                .filter((img) => img.preview)
                .map((img, index) => (
                  <div key={index} className={styles.imagePreviewItem}>
                    <img src={img.preview} alt={`New image ${index + 1}`} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>
            <FaEdit /> Update Product - {product?.name || "Unknown Product"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalContent}>
          {!showPreview ? (
            <div className={styles.formSection}>
              {/* General Error Message */}
              {errors.general && (
                <div className={styles.errorMessage}>{errors.general}</div>
              )}

              {/* Current Product Display */}
              <div className={styles.currentStockInfo}>
                <h3>Current Product Information</h3>
                <div className={styles.stockInfo}>
                  <div className={styles.stockItem}>
                    <span>Current Price:</span>
                    <strong>${productData?.price || 0}</strong>
                  </div>
                  <div className={styles.stockItem}>
                    <span>Total Stock:</span>
                    <strong>{productData?.stock || 0}</strong>
                  </div>

                  {productData?.business_category === "fashion" && (
                    <>
                      {productData?.sizes && productData.sizes.length > 0 && (
                        <div className={styles.stockItem}>
                          <span>Current Sizes:</span>
                          <div className={styles.attributesList}>
                            {productData.sizes.map((size, index) => (
                              <span key={index} className={styles.attributeTag}>
                                {size.size}: {size.quantity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {productData?.colors && productData.colors.length > 0 && (
                        <div className={styles.stockItem}>
                          <span>Current Colors:</span>
                          <div className={styles.attributesList}>
                            {productData.colors.map((color, index) => (
                              <span key={index} className={styles.attributeTag}>
                                {color.color}: {color.quantity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {productData?.additional_images &&
                        productData.additional_images.length > 0 && (
                          <div className={styles.stockItem}>
                            <span>Current Additional Images:</span>
                            <div className={styles.imageGrid}>
                              {productData.additional_images.map(
                                (image, index) => (
                                  <div
                                    key={index}
                                    className={styles.imagePreview}
                                  >
                                    <img
                                      src={image.url || image.image || image}
                                      alt={`Product image ${index + 1}`}
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>

              {/* Update Form */}
              <div className={styles.updateForm}>
                <h3>Update Product</h3>

                {/* Price Input */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className={`${styles.input} ${
                      errors.price ? styles.inputError : ""
                    }`}
                    min="0"
                    placeholder="Enter new price (optional)"
                  />
                  {errors.price && (
                    <span className={styles.errorText}>{errors.price}</span>
                  )}
                </div>

                {/* Stock Input - Always show for all categories */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Stock Quantity *</label>
                  <input
                    type="number"
                    value={formData.in_stock}
                    onChange={(e) =>
                      handleInputChange("in_stock", e.target.value)
                    }
                    className={`${styles.input} ${
                      errors.in_stock ? styles.inputError : ""
                    }`}
                    min="0"
                    placeholder="Enter stock quantity"
                  />
                  {errors.in_stock && (
                    <span className={styles.errorText}>{errors.in_stock}</span>
                  )}
                </div>

                {businessCategory === "fashion" && (
                  <>
                    {/* Sizes Section */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Sizes (Optional)</label>
                      <small className={styles.helpText}></small>
                      {formData.sizes.map((size, index) => (
                        <div key={index} className={styles.variationRow}>
                          <input
                            type="text"
                            value={size.size}
                            onChange={(e) =>
                              handleSizeChange(index, "size", e.target.value)
                            }
                            className={`${styles.input} ${styles.sizeInput} ${
                              errors[`size_${index}`] ? styles.inputError : ""
                            }`}
                            placeholder="Size (e.g., S, M, L)"
                          />
                          <input
                            type="number"
                            value={size.quantity}
                            onChange={(e) =>
                              handleSizeChange(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className={`${styles.input} ${
                              styles.quantityInput
                            } ${
                              errors[`size_quantity_${index}`]
                                ? styles.inputError
                                : ""
                            }`}
                            min="0"
                            placeholder="Quantity"
                          />
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => removeSizeField(index)}
                          >
                            <FaTrash />
                          </button>
                          {(errors[`size_${index}`] ||
                            errors[`size_quantity_${index}`]) && (
                            <span className={styles.errorText}>
                              {errors[`size_${index}`] ||
                                errors[`size_quantity_${index}`]}
                            </span>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={addSizeField}
                      >
                        <FaPlus /> Add Size
                      </button>
                    </div>

                    {/* Colors Section */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Colors (Optional)</label>
                      {formData.colors.map((color, index) => (
                        <div key={index} className={styles.variationRow}>
                          <input
                            type="text"
                            value={color.color}
                            onChange={(e) =>
                              handleColorChange(index, "color", e.target.value)
                            }
                            className={`${styles.input} ${styles.sizeInput} ${
                              errors[`color_${index}`] ? styles.inputError : ""
                            }`}
                            placeholder="Color (e.g., Red, Blue)"
                          />
                          <input
                            type="number"
                            value={color.quantity}
                            onChange={(e) =>
                              handleColorChange(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className={`${styles.input} ${
                              styles.quantityInput
                            } ${
                              errors[`color_quantity_${index}`]
                                ? styles.inputError
                                : ""
                            }`}
                            min="0"
                            placeholder="Quantity"
                          />
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => removeColorField(index)}
                          >
                            <FaTrash />
                          </button>
                          {(errors[`color_${index}`] ||
                            errors[`color_quantity_${index}`]) && (
                            <span className={styles.errorText}>
                              {errors[`color_${index}`] ||
                                errors[`color_quantity_${index}`]}
                            </span>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={addColorField}
                      >
                        <FaPlus /> Add Color
                      </button>
                    </div>
                  </>
                )}

                {/* Additional Images Section */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Add New Images (Optional)
                  </label>
                  {newImages.map((item, index) => (
                    <div key={index} className={styles.imageUploadRow}>
                      <input
                        type="file"
                        onChange={(e) => handleImageChange(e, index)}
                        className={styles.fileInput}
                        accept="image/jpeg,image/png,image/gif,image/webp"
                      />
                      {item.preview && (
                        <div className={styles.imagePreview}>
                          <img
                            src={item.preview}
                            alt={`Preview ${index + 1}`}
                          />
                        </div>
                      )}
                      {newImages.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => removeImageField(index)}
                        >
                          <FaTrash />
                        </button>
                      )}
                      {errors[`image_${index}`] && (
                        <span className={styles.errorText}>
                          {errors[`image_${index}`]}
                        </span>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={addImageField}
                  >
                    <FaPlus /> Add Another Image
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <PreviewSection />
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>

          {!showPreview ? (
            <button
              type="button"
              className={styles.previewButton}
              onClick={() => setShowPreview(true)}
              disabled={!hasChanges()}
            >
              <FaEye /> Preview Changes
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => setShowPreview(false)}
              >
                Back to Edit
              </button>
              <button
                type="button"
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Confirm Update"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateStockModal;
