import React from "react";
import styles from "../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";

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
  onNameKeyDown,
  onSignatureKeyDown,
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
          onKeyDown={onNameKeyDown}
          className={`${styles.signatureInput} ${nameError ? styles.errorInput : ""}`}
          placeholder="П.І.Б."
          required
          ref={(el) => (inputRefs.current[nameField] = el)}
          data-error-field={nameField}
          aria-label={`ПІБ для ${title}`}
        />
        <span>/</span>
        <input
          type="text"
          name={signatureField}
          value={formData[signatureField]}
          onChange={(e) => handleChange(e, signatureField)}
          onFocus={() => handleFocus(signatureField)}
          onBlur={() => handleBlur(signatureField)}
          onKeyDown={onSignatureKeyDown}
          className={`${styles.signatureInput} ${signatureError ? styles.errorInput : ""}`}
          placeholder="Підпис"
          required
          ref={(el) => (inputRefs.current[signatureField] = el)}
          data-error-field={signatureField}
          aria-label={`Підпис для ${title}`}
        />
      </div>
      {nameError && <p id={`${nameField}-error`} className={styles.error}>{nameError}</p>}
      {signatureError && <p id={`${signatureField}-error`} className={styles.error}>{signatureError}</p>}
    </div>
  );
};

export default SignatureBlock;