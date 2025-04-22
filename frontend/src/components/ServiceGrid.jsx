import React from "react";
import ServiceCard from "./ServiceCard";
import styles from "../css/OtherService.module.css";

const ServiceGrid = ({ services }) => {
  return (
    <div className={styles.serviceCardGrid}>
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
};

export default ServiceGrid;
