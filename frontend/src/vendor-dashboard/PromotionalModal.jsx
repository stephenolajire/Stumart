import React, { useState } from 'react';
import styles from './css/PromotionalModal.module.css';

const PromotionModal = ({ isOpen, onClose, product, onUpdatePromotion }) => {
  const [promotionPrice, setPromotionPrice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!promotionPrice || isNaN(promotionPrice)) {
      setError('Please enter a valid price');
      return;
    }

    if (parseFloat(promotionPrice) >= product.price) {
      setError('Promotion price must be less than original price');
      return;
    }

    try {
      await onUpdatePromotion(product.id, promotionPrice);
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to update promotion price');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Add Promotion Price</h2>
        <p>Original Price: ₦{product?.price}</p>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="promotionPrice">Promotion Price (₦)</label>
            <input
              type="number"
              id="promotionPrice"
              value={promotionPrice}
              onChange={(e) => setPromotionPrice(e.target.value)}
              min="0"
              max={product?.price}
              step="0.01"
              className={styles.input}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Save Promotion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromotionModal;