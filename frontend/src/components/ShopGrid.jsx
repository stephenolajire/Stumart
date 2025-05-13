import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "../css/ShopGrid.module.css";
import { MEDIA_BASE_URL } from "../constant/api";
import { FaStore, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const ShopGrid = ({ shops }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const shopsPerPage = 20;

  // Calculate pagination
  const indexOfLastShop = currentPage * shopsPerPage;
  const indexOfFirstShop = indexOfLastShop - shopsPerPage;
  const currentShops = shops?.slice(indexOfFirstShop, indexOfLastShop);
  const totalPages = Math.ceil((shops?.length || 0) / shopsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className={styles.shopGrid}>
        {shops && shops.length > 0 ? (
          currentShops.map((shop) =>
            shop.business_category !== "others" ? (
              <div key={shop.id}>
                <Link to={`/shop/${shop.id}`} className={styles.shopCard}>
                  <div className={styles.imageWrapper}>
                    <img
                      src={`${MEDIA_BASE_URL}${shop.shop_image}`}
                      alt={shop.business_name}
                    />
                  </div>
                  <div className={styles.shopInfo}>
                    <h3>{shop.business_name}</h3>
                    <p className={styles.category}>{shop.business_category}</p>
                    <p className={styles.category}>{shop.user.state}</p>
                    <p className={styles.category}>{shop.user.institution}</p>
                    <div className={styles.rating}>⭐ {shop.rating}</div>
                    <p className={styles.delivery}>🕒 15mins - 30mins</p>
                  </div>
                </Link>
              </div>
            ) : null
          )
        ) : (
          <div className={styles.contNo}>
            <p>No shops available</p>
            <FaStore className={styles.storeIcon} />
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            <FaChevronLeft /> Prev
          </button>

          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`${styles.pageNumber} ${
                    currentPage === number ? styles.activePage : ""
                  }`}
                >
                  {number}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next <FaChevronRight />
          </button>
        </div>
      )}
    </>
  );
};

export default ShopGrid;
