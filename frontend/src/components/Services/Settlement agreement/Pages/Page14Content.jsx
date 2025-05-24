import React from "react";
import styles from "./styles/Page14Content.module.css";

const Page14Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
}) => {
  return (
    <div className={styles.page14ContractText} role="region" aria-labelledby="final-steps-title">
      <h3 id="final-steps-title" className={styles.page14CenteredTitle}>Фінальний Крок: Подача Договору</h3>

      <div className={styles.page14InfoSection}>
        <h4 className={styles.page14SectionTitle}>Перевірте Дані</h4>
        <p className={styles.page14JustifiedText}>
          Перед подачею переконайтеся, що ПІБ, паспортні дані, ідентифікаційний номер, контакти, номер гуртожитку та кімнати введено правильно. Помилки можуть затримати поселення.
        </p>
      </div>

      <div className={styles.page14InfoSection}>
        <h4 className={styles.page14SectionTitle}>Підтвердження</h4>
        <p className={styles.page14JustifiedText}>
          Після натискання «Подати заявку» ви отримаєте повідомлення про успіх. Збережіть скріншот. Якщо підтвердження немає, зверніться до деканату.
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
              className={`${styles.page14CheckboxInput} ${errors.dataProcessingConsent ? styles.page14ErrorInput : ""}`}
              required
              ref={(el) => (inputRefs.current.dataProcessingConsent = el)}
              data-error-field="dataProcessingConsent"
              aria-label="Згода на обробку персональних даних"
              aria-invalid={!!errors.dataProcessingConsent}
              aria-describedby={errors.dataProcessingConsent ? "dataProcessingConsent-error" : undefined}
            />
            Я надаю згоду на обробку моїх персональних даних відповідно до Закону України «Про захист персональних даних».
          </label>
          {errors.dataProcessingConsent && (
            <p id="dataProcessingConsent-error" className={styles.page14Error}>
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
              className={`${styles.page14CheckboxInput} ${errors.contractTermsConsent ? styles.page14ErrorInput : ""}`}
              required
              ref={(el) => (inputRefs.current.contractTermsConsent = el)}
              data-error-field="contractTermsConsent"
              aria-label="Згода з умовами договору"
              aria-invalid={!!errors.contractTermsConsent}
              aria-describedby={errors.contractTermsConsent ? "contractTermsConsent-error" : undefined}
            />
            Я ознайомлений(а) та згоден(на) з умовами цього Договору та Правилами внутрішнього розпорядку гуртожитку.
          </label>
          {errors.contractTermsConsent && (
            <p id="contractTermsConsent-error" className={styles.page14Error}>
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
              className={`${styles.page14CheckboxInput} ${errors.dataAccuracyConsent ? styles.page14ErrorInput : ""}`}
              required
              ref={(el) => (inputRefs.current.dataAccuracyConsent = el)}
              data-error-field="dataAccuracyConsent"
              aria-label="Підтвердження правильності даних"
              aria-invalid={!!errors.dataAccuracyConsent}
              aria-describedby={errors.dataAccuracyConsent ? "dataAccuracyConsent-error" : undefined}
            />
            Я підтверджую, що всі введені дані є правильними, і беру на себе відповідальність за їх достовірність.
          </label>
          {errors.dataAccuracyConsent && (
            <p id="dataAccuracyConsent-error" className={styles.page14Error}>
              {errors.dataAccuracyConsent}
            </p>
          )}
        </div>
      </div>

      <div className={styles.page14SignatureSection}>
        <div className={styles.page14SignatureBlock}>
          <p className={styles.page14SignatureLabel}>Підтверджую правильність даних: Мешканець</p>
          <div className={styles.page14SignatureInputs}>
            <input
              type="text"
              name="residentName"
              value={formData.residentName || ""}
              onChange={(e) => handleChange(e, "residentName")}
              onFocus={() => handleFocus("residentName")}
              onBlur={() => handleBlur("residentName")}
              className={`${styles.page14SignatureInput} ${errors.residentName ? styles.page14ErrorInput : ""}`}
              placeholder="П.І.Б."
              required
              ref={(el) => (inputRefs.current.residentName = el)}
              data-error-field="residentName"
              aria-label="П.І.Б. мешканця"
              aria-invalid={!!errors.residentName}
              aria-describedby={errors.residentName ? "residentName-error" : undefined}
            />
          </div>
        </div>
        <div className={styles.page14SignatureBlock}>
          <p className={styles.page14SignatureLabel}>Прийняв: Завідувач гуртожитку</p>
          <div className={styles.page14SignatureInputs}>
            <input
              type="text"
              name="dormManagerName"
              value={formData.dormManagerName || ""}
              onChange={(e) => handleChange(e, "dormManagerName")}
              onFocus={() => handleFocus("dormManagerName")}
              onBlur={() => handleBlur("dormManagerName")}
              className={`${styles.page14SignatureInput} ${errors.dormManagerName ? styles.page14ErrorInput : ""}`}
              placeholder="П.І.Б."
              required
              ref={(el) => (inputRefs.current.dormManagerName = el)}
              data-error-field="dormManagerName"
              aria-label="П.І.Б. завідувача гуртожитку"
              aria-invalid={!!errors.dormManagerName}
              aria-describedby={errors.dormManagerName ? "dormManagerName-error" : undefined}
            />
          </div>
        </div>
      </div>
      {errors.residentName && (
        <p id="residentName-error" className={styles.page14Error}>{errors.residentName}</p>
      )}
      {errors.dormManagerName && (
        <p id="dormManagerName-error" className={styles.page14Error}>{errors.dormManagerName}</p>
      )}

      <div className={styles.page14SubmitSection}>
        <p className={styles.page14CenteredText}>
          Дякуємо за заповнення! Ви на крок ближче до комфортного проживання!
        </p>
      </div>
    </div>
  );
};

export default Page14Content;