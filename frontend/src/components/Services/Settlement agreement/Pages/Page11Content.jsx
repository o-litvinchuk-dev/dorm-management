import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";
import InventoryTable from "../InventoryTable"; // Імпортуємо компонент таблиці

const Page11Content = ({
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  inputRefs,
  defaultInventoryItems,
  displayDormName // Отримуємо назву гуртожитку з головного компонента
}) => {
  
  // Визначаємо дату для додатка, використовуючи дату договору як основну
  const day = formData.contractDay || "__";
  const month = formData.contractMonth || "__";
  const year = formData.contractYear || "__";

  return (
    <div className={styles.contractText}>
      <p className={styles.rightText}>Додаток № 1</p>
      <h3 className={styles.centeredTitle}>ПЕРЕЛІК</h3>
      <p className={styles.centeredText}>меблів і м’якого інвентарю</p>
      
      <div className={styles.dateRight}>
        «
        <input type="text" value={day} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        »
        <input type="text" value={month} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        20
        <input type="text" value={year} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        р.
      </div>

      {/* Адреса, кімната, гуртожиток */}
      <div className={styles.infoRow}>
        <span>за адресою: </span>
        <input
          type="text"
          name="address_appendix1"
          value={`вул. ${formData.dormStreet || '...'}, буд. ${formData.dormBuilding || '...'}`}
          readOnly
          className={`${styles.longInput} ${styles.readOnlyField}`}
          ref={(el) => { inputRefs.current["address_appendix1"] = el; }}
        />
      </div>
      <div className={styles.infoRow}>
        <span>кімнати №</span>
        <input
          type="text"
          value={formData.roomNumber || "..."}
          readOnly
          className={`${styles.roomNumberAppendix} ${styles.readOnlyField}`}
        />
        {/* ВИКОРИСТОВУЄМО НАЗВУ ГУРТОЖИТКУ ЗАМІСТЬ ID */}
        <span>гуртожитку </span>
        <input
          type="text"
          value={displayDormName || `№ ${formData.dormNumber || '...'}`}
          readOnly
          className={`${styles.inlineInputDormNameAppendix} ${styles.readOnlyField}`}
        />
      </div>
      
      {/* Використовуємо компонент таблиці */}
      <InventoryTable
        inventory={formData.inventory}
        errors={errors}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        inputRefs={inputRefs}
        defaultInventoryItems={defaultInventoryItems}
      />
    </div>
  );
};

export default Page11Content;