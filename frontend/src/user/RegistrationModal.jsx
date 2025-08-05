import React from "react";
import styles from '../css/SignUp.module.css'

const CategoryDescriptionModal = ({ category, isOpen, onConfirm, onCancel }) => {
  const categoryDescriptions = {
    Food: {
      title: "Food Category",
      description: "This category includes all food and beverage items such as:",
      items: [
        "Cooked meals and ready-to-eat food",
        "Snacks, pastries, and baked goods",
        "Beverages (soft drinks, juices, water)",
        "Fresh fruits and vegetables",
        "Packaged food items",
        "Traditional and local delicacies",
        "Fast food and restaurant meals"
      ]
    },
    Fashion: {
      title: "Fashion Category", 
      description: "This category is about fashion items where color and sizes are applicable, such as:",
      items: [
        "Clothing (shirts, trousers, dresses, skirts)",
        "Footwear (shoes, sneakers, sandals, boots)",
        "Sportswear and casual wear",
        "Traditional and cultural attire",
        "Undergarments and sleepwear",
        "Seasonal clothing (jackets, coats)",
        "Fashion items with size and color variations"
      ]
    },
    Technology: {
      title: "Technology Category",
      description: "This category covers all technology and electronic devices including:",
      items: [
        "Smartphones and tablets",
        "Laptops and desktop computers",
        "Gaming consoles and accessories",
        "Smart home devices",
        "Audio equipment (speakers, headphones)",
        "Cameras and photography equipment",
        "Software and digital products"
      ]
    },
    Accessories: {
      title: "Accessories Category",
      description: "This category includes accessories and complementary items such as:",
      items: [
        "Phone accessories (cases, screen protectors, chargers)",
        "Audio accessories (earpiece, headset, earbuds)",
        "Jewelry and ornaments (earrings, necklaces, bracelets)",
        "Fashion accessories (belts, watches, bags)",
        "Beauty items (perfume, cosmetics)",
        "Hair accessories and styling tools",
        "Personal accessories that complement your style"
      ]
    },
    Home: {
      title: "Home Category",
      description: "This category covers home and living essentials including:",
      items: [
        "Furniture (chairs, tables, beds, storage)",
        "Home decor and decorative items",
        "Kitchen appliances and utensils",
        "Bedding and linens",
        "Cleaning supplies and tools",
        "Garden and outdoor items",
        "Home improvement and maintenance tools"
      ]
    },
    Books: {
      title: "Books Category",
      description: "This category includes all reading and educational materials such as:",
      items: [
        "Textbooks and academic materials",
        "Novels and fiction books",
        "Educational and reference books",
        "Magazines and periodicals",
        "E-books and digital publications",
        "Children's books and comics",
        "Professional and self-help books"
      ]
    },
    Electronics: {
      title: "Electronics Category",
      description: "This category covers electronic devices and components including:",
      items: [
        "Consumer electronics (TVs, radios, players)",
        "Electronic components and parts",
        "Power banks and charging devices",
        "Electronic tools and gadgets",
        "Home electronics and appliances",
        "Electronic accessories and cables",
        "Repair parts and electronic supplies"
      ]
    },
    Others: {
      title: "Other Services",
      description: "This category includes various services and items not covered by other categories:",
      items: [
        "Personal services (laundry, cleaning)",
        "Educational services (tutoring, note writing)",
        "Beauty services (hair styling, barbing)",
        "Technical services (repairs, printing)",
        "Creative services (photography, graphic design)",
        "Professional services (tailoring, event planning)",
        "Any other products or services you offer"
      ]
    }
  };

  if (!isOpen || !category) return null;

  const categoryInfo = categoryDescriptions[category];

  return (
    <div className={`${styles.modalOverlay}`}>
      <div className={`${styles.modalContent}`}>
        <div className={`${styles.modalHeader}`}>
          <h3>{categoryInfo?.title}</h3>
          <button onClick={onCancel} className={`${styles.closeButton}`}>
            ×
          </button>
        </div>
        
        <div className={`${styles.modalBody}`}>
          <p>{categoryInfo?.description}</p>
          
          <ul className={`${styles.categoryList}`}>
            {categoryInfo?.items.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
        
        <div className={`${styles.modalFooter}`}>
          <button
            onClick={onCancel}
            className={`${styles.cancelButton}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${styles.confirmButton}`}
          >
            OK, Select This Category
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDescriptionModal