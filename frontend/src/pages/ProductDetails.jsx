import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  X,
  LogIn,
  UserPlus,
  ShoppingCart as ShoppingCartIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../constant/api";
import Swal from "sweetalert2";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaShoppingCart,
  FaStore,
} from "react-icons/fa";
import Spinner from "../components/Spinner";
import SEO from "../components/Metadata";
import {
  useGetProduct,
  useGetProductReviews,
  useGetUserReviewStatus,
} from "../hooks/useStumart";
import { useCart } from "../hooks/useCart";

// ── Toast ─────────────────────────────────────────────────────────────────────
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

// ── StarRating (display only) ─────────────────────────────────────────────────
const StarRating = ({ rating, size = 16 }) => {
  const full = Math.floor(rating);
  const half = rating % 1 !== 0;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <FaStar key={`f${i}`} size={size} className="text-primary" />
      ))}
      {half && <FaStarHalfAlt size={size} className="text-primary" />}
      {Array.from({ length: empty }).map((_, i) => (
        <FaRegStar key={`e${i}`} size={size} className="text-border-dark" />
      ))}
    </div>
  );
};

// ── InteractiveStarRating ─────────────────────────────────────────────────────
const InteractiveStarRating = ({ rating, onRatingChange, size = 22 }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={size}
          className={`cursor-pointer transition-colors duration-[--transition-fast] ${
            star <= (hover || rating) ? "text-primary" : "text-border-dark"
          }`}
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        />
      ))}
    </div>
  );
};

