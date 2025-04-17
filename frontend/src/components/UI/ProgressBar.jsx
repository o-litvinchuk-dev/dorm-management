import React from 'react';
import PropTypes from 'prop-types';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ current, max, className }) => {
  const percentage = (current / max) * 100;
  
  return (
    <div className={`${styles.progressContainer} ${className}`}>
      <div 
        className={styles.progressBar}
        style={{ width: `${percentage}%` }}
      />
      <span className={styles.progressText}>
        {current}/{max}
      </span>
    </div>
  );
};

ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  className: PropTypes.string
};

export default ProgressBar;