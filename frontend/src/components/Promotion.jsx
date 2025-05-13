import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from "../css/Promotion.module.css";
import stumart1 from "../assets/stumart1.jpeg";
import stumart2 from "../assets/stumart2.jpeg"; 
import stumart3 from "../assets/stumart3.jpeg"; 
import stumart4 from "../assets/stumart4.jpeg";
// Updated promotion data with real video URLs from Pexels
const promotions = [
  {
    id: 1,
    title: "Back to School Sale",
    video:
      "https://res.cloudinary.com/demo/video/upload/v1452716716/fashion_show.mp4",
    image: stumart1,
    thumbnail:
      "https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg",
    description: "Get 20% off on all stationery items",
    content:
      "Get 20% off on all stationery items, including textbooks, notebooks, and writing materials. Limited time offer!",
    details: {
      discount: "20%",
      validPeriod: "August 15 - September 15",
      categories: [
        "Textbooks",
        "Notebooks",
        "Writing Supplies",
        "Backpacks",
        "Study Accessories",
      ],

      terms: [
        "Discount applies to selected items",
        "Cannot be combined with other offers",
        "Valid for in-store and online purchases",
      ],
      additionalBenefits: [
        "Free campus delivery",
        "Extended return policy",
        "Student ID required",
      ],
    },
  },
  {
    id: 2,
    title: "Food Festival Week",
    video:
      "https://res.cloudinary.com/demo/video/upload/v1452716767/sea-turtle.mp4",
    image: stumart2,
    thumbnail:
      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
    description: "Amazing deals on campus restaurants",
    content:
      "A week-long culinary celebration featuring discounts, special menus, and food challenges across campus dining venues!",
    details: {
      discount: "Up to 50%",
      validPeriod: "September 20 - September 27",
      participatingVenues: [
        "Campus Bites",
        "Healthy Eats Cafe",
        "Quick Snack Corner",
        "International Cuisine Hub",
      ],
      events: [
        "Daily lunch specials",
        "Food truck rally",
        "Cooking demonstrations",
        "Multicultural food tasting",
      ],
      specialOffers: [
        "Buy one, get one 50% off",
        "Free dessert with main course",
        "Student meal combo deals",
      ],
      terms: [
        "Valid with student ID",
        "Limited time offers",
        "Participating restaurants only",
      ],
    },
  },
  {
    id: 3,
    title: "Tech Gadget Fair",
    video:
      "https://res.cloudinary.com/demo/video/upload/v1452716847/snow-work.mp4",
    image: stumart3,
    thumbnail:
      "https://images.pexels.com/photos/1447264/pexels-photo-1447264.jpeg",
    description: "Latest gadgets at student-friendly prices",
    content:
      "Exclusive tech fair with unbeatable deals on the latest gadgets, laptops, and accessories tailored for students!",
    details: {
      discount: "Up to 35%",
      validPeriod: "October 5 - October 10",
      categories: [
        "Laptops",
        "Smartphones",
        "Tablets",
        "Headphones",
        "Accessories",
      ],
      brands: ["Apple", "Samsung", "Lenovo", "Dell", "HP", "Sony"],
      specialDeals: [
        "Student discounts",
        "Extended warranty",
        "Trade-in programs",
      ],
      financing: [
        "Zero down payment",
        "Interest-free installments",
        "Flexible student payment plans",
      ],
      terms: [
        "Limited stock",
        "Valid with valid student ID",
        "Online and in-store offers",
      ],
      additionalBenefits: [
        "Free tech consultation",
        "On-site repair services",
        "Software bundle included",
      ],
    },
  },
];

const Promotion = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    fade: true,
    cssEase: "cubic-bezier(0.87, 0.03, 0.41, 0.9)",
  };

  return (
    <section className={styles.promotionSection}>
      <div className={styles.container}>
        <Slider {...settings}>
          {promotions.map((promo) => (
            <div key={promo.id} className={styles.slide}>
              <div className={styles.mediaWrapper}>
                {/* <video
                  className={styles.video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={promo.thumbnail}
                >
                  <source src={promo.video} type="video/mp4" />
                </video> */}
                <img className={styles.image} src={promo.image} alt="image" />
                <div className={styles.overlay}></div>
              </div>

              <div className={styles.content}>
                <h2 className={styles.title}>{promo.title}</h2>
                <p className={styles.description}>{promo.description}</p>
                <div className={styles.details}>
                  <div className={styles.offer}>
                    <span className={styles.discount}>
                      {promo.details.discount}
                    </span>
                    <span className={styles.period}>
                      {promo.details.validPeriod}
                    </span>
                  </div>
                  <button className={styles.button}>Learn More</button>
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
