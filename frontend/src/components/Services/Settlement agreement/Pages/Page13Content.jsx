import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";
import ElectricalAppliancesTable from "../ElectricalAppliancesTable"; // Імпортуємо оновлений компонент
import SignatureBlock from "../SignatureBlock";

const Page13Content = ({
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  inputRefs,
  handleTableKeyDown, // Цей проп більше не потрібен для навігації, але може використовуватися для інших цілей
}) => {

  const isManagerNameReadOnly = !!formData.dormManagerName_main;
  const isResidentNameReadOnly = !!formData.fullName;

  // Синхронізуємо дату з основною датою договору
  const day = formData.contractDay || "__";
  const month = formData.contractMonth || "__";
  const year = formData.contractYear || "__";

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
        <input type="text" value={day} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        <span>»</span>
        <input type="text" value={month} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        <span>20</span>
        <input type="text" value={year} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        <span>р.</span>
      </div>

      <ElectricalAppliancesTable
        appliances={formData.electricalAppliances}
        errors={errors} // Передаємо весь об'єкт помилок
        touched={touched} // Передаємо весь об'єкт touched
        handleChange={handleChange}
        handleBlur={handleBlur}
        inputRefs={inputRefs}
        handleTableKeyDown={handleTableKeyDown}
      />
      
      <p className={styles.footnote}>
        *У разі зміни тарифів на електроенергію вартість спожитої електроенергії перераховується та
        відображається у кошторисі витрат та затверджується наказом ректора.
      </p>
    </div>
  );
};

export default Page13Content;