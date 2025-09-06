import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlobalContext } from "../constant/GlobalContext";
import api from "../constant/api";
import Swal from "sweetalert2";
import {
  FaArrowLeft,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
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
  const { useCartMutations, isAuthenticated } = useContext(GlobalContext);
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
      enabled: !!productId && isAuthenticated, // Only run if authenticated
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
      stars.push(
        <FaStar key={`full-${i}`} className="text-amber-500" size={size} />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt key="half" className="text-amber-500" size={size} />
      );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaRegStar key={`empty-${i}`} className="text-gray-300" size={size} />
      );
    }

    return <div className="flex items-center gap-1">{stars}</div>;
  };

  // Interactive Star Rating Component for modal
  const InteractiveStarRating = ({ rating, onRatingChange, size = 20 }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            size={size}
            className={`cursor-pointer transition-colors duration-200 ${
              star <= (hoverRating || rating)
                ? "text-amber-500"
                : "text-gray-300"
            }`}
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
      <div className="flex justify-center items-center min-h-screen pt-40">
        <Spinner />
      </div>
    );
  }

  // Error state
  if (productError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8">
          <p className="text-red-600 text-lg">
            Error loading product details. Please try again.
          </p>
        </div>
      </div>
    );
  }

  // No product found
  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8">
          <p className="text-gray-600 text-lg">Product not found.</p>
        </div>
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
    <div className="min-h-screen bg-gray-50 mt-31 lg:mt-0">
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

      <div className="max-w-7xl mx-auto px-4 pb-6 -mt-7">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image Section */}
          <div className="space-y-4">
            {/* Main Image Carousel */}
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="aspect-square">
                <img
                  src={getCurrentImageUrl()}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {hasCarousel && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all duration-200 hover:scale-105"
                  >
                    <FaChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all duration-200 hover:scale-105"
                  >
                    <FaChevronRight size={20} />
                  </button>

                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {[
                      product.image_url,
                      ...(product.additional_images || []).map(
                        (img) => img.url
                      ),
                    ].map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          currentImageIndex === index
                            ? "bg-amber-500"
                            : "bg-white/60"
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {hasCarousel && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    currentImageIndex === 0
                      ? "border-amber-500"
                      : "border-gray-200"
                  }`}
                  onClick={() => setCurrentImageIndex(0)}
                >
                  <img
                    src={product.image_url}
                    alt={`${product.name} - main`}
                    className="w-full h-full object-cover"
                  />
                </button>

                {product.additional_images?.map((img, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      currentImageIndex === index + 1
                        ? "border-amber-500"
                        : "border-gray-200"
                    }`}
                    onClick={() => setCurrentImageIndex(index + 1)}
                  >
                    <img
                      src={img.image_url}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4 uppercase">
                {product.name}
              </h1>

              {/* Price Section */}
              <div className="flex items-center gap-3 mb-4">
                {product.promotion_price &&
                product.promotion_price > 0 &&
                product.promotion_price < product.price ? (
                  <>
                    <span className="text-3xl font-bold text-amber-600">
                      ₦{Number(product.promotion_price).toLocaleString()}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      ₦{Number(product.price).toLocaleString()}
                    </span>
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm font-medium">
                      {Math.round(
                        ((product.price - product.promotion_price) /
                          product.price) *
                          100
                      )}
                      % OFF
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-amber-600">
                    ₦{Number(product.price).toLocaleString()}
                  </span>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">
                {product.description}
              </p>
            </div>

            {/* Vendor Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Sold by: {product.vendor_name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex items-center">
                      <FaStar className="text-amber-500" size={16} />
                      <span className="ml-1 text-sm text-gray-600">
                        {product.vendor_rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Info for Fashion Products */}
            {isFashionProduct && (
              <div className="bg-blue-50 rounded-xl p-4">
                {product.in_stock > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">
                      In Stock: {product.in_stock}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-red-600">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Colors Section */}
            {isFashionProduct &&
              product.colors &&
              product.colors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Colors:</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.colors
                      .filter((color) => color.quantity > 0)
                      .map((color) => (
                        <button
                          key={color.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                            selectedColor === color.color
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-amber-300"
                          }`}
                          onClick={() => setSelectedColor(color.color)}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.color }}
                          ></span>
                          <span className="text-sm">
                            {color.color} ({color.quantity})
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

            {/* Sizes Section */}
            {isFashionProduct && product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sizes:</h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes
                    .filter((size) => size.quantity > 0)
                    .map((size) => (
                      <button
                        key={size.id}
                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium ${
                          selectedSize === size.size
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-gray-200 hover:border-amber-300 text-gray-700"
                        }`}
                        onClick={() => setSelectedSize(size.size)}
                      >
                        {size.size} ({size.quantity})
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Add to Cart Section */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={
                      quantity === 1 || (isFashionProduct && isOutOfStock)
                    }
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-medium text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={
                      (isFashionProduct && isOutOfStock) ||
                      (isFashionProduct && quantity >= product.in_stock)
                    }
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>

                <button
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                    isFashionProduct && isOutOfStock
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-amber-500 hover:bg-amber-600 hover:shadow-lg transform hover:scale-[1.02]"
                  } disabled:opacity-50`}
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
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
              Customer Reviews
            </h2>

            {/* User Review Actions */}
            {!userReviewStatusLoading && userReviewStatus?.hasBought && (
              <div>
                {userReviewStatus.hasReviewed ? (
                  <button
                    className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-medium hover:bg-amber-200 transition-colors duration-200"
                    onClick={handleOpenReviewModal}
                  >
                    Edit Your Review
                  </button>
                ) : (
                  <button
                    className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors duration-200"
                    onClick={handleOpenReviewModal}
                  >
                    Write a Review
                  </button>
                )}
              </div>
            )}
          </div>

          {reviewStats.total_reviews > 0 && (
            <div className="border-b pb-6 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-amber-600">
                    {reviewStats.average_rating.toFixed(1)}
                  </div>
                  <div>
                    <StarRating rating={reviewStats.average_rating} size={20} />
                    <p className="text-sm text-gray-600 mt-1">
                      ({reviewStats.total_reviews} review
                      {reviewStats.total_reviews !== 1 ? "s" : ""})
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div
                      key={rating}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="w-12 text-gray-600">{rating} star</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
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
                      <span className="w-8 text-gray-600 text-right">
                        {reviewStats.rating_breakdown[rating]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div>
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FaStar className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-600 mb-2">
                  No reviews yet for this vendor's products.
                </p>
                <p className="text-gray-500 text-sm">
                  Be the first to leave a review after your purchase!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {displayedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-100 last:border-0 pb-6 last:pb-0"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {review.reviewer_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {review.created_at}
                        </p>
                      </div>
                      <StarRating rating={review.rating} size={16} />
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}

                {reviews.length > 3 && (
                  <button
                    className="w-full py-3 text-amber-600 font-medium hover:bg-amber-50 rounded-lg transition-colors duration-200 border border-amber-200"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews
                      ? "Show Less Reviews"
                      : `Show All ${reviews.length} Reviews`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {userReviewStatus?.hasReviewed
                  ? "Edit Your Review"
                  : "Write a Review"}
              </h3>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                onClick={handleCloseReviewModal}
              >
                <FaTimes className="text-gray-500" size={20} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Rating *
                </label>
                <InteractiveStarRating
                  rating={reviewForm.rating}
                  onRatingChange={(rating) =>
                    setReviewForm((prev) => ({ ...prev, rating }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Comment (Optional)
                </label>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                  onClick={handleCloseReviewModal}
                  disabled={reviewSubmitMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
