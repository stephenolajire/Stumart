import React from "react";
import { FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import styles from "../css/OtherService.module.css";
import { MEDIA_BASE_URL } from "../constant/api";

const ServiceCard = ({ service }) => {
  // Find the category label from the service type
  const getCategoryLabel = (categoryValue) => {
    const categories = [
      { value: "laundry", label: "Laundry Services" },
      { value: "note_writing", label: "Note Writing" },
      { value: "assignment_help", label: "Assignment Help" },
      { value: "barbing", label: "Barbing Services" },
      { value: "hair_styling", label: "Hair Styling" },
      { value: "printing", label: "Printing Services" },
      { value: "computer_repairs", label: "Computer Repairs" },
      { value: "phone_repairs", label: "Phone Repairs" },
      { value: "tutoring", label: "Tutoring" },
      { value: "photography", label: "Photography" },
      { value: "graphic_design", label: "Graphic Design" },
      { value: "tailoring", label: "Tailoring" },
      { value: "cleaning", label: "Cleaning Services" },
      { value: "event_planning", label: "Event Planning" },
    ];

    // console.log(service)

    const category = categories.find((cat) => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  return (
    <div className={styles.serviceCard}>
      <div className={styles.serviceImageContainer}>
        <img
          src={service.shop_image ? `${MEDIA_BASE_URL}${service.shop_image}` : "/default-service.jpg"}
          alt={service.business_name}
          className={styles.serviceImage}
        />
        <div className={styles.serviceImageOverlay}></div>
        <div className={styles.serviceCategory}>
          {getCategoryLabel(service.specific_category)}
        </div>
      </div>

      <div className={styles.serviceDetails}>
        <h3 className={styles.serviceName}>{service.business_name}</h3>
        <p className={styles.providerName}>
          By {service.user.first_name} {service.user.last_name}
        </p>

        <div className={styles.serviceLocation}>
          <FaMapMarkerAlt />
          <span>{service.user.institution}</span>
        </div>

        <div className={styles.serviceRating}>
          <FaStar className={styles.starIcon} />
          <span className={styles.ratingValue}>
            {service.rating > 0 ? service.rating.toFixed(1) : "New"}
          </span>
          {service.total_ratings > 0 && (
            <span>({service.total_ratings} reviews)</span>
          )}
        </div>

        <Link
          to={`/service-application/${service.id}`}
          className={styles.applyButton}
        >
          Apply for Service
        </Link>
      </div>
    </div>
  );
};

export default ServiceCard;
