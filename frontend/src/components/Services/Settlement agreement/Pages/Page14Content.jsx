import React from "react";
import styles from "./styles/Page14Content.module.css";
import { getNestedError } from "../../../../pages/Services/Settlement agreement/helpers";

const Page14Content = ({
  formData,
  errors,
  touched,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
  displayFacultyName,
  displayGroupName,
  displayDormName,
  handleInputKeyDown,
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
            <span>{formData.residentPhone ? `+380${formData.residentPhone}` : "Не вказано"}</span>
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
              onChange={handleChange}
              onFocus={() => handleFocus("dataProcessingConsent")}
              onBlur={handleBlur}
              className={`${styles.page14CheckboxInput} ${getNestedError(errors, 'dataProcessingConsent') ? styles.page14ErrorInput : ""}`}
              ref={(el) => { inputRefs.current["dataProcessingConsent"] = el;}}
            />
            Я надаю згоду на обробку моїх персональних даних відповідно до Закону України «Про захист персональних даних».
          </label>
          {getNestedError(errors, 'dataProcessingConsent') && <p className={styles.page14Error}>{getNestedError(errors, 'dataProcessingConsent')}</p>}

          <label className={styles.page14CheckboxLabel}>
            <input
              type="checkbox"
              name="contractTermsConsent"
              checked={formData.contractTermsConsent || false}
              onChange={handleChange}
              onFocus={() => handleFocus("contractTermsConsent")}
              onBlur={handleBlur}
              className={`${styles.page14CheckboxInput} ${getNestedError(errors, 'contractTermsConsent') ? styles.page14ErrorInput : ""}`}
              ref={(el) => { inputRefs.current["contractTermsConsent"] = el; }}
            />
            Я ознайомлений(а) та згоден(на) з умовами цього Договору та Правилами внутрішнього розпорядку гуртожитку.
          </label>
          {getNestedError(errors, 'contractTermsConsent') && <p className={styles.page14Error}>{getNestedError(errors, 'contractTermsConsent')}</p>}

          <label className={styles.page14CheckboxLabel}>
            <input
              type="checkbox"
              name="dataAccuracyConsent"
              checked={formData.dataAccuracyConsent || false}
              onChange={handleChange}
              onFocus={() => handleFocus("dataAccuracyConsent")}
              onBlur={handleBlur}
              className={`${styles.page14CheckboxInput} ${getNestedError(errors, 'dataAccuracyConsent') ? styles.page14ErrorInput : ""}`}
              ref={(el) => { inputRefs.current["dataAccuracyConsent"] = el; }}
            />
            Я підтверджую, що всі введені дані є правильними, і беру на себе відповідальність за їх достовірність.
          </label>
          {getNestedError(errors, 'dataAccuracyConsent') && <p className={styles.page14Error}>{getNestedError(errors, 'dataAccuracyConsent')}</p>}
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