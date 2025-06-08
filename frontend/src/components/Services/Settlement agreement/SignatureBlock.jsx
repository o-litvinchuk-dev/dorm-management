// src/components/Services/Settlement agreement/SignatureBlock.jsx
import React from "react";
import styles from "../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";

const SignatureBlock = ({
  title,
  name,
  isReadOnly,
}) => {
  return (
    <div className={styles.signatureBlock}>
      <span className={styles.signatureLabel}>{title}</span>
      <input
        type="text"
        value={name || ""}
        readOnly
        className={`${styles.signatureInput} ${isReadOnly ? styles.readOnlyField : ''}`}
      />
    </div>
  );
};

export default SignatureBlock;