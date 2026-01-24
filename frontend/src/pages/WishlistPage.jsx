import React from "react";
import { useWishlist } from "../context/WishlistContext";
import { Link } from "react-router-dom";

const WishlistPage = () => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();

  if (wishlist.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Your Wishlist is Empty</h2>
        <Link to="/products" className="text-yellow-600 underline">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Wishlist</h2>
        <button
          onClick={clearWishlist}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear Wishlist
        </button>
      </div>
      <ul className="space-y-4">
        {wishlist.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between bg-white p-4 rounded shadow"
          >
            <div className="flex items-center gap-4">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <Link
                  to={`/product/${item.id}`}
                  className="font-semibold text-lg hover:text-yellow-600"
                >
                  {item.name}
                </Link>
                <div className="text-gray-500">₦{item.price}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => removeFromWishlist(item.id)}
                className="text-red-500 hover:underline"
              >
                Remove
              </button>
              <Link
                to="/shopping-cart"
                className="text-green-600 hover:underline"
              >
                Add to Cart
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WishlistPage;
