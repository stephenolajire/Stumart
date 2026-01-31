import { useState, useRef, useCallback, useEffect } from "react";

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price || 0);
};

const PriceFilter = ({ minPrice, maxPrice, onChange, onReset }) => {
  const [minVal, setMinVal] = useState(minPrice);
  const [maxVal, setMaxVal] = useState(maxPrice);
  const minValRef = useRef(minVal);
  const maxValRef = useRef(maxVal);
  const rangeRef = useRef(null);

  // Syncs slider when min/max props change (e.g. new page loads)
  // Uses onReset — does NOT reset the page in the URL
  useEffect(() => {
    setMinVal(minPrice);
    setMaxVal(maxPrice);
    minValRef.current = minPrice;
    maxValRef.current = maxPrice;
    onReset({ min: minPrice, max: maxPrice });
  }, [minPrice, maxPrice]);

  // Update the colored range bar between the two thumbs
  useEffect(() => {
    if (rangeRef.current) {
      const minPercent = ((minVal - minPrice) / (maxPrice - minPrice)) * 100;
      const maxPercent = ((maxVal - minPrice) / (maxPrice - minPrice)) * 100;
      rangeRef.current.style.left = `${minPercent}%`;
      rangeRef.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, maxVal, minPrice, maxPrice]);

  // User drags min thumb — calls onChange which resets page to 1
  const handleMinChange = useCallback(
    (e) => {
      const value = Math.min(Number(e.target.value), maxVal);
      setMinVal(value);
      minValRef.current = value;
      onChange({ min: value, max: maxValRef.current });
    },
    [maxVal, onChange],
  );

  // User drags max thumb — calls onChange which resets page to 1
  const handleMaxChange = useCallback(
    (e) => {
      const value = Math.max(Number(e.target.value), minVal);
      setMaxVal(value);
      maxValRef.current = value;
      onChange({ min: minValRef.current, max: value });
    },
    [minVal, onChange],
  );

  // User clicks "Reset" button — calls onReset, does NOT reset page
  const handleResetClick = () => {
    setMinVal(minPrice);
    setMaxVal(maxPrice);
    minValRef.current = minPrice;
    maxValRef.current = maxPrice;
    onReset({ min: minPrice, max: maxPrice });
  };

  const isFiltered = minVal !== minPrice || maxVal !== maxPrice;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">
          Filter by Price
        </span>
        {isFiltered && (
          <button
            onClick={handleResetClick}
            className="text-xs text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Price Labels */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
          {formatPrice(minVal)}
        </span>
        <span className="text-xs text-gray-400">—</span>
        <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
          {formatPrice(maxVal)}
        </span>
      </div>

      {/* Dual Slider */}
      <div className="relative h-6 flex items-center">
        {/* Background track */}
        <div className="absolute w-full h-1.5 bg-gray-200 rounded-full" />

        {/* Active range (colored portion) */}
        <div
          ref={rangeRef}
          className="absolute h-1.5 bg-yellow-500 rounded-full"
        />

        {/* Min Thumb */}
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={minVal}
          onChange={handleMinChange}
          className="absolute w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: minVal > maxPrice - 100 ? 5 : 3 }}
        />

        {/* Max Thumb */}
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Global thumb styles — injected once */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background-color: #fff;
          border: 2px solid #eab308;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          pointer-events: auto;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }
        input[type="range"]::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background-color: #fff;
          border: 2px solid #eab308;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          pointer-events: auto;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }
      `}</style>
    </div>
  );
};

export default PriceFilter;
