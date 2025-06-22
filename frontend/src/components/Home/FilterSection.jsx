import React from "react";
import { FaFilter, FaTimes } from "react-icons/fa";
import styles from "../../css/Home.module.css";

const FilterSection = ({
  title,
  showFilters,
  onToggleFilters,
  filters,
  states,
  availableSchools,
  onStateChange,
  onSchoolChange,
  onSchoolSubmit,
  onResetFilter,
  isAuthenticated,
  institution,
  isLockedToInstitution,
}) => {
  return (
    <section className={styles.filterSection}>
      <div className={styles.filterBar}>
        <div className={styles.filterHeader}>
          <h2>{title}</h2>
          <button onClick={onToggleFilters} className={styles.filterToggle}>
            {showFilters ? <FaTimes /> : <FaFilter />}{" "}
            {showFilters ? "Hide Filter" : "Filter by school"}
          </button>
        </div>

        {showFilters && (
          <div className={styles.advancedFilters}>
            <form className={styles.filterForm} onSubmit={onSchoolSubmit}>
              <div className={styles.filterGrid}>
                <div className={styles.filterGroup}>
                  <label htmlFor="state-select">State:</label>
                  <select
                    id="state-select"
                    value={filters.state}
                    onChange={onStateChange}
                    disabled={
                      isAuthenticated && institution && isLockedToInstitution
                    }
                    className={styles.formSelect}
                  >
                    <option value="">-- Select State --</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label htmlFor="school-select">Institution:</label>
                  <select
                    id="school-select"
                    value={filters.school}
                    onChange={onSchoolChange}
                    disabled={
                      (isAuthenticated &&
                        institution &&
                        isLockedToInstitution) ||
                      !filters.state
                    }
                    className={styles.formSelect}
                  >
                    <option value="">-- Select School --</option>
                    {availableSchools.map((school, index) => (
                      <option key={index} value={school}>
                        {school}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.filterButtons}>
                {filters.school && (
                  <button
                    type="button"
                    onClick={onSchoolSubmit}
                    className={styles.applyButton}
                  >
                    View Shops
                  </button>
                )}

                {(filters.state || filters.school) && (
                  <button
                    type="button"
                    onClick={onResetFilter}
                    className={styles.resetButton}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};

export default FilterSection;
