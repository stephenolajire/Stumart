import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import styles from "../css/ProductDetails.module.css";
import { GlobalContext } from "../constant/GlobalContext";
import api from "../constant/api";
import Swal from "sweetalert2";
import { FaArrowLeft } from "react-icons/fa";

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

const ProductDetails = () => {
  const { productId } = useParams();
  const [quantity, setQuantity] = useState(1);
  const { fetchProduct, incrementCount, product, loading, generateCartCode } =
    useContext(GlobalContext);

  // New state for selected image, color, and size
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // Handle Add to Cart
  const handleAddToCart = async () => {
    const isFashionProduct = product.vendor_category === "fashion";

    if (isFashionProduct) {
      if (!selectedColor && product.colors?.length > 0) {
        Toast.fire({
          icon: "warning",
          title: "Please select a color",
        });
        return;
      }

      if (!selectedSize && product.sizes?.length > 0) {
        Toast.fire({
          icon: "warning",
          title: "Please select a size",
        });
        return;
      }
    }

    try {
      const cartCode = localStorage.getItem("cart_code") || generateCartCode();

      const res = await api.post("add-to-cart/", {
        product_id: product.id,
        quantity,
        size: selectedSize,
        color: selectedColor,
        cart_code: cartCode,
      });

      if (res.status === 201) {
        Toast.fire({
          icon: "success",
          title: `${product.name} added to cart`,
        });
        incrementCount();
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to add item to cart",
      });
    }
  };

  useEffect(() => {
    fetchProduct(productId);
  }, [productId]);

  useEffect(() => {
    // Set default selections when product loads
    const isFashionProduct = product?.vendor_category === "fashion";

    if (
      isFashionProduct &&
      product &&
      product.colors &&
      product.colors.length > 0
    ) {
      // Find first color with quantity > 0
      const availableColor = product.colors.find((color) => color.quantity > 0);
      if (availableColor) {
        setSelectedColor(availableColor.color);
      }
    }

    if (
      isFashionProduct &&
      product &&
      product.sizes &&
      product.sizes.length > 0
    ) {
      // Find first size with quantity > 0
      const availableSize = product.sizes.find((size) => size.quantity > 0);
      if (availableSize) {
        setSelectedSize(availableSize.size);
      }
    }
  }, [product]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Handle carousel navigation
  const nextImage = () => {
    const totalImages = 1 + (product.additional_images?.length || 0);
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % totalImages);
  };

  const prevImage = () => {
    const totalImages = 1 + (product.additional_images?.length || 0);
    setCurrentImageIndex(
      (prevIndex) => (prevIndex - 1 + totalImages) % totalImages
    );
  };

  // Get current image URL
  const getCurrentImageUrl = () => {
    if (currentImageIndex === 0) {
      return product.image_url; // Main image
    } else {
      // Additional images (index - 1 because main image is at index 0)
      return (
        product.additional_images[currentImageIndex - 1]?.image_url ||
        product.image_url
      );
    }
  };

  // Check if product is a fashion product
  const isFashionProduct = product.vendor_category === "fashion";

  // Check if product is out of stock - only applicable for fashion products
  const isOutOfStock = isFashionProduct && product.in_stock <= 0;

  // Check if we have a carousel
  const hasCarousel =
    product.additional_images && product.additional_images.length > 0;

  return (
    <div className={styles.productDetails}>
      <div className={styles.header}>
        <div className={styles.backButton} onClick={() => window.history.back()}>
          <FaArrowLeft size={20}/>
          <span className={styles.backText}>Back</span>
        </div>
        <h2 className={styles.title}>Product Details</h2>
      </div>
      <div className={styles.container}>
        <div className={styles.productGrid}>
          <div className={styles.imageSection}>
            {/* Image carousel */}
            <div className={styles.carousel}>
              <img src={getCurrentImageUrl()} alt={product.name} />

              {hasCarousel && (
                <div className={styles.carouselControls}>
                  <button onClick={prevImage} className={styles.carouselButton}>
                    ❮
                  </button>
                  <div className={styles.carouselIndicators}>
                    {[
                      product.image_url,
                      ...(product.additional_images || []).map(
                        (img) => img.url
                      ),
                    ].map((_, index) => (
                      <span
                        key={index}
                        className={`${styles.indicator} ${
                          currentImageIndex === index
                            ? styles.activeIndicator
                            : ""
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                  <button onClick={nextImage} className={styles.carouselButton}>
                    ❯
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail gallery */}
            {hasCarousel && (
              <div className={styles.thumbnailGallery}>
                <div
                  className={`${styles.thumbnail} ${
                    currentImageIndex === 0 ? styles.activeThumbnail : ""
                  }`}
                  onClick={() => setCurrentImageIndex(0)}
                >
                  <img src={product.image_url} alt={`${product.name} - main`} />
                </div>

                {product.additional_images?.map((img, index) => (
                  <div
                    key={index}
                    className={`${styles.thumbnail} ${
                      currentImageIndex === index + 1
                        ? styles.activeThumbnail
                        : ""
                    }`}
                    onClick={() => setCurrentImageIndex(index + 1)}
                  >
                    <img
                      src={img.image_url}
                      alt={`${product.name} - ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.infoSection}>
            <h1>{product.name}</h1>
            <p className={styles.price}>₦{product.price}</p>
            <p className={styles.description}>{product.description}</p>

            <div className={styles.shopInfo}>
              <h3>Sold by: {product.vendor_name}</h3>
              <div className={styles.rating}>⭐ {product.vendor_rating}</div>
            </div>

            {/* Only show stock info for fashion products */}
            {isFashionProduct && (
              <div className={styles.shopInfo}>
                {product.in_stock > 0 && <h3>In Stock: {product.in_stock}</h3>}
                {product.in_stock <= 0 && (
                  <h3 className={styles.outOfStock}>Out of Stock</h3>
                )}
              </div>
            )}

            {/* Colors section - only for fashion products with colors */}
            {isFashionProduct &&
              product.colors &&
              product.colors.length > 0 && (
                <div className={styles.colorsSection}>
                  <h3>Colors:</h3>
                  <div className={styles.colorOptions}>
                    {product.colors
                      .filter((color) => color.quantity > 0) // Only show colors with stock
                      .map((color) => (
                        <div
                          key={color.id}
                          className={`${styles.colorOption} ${
                            selectedColor === color.color
                              ? styles.selectedColor
                              : ""
                          }`}
                          onClick={() => setSelectedColor(color.color)}
                        >
                          <span
                            className={styles.colorSwatch}
                            style={{ backgroundColor: color.color }}
                          ></span>
                          <span>
                            {color.color} ({color.quantity})
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Sizes section - only for fashion products with sizes */}
            {isFashionProduct && product.sizes && product.sizes.length > 0 && (
              <div className={styles.sizesSection}>
                <h3>Sizes:</h3>
                <div className={styles.sizeOptions}>
                  {product.sizes
                    .filter((size) => size.quantity > 0) // Only show sizes with stock
                    .map((size) => (
                      <div
                        key={size.id}
                        className={`${styles.sizeOption} ${
                          selectedSize === size.size ? styles.selectedSize : ""
                        }`}
                        onClick={() => setSelectedSize(size.size)}
                      >
                        <span>
                          {size.size} ({size.quantity})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className={styles.addToCart}>
              <div className={styles.quantity}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={
                    quantity === 1 || (isFashionProduct && isOutOfStock)
                  }
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={
                    (isFashionProduct && isOutOfStock) ||
                    (isFashionProduct && quantity >= product.in_stock)
                  }
                >
                  +
                </button>
              </div>
              <button
                className={`${styles.addButton} ${
                  isFashionProduct && isOutOfStock ? styles.disabledButton : ""
                }`}
                disabled={isFashionProduct && isOutOfStock}
                onClick={() => {
                  handleAddToCart();
                  incrementCount();
                }}
              >
                {isFashionProduct && isOutOfStock
                  ? "Out of Stock"
                  : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
