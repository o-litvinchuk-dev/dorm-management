import React from "react";
import styles from "../../../pages/Services/Settlement agreement/styles/SettlementApplicationPage.module.css";

const SignatureBlock = ({
  title,
  nameField,
  signatureField,
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
}) => {
  const nameError = errors[nameField];
  const signatureError = errors[signatureField];

  return (
    <div className={styles.signatureBlock}>
      <p className={styles.justifiedText}>{title}:</p>
      <div className={styles.signatureInputs}>
        <input
          type="text"
          name={nameField}
          value={formData[nameField]}
          onChange={(e) => handleChange(e, nameField)}
          onFocus={() => handleFocus(nameField)}
          onBlur={() => handleBlur(nameField)}
          className={`${styles.signatureInput} ${nameError ? styles.errorInput : ""}`}
          placeholder="П.І.Б."
          required
          ref={(el) => (inputRefs.current[nameField] = el)}
          data-error-field={nameField}
        />
        <span>/</span>
        <input
          type="text"
          name={signatureField}
          value={formData[signatureField]}
          onChange={(e) => handleChange(e, signatureField)}
          onFocus={() => handleFocus(signatureField)}
          onBlur={() => handleBlur(signatureField)}
          className={`${styles.signatureInput} ${signatureError ? styles.errorInput : ""}`}
          placeholder="Підпис"
          required
          ref={(el) => (inputRefs.current[signatureField] = el)}
          data-error-field={signatureField}
        />
      </div>
      {nameError && <p className={styles.error}>{nameError}</p>}
      {signatureError && <p className={styles.error}>{signatureError}</p>}
    </div>
  );
};

export default SignatureBlock;