import React, { useState, useEffect } from "react";
import { FaEdit, FaTimes, FaPlus, FaTrash, FaEye } from "react-icons/fa";
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Updated Product Summary
      </h3>

      {errors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price Preview */}
        {formData.price !== "" &&
          formData.price !== null &&
          formData.price !== undefined && (
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">Price</h4>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Current: ${productData?.price || 0}
                </span>
                <span className="text-yellow-500">→</span>
                <span className="text-sm font-medium text-green-600">
                  New: ${formData.price}
                </span>
              </div>
            </div>
          )}

        {/* Stock Preview */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-3">Total Stock</h4>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Current: {productData?.stock || 0}
            </span>
            <span className="text-yellow-500">→</span>
            <span className="text-sm font-medium text-green-600">
              New: {calculateTotalStock()}
            </span>
          </div>
        </div>

        {businessCategory === "fashion" &&
          formData.sizes.some((s) => s.size.trim()) && (
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">
                Sizes ({formData.sizes.filter((s) => s.size.trim()).length})
              </h4>
              <div className="space-y-2">
                {formData.sizes
                  .filter((size) => size.size.trim())
                  .map((size, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-700">{size.size}</span>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {size.quantity}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {businessCategory !== "food" &&
          formData.colors.some((c) => c.color.trim()) && (
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">
                Colors ({formData.colors.filter((c) => c.color.trim()).length})
              </h4>
              <div className="space-y-2">
                {formData.colors
                  .filter((color) => color.color.trim())
                  .map((color, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-700">{color.color}</span>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {color.quantity}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {newImages.filter((img) => img.image).length > 0 && (
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">
              New Images ({newImages.filter((img) => img.image).length})
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {newImages
                .filter((img) => img.preview)
                .map((img, index) => (
                  <div
                    key={index}
                    className="w-16 h-16 rounded overflow-hidden"
                  >
                    <img
                      src={img.preview}
                      alt={`New image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FaEdit className="mr-2 text-yellow-500" />
            Update Product - {product?.name || "Unknown Product"}
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {!showPreview ? (
            <div className="space-y-8">
              {/* General Error Message */}
              {errors.general && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {errors.general}
                </div>
              )}

              {/* Current Product Display */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Current Product Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Price:</span>
                    <strong className="text-gray-900">
                      ${productData?.price || 0}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Stock:</span>
                    <strong className="text-gray-900">
                      {productData?.stock || 0}
                    </strong>
                  </div>

                  {productData?.business_category === "fashion" && (
                    <>
                      {productData?.sizes && productData.sizes.length > 0 && (
                        <div className="md:col-span-2">
                          <span className="text-gray-600 block mb-2">
                            Current Sizes:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {productData.sizes.map((size, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                              >
                                {size.size}: {size.quantity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {productData?.colors && productData.colors.length > 0 && (
                        <div className="md:col-span-2">
                          <span className="text-gray-600 block mb-2">
                            Current Colors:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {productData.colors.map((color, index) => (
                              <span
                                key={index}
                                className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                              >
                                {color.color}: {color.quantity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {productData?.additional_images &&
                        productData.additional_images.length > 0 && (
                          <div className="md:col-span-2">
                            <span className="text-gray-600 block mb-2">
                              Current Additional Images:
                            </span>
                            <div className="grid grid-cols-4 gap-2">
                              {productData.additional_images.map(
                                (image, index) => (
                                  <div
                                    key={index}
                                    className="w-20 h-20 rounded overflow-hidden"
                                  >
                                    <img
                                      src={image.url || image.image || image}
                                      alt={`Product image ${index + 1}`}
                                      className="w-full h-full object-cover"
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
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Update Product
                </h3>

                {/* Price Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      errors.price ? "border-red-400" : "border-gray-300"
                    }`}
                    min="0"
                    placeholder="Enter new price (optional)"
                  />
                  {errors.price && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.price}
                    </span>
                  )}
                </div>

                {/* Stock Input - Always show for all categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.in_stock}
                    onChange={(e) =>
                      handleInputChange("in_stock", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      errors.in_stock ? "border-red-400" : "border-gray-300"
                    }`}
                    min="0"
                    placeholder="Enter stock quantity"
                  />
                  {errors.in_stock && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.in_stock}
                    </span>
                  )}
                </div>

                {businessCategory === "fashion" && (
                  <>
                    {/* Sizes Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sizes (Optional)
                      </label>
                      <div className="space-y-3">
                        {formData.sizes.map((size, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <input
                              type="text"
                              value={size.size}
                              onChange={(e) =>
                                handleSizeChange(index, "size", e.target.value)
                              }
                              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                                errors[`size_${index}`]
                                  ? "border-red-400"
                                  : "border-gray-300"
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
                              className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                                errors[`size_quantity_${index}`]
                                  ? "border-red-400"
                                  : "border-gray-300"
                              }`}
                              min="0"
                              placeholder="Qty"
                            />
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700 p-2"
                              onClick={() => removeSizeField(index)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                          onClick={addSizeField}
                        >
                          <FaPlus className="mr-2" /> Add Size
                        </button>
                      </div>
                    </div>

                    {/* Colors Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Colors (Optional)
                      </label>
                      <div className="space-y-3">
                        {formData.colors.map((color, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <input
                              type="text"
                              value={color.color}
                              onChange={(e) =>
                                handleColorChange(
                                  index,
                                  "color",
                                  e.target.value
                                )
                              }
                              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                                errors[`color_${index}`]
                                  ? "border-red-400"
                                  : "border-gray-300"
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
                              className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                                errors[`color_quantity_${index}`]
                                  ? "border-red-400"
                                  : "border-gray-300"
                              }`}
                              min="0"
                              placeholder="Qty"
                            />
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700 p-2"
                              onClick={() => removeColorField(index)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                          onClick={addColorField}
                        >
                          <FaPlus className="mr-2" /> Add Color
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Additional Images Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add New Images (Optional)
                  </label>
                  <div className="space-y-3">
                    {newImages.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="file"
                          onChange={(e) => handleImageChange(e, index)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                        />
                        {item.preview && (
                          <div className="w-16 h-16 rounded overflow-hidden">
                            <img
                              src={item.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {newImages.length > 1 && (
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700 p-2"
                            onClick={() => removeImageField(index)}
                          >
                            <FaTrash />
                          </button>
                        )}
                        {errors[`image_${index}`] && (
                          <span className="text-red-500 text-sm block mt-1">
                            {errors[`image_${index}`]}
                          </span>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                      onClick={addImageField}
                    >
                      <FaPlus className="mr-2" /> Add Another Image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <PreviewSection />
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>

          {!showPreview ? (
            <button
              type="button"
              className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              onClick={() => setShowPreview(true)}
              disabled={!hasChanges()}
            >
              <FaEye className="mr-2" /> Preview Changes
            </button>
          ) : (
            <>
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setShowPreview(false)}
              >
                Back to Edit
              </button>
              <button
                type="button"
                className="flex items-center px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
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
