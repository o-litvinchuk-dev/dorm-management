import React from "react";
import styles from "./styles/Page14Content.module.css";

const Page14Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
  displayFacultyName,
  displayGroupName,
  displayDormName,
  handleInputKeyDown, // For checkbox navigation
}) => {

  const formatDateForDisplay = (day, month, yearShort) => {
    if (!day || !month || !yearShort || String(yearShort).length !== 2) return "Не вказано";
    const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;
    const fullYear = currentCentury + parseInt(yearShort, 10);
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${fullYear}`;
  };

  return (
    <div className={styles.page14ContractText} role="region" aria-labelledby="final-steps-title">
      <h3 id="final-steps-title" className={styles.page14CenteredTitle}>Фінальний Крок: Подача Договору</h3>

      <div className={styles.page14InfoSection}>
        <h4 className={styles.page14SectionTitle}>Будь ласка, перевірте введені дані:</h4>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <strong>П.І.Б. студента:</strong>
            <span>{formData.fullName || "Не вказано"}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Факультет:</strong>
            <span>{displayFacultyName || "Не обрано"}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Група:</strong>
            <span>{displayGroupName || "Не обрано"}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Курс:</strong>
            <span>{formData.course || "Не вказано"}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Паспорт:</strong>
            <span>{formData.passportSeries || "XX"} №{formData.passportNumber || "000000"}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>ІПН:</strong>
            <span>{(formData.taxId || []).join("") || "Не вказано"}</span>
          </div>
           <div className={styles.summaryItem}>
            <strong>Телефон:</strong>
            <span>{formData.residentPhone ? `${formData.residentPhone.startsWith('+380') ? '' : '+380'}${formData.residentPhone.replace('+380','')}` : "Не вказано"}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Гуртожиток:</strong>
            <span>{displayDormName || "Не обрано"}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Кімната №:</strong>
            <span>{formData.roomNumber || "Не вказано"}</span>
          </div>
          <div className={styles.summaryItem}>
            <strong>Період проживання:</strong>
            <span>
              {formatDateForDisplay(formData.startDay, formData.startMonth, formData.startYear)} - {formatDateForDisplay(formData.endDay, formData.endMonth, formData.endYear)}
            </span>
          </div>
           <div className={styles.summaryItem}>
            <strong>Дата договору:</strong>
            <span>{formatDateForDisplay(formData.contractDay, formData.contractMonth, formData.contractYear)}</span>
          </div>
        </div>
        <p className={styles.page14JustifiedText} style={{ marginTop: '15px', color: '#c0392b', fontWeight: '500' }}>
          Увага! Перед подачею переконайтеся, що всі дані вірні. Помилки можуть затримати процес поселення.
        </p>
      </div>


      <div className={styles.page14InfoSection}>
        <h4 className={styles.page14SectionTitle}>Підтвердження Згоди</h4>
        <p className={styles.page14JustifiedText}>
          Будь ласка, підтвердіть наступні пункти для завершення подачі договору:
        </p>
        <div className={styles.page14CheckboxGroup}>
          <label className={styles.page14CheckboxLabel}>
            <input
              type="checkbox"
              name="dataProcessingConsent"
              checked={formData.dataProcessingConsent || false}
              onChange={(e) => handleChange(e, "dataProcessingConsent")}
              onFocus={() => handleFocus("dataProcessingConsent")}
              onBlur={() => handleBlur("dataProcessingConsent")}
              onKeyDown={(e) => handleInputKeyDown(e, "dataProcessingConsent", "contractTermsConsent", "residentSignature_appendix3")} // prev from Page 13 sig
              className={`${styles.page14CheckboxInput} ${errors.dataProcessingConsent ? styles.page14ErrorInput : ""}`}
              required
              ref={(el) => { inputRefs.current["dataProcessingConsent"] = el;}}
              data-error-field="dataProcessingConsent"
              aria-label="Згода на обробку персональних даних"
            />
            Я надаю згоду на обробку моїх персональних даних відповідно до Закону України «Про захист персональних даних».
          </label>
          {errors.dataProcessingConsent && (
            <p id="dataProcessingConsent-error-p14" className={styles.page14Error}>
              {errors.dataProcessingConsent}
            </p>
          )}

          <label className={styles.page14CheckboxLabel}>
            <input
              type="checkbox"
              name="contractTermsConsent"
              checked={formData.contractTermsConsent || false}
              onChange={(e) => handleChange(e, "contractTermsConsent")}
              onFocus={() => handleFocus("contractTermsConsent")}
              onBlur={() => handleBlur("contractTermsConsent")}
              onKeyDown={(e) => handleInputKeyDown(e, "contractTermsConsent", "dataAccuracyConsent", "dataProcessingConsent")}
              className={`${styles.page14CheckboxInput} ${errors.contractTermsConsent ? styles.page14ErrorInput : ""}`}
              required
              ref={(el) => { inputRefs.current["contractTermsConsent"] = el; }}
              data-error-field="contractTermsConsent"
              aria-label="Згода з умовами договору"
            />
            Я ознайомлений(а) та згоден(на) з умовами цього Договору та Правилами внутрішнього розпорядку гуртожитку.
          </label>
          {errors.contractTermsConsent && (
            <p id="contractTermsConsent-error-p14" className={styles.page14Error}>
              {errors.contractTermsConsent}
            </p>
          )}

          <label className={styles.page14CheckboxLabel}>
            <input
              type="checkbox"
              name="dataAccuracyConsent"
              checked={formData.dataAccuracyConsent || false}
              onChange={(e) => handleChange(e, "dataAccuracyConsent")}
              onFocus={() => handleFocus("dataAccuracyConsent")}
              onBlur={() => handleBlur("dataAccuracyConsent")}
              onKeyDown={(e) => handleInputKeyDown(e, "dataAccuracyConsent", null, "contractTermsConsent")} // Last interactive element before submit
              className={`${styles.page14CheckboxInput} ${errors.dataAccuracyConsent ? styles.page14ErrorInput : ""}`}
              required
              ref={(el) => { inputRefs.current["dataAccuracyConsent"] = el; }}
              data-error-field="dataAccuracyConsent"
              aria-label="Підтвердження правильності даних"
            />
            Я підтверджую, що всі введені дані є правильними, і беру на себе відповідальність за їх достовірність.
          </label>
          {errors.dataAccuracyConsent && (
            <p id="dataAccuracyConsent-error-p14" className={styles.page14Error}>
              {errors.dataAccuracyConsent}
            </p>
          )}
        </div>
      </div>

      <div className={styles.page14SubmitSection}>
        <p className={styles.page14CenteredText}>
          Дякуємо за заповнення! Ви на крок ближче до комфортного проживання!
        </p>
      </div>
    </div>
  );
};

export default Page14Content;