import { useState, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  FaBuilding,
  FaStar,
  FaArrowLeft,
  FaExclamationTriangle,
} from "react-icons/fa";
import Spinner from "../components/Spinner";
import Card from "./components/Card";
import Pagination from "./components/Pagination";
import PriceFilter from "./components/PriceFilter";
import { useGetShopProducts } from "../hooks/useStumart";

const ShopDetails = () => {
  const { shopId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });

  const page = Number(searchParams.get("page")) || 1;

  const {
    data: productsData,
    isLoading,
    isError,
    error,
  } = useGetShopProducts(shopId, page);
  console.log("ShopDetails - productsData:", productsData);

  const products = productsData?.products || [];
  const details = productsData?.details || {};
  const pagination = productsData?.pagination || {};

  const { minPrice, maxPrice } = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0)
      return { minPrice: 0, maxPrice: 0 };
    const prices = products.map((p) => {
      const price = parseFloat(p.price);
      const promo = parseFloat(p.promotion_price);
      return promo > 0 && promo < price ? promo : price;
    });
    return {
      minPrice: Math.floor(Math.min(...prices)),
      maxPrice: Math.ceil(Math.max(...prices)),
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((p) => {
      const price = parseFloat(p.price);
      const promo = parseFloat(p.promotion_price);
      const effectivePrice = promo > 0 && promo < price ? promo : price;
      return (
        effectivePrice >= priceRange.min && effectivePrice <= priceRange.max
      );
    });
  }, [products, priceRange]);

  const handlePriceChange = (newRange) => {
    setPriceRange(newRange);
    setSearchParams({ page: 1 });
  };

  const handlePriceReset = (newRange) => {
    setPriceRange(newRange);
  };

  // ── Loading ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-background pt-28">
        <Spinner />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center p-4 bg-background pt-28">
        <div className="w-full max-w-4xl bg-surface rounded-2xl border border-border shadow-md p-10 text-center">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <FaExclamationTriangle className="w-7 h-7 text-error" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Failed to load shop
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            {error?.message || "Something went wrong. Please try again."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-text-primary hover:bg-text-secondary text-text-inverse font-semibold px-6 py-3 rounded-xl transition-[background] duration-[--transition-base]"
          >
            <FaArrowLeft className="text-sm" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="w-full min-h-screen bg-background pt-20">
        <div className="w-full min-h-[60vh] flex flex-col justify-center items-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-md p-14 text-center max-w-md">
            <div className="text-6xl mb-5">🛍️</div>
            <h2 className="text-xl font-bold text-text-primary mb-3">
              No Products Yet
            </h2>
            <p className="text-text-secondary text-sm mb-8">
              This shop hasn't listed any products. Check back soon!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-text-primary hover:bg-text-secondary text-text-inverse font-semibold px-6 py-3 rounded-xl transition-[background] duration-[--transition-base]"
            >
              <FaArrowLeft className="text-sm" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main ──────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-background-secondary pb-16">
      <div className="w-full mx-auto">
        {/* ── Shop Hero Banner ───────────────────────────── */}
        <div className="bg-text-primary mt-38 lg:mt-0 px-6 sm:px-10 py-10 mb-8">
          {/* Category badge */}
          <div className="mb-4">
            <span className="inline-block bg-primary text-text-primary text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-lg">
              {details?.business_category}
            </span>
          </div>

          {/* Shop name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-text-inverse mb-3 leading-tight">
            {details?.business_name}
          </h1>

          {/* Description */}
          <p className="text-sm text-text-inverse/70 mb-7 leading-relaxed">
            {details?.business_description?.trim()
              ? details.business_description
              : `Discover quality products at ${details?.business_name}, your trusted destination for ${details?.business_category}.`}
          </p>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 py-2 px-4 rounded-xl">
              <FaBuilding className="text-primary text-sm" />
              <span className="text-sm font-medium text-text-inverse">
                {details?.business_name}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 py-2 px-4 rounded-xl">
              <FaStar className="text-primary text-sm" />
              <span className="text-sm font-medium text-text-inverse">
                {details?.rating || "New"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Products Section ───────────────────────────── */}
        <div className="px-4 sm:px-8">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                Available Products
              </h2>
              <div className="w-14 h-1 bg-primary rounded-full" />
            </div>
            {pagination?.total_products > 0 && (
              <span className="text-sm text-text-tertiary">
                {filteredProducts.length} of {pagination.total_products} product
                {pagination.total_products !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Price filter */}
          {minPrice < maxPrice && (
            <div className="mb-6">
              <PriceFilter
                minPrice={minPrice}
                maxPrice={maxPrice}
                onChange={handlePriceChange}
                onReset={handlePriceReset}
              />
            </div>
          )}

          {/* Grid or empty-filter state */}
          {filteredProducts.length > 0 ? (
            <Card products={filteredProducts} />
          ) : (
            <div className="max-w-sm mx-auto bg-surface rounded-2xl border border-border shadow-sm p-10 text-center mt-10">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-base font-bold text-text-primary mb-2">
                No products in this range
              </h3>
              <p className="text-text-secondary text-sm">
                Adjust the price filter to see more products.
              </p>
            </div>
          )}
        </div>

        {/* ── Pagination ─────────────────────────────────── */}
        {pagination?.total_pages > 1 && (
          <div className="mt-10 px-4 sm:px-8">
            <Pagination
              currentPage={page}
              totalPages={pagination.total_pages}
              onPageChange={(newPage) => {
                setSearchParams({ page: newPage });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetails;
