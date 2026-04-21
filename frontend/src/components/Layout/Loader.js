import React from 'react';
import styles from './Loader.module.css';

export default function Loader({ fullscreen, size = 'md' }) {
  if (fullscreen) {
    return (
      <div className={styles.fullscreen}>
        <div className={styles.logoLoader}>
          <span className="gradient-text">JIOREELS</span>
          <div className={styles.bar}>
            <div className={styles.barFill} />
          </div>
        </div>
      </div>
    );
  }
  return <div className={`${styles.spinner} ${styles[size]}`} />;
}
