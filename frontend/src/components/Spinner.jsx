import styles from "../css/Spinner.module.css";

const Spinner = () => {
  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <p className={styles.loadingText}>Loading...</p>
    </div>
  );
};

export default Spinner;
