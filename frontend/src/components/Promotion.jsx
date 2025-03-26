import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from "../css/Promotion.module.css";

// Updated promotion data with real video URLs from Pexels
const promotions = [
  {
    id: 1,
    title: "Back to School Sale",
    video: "https://res.cloudinary.com/demo/video/upload/v1452716716/fashion_show.mp4",
    thumbnail: "https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg",
    description: "Get 20% off on all stationery items",
    content: "Get 20% off on all stationery items, including textbooks, notebooks, and writing materials. Limited time offer!",
    details: {
      discount: "20%",
      validPeriod: "August 15 - September 15",
      categories: [
        "Textbooks",
        "Notebooks",
        "Writing Supplies",
        "Backpacks",
        "Study Accessories"
      ],
      terms: [
        "Discount applies to selected items",
        "Cannot be combined with other offers",
        "Valid for in-store and online purchases"
      ],
      additionalBenefits: [
        "Free campus delivery",
        "Extended return policy",
        "Student ID required"
      ]
    }
  },
  {
    id: 2,
    title: "Food Festival Week",
    video: "https://res.cloudinary.com/demo/video/upload/v1452716767/sea-turtle.mp4",
    thumbnail: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
    description: "Amazing deals on campus restaurants",
    content: "A week-long culinary celebration featuring discounts, special menus, and food challenges across campus dining venues!",
    details: {
      discount: "Up to 50%",
      validPeriod: "September 20 - September 27",
      participatingVenues: [
        "Campus Bites",
        "Healthy Eats Cafe",
        "Quick Snack Corner",
        "International Cuisine Hub"
      ],
      events: [
        "Daily lunch specials",
        "Food truck rally",
        "Cooking demonstrations",
        "Multicultural food tasting"
      ],
      specialOffers: [
        "Buy one, get one 50% off",
        "Free dessert with main course",
        "Student meal combo deals"
      ],
      terms: [
        "Valid with student ID",
        "Limited time offers",
        "Participating restaurants only"
      ]
    }
  },
  {
    id: 3,
    title: "Tech Gadget Fair",
    video: "https://res.cloudinary.com/demo/video/upload/v1452716847/snow-work.mp4",
    thumbnail: "https://images.pexels.com/photos/1447264/pexels-photo-1447264.jpeg",
    description: "Latest gadgets at student-friendly prices",
    content: "Exclusive tech fair with unbeatable deals on the latest gadgets, laptops, and accessories tailored for students!",
    details: {
      discount: "Up to 35%",
      validPeriod: "October 5 - October 10",
      categories: [
        "Laptops",
        "Smartphones",
        "Tablets",
        "Headphones",
        "Accessories"
      ],
      brands: [
        "Apple",
        "Samsung",
        "Lenovo",
        "Dell",
        "HP",
        "Sony"
      ],
      specialDeals: [
        "Student discounts",
        "Extended warranty",
        "Trade-in programs"
      ],
      financing: [
        "Zero down payment",
        "Interest-free installments",
        "Flexible student payment plans"
      ],
      terms: [
        "Limited stock",
        "Valid with valid student ID",
        "Online and in-store offers"
      ],
      additionalBenefits: [
        "Free tech consultation",
        "On-site repair services",
        "Software bundle included"
      ]
    }
  }
];


const Promotion = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 15000,
    pauseOnHover: true,
    fade: true, // Added fade transition
  };

  return (
    <section className={styles.promotionSection}>
      <div className={styles.header}>
        <h2>Featured Promotions</h2>
        <p>Discover amazing deals and offers from campus vendors</p>
      </div>

      <div className={styles.container}>
        <Slider {...settings}>
          {promotions.map((promo) => (
            <div key={promo.id} className={styles.slideContainer}>
              <div className={styles.videoSection}>
                <video
                  className={styles.video}
                  autoPlay
                  loop
                  playsInline // Added for better mobile support
                  poster={promo.thumbnail}
                >
                  <source src={promo.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className={styles.videoOverlay}>
                  <h3>{promo.title}</h3>
                </div>
              </div>

              <div className={styles.contentSection}>
                <div className={styles.contentHeader}>
                  <h3>{promo.title}</h3>
                  <p className={styles.content}>{promo.content}</p>
                </div>
                <div className={styles.description}>
                  <p>{promo.description}</p>
                  <button className={styles.ctaButton}>Learn More</button>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default Promotion;
