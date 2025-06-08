// src/components/Services/Settlement agreement/Pages/Page10Content.jsx
import React, { useEffect, useState } from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";
import { getNestedError } from "../../../../pages/Services/Settlement agreement/helpers";
import api from "../../../../utils/api";

const Page10Content = ({
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  inputRefs,
  handleInputKeyDown,
}) => {
  const [phoneFromDB, setPhoneFromDB] = useState(null);

  useEffect(() => {
    const fetchUserPhone = async () => {
      try {
        const response = await api.get("/secure/profile");
        const data = response.data;
        if (data && data.phone) {
          setPhoneFromDB(data.phone);
        }
      } catch (error) {
        console.error("Помилка при отриманні номера телефону:", error);
      }
    };
    fetchUserPhone();
  }, []);

  const isResidentFullNameReadOnly = true;
  const isResidentPhoneReadOnly = !!phoneFromDB;

  useEffect(() => {
    if (phoneFromDB && (!formData.residentPhone || formData.residentPhone.trim() === "")) {
      const phoneDigits = phoneFromDB.replace(/^\+380/, '');
      handleChange({
        target: { name: "residentPhone", value: phoneDigits },
      });
    }
  }, [phoneFromDB, formData.residentPhone, handleChange]);

  return (
    <div className={styles.contractText}>
      <h3 className={styles.centeredTitle}>АДРЕСИ ТА РЕКВІЗИТИ СТОРІН</h3>
      <div className={styles.twoColumnLayout}>
        <div className={styles.leftColumn}>
          <h4>Університет</h4>
          <p>Національний університет біоресурсів і природокористування України</p>
          <p>вул. Героїв Оборони, 15, м. Київ, 03041</p>
          <p>IBAN: UA338201720313281002202016289</p>
          <p>Державна казначейська служба України м. Київ</p>
          <p>код банку 820172</p>
          <p>код ЄДРПОУ 00493706</p>
        </div>
        <div className={styles.rightColumn}>
          <h4>Мешканець</h4>
          <div className={styles.fullNameWrapper}>
            <input
              type="text"
              name="residentFullName"
              value={formData.residentFullName || ""}
              readOnly={isResidentFullNameReadOnly}
              className={`${styles.fullWidthInput} ${styles.readOnlyField}`}
              ref={(el) => { inputRefs.current["residentFullName"] = el; }}
            />
            <span className={styles.inputLabel}>(П.І.Б.)</span>
            {touched.residentFullName && getNestedError(errors, 'residentFullName') && <p className={styles.error}>{getNestedError(errors, 'residentFullName')}</p>}
          </div>
          <p className={styles.justifiedText}>Поштова адреса:</p>
          <div className={styles.inputRow}>
            <label htmlFor="residentRegion" className={styles.label}>Область:</label>
            <input
              id="residentRegion"
              type="text"
              name="residentRegion"
              value={formData.residentRegion || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => handleInputKeyDown(e, "residentDistrict", "residentFullName")}
              className={`${styles.stretchedInput} ${touched.residentRegion && getNestedError(errors, 'residentRegion') ? styles.errorInput : ""}`}
              ref={(el) => { inputRefs.current["residentRegion"] = el; }}
              placeholder="Наприклад: Київська"
              autoComplete="address-level1"
            />
          </div>
          {touched.residentRegion && getNestedError(errors, 'residentRegion') && <p className={styles.error}>{getNestedError(errors, 'residentRegion')}</p>}
          <div className={styles.inputRow}>
            <label htmlFor="residentDistrict" className={styles.label}>Район:</label>
            <input
              id="residentDistrict"
              type="text"
              name="residentDistrict"
              value={formData.residentDistrict || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => handleInputKeyDown(e, "residentCity", "residentRegion")}
              className={`${styles.stretchedInput} ${touched.residentDistrict && getNestedError(errors, 'residentDistrict') ? styles.errorInput : ""}`}
              ref={(el) => { inputRefs.current["residentDistrict"] = el; }}
              placeholder="Наприклад: Бучанський"
              autoComplete="address-level2"
            />
          </div>
          {touched.residentDistrict && getNestedError(errors, 'residentDistrict') && <p className={styles.error}>{getNestedError(errors, 'residentDistrict')}</p>}
          <div className={styles.inputRow}>
            <label htmlFor="residentCity" className={styles.label}>Населений пункт:</label>
            <input
              id="residentCity"
              type="text"
              name="residentCity"
              value={formData.residentCity || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => handleInputKeyDown(e, "residentPostalCode", "residentDistrict")}
              className={`${styles.stretchedInput} ${touched.residentCity && getNestedError(errors, 'residentCity') ? styles.errorInput : ""}`}
              ref={(el) => { inputRefs.current["residentCity"] = el; }}
              placeholder="Наприклад: м. Ірпінь"
              autoComplete="address-level3"
            />
          </div>
          {touched.residentCity && getNestedError(errors, 'residentCity') && <p className={styles.error}>{getNestedError(errors, 'residentCity')}</p>}
          <div className={styles.inputRow}>
            <label htmlFor="residentPostalCode" className={styles.label}>Поштовий індекс:</label>
            <input
              id="residentPostalCode"
              type="text"
              name="residentPostalCode"
              value={formData.residentPostalCode || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => handleInputKeyDown(e, "residentPhone", "residentCity")}
              className={`${styles.stretchedInput} ${touched.residentPostalCode && getNestedError(errors, 'residentPostalCode') ? styles.errorInput : ""}`}
              ref={(el) => { inputRefs.current["residentPostalCode"] = el; }}
              placeholder="12345"
              maxLength="5"
              autoComplete="postal-code"
            />
          </div>
          {touched.residentPostalCode && getNestedError(errors, 'residentPostalCode') && <p className={styles.error}>{getNestedError(errors, 'residentPostalCode')}</p>}
          <div className={styles.inputRow}>
            <label htmlFor="residentPhone" className={styles.label}>Контактний тел.:</label>
            <span className={styles.phonePrefix}>+380</span>
            <input
              id="residentPhone"
              type="tel"
              name="residentPhone"
              value={formData.residentPhone || ""}
              readOnly={isResidentPhoneReadOnly}
              className={`${styles.stretchedInput} ${styles.phoneInput} ${isResidentPhoneReadOnly ? styles.readOnlyField : ""} ${touched.residentPhone && getNestedError(errors, 'residentPhone') ? styles.errorInput : ""}`}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => handleInputKeyDown(e, "motherPhone", "residentPostalCode")}
              ref={(el) => { inputRefs.current["residentPhone"] = el; }}
              placeholder="XXXXXXXXX"
              maxLength="9"
            />
          </div>
          {touched.residentPhone && getNestedError(errors, 'residentPhone') && <p className={styles.error}>{getNestedError(errors, 'residentPhone')}</p>}
          <p className={styles.justifiedText}>Телефон батьків (вкажіть хоча б один):</p>
          {getNestedError(errors, 'atLeastOneParentPhone') && <p className={styles.error}>{getNestedError(errors, 'atLeastOneParentPhone')}</p>}
          <div className={styles.inputRow}>
            <label htmlFor="motherPhone" className={styles.label}>Мама:</label>
            <span className={styles.phonePrefix}>+380</span>
            <input
              id="motherPhone"
              type="tel"
              name="motherPhone"
              value={formData.motherPhone || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => handleInputKeyDown(e, "fatherPhone", "residentPhone")}
              className={`${styles.stretchedInput} ${styles.phoneInput} ${touched.motherPhone && getNestedError(errors, 'motherPhone') ? styles.errorInput : ""}`}
              ref={(el) => { inputRefs.current["motherPhone"] = el; }}
              placeholder="991234567"
              maxLength="9"
              autoComplete="tel-national"
            />
          </div>
          {touched.motherPhone && getNestedError(errors, 'motherPhone') && <p className={styles.error}>{getNestedError(errors, 'motherPhone')}</p>}
          <div className={styles.inputRow}>
            <label htmlFor="fatherPhone" className={styles.label}>Тато:</label>
            <span className={styles.phonePrefix}>+380</span>
            <input
              id="fatherPhone"
              type="tel"
              name="fatherPhone"
              value={formData.fatherPhone || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => handleInputKeyDown(e, "parentFullName", "motherPhone")}
              className={`${styles.stretchedInput} ${styles.phoneInput} ${touched.fatherPhone && getNestedError(errors, 'fatherPhone') ? styles.errorInput : ""}`}
              ref={(el) => { inputRefs.current["fatherPhone"] = el; }}
              placeholder="991234567"
              maxLength="9"
              autoComplete="tel-national"
            />
          </div>
          {touched.fatherPhone && getNestedError(errors, 'fatherPhone') && <p className={styles.error}>{getNestedError(errors, 'fatherPhone')}</p>}
          <div className={styles.fullNameWrapper}>
            <input
              type="text"
              name="parentFullName"
              value={formData.parentFullName || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => handleInputKeyDown(e, null, "fatherPhone")}
              className={`${styles.fullWidthInput} ${touched.parentFullName && getNestedError(errors, 'parentFullName') ? styles.errorInput : ""}`}
              ref={(el) => { inputRefs.current["parentFullName"] = el; }}
              placeholder="П.І.Б. одного з батьків"
              autoComplete="name"
            />
            <span className={styles.inputLabel}>(П.І.Б. одного з батьків)</span>
            {touched.parentFullName && getNestedError(errors, 'parentFullName') && <p className={styles.error}>{getNestedError(errors, 'parentFullName')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page10Content;