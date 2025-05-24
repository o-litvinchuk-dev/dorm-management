import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";

const Page10Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
  handleInputKeyDown,
}) => {
  return (
    <div className={styles.contractText}>
      <h3 className={styles.centeredTitle}>АДРЕСИ ТА РЕКВІЗИТИ СТОРІН</h3>
      <div className={styles.twoColumnLayout}>
        <div className={styles.leftColumn}>
          <h4>Університет</h4>
          <p className={styles.justifiedText}>
            Національний університет біоресурсів і природокористування України
          </p>
          <p className={styles.justifiedText}>
            вул. Героїв Оборони, 15, м. Київ, 03041
          </p>
          <p className={styles.justifiedText}>
            IBAN: UA338201720313281002202016289
          </p>
          <p className={styles.justifiedText}>
            Державна казначейська служба України м. Київ
          </p>
          <p className={styles.justifiedText}>
            код банку 820172
          </p>
          <p className={styles.justifiedText}>
            код ЄДРПОУ 00493706
          </p>
          <div className={styles.signatureBlock}>
            <p className={`${styles.justifiedText} ${styles.centeredSignature}`}>
              Сергій СТЕЦЮК
            </p>
          </div>
        </div>
        <div className={styles.rightColumn}>
          <h4>Мешканець</h4>
          <div className={styles.fullNameWrapper}>
            <input
              type="text"
              name="residentFullName"
              value={formData.residentFullName || ""}
              onChange={(e) => handleChange(e, "residentFullName")}
              onFocus={() => handleFocus("residentFullName")}
              onBlur={() => handleBlur("residentFullName")}
              onKeyDown={(e) => handleInputKeyDown(e, "residentFullName", "residentRegion", null)}
              className={`${styles.fullWidthInput} ${errors.residentFullName ? styles.errorInput : ""}`}
              required
              ref={(el) => (inputRefs.current.residentFullName = el)}
              placeholder="П.І.Б."
              aria-label="П.І.Б. мешканця"
              aria-invalid={!!errors.residentFullName}
              aria-describedby={errors.residentFullName ? "residentFullName-error" : undefined}
              autoComplete="name"
            />
            <span className={styles.inputLabel}>(П.І.Б.)</span>
          </div>
          {errors.residentFullName && (
            <p id="residentFullName-error" className={styles.error}>{errors.residentFullName}</p>
          )}
          <p className={styles.justifiedText}>Поштова адреса:</p>
          <div className={styles.inputRow}>
            <label className={styles.label}>Область:</label>
            <input
              type="text"
              name="residentRegion"
              value={formData.residentRegion || ""}
              onChange={(e) => handleChange(e, "residentRegion")}
              onFocus={() => handleFocus("residentRegion")}
              onBlur={() => handleBlur("residentRegion")}
              onKeyDown={(e) => handleInputKeyDown(e, "residentRegion", "residentDistrict", "residentFullName")}
              className={`${styles.stretchedInput} ${errors.residentRegion ? styles.errorInput : ""}`}
              required
              ref={(el) => (inputRefs.current.residentRegion = el)}
              placeholder="Область"
              aria-label="Область"
              aria-invalid={!!errors.residentRegion}
              aria-describedby={errors.residentRegion ? "residentRegion-error" : undefined}
              autoComplete="address-level1"
            />
          </div>
          {errors.residentRegion && (
            <p id="residentRegion-error" className={styles.error}>{errors.residentRegion}</p>
          )}
          <div className={styles.inputRow}>
            <label className={styles.label}>Район:</label>
            <input
              type="text"
              name="residentDistrict"
              value={formData.residentDistrict || ""}
              onChange={(e) => handleChange(e, "residentDistrict")}
              onFocus={() => handleFocus("residentDistrict")}
              onBlur={() => handleBlur("residentDistrict")}
              onKeyDown={(e) => handleInputKeyDown(e, "residentDistrict", "residentCity", "residentRegion")}
              className={`${styles.stretchedInput} ${errors.residentDistrict ? styles.errorInput : ""}`}
              required
              ref={(el) => (inputRefs.current.residentDistrict = el)}
              placeholder="Район"
              aria-label="Район"
              aria-invalid={!!errors.residentDistrict}
              aria-describedby={errors.residentDistrict ? "residentDistrict-error" : undefined}
              autoComplete="address-level2"
            />
          </div>
          {errors.residentDistrict && (
            <p id="residentDistrict-error" className={styles.error}>{errors.residentDistrict}</p>
          )}
          <div className={styles.inputRow}>
            <label className={styles.label}>Населений пункт:</label>
            <input
              type="text"
              name="residentCity"
              value={formData.residentCity || ""}
              onChange={(e) => handleChange(e, "residentCity")}
              onFocus={() => handleFocus("residentCity")}
              onBlur={() => handleBlur("residentCity")}
              onKeyDown={(e) => handleInputKeyDown(e, "residentCity", "residentPostalCode", "residentDistrict")}
              className={`${styles.stretchedInput} ${errors.residentCity ? styles.errorInput : ""}`}
              required
              ref={(el) => (inputRefs.current.residentCity = el)}
              placeholder="Населений пункт"
              aria-label="Населений пункт"
              aria-invalid={!!errors.residentCity}
              aria-describedby={errors.residentCity ? "residentCity-error" : undefined}
              autoComplete="address-level3"
            />
          </div>
          {errors.residentCity && (
            <p id="residentCity-error" className={styles.error}>{errors.residentCity}</p>
          )}
          <div className={styles.inputRow}>
            <label className={styles.label}>Поштовий індекс:</label>
            <input
              type="text"
              name="residentPostalCode"
              value={formData.residentPostalCode || ""}
              onChange={(e) => handleChange(e, "residentPostalCode")}
              onFocus={() => handleFocus("residentPostalCode")}
              onBlur={() => handleBlur("residentPostalCode")}
              onKeyDown={(e) => handleInputKeyDown(e, "residentPostalCode", "residentPhone", "residentCity")}
              className={`${styles.stretchedInput} ${errors.residentPostalCode ? styles.errorInput : ""}`}
              required
              ref={(el) => (inputRefs.current.residentPostalCode = el)}
              placeholder="Поштовий індекс"
              aria-label="Поштовий індекс"
              aria-invalid={!!errors.residentPostalCode}
              aria-describedby={errors.residentPostalCode ? "residentPostalCode-error" : undefined}
              autoComplete="postal-code"
            />
          </div>
          {errors.residentPostalCode && (
            <p id="residentPostalCode-error" className={styles.error}>{errors.residentPostalCode}</p>
          )}
          <div className={styles.inputRow}>
            <label className={styles.label}>Контактний тел.:</label>
            <input
              type="text"
              name="residentPhone"
              value={formData.residentPhone || ""}
              onChange={(e) => handleChange(e, "residentPhone")}
              onFocus={() => handleFocus("residentPhone")}
              onBlur={() => handleBlur("residentPhone")}
              onKeyDown={(e) => handleInputKeyDown(e, "residentPhone", "motherPhone", "residentPostalCode")}
              className={`${styles.stretchedInput} ${errors.residentPhone ? styles.errorInput : ""}`}
              required
              ref={(el) => (inputRefs.current.residentPhone = el)}
              placeholder="Номер телефону"
              aria-label="Контактний телефон мешканця"
              aria-invalid={!!errors.residentPhone}
              aria-describedby={errors.residentPhone ? "residentPhone-error" : undefined}
              autoComplete="tel"
            />
          </div>
          {errors.residentPhone && (
            <p id="residentPhone-error" className={styles.error}>{errors.residentPhone}</p>
          )}
          <p className={styles.justifiedText}>Телефон батьків:</p>
          <div className={styles.inputRow}>
            <label className={styles.label}>Мама:</label>
            <input
              type="text"
              name="motherPhone"
              value={formData.motherPhone || ""}
              onChange={(e) => handleChange(e, "motherPhone")}
              onFocus={() => handleFocus("motherPhone")}
              onBlur={() => handleBlur("motherPhone")}
              onKeyDown={(e) => handleInputKeyDown(e, "motherPhone", "fatherPhone", "residentPhone")}
              className={`${styles.stretchedInput} ${errors.motherPhone && formData.motherPhone ? styles.errorInput : ""}`}
              ref={(el) => (inputRefs.current.motherPhone = el)}
              placeholder="Номер телефону мами"
              aria-label="Телефон мами"
              aria-invalid={!!errors.motherPhone && !!formData.motherPhone}
              aria-describedby={errors.motherPhone && formData.motherPhone ? "motherPhone-error" : undefined}
              autoComplete="tel"
            />
          </div>
          {errors.motherPhone && formData.motherPhone && (
            <p id="motherPhone-error" className={styles.error}>{errors.motherPhone}</p>
          )}
          <div className={styles.inputRow}>
            <label className={styles.label}>Тато:</label>
            <input
              type="text"
              name="fatherPhone"
              value={formData.fatherPhone || ""}
              onChange={(e) => handleChange(e, "fatherPhone")}
              onFocus={() => handleFocus("fatherPhone")}
              onBlur={() => handleBlur("fatherPhone")}
              onKeyDown={(e) => handleInputKeyDown(e, "fatherPhone", "parentFullName", "motherPhone")}
              className={`${styles.stretchedInput} ${errors.fatherPhone && formData.fatherPhone ? styles.errorInput : ""}`}
              ref={(el) => (inputRefs.current.fatherPhone = el)}
              placeholder="Номер телефону тата"
              aria-label="Телефон тата"
              aria-invalid={!!errors.fatherPhone && !!formData.fatherPhone}
              aria-describedby={errors.fatherPhone && formData.fatherPhone ? "fatherPhone-error" : undefined}
              autoComplete="tel"
            />
          </div>
          {errors.fatherPhone && formData.fatherPhone && (
            <p id="fatherPhone-error" className={styles.error}>{errors.fatherPhone}</p>
          )}
          {errors.atLeastOneParentPhone && !formData.motherPhone && !formData.fatherPhone && (
            <p id="parentPhone-error" className={styles.error}>
              {errors.atLeastOneParentPhone}
            </p>
          )}
          <div className={styles.fullNameWrapper}>
            <input
              type="text"
              name="parentFullName"
              value={formData.parentFullName || ""}
              onChange={(e) => handleChange(e, "parentFullName")}
              onFocus={() => handleFocus("parentFullName")}
              onBlur={() => handleBlur("parentFullName")}
              onKeyDown={(e) => handleInputKeyDown(e, "parentFullName", null, "fatherPhone")}
              className={`${styles.fullWidthInput} ${errors.parentFullName ? styles.errorInput : ""}`}
              required
              ref={(el) => (inputRefs.current.parentFullName = el)}
              placeholder="П.І.Б. одного з батьків"
              aria-label="П.І.Б. одного з батьків"
              aria-invalid={!!errors.parentFullName}
              aria-describedby={errors.parentFullName ? "parentFullName-error" : undefined}
              autoComplete="name"
            />
            <span className={styles.inputLabel}>(П.І.Б. одного з батьків)</span>
          </div>
          {errors.parentFullName && (
            <p id="parentFullName-error" className={styles.error}>{errors.parentFullName}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page10Content;