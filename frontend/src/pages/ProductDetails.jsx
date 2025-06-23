import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "../css/ProductDetails.module.css";
import { GlobalContext } from "../constant/GlobalContext";
import api from "../constant/api";
import Swal from "sweetalert2";
import {
  FaArrowLeft,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaTimes,
} from "react-icons/fa";
import Spinner from "../components/Spinner";
import Header from "../components/Header";
import SEO from "../components/Metadata";

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
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);

  // Access context values
  const { useCartMutations } = useContext(GlobalContext);
  const { addToCart, generateCartCode } = useCartMutations();

  // New state for selected image, color, and size
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // Review states
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: "",
  });

  // Fetch product using TanStack Query
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const response = await api.get(`product/${productId}`);
      return response.data;
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Fetch reviews using TanStack Query
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const response = await api.get(`products/${productId}/reviews/`);
      return {
        reviews: response.data.reviews || [],
        stats: response.data.stats || {
          total_reviews: 0,
          average_rating: 0,
          rating_breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      };
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Fetch user review status using TanStack Query
  const { data: userReviewStatus, isLoading: userReviewStatusLoading } =
    useQuery({
      queryKey: ["userReviewStatus", productId],
      queryFn: async () => {
        try {
          const response = await api.get(
            `products/${productId}/user-review-status/`
          );
          return {
            hasBought: response.data.has_bought,
            hasReviewed: response.data.has_reviewed,
            existingReview: response.data.existing_review,
            loading: false,
          };
        } catch (error) {
          console.error(
            "Error checking review status:",
            error.response?.data || error
          );
          return {
            hasBought: false,
            hasReviewed: false,
            existingReview: null,
            loading: false,
          };
        }
      },
      enabled: !!productId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    });

  // Review submission mutation
  const reviewSubmitMutation = useMutation({
    mutationFn: async (reviewData) => {
      const endpoint = userReviewStatus?.hasReviewed
        ? `products/${productId}/reviews/${userReviewStatus.existingReview.id}/`
        : `products/${productId}/reviews/create/`;

      const method = userReviewStatus?.hasReviewed ? "put" : "post";

      const response = await api[method](endpoint, {
        product_id: productId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });

      return response.data;
    },
    onSuccess: () => {
      Toast.fire({
        icon: "success",
        title: userReviewStatus?.hasReviewed
          ? "Review updated successfully!"
          : "Review submitted successfully!",
      });

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({
        queryKey: ["userReviewStatus", productId],
      });

      // Close modal and reset form
      setShowReviewModal(false);
      setReviewForm({ rating: 0, comment: "" });
    },
    onError: (error) => {
      console.error("Error submitting review:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to submit review. Please try again.",
      });
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (cartData) => {
      const cartCode = localStorage.getItem("cart_code") || generateCartCode();

      const response = await api.post("add-to-cart/", {
        product_id: product.id,
        quantity: cartData.quantity,
        size: cartData.selectedSize,
        color: cartData.selectedColor,
        cart_code: cartCode,
      });

      return response.data;
    },
    onSuccess: () => {
      Toast.fire({
        icon: "success",
        title: `${product.name} added to cart`,
      });

      // Invalidate cart queries to update cart count
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      console.error("Add to cart error:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to add item to cart",
      });
    },
  });

  // Star Rating Component
  const StarRating = ({ rating, size = 16 }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} color="#daa520" size={size} />);
    }

    // Half star
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" color="#daa520" size={size} />);
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} color="#d1d5db" size={size} />);
    }

    return <div className={styles.starRating}>{stars}</div>;
  };

  // Interactive Star Rating Component for modal
  const InteractiveStarRating = ({ rating, onRatingChange, size = 20 }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className={styles.interactiveStarRating}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            size={size}
            color={star <= (hoverRating || rating) ? "#daa520" : "#d1d5db"}
            style={{ cursor: "pointer", marginRight: "4px" }}
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          />
        ))}
      </div>
    );
  };

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (reviewForm.rating === 0) {
      Toast.fire({
        icon: "warning",
        title: "Please select a rating",
      });
      return;
    }

    reviewSubmitMutation.mutate({
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    });
  };

  // Handle opening review modal
  const handleOpenReviewModal = () => {
    if (userReviewStatus?.hasReviewed && userReviewStatus.existingReview) {
      setReviewForm({
        rating: userReviewStatus.existingReview.rating,
        comment: userReviewStatus.existingReview.comment || "",
      });
    } else {
      setReviewForm({
        rating: 0,
        comment: "",
      });
    }
    setShowReviewModal(true);
  };

  // Handle closing review modal
  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setReviewForm({
      rating: 0,
      comment: "",
    });
  };

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

    addToCartMutation.mutate({
      quantity,
      selectedSize,
      selectedColor,
    });
  };

  // Set default selections when product loads
  useEffect(() => {
    if (!product) return;

    const isFashionProduct = product.vendor_category === "fashion";

    if (isFashionProduct && product.colors && product.colors.length > 0) {
      // Find first color with quantity > 0
      const availableColor = product.colors.find((color) => color.quantity > 0);
      if (availableColor) {
        setSelectedColor(availableColor.color);
      }
    }

    if (isFashionProduct && product.sizes && product.sizes.length > 0) {
      // Find first size with quantity > 0
      const availableSize = product.sizes.find((size) => size.quantity > 0);
      if (availableSize) {
        setSelectedSize(availableSize.size);
      }
    }
  }, [product]);

  // Loading state
  if (productLoading || reviewsLoading || userReviewStatusLoading) {
    return (
      <div style={{ marginTop: "10rem" }}>
        <Spinner />
      </div>
    );
  }

  // Error state
  if (productError) {
    return (
      <div className={styles.errorContainer}>
        <p>Error loading product details. Please try again.</p>
      </div>
    );
  }

  // No product found
  if (!product) {
    return (
      <div className={styles.errorContainer}>
        <p>Product not found.</p>
      </div>
    );
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

  // Get reviews data with fallbacks
  const reviews = reviewsData?.reviews || [];
  const reviewStats = reviewsData?.stats || {
    total_reviews: 0,
    average_rating: 0,
    rating_breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  // Display limited reviews
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const formatPrice = (price) => {
    return Number(price).toLocaleString("en-NG");
  };

  return (
    <div className={styles.productDetails}>
      <SEO
        title={
          product
            ? `${product.name} - StuMart | ${product.vendor_name}`
            : "Product Details - StuMart"
        }
        description={
          product
            ? `Buy ${product.name} from ${
                product.vendor_name
              } on StuMart campus marketplace. ${product.description?.substring(
                0,
                120
              )}${
                product.description?.length > 120 ? "..." : ""
              } Price: ₦${Number(
                product.promotion_price || product.price
              ).toLocaleString()}`
            : "View product details on StuMart campus marketplace. Buy from verified student vendors with secure delivery across Nigerian universities."
        }
        keywords={
          product
            ? `${product.name}, ${product.vendor_name}, stumart product, campus marketplace, student shopping, university product, ${product.vendor_category}, buy ${product.name}, student vendor, campus delivery, university shopping nigeria, student marketplace product, campus e-commerce`
            : "stumart product details, campus marketplace product, student shopping, university product, campus delivery, student vendor, university marketplace"
        }
        url={`/products/${productId}`}
      />
      <Header title="Product Details" />
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
            <div className={styles.priceSection}>
              {product.promotion_price &&
              product.promotion_price > 0 &&
              product.promotion_price < product.price ? (
                <>
                  <span className={styles.promotionPrice}>
                    ₦{Number(product.promotion_price).toLocaleString()}
                  </span>
                  <span className={styles.originalPrice}>
                    ₦{Number(product.price).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className={styles.price}>
                  ₦{Number(product.price).toLocaleString()}
                </span>
              )}
            </div>
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
                disabled={
                  (isFashionProduct && isOutOfStock) ||
                  addToCartMutation.isPending
                }
                onClick={handleAddToCart}
              >
                {addToCartMutation.isPending
                  ? "Adding..."
                  : isFashionProduct && isOutOfStock
                  ? "Out of Stock"
                  : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className={styles.reviewsSection}>
          <div className={styles.reviewsHeader}>
            <div className={styles.reviewsHeaderTop}>
              <h2>Customer Reviews</h2>

              {/* User Review Action Buttons */}
              {!userReviewStatusLoading && userReviewStatus?.hasBought && (
                <div className={styles.userReviewActions}>
                  {userReviewStatus.hasReviewed ? (
                    <button
                      className={styles.editReviewButton}
                      onClick={handleOpenReviewModal}
                    >
                      Edit Your Review
                    </button>
                  ) : (
                    <button
                      className={styles.addReviewButton}
                      onClick={handleOpenReviewModal}
                    >
                      Write a Review
                    </button>
                  )}
                </div>
              )}
            </div>

            {reviewStats.total_reviews > 0 && (
              <div className={styles.reviewsSummary}>
                <div className={styles.averageRating}>
                  <StarRating rating={reviewStats.average_rating} size={20} />
                  <span className={styles.ratingNumber}>
                    {reviewStats.average_rating} out of 5
                  </span>
                  <span className={styles.totalReviews}>
                    ({reviewStats.total_reviews} review
                    {reviewStats.total_reviews !== 1 ? "s" : ""})
                  </span>
                </div>

                <div className={styles.ratingBreakdown}>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className={styles.ratingBar}>
                      <span className={styles.ratingLabel}>{rating} star</span>
                      <div className={styles.barContainer}>
                        <div
                          className={styles.barFill}
                          style={{
                            width:
                              reviewStats.total_reviews > 0
                                ? `${
                                    (reviewStats.rating_breakdown[rating] /
                                      reviewStats.total_reviews) *
                                    100
                                  }%`
                                : "0%",
                          }}
                        ></div>
                      </div>
                      <span className={styles.ratingCount}>
                        {reviewStats.rating_breakdown[rating]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.reviewsList}>
            {reviews.length === 0 ? (
              <div className={styles.noReviews}>
                <p>No reviews yet for this vendor's products.</p>
                <p>Be the first to leave a review after your purchase!</p>
              </div>
            ) : (
              <>
                {displayedReviews.map((review) => (
                  <div key={review.id} className={styles.reviewItem}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewerInfo}>
                        <span className={styles.reviewerName}>
                          {review.reviewer_name}
                        </span>
                        <span className={styles.reviewDate}>
                          {review.created_at}
                        </span>
                      </div>
                      <StarRating rating={review.rating} size={16} />
                    </div>
                    {review.comment && (
                      <p className={styles.reviewComment}>{review.comment}</p>
                    )}
                  </div>
                ))}

                {reviews.length > 3 && (
                  <button
                    className={styles.showMoreButton}
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews
                      ? "Show Less Reviews"
                      : `Show All ${reviews.length} Reviews`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>
                {userReviewStatus?.hasReviewed
                  ? "Edit Your Review"
                  : "Write a Review"}
              </h3>
              <button
                className={styles.modalClose}
                onClick={handleCloseReviewModal}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className={styles.reviewForm}>
              <div className={styles.formGroup}>
                <label>Rating *</label>
                <InteractiveStarRating
                  rating={reviewForm.rating}
                  onRatingChange={(rating) =>
                    setReviewForm((prev) => ({ ...prev, rating }))
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Comment (Optional)</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  placeholder="Share your experience with this product..."
                  rows={4}
                  className={styles.reviewTextarea}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCloseReviewModal}
                  disabled={reviewSubmitMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={
                    reviewSubmitMutation.isPending || reviewForm.rating === 0
                  }
                >
                  {reviewSubmitMutation.isPending
                    ? "Submitting..."
                    : userReviewStatus?.hasReviewed
                    ? "Update Review"
                    : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
