import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, ArrowLeft, ShoppingBag, Store } from "lucide-react";
import Spinner from "../components/Spinner";
import { useBookmarks } from "../hooks/useBookmark";
import { useVendorBookmarks } from "../hooks/useVendorBookmark";
import { MEDIA_BASE_URL } from "../constant/api";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price || 0);

const calculateDiscount = (price, promoPrice) => {
  const p = parseFloat(price);
  const pp = parseFloat(promoPrice);
  if (!pp || pp <= 0 || pp >= p) return null;
  return Math.round(((p - pp) / p) * 100);
};

// ── Single product bookmark card ──────────────────────────────────────────────
const BookmarkCard = ({ bookmark, onRemove, isRemoving }) => {
  const { product } = bookmark;
  const discount = calculateDiscount(product.price, product.promotion_price);
  const effectivePrice =
    product.promotion_price &&
    parseFloat(product.promotion_price) > 0 &&
    parseFloat(product.promotion_price) < parseFloat(product.price)
      ? parseFloat(product.promotion_price)
      : parseFloat(product.price);

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-yellow-200">
      {discount && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {discount}% OFF
          </span>
        </div>
      )}

      <button
        onClick={() => onRemove(bookmark.id)}
        disabled={isRemoving}
        className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-50 hover:scale-110 transition-all duration-300 shadow-md disabled:opacity-50"
        aria-label="Remove bookmark"
      >
        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600 transition-colors" />
      </button>

      <Link to={`/product/${product.id}`} className="block">
        <div className="relative overflow-hidden bg-gray-50 h-44">
          <img
            loading="lazy"
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-yellow-600 transition-colors uppercase">
            {product.name}
          </h3>

          {product.vendor_institution && (
            <p className="text-xs text-gray-500">
              {product.vendor_institution}
            </p>
          )}

          <div className="space-y-0.5">
            <span className="text-base font-bold text-yellow-500">
              {formatPrice(effectivePrice)}
            </span>
            {discount && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(parseFloat(product.price))}
                </span>
                <span className="text-xs text-green-600 font-medium">
                  Save {discount}%
                </span>
              </div>
            )}
          </div>

          {product.vendor_category === "fashion" ? (
            <span
              className={`text-xs font-medium ${product.in_stock > 0 ? "text-green-600" : "text-red-500"}`}
            >
              {product.in_stock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          ) : (
            <span className="text-xs font-medium text-green-600">
              Available
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

// ── Single vendor bookmark card ───────────────────────────────────────────────
const VendorBookmarkCard = ({ bookmark, onRemove, isRemoving }) => {
  const { vendor } = bookmark;

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-yellow-200">
      <button
        onClick={() => onRemove(bookmark.id)}
        disabled={isRemoving}
        className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-50 hover:scale-110 transition-all duration-300 shadow-md disabled:opacity-50"
        aria-label="Remove vendor bookmark"
      >
        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600 transition-colors" />
      </button>

      <Link to={`/shop/${vendor.id}`} className="block">
        <div className="relative overflow-hidden bg-gray-50 h-44">
          <img
            loading="lazy"
            src={
              vendor.shop_image
                ? `${MEDIA_BASE_URL}${vendor.shop_image}`
                : "/placeholder-shop.jpg"
            }
            alt={vendor.business_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.target.src = "/placeholder-shop.jpg";
            }}
          />
          {vendor.is_verified && (
            <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              ✓ Verified
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-yellow-600 transition-colors uppercase">
            {vendor.business_name}
          </h3>

          {vendor.user?.institution && (
            <p className="text-xs text-gray-500">{vendor.user.institution}</p>
          )}

          {vendor.business_description && (
            <p className="text-xs text-gray-400 line-clamp-2">
              {vendor.business_description}
            </p>
          )}

          <div className="flex items-center gap-1">
            <Store className="w-3 h-3 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-600 capitalize">
              {vendor.business_category}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ tab }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="bg-surface rounded-2xl border border-border shadow-md p-14 text-center max-w-4xl w-full">
      {tab === "products" ? (
        <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-5" />
      ) : (
        <Store className="w-16 h-16 text-gray-200 mx-auto mb-5" />
      )}
      <h2 className="text-xl font-bold text-text-primary mb-3">
        No {tab === "products" ? "product" : "vendor"} bookmarks yet
      </h2>
      <p className="text-text-secondary text-sm mb-8">
        {tab === "products"
          ? "Tap the heart on any product to save it here."
          : "Tap the heart on any vendor to save it here."}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-text-primary hover:bg-text-secondary text-text-inverse font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
      >
        <ShoppingBag className="w-4 h-4" />
        Start Shopping
      </Link>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const Bookmark = () => {
  const [activeTab, setActiveTab] = useState("products");

  const {
    bookmarks,
    count,
    isLoading,
    isError,
    error,
    removeBookmark,
    isRemoving,
  } = useBookmarks();

  const {
    bookmarks: vendorBookmarks,
    count: vendorCount,
    isLoading: vendorLoading,
    isError: vendorIsError,
    removeBookmark: removeVendorBookmark,
    isRemoving: isRemovingVendor,
  } = useVendorBookmarks();

  if (isLoading || vendorLoading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-background pt-28">
        <Spinner />
      </div>
    );
  }

  if (isError || vendorIsError) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center p-4 bg-background pt-28">
        <div className="bg-surface rounded-2xl border border-border shadow-md p-10 text-center max-w-4xl">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Failed to load bookmarks
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            {error?.message || "Something went wrong. Please try again."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-text-primary hover:bg-text-secondary text-text-inverse font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background-secondary pb-16 pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            My Bookmarks
          </h1>
          <div className="w-14 h-1 bg-primary rounded-full" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border justify-between">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center  gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px ${
              activeTab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Products
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "products"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary"
              }`}
            >
              {count}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("vendors")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px ${
              activeTab === "vendors"
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <Store className="w-4 h-4" />
            Vendors
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "vendors"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-secondary"
              }`}
            >
              {vendorCount}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "products" &&
          (bookmarks.length === 0 ? (
            <EmptyState tab="products" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {bookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onRemove={removeBookmark}
                  isRemoving={isRemoving}
                />
              ))}
            </div>
          ))}

        {activeTab === "vendors" &&
          (vendorBookmarks.length === 0 ? (
            <EmptyState tab="vendors" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {vendorBookmarks.map((bookmark) => (
                <VendorBookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onRemove={removeVendorBookmark}
                  isRemoving={isRemovingVendor}
                />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};

export default Bookmark;
