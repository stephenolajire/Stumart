import { useState, useEffect } from "react";
import {
  ChevronRight,
  ShoppingBag,
  MessageSquare,
  Ticket,
  Heart,
  Smartphone,
  Zap,
  Monitor,
  ShoppingCart,
  Flower2,
  Home,
  Power,
  Laptop,
  Shirt,
  Book,
  Bike,
  Phone,
  Settings, // Replaced TbIroning
} from "lucide-react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

const SidebarNavigation = ({ close, openMenu }) => {
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      easing: "ease-in-out",
      offset: 100,
    });
  }, []);

  const helpItems = [{ id: "help", label: "NEED HELP?", hasChevron: true }];

  const accountItems = [
    { id: "account", label: "STUMART ACCOUNT", hasChevron: true },
  ];

  const userMenuItems = [
    { id: "about", label: "About", icon: ShoppingBag, href: "/about" },
    { id: "rider", label: "Rider", icon: Bike, href: "/rider" },
    { id: "vendor", label: "Vendor", icon: ShoppingCart, href: "/vendors" },
    { id: "contact", label: "Contact", icon: Phone, href: "/contact" },
  ];

  const categories = [
    { id: "food", label: "Food", icon: Heart },
    { id: "fashion", label: "Fashion", icon: Shirt },
    { id: "technology", label: "Technology", icon: Monitor },
    { id: "accessories", label: "Accessories", icon: Settings },
    { id: "home", label: "Home", icon: Home },
    { id: "books", label: "Books", icon: Book },
    { id: "electronics", label: "Electronics", icon: Zap },
  ];

  const handleItemClick = (itemId) => {
    setActiveItem(activeItem === itemId ? null : itemId);
  };

  const NavItem = ({
    item,
    hasChevron = false,
    isCategory = false,
    isHeader = false,
    onClick,
  }) => {
    const isActive = activeItem === item.id;

    return (
      <div
        onClick={() => {
          handleItemClick(item.id);
          if (onClick) onClick(item);
        }}
        className={`
          flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200
          ${
            isActive
              ? "bg-amber-50 border-r-4 border-amber-500"
              : "hover:bg-gray-50"
          }
          ${isHeader ? "border-b border-gray-200" : ""}
        `}
      >
        <div className="flex items-center gap-3">
          {item.icon && (
            <item.icon
              className={`w-5 h-5 ${
                isActive ? "text-amber-500" : "text-gray-600"
              }`}
            />
          )}
          <span
            className={`text-sm ${
              isHeader
                ? "font-semibold text-gray-800 uppercase text-xs tracking-wide"
                : isActive
                ? "text-amber-600 font-medium"
                : "text-gray-700"
            }`}
          >
            {item.label}
          </span>
        </div>

        {hasChevron && (
          <ChevronRight
            className={`w-4 h-4 transition-colors ${
              isActive ? "text-amber-500" : "text-gray-400"
            }`}
          />
        )}
      </div>
    );
  };

  return (
    <div
      className="w-80 absolute top-16 z-50 right-0 bg-white shadow-lg border-r border-gray-200 h-screen overflow-y-auto"
      data-aos={openMenu ? "fade-in" : "fade-out"}
      data-aos-delay="600"
    >
      {/* Help Section */}
      <div className="border-b border-gray-100">
        {helpItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            hasChevron={item.hasChevron}
            isHeader={true}
          />
        ))}
      </div>

      {/* Account Section */}
      <div className="border-b border-gray-100">
        {accountItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            hasChevron={item.hasChevron}
            isHeader={true}
          />
        ))}
      </div>

      {/* User Menu Items */}
      <div className="border-b border-gray-100 py-2">
        {userMenuItems.map((item) => (
          <Link to={item.href} key={item.id}>
            <NavItem
              key={item.id}
              item={item}
              onClick={() => {
                close();
              }}
            />
          </Link>
        ))}
      </div>

      {/* Categories Section */}
      <div className="py-2">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
            OUR CATEGORIES
          </h3>
          {/* Replace Link with button for compatibility */}
          <Link to="/products">
            <button onClick={()=>{close()}} className="text-xs text-amber-500 hover:text-amber-600 font-medium transition-colors">
              See All
            </button>
          </Link>
        </div>

        {categories.map((item) => (
          <Link key={item.id} to={`/category/?category=${item.label}`}>
            <NavItem
              key={item.id}
              item={item}
              isCategory={true}
              onClick={() => close()}
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SidebarNavigation;