// ── Guest login prompt modal ──────────────────────────────────────────────────
const LoginPromptModal = ({ onClose }) => {
  const navigate = useNavigate();
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="relative bg-linear-to-br from-gray-900 to-gray-800 px-6 pt-8 pb-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingCartIcon className="w-7 h-7 text-yellow-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Sign in to continue
          </h3>
          <p className="text-gray-400 text-sm">
            Create an account or sign in to add items to your cart.
          </p>
        </div>
        <div className="p-5 space-y-3">
          <button
            onClick={() => {
              onClose();
              navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            onClick={() => {
              onClose();
              navigate("/register");
            }}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create Account
          </button>
          <button
            onClick={onClose}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

// ── ProductDetails ────────────────────────────────────────────────────────────
const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cartCode] = useState(() => {
    const existing = localStorage.getItem("cart_code");
    if (existing) return existing;
    const newCode = "cart_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("cart_code", newCode);
    return newCode;
  });

  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });

  // ── Data fetching ───────────────────────────────────────────────────────────
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useGetProduct(productId);

  const { data: reviewsData, isLoading: reviewsLoading } =
    useGetProductReviews(productId);

  const { data: userReviewStatus, isLoading: userReviewStatusLoading } =
    useGetUserReviewStatus(productId);

  const { addToCart, isAddingToCart, isLoggedIn } = useCart(cartCode);

  // ── Derived values ──────────────────────────────────────────────────────────
  const reviews = reviewsData?.reviews || [];
  const reviewStats = reviewsData?.stats || {
    total_reviews: 0,
    average_rating: 0,
    rating_breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const isFashion = product?.vendor_category === "fashion";
  const isOutOfStock = isFashion && product?.in_stock <= 0;
  const hasCarousel = product?.additional_images?.length > 0;
  const totalImages = 1 + (product?.additional_images?.length || 0);

  useEffect(() => {
    if (!product || !isFashion) return;
    const availColor = product.colors?.find((c) => c.quantity > 0);
    const availSize = product.sizes?.find((s) => s.quantity > 0);
    if (availColor) setSelectedColor(availColor.color);
    if (availSize) setSelectedSize(availSize.size);
  }, [product, isFashion]);

  // ── Review mutation ─────────────────────────────────────────────────────────
  const reviewMutation = useMutation({
    mutationFn: (data) => {
      const isEdit = userReviewStatus?.hasReviewed;
      const url = isEdit
        ? `products/${productId}/reviews/${userReviewStatus.existingReview.id}/`
        : `products/${productId}/reviews/create/`;
      return api[isEdit ? "put" : "post"](url, {
        product_id: productId,
        ...data,
      });
    },
    onSuccess: () => {
      Toast.fire({
        icon: "success",
        title: userReviewStatus?.hasReviewed
          ? "Review updated!"
          : "Review submitted!",
      });
      queryClient.invalidateQueries({
        queryKey: ["reviews-product", productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["reviews-status", productId],
      });
      setShowReviewModal(false);
      setReviewForm({ rating: 0, comment: "" });
    },
    onError: () =>
      Toast.fire({ icon: "error", title: "Failed to submit review." }),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(() => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (isFashion) {
      if (!selectedColor && product.colors?.length > 0)
        return Toast.fire({ icon: "warning", title: "Please select a color" });
      if (!selectedSize && product.sizes?.length > 0)
        return Toast.fire({ icon: "warning", title: "Please select a size" });
    }
    addToCart(product.id, quantity, selectedSize, selectedColor);
    Toast.fire({ icon: "success", title: `${product.name} added to cart` });
  }, [
    isLoggedIn,
    isFashion,
    selectedColor,
    selectedSize,
    product,
    quantity,
    addToCart,
  ]);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewForm.rating)
      return Toast.fire({ icon: "warning", title: "Please select a rating" });
    reviewMutation.mutate(reviewForm);
  };

  const handleOpenReviewModal = () => {
    if (userReviewStatus?.hasReviewed && userReviewStatus.existingReview) {
      setReviewForm({
        rating: userReviewStatus.existingReview.rating,
        comment: userReviewStatus.existingReview.comment || "",
      });
    } else {
      setReviewForm({ rating: 0, comment: "" });
    }
    setShowReviewModal(true);
  };

  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % totalImages);
  const prevImage = () =>
    setCurrentImageIndex((i) => (i - 1 + totalImages) % totalImages);

  const getCurrentImageUrl = () =>
    currentImageIndex === 0
      ? product.image_url
      : (product.additional_images[currentImageIndex - 1]?.image_url ??
        product.image_url);

  // ── States ──────────────────────────────────────────────────────────────────
  if (productLoading || reviewsLoading || userReviewStatusLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Spinner />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background px-4">
        <div className="text-center p-8 bg-surface rounded-2xl border border-border shadow-md w-full max-w-sm">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-text-primary font-semibold mb-1">
            Product not found
          </p>
          <p className="text-text-secondary text-sm">
            {productError?.message || "This product may have been removed."}
          </p>
        </div>
      </div>
    );
  }

  const hasPromo =
    product.promotion_price > 0 && product.promotion_price < product.price;
  const discount = hasPromo
    ? Math.round(
        ((product.price - product.promotion_price) / product.price) * 100,
      )
    : 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background-secondary pt-20 lg:pt-6 pb-8">
      <SEO
        title={`${product.name} - StuMart | ${product.vendor_name}`}
        description={`Buy ${product.name} from ${product.vendor_name} on StuMart. ${product.description?.substring(0, 120) ?? ""} Price: ₦${Number(product.promotion_price || product.price).toLocaleString()}`}
        keywords={`${product.name}, ${product.vendor_name}, stumart, campus marketplace, ${product.vendor_category}`}
        url={`/products/${productId}`}
      />

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* ── Product Grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-6">
          {/* Left — Image carousel */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative bg-surface rounded-xl sm:rounded-2xl shadow-md overflow-hidden border border-border">
              {/* Fixed aspect ratio — prevents overflow on small screens */}
              <div className="aspect-square w-full">
                <img
                  src={getCurrentImageUrl()}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Promo badge */}
              {hasPromo && (
                <div className="absolute top-3 left-3 bg-error text-text-inverse text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                  -{discount}% OFF
                </div>
              )}

              {hasCarousel && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-surface/90 hover:bg-surface text-text-primary p-2 sm:p-2.5 rounded-full shadow-md transition-all hover:scale-110"
                  >
                    <FaChevronLeft size={14} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-surface/90 hover:bg-surface text-text-primary p-2 sm:p-2.5 rounded-full shadow-md transition-all hover:scale-110"
                  >
                    <FaChevronRight size={14} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {Array.from({ length: totalImages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`rounded-full transition-all ${
                          currentImageIndex === i
                            ? "w-4 h-1.5 bg-primary"
                            : "w-1.5 h-1.5 bg-surface/70 hover:bg-surface"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails — horizontal scroll, no overflow */}
            {hasCarousel && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  product.image_url,
                  ...(product.additional_images || []).map((i) => i.image_url),
                ].map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === i
                        ? "border-primary shadow-sm"
                        : "border-border hover:border-border-dark"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`view ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Product info */}
          <div className="bg-surface rounded-xl sm:rounded-2xl shadow-md border border-border p-4 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5">
            {/* Name + price */}
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary uppercase leading-tight mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {hasPromo ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-bold text-primary-dark">
                      ₦{Number(product.promotion_price).toLocaleString()}
                    </span>
                    <span className="text-base sm:text-lg text-text-tertiary line-through">
                      ₦{Number(product.price).toLocaleString()}
                    </span>
                    <span className="bg-error/10 text-error text-xs font-semibold px-2 py-0.5 rounded-full">
                      {discount}% OFF
                    </span>
                  </>
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-primary-dark">
                    ₦{Number(product.price).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-text-secondary text-sm leading-relaxed">
              {product.description}
            </p>

            {/* Vendor chip */}
            <div className="bg-background-secondary rounded-xl p-3 sm:p-4 border border-border flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
                  <FaStore className="text-primary-dark text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-tertiary font-medium">
                    Sold by
                  </p>
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {product.vendor_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <FaStar className="text-primary text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm font-medium text-text-primary">
                  {product.vendor_rating}
                </span>
              </div>
            </div>

            {/* Stock badge (fashion only) */}
            {isFashion && (
              <div
                className={`flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border text-xs sm:text-sm font-medium ${
                  product.in_stock > 0
                    ? "bg-success/8 border-success/25 text-success-dark"
                    : "bg-error/8 border-error/25 text-error-dark"
                }`}
              >
                <div
                  className={`w-2 h-2 shrink-0 rounded-full ${
                    product.in_stock > 0 ? "bg-success" : "bg-error"
                  }`}
                />
                {product.in_stock > 0
                  ? `In Stock — ${product.in_stock} available`
                  : "Out of Stock"}
              </div>
            )}

            {/* Colors */}
            {isFashion &&
              product.colors?.filter((c) => c.quantity > 0).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-2">
                    Color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors
                      .filter((c) => c.quantity > 0)
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedColor(c.color)}
                          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 text-xs sm:text-sm transition-all ${
                            selectedColor === c.color
                              ? "border-primary bg-primary/8 text-text-primary font-medium"
                              : "border-border hover:border-border-dark text-text-secondary"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-border-dark shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.color} ({c.quantity})
                        </button>
                      ))}
                  </div>
                </div>
              )}

            {/* Sizes */}
            {isFashion &&
              product.sizes?.filter((s) => s.quantity > 0).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-2">
                    Size
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes
                      .filter((s) => s.quantity > 0)
                      .map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSize(s.size)}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all ${
                            selectedSize === s.size
                              ? "border-primary bg-primary/8 text-primary-dark"
                              : "border-border hover:border-border-dark text-text-secondary"
                          }`}
                        >
                          {s.size} ({s.quantity})
                        </button>
                      ))}
                  </div>
                </div>
              )}

            {/* Quantity + Add to Cart */}
            <div className="border-t border-border pt-4 sm:pt-5 flex items-center gap-2 sm:gap-3">
              {/* Stepper */}
              <div className="flex items-center bg-background-tertiary rounded-xl border border-border overflow-hidden shrink-0">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity === 1 || isOutOfStock}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 text-text-secondary hover:text-text-primary hover:bg-background-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base sm:text-lg font-medium"
                >
                  −
                </button>
                <span className="px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-text-primary min-w-[2.5rem] text-center text-sm sm:text-base">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={
                    isOutOfStock || (isFashion && quantity >= product.in_stock)
                  }
                  className="px-3 sm:px-4 py-2.5 sm:py-3 text-text-secondary hover:text-text-primary hover:bg-background-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base sm:text-lg font-medium"
                >
                  +
                </button>
              </div>

              {/* CTA — takes remaining width */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                  isOutOfStock
                    ? "bg-background-tertiary text-text-tertiary cursor-not-allowed border border-border"
                    : "bg-primary hover:bg-primary-dark text-text-primary shadow-sm hover:shadow-md active:scale-[0.98]"
                }`}
              >
                <FaShoppingCart size={13} className="shrink-0" />
                <span className="truncate">
                  {isAddingToCart
                    ? "Adding..."
                    : isOutOfStock
                      ? "Out of Stock"
                      : "Add to Cart"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Reviews Section ────────────────────────────────────────── */}
        <div className="bg-surface rounded-xl sm:rounded-2xl shadow-md border border-border p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-5 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary">
              Customer Reviews
            </h2>
            {!userReviewStatusLoading && userReviewStatus?.hasBought && (
              <button
                onClick={handleOpenReviewModal}
                className={`self-start xs:self-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  userReviewStatus.hasReviewed
                    ? "bg-primary/15 text-primary-dark hover:bg-primary/25 border border-primary/30"
                    : "bg-primary hover:bg-primary-dark text-text-primary shadow-sm"
                }`}
              >
                {userReviewStatus.hasReviewed
                  ? "Edit Your Review"
                  : "Write a Review"}
              </button>
            )}
          </div>

          {/* Stats bar */}
          {reviewStats.total_reviews > 0 && (
            <div className="border border-border rounded-xl p-4 sm:p-5 mb-5 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-4xl sm:text-5xl font-bold text-primary-dark leading-none">
                  {reviewStats.average_rating.toFixed(1)}
                </span>
                <div>
                  <StarRating rating={reviewStats.average_rating} size={16} />
                  <p className="text-xs text-text-tertiary mt-1">
                    {reviewStats.total_reviews} review
                    {reviewStats.total_reviews !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                {[5, 4, 3, 2, 1].map((r) => (
                  <div key={r} className="flex items-center gap-2 text-xs">
                    <span className="w-8 sm:w-10 text-text-tertiary text-right shrink-0">
                      {r} ★
                    </span>
                    <div className="flex-1 bg-background-tertiary rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{
                          width:
                            reviewStats.total_reviews > 0
                              ? `${(reviewStats.rating_breakdown[r] / reviewStats.total_reviews) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="w-5 text-text-tertiary shrink-0">
                      {reviewStats.rating_breakdown[r]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="text-center py-10 sm:py-14">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 bg-background-tertiary rounded-full flex items-center justify-center">
                <FaStar className="text-text-tertiary" size={20} />
              </div>
              <p className="text-text-secondary font-medium mb-1">
                No reviews yet
              </p>
              <p className="text-text-tertiary text-sm">
                Be the first to share your experience!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {displayedReviews.map((review) => (
                <div
                  key={review.id}
                  className="py-4 sm:py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary text-sm truncate">
                        {review.reviewer_name}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {review.created_at}
                      </p>
                    </div>
                    <StarRating rating={review.rating} size={13} />
                  </div>
                  {review.comment && (
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}

              {reviews.length > 3 && (
                <div className="pt-4">
                  <button
                    onClick={() => setShowAllReviews((v) => !v)}
                    className="w-full py-2.5 sm:py-3 text-sm font-semibold text-primary-dark border border-primary/30 rounded-xl hover:bg-primary/8 transition-colors"
                  >
                    {showAllReviews
                      ? "Show Less"
                      : `Show All ${reviews.length} Reviews`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Review Modal ──────────────────────────────────────────────── */}
      {showReviewModal && (
        <div
          className="fixed inset-0 bg-text-primary/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={(e) =>
            e.target === e.currentTarget && setShowReviewModal(false)
          }
        >
          {/* On mobile: sheet from bottom. On sm+: centered modal */}
          <div className="bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl border border-border w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              {/* Drag handle on mobile */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-border rounded-full sm:hidden" />
              <h3 className="text-base sm:text-lg font-bold text-text-primary mt-2 sm:mt-0">
                {userReviewStatus?.hasReviewed
                  ? "Edit Review"
                  : "Write a Review"}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 sm:p-2 hover:bg-background-tertiary rounded-full transition-colors text-text-tertiary hover:text-text-primary"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <form
              onSubmit={handleReviewSubmit}
              className="p-4 sm:p-6 space-y-4 sm:space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2 sm:mb-3">
                  Rating <span className="text-error">*</span>
                </label>
                <InteractiveStarRating
                  rating={reviewForm.rating}
                  onRatingChange={(r) =>
                    setReviewForm((p) => ({ ...p, rating: r }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Comment{" "}
                  <span className="text-text-tertiary font-normal">
                    (Optional)
                  </span>
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm((p) => ({ ...p, comment: e.target.value }))
                  }
                  placeholder="Share your experience with this product..."
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-background-secondary border border-border rounded-xl text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2 pb-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  disabled={reviewMutation.isPending}
                  className="flex-1 py-2.5 sm:py-3 text-sm font-semibold text-text-secondary border border-border rounded-xl hover:bg-background-tertiary transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending || !reviewForm.rating}
                  className="flex-1 py-2.5 sm:py-3 text-sm font-semibold bg-primary hover:bg-primary-dark text-text-primary rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {reviewMutation.isPending
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

      {/* ── Login Prompt Modal (guest add-to-cart) ────────────────────── */}
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}
    </div>
  );
};

export default ProductDetails;
