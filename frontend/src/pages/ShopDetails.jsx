import { useContext } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaBuilding,
  FaStar,
  FaArrowLeft,
  FaExclamationTriangle,
} from "react-icons/fa";
import { GlobalContext } from "../constant/GlobalContext";
import Spinner from "../components/Spinner";
import Header from "../components/Header";
import Card from "./components/Card";

const ShopDetails = () => {
  const { shopId } = useParams();
  const { useProducts } = useContext(GlobalContext);

  const { data: productsData, isLoading, isError, error } = useProducts(shopId);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-gray-50 pt-28">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50 pt-28">
        <Header />
        <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error loading shop details
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            {error?.message || "Something went wrong"}
          </p>
          <Link
            to="/shops"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <FaArrowLeft />
            Return to Shops
          </Link>
        </div>
      </div>
    );
  }

  if (!productsData) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-gray-50 pt-28">
        <Header />
      </div>
    );
  }

  const { products, details } = productsData;

  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gray-50 pt-28">
        {/* <Header /> */}
        <div className="w-full min-h-[50vh] flex flex-col justify-center items-center p-4">
          <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-6"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              No Products Available
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              This shop doesn't have any products yet. Check back later!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <FaArrowLeft />
              Return to Shops
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-10">
      <div className="w-full mx-auto">
        {/* Back Button */}
        {/* <Link
          to="/shops"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back to Shops
        </Link> */}

        {/* Shop Header Section */}
        <div className="bg-linear-to-r mt-38 lg:mt-0 from-gray-900 via-gray-800 to-gray-900 p-6 sm:p-8 mb-8 border border-gray-800">
          <div className="mb-4">
            <span className="inline-block bg-yellow-500 text-gray-900 py-1.5 px-4 rounded-lg text-sm font-bold uppercase tracking-wide">
              {details?.business_category}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            {details?.business_name}
          </h1>

          <p className="text-base text-gray-300 mb-6 max-w-3xl">
            {details?.business_description &&
            details.business_description.trim()
              ? details.business_description
              : `Discover quality products at ${details?.business_name}, your trusted destination for ${details?.business_category}.`}
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-gray-800 py-2 px-4 rounded-lg border border-gray-700">
              <FaBuilding className="text-yellow-500 text-sm" />
              <span className="text-sm font-medium text-white">
                {details?.business_name}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-gray-800 py-2 px-4 rounded-lg border border-gray-700">
              <FaStar className="text-yellow-500 text-sm" />
              <span className="text-sm font-medium text-white">
                {details?.rating || "New"}
              </span>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-6 px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Available Products
          </h2>
          <div className="w-20 h-1 bg-gray-900 rounded-full"></div>
        </div>

        <div className="px-6">
          <Card products={products} />
        </div>
      </div>
    </div>
  );
};

export default ShopDetails;
