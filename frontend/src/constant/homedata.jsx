import {
  FaBook,
  FaUtensils,
  FaLaptop,
  FaTshirt,
  FaDesktop,
  FaHome,
  FaPlane,
  FaTablet,
  FaSearch,
  FaStore,
} from "react-icons/fa";
import ourwife from "../assets/our-wife.jpg";
import abu from "../assets/abu.jpg";
import james from "../assets/james.jpg";

export const SHOPS_PER_PAGE = 12;

export const categories = [
  { id: 0, name: "All", icon: <FaStore /> },
  { id: 1, name: "Books", icon: <FaBook /> },
  { id: 2, name: "Food", icon: <FaUtensils /> },
  { id: 3, name: "Technology", icon: <FaLaptop /> },
  { id: 4, name: "Fashion", icon: <FaTshirt /> },
  { id: 5, name: "Accessories", icon: <FaDesktop /> },
  { id: 6, name: "Home", icon: <FaHome /> },
  { id: 7, name: "Electronics", icon: <FaTablet /> },
  { id: 8, name: "Other", icon: <FaSearch /> },
];

export const promotions = [
  {
    id: 1,
    title: "Back to School Sale!",
    description: "Get 20% off on all stationery items",
    link: "/products",
    gradient: "primary",
    image: ourwife,
  },
  {
    id: 2,
    title: "Food Festival Week",
    description: "Amazing deals on campus restaurants",
    link: "/products",
    gradient: "secondary",
    image: abu,
  },
  {
    id: 3,
    title: "Tech Gadget Fair",
    description: "Latest gadgets at student-friendly prices",
    link: "/products",
    gradient: "tertiary",
    image: james,
  },
];
