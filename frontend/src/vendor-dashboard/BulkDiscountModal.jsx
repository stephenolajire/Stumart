import React, { useState } from 'react';
import styles from './css/BulkDiscountModal.module.css';

const BulkDiscountModal = ({ isOpen, onClose, onApplyDiscount }) => {
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!discountValue || isNaN(discountValue) || discountValue <= 0) {
      setError('Please enter a valid discount value');
      return;
    }

    if (discountType === 'percentage' && discountValue > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }

    try {
      await onApplyDiscount({
        type: discountType,
        value: parseFloat(discountValue)
      });
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to apply discount');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Apply Bulk Discount</h2>
        <p className={styles.description}>
          This will apply the discount to all your products
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Discount Type</label>
            <div className={styles.radioGroup}>
              <label>
                <input
                  type="radio"
                  value="percentage"
                  checked={discountType === 'percentage'}
                  onChange={(e) => setDiscountType(e.target.value)}
                />
                Percentage (%)
              </label>
              <label>
                <input
                  type="radio"
                  value="fixed"
                  checked={discountType === 'fixed'}
                  onChange={(e) => setDiscountType(e.target.value)}
                />
                Fixed Amount (₦)
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>
              {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              min="0"
              max={discountType === 'percentage' ? "100" : undefined}
              step="0.01"
              className={styles.input}
              placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Apply Discount
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkDiscountModal;