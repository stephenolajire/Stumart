import React from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './css/PickerDetailsModal.module.css';

const PickerDetailsModal = ({ picker, onClose }) => {
  if (!picker) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>

        <div className={styles.pickerProfile}>
          <div className={styles.imageContainer}>
            <img 
              src={picker.profile_picture || '/default-avatar.png'} 
              alt={`${picker.first_name} ${picker.last_name}`}
              className={styles.profileImage}
            />
          </div>

          <div className={styles.pickerInfo}>
            <h3 className={styles.pickerName}>
              {picker.first_name} {picker.last_name}
            </h3>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Email:</label>
                <p>{picker.email}</p>
              </div>
              
              <div className={styles.infoItem}>
                <label>Phone:</label>
                <p>{picker.phone_number}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickerDetailsModal;