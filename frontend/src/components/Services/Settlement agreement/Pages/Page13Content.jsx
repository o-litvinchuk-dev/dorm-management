// src/components/Services/Settlement agreement/Pages/Page13Content.jsx
import React, { useEffect } from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";
import ElectricalAppliancesTable from "../ElectricalAppliancesTable"; // Assuming component exists
import SignatureBlock from "../SignatureBlock";

const Page13Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
  handleInputKeyDown,
  handleDateKeyDown,
  handleTableKeyDown, // For table navigation
}) => {

  useEffect(() => {
    const today = new Date();
    const updates = {};

    if (!formData.day_appendix3) updates.day_appendix3 = String(today.getDate()).padStart(2, '0');
    if (!formData.month_appendix3) updates.month_appendix3 = String(today.getMonth() + 1).padStart(2, '0');
    if (!formData.year_appendix3) updates.year_appendix3 = String(today.getFullYear()).slice(-2);
    
    // Auto-fill signature names
    if (!formData.dormManagerName_appendix3 && formData.dormManagerName_appendix2) { // From previous appendix if available
        updates.dormManagerName_appendix3 = formData.dormManagerName_appendix2;
    } else if (!formData.dormManagerName_appendix3 && formData.dormManagerName_main) { // Or main
        updates.dormManagerName_appendix3 = formData.dormManagerName_main;
    }

    if (!formData.residentName_appendix3 && formData.fullName) { // From page 1
        updates.residentName_appendix3 = formData.fullName;
    }


    if (Object.keys(updates).length > 0) {
        Object.entries(updates).forEach(([key, value]) => {
            handleChange({ target: { name: key, value: String(value) } });
        });
    }
  }, [
      formData.day_appendix3, formData.month_appendix3, formData.year_appendix3,
      formData.dormManagerName_appendix2, formData.dormManagerName_main, formData.fullName, // For signature auto-fill
      formData.dormManagerName_appendix3, formData.residentName_appendix3,
      handleChange
  ]);


  return (
    <div className={styles.contractText} role="region" aria-labelledby="appendix-title-3">
      <p className={styles.rightText}>Додаток № 3</p>
      <h3 id="appendix-title-3" className={styles.centeredTitle}>ПЕРЕЛІК</h3>
      <p className={styles.centeredText}>
        власних приладів, що споживають електроенергію, оплата за яку здійснюється Мешканцем
      </p>
      <p className={styles.centeredText}>додатково</p>

      <div className={styles.dateRight}>
        <span>«</span>
        <input
          type="text"
          name="day_appendix3"
          value={formData.day_appendix3 || ""}
          onChange={(e) => handleChange(e, "day_appendix3")}
          onFocus={() => handleFocus("day_appendix3")}
          onBlur={() => handleBlur("day_appendix3")}
          onKeyDown={(e) => handleDateKeyDown(e, "day_appendix3", "month_appendix3", "residentSignature_appendix2")} // prev from Page 12 sig
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.day_appendix3 ? styles.errorInput : ""}`}
          required
          ref={(el) => { inputRefs.current["day_appendix3"] = el; }}
          data-error-field="day_appendix3"
          aria-label="День для Додатку 3"
        />
        <span>»</span>
        <input
          type="text"
          name="month_appendix3"
          value={formData.month_appendix3 || ""}
          onChange={(e) => handleChange(e, "month_appendix3")}
          onFocus={() => handleFocus("month_appendix3")}
          onBlur={() => handleBlur("month_appendix3")}
          onKeyDown={(e) => handleDateKeyDown(e, "month_appendix3", "year_appendix3", "day_appendix3")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.month_appendix3 ? styles.errorInput : ""}`}
          required
          ref={(el) => { inputRefs.current["month_appendix3"] = el; }}
          data-error-field="month_appendix3"
          aria-label="Місяць для Додатку 3"
        />
        <span>20</span>
        <input
          type="text"
          name="year_appendix3"
          value={formData.year_appendix3 || ""}
          onChange={(e) => handleChange(e, "year_appendix3")}
          onFocus={() => handleFocus("year_appendix3")}
          onBlur={() => handleBlur("year_appendix3")}
          onKeyDown={(e) => handleDateKeyDown(e, "year_appendix3", "electricalAppliances[0].brand", "month_appendix3")} // First field in table after year
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.year_appendix3 ? styles.errorInput : ""}`} // Changed from inlineInputYear for consistency
          required
          ref={(el) => { inputRefs.current["year_appendix3"] = el; }}
          data-error-field="year_appendix3"
          aria-label="Рік для Додатку 3 (останні дві цифри)"
        />
        <span>р.</span>
      </div>
      {errors.day_appendix3 && <p id="day_appendix3-error-p13" className={styles.error}>{errors.day_appendix3}</p>}
      {errors.month_appendix3 && <p id="month_appendix3-error-p13" className={styles.error}>{errors.month_appendix3}</p>}
      {errors.year_appendix3 && <p id="year_appendix3-error-p13" className={styles.error}>{errors.year_appendix3}</p>}

      <ElectricalAppliancesTable
        appliances={formData.electricalAppliances}
        errors={errors.electricalAppliances}
        handleChange={handleChange}
        handleFocus={handleFocus}
        handleBlur={handleBlur}
        inputRefs={inputRefs}
        handleTableKeyDown={handleTableKeyDown}
      />
      {/* Errors for electricalAppliances table */}
      {formData.electricalAppliances.map((_, index) =>
        errors.electricalAppliances?.[index] ? (
          <div key={`appliance-error-group-${index}`}>
            {errors.electricalAppliances[index].name && (
              <p id={`appliance-${index}-name-error-p13`} className={styles.error}>
                {`Прилад ${index + 1}, Назва: ${errors.electricalAppliances[index].name}`}
              </p>
            )}
            {errors.electricalAppliances[index].brand && (
              <p id={`appliance-${index}-brand-error-p13`} className={styles.error}>
                {`Прилад ${index + 1}, Марка: ${errors.electricalAppliances[index].brand}`}
              </p>
            )}
            {errors.electricalAppliances[index].year && (
              <p id={`appliance-${index}-year-error-p13`} className={styles.error}>
                {`Прилад ${index + 1}, Рік: ${errors.electricalAppliances[index].year}`}
              </p>
            )}
            {errors.electricalAppliances[index].quantity && (
              <p id={`appliance-${index}-quantity-error-p13`} className={styles.error}>
                {`Прилад ${index + 1}, Кількість: ${errors.electricalAppliances[index].quantity}`}
              </p>
            )}
            {errors.electricalAppliances[index].note && (
              <p id={`appliance-${index}-note-error-p13`} className={styles.error}>
                {`Прилад ${index + 1}, Примітка: ${errors.electricalAppliances[index].note}`}
              </p>
            )}
          </div>
        ) : null
      )}
      <p className={styles.footnote}>
        *У разі зміни тарифів на електроенергію вартість спожитої електроенергії перераховується та
        відображається у кошторисі витрат та затверджується наказом ректора.
      </p>
    </div>
  );
};

export default Page13Content;