import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";
import { getNestedError } from "../../../../pages/Services/Settlement agreement/helpers";
import SignatureBlock from "../SignatureBlock";

const Page12Content = ({
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  inputRefs,
  handleInputKeyDown,
  autoSelectedRoomInfo,
  allDormitories,
  defaultPremisesConditionsItems,
}) => {
  const conditionOptions = [
    { value: "Добрий", label: "Добрий" },
    { value: "Задовільний", label: "Задовільний" },
    { value: "Потребує косметичного ремонту", label: "Потребує косметичного ремонту" },
    { value: "Потребує капітального ремонту", label: "Потребує капітального ремонту" },
    { value: "Непридатний", label: "Непридатний" },
    { value: "Відсутній", label: "Відсутній" },
  ];

  const roomSourceText = () => {
    if (autoSelectedRoomInfo?.source === 'reservation') return "(З вашого бронювання)";
    if (autoSelectedRoomInfo?.source === 'application') return "(Призначено у заявці)";
    if (autoSelectedRoomInfo?.source === 'auto-select') return "(Автоматично підібрано)";
    return "";
  };

  const getDormNameById = (dormId) => {
    if (!dormId || !allDormitories || allDormitories.length === 0) return `№ ${dormId || '?'}`;
    const dorm = allDormitories.find(d => String(d.id) === String(dormId));
    return dorm ? dorm.name : `№ ${dormId}`;
  };
  
  const isManagerNameReadOnly = !!formData.dormManagerName_main;
  const isResidentNameReadOnly = !!formData.fullName;
  
  const day = formData.contractDay || "__";
  const month = formData.contractMonth || "__";
  const year = formData.contractYear || "__";

  return (
    <div className={styles.contractText} role="region" aria-labelledby="act-title-p12">
      <p className={styles.rightText}>Додаток №2</p>
      <h2 id="act-title-p12" className={styles.centeredTitle}>АКТ</h2>
      <p className={styles.centeredText}>прийому–передачі житлового приміщення</p>

      <div className={styles.dateRight}>
        <span>«</span>
        <input type="text" value={day} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        <span>»</span>
        <input type="text" value={month} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        <span>20</span>
        <input type="text" value={year} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        <span>р.</span>
      </div>

      <p className={styles.justifiedText}>
        Цей акт складено завідувачем гуртожитку {" "}
        <input type="text" value={getDormNameById(formData.dormNumber)} readOnly className={`${styles.inlineInputDormNameAppendix} ${styles.readOnlyField}`} />
      </p>

      <div className={styles.fullNameWrapper}>
        <input
          type="text" name="dormManagerName_appendix2" value={formData.dormManagerName_main || ""}
          readOnly={isManagerNameReadOnly}
          className={`${styles.fullWidthInput} ${isManagerNameReadOnly ? styles.readOnlyField : ""}`}
          ref={(el) => (inputRefs.current["dormManagerName_appendix2"] = el)}
        />
        <span className={styles.inputLabel}>(П.І.Б. завідувача гуртожитку)</span>
      </div>

      <p className={styles.justifiedText}>з одного боку</p>
      <p className={styles.justifiedText}>
        та Мешканцем кімнати №{" "}
        <input type="text" value={formData.roomNumber || ""} readOnly className={`${styles.roomNumberAppendix} ${styles.readOnlyField}`} />
        {" "}
        {autoSelectedRoomInfo?.source && autoSelectedRoomInfo.source !== "manual" && formData.roomNumber && (
          <span className={styles.roomSourceInfo}>{roomSourceText()}</span>
        )}
        гуртожитку {" "}
        <input type="text" value={getDormNameById(formData.dormNumber)} readOnly className={`${styles.inlineInputDormNameAppendix} ${styles.readOnlyField}`} />
        , розташованого за адресою:{" "}
        <input
          type="text" name="address_appendix2" value={`вул. ${formData.dormStreet || '...'}, буд. ${formData.dormBuilding || '...'}`} readOnly
          className={`${styles.fullWidthInput} ${styles.readOnlyField}`}
          ref={(el) => (inputRefs.current["address_appendix2"] = el)}
        />
      </p>
      
      <div className={styles.fullNameWrapper}>
        <input
          type="text" name="residentName_appendix2" value={formData.fullName || ""} readOnly={isResidentNameReadOnly}
          className={`${styles.fullWidthInput} ${isResidentNameReadOnly ? styles.readOnlyField : ""}`}
          ref={(el) => (inputRefs.current["residentName_appendix2"] = el)}
        />
        <span className={styles.inputLabel}>(П.І.Б. Мешканця)</span>
      </div>
      
      <p className={styles.justifiedText}>з другого боку</p>
      <p className={styles.justifiedText}>
        в тому, що завідувач гуртожитку передав, а Мешканець прийняв житлове приміщення №{" "}
        <input
          type="text" name="premisesNumber_appendix2" value={formData.roomNumber || ""} readOnly
          className={`${styles.inlineInput} ${styles.shortInlineInput} ${styles.readOnlyField}`}
          ref={(el) => (inputRefs.current["premisesNumber_appendix2"] = el)}
        />{" "}
        площею{" "}
        <input
          type="text" name="premisesArea_appendix2" value={formData.premisesArea_appendix2 || ""}
          onChange={handleChange} onBlur={handleBlur}
          onKeyDown={(e) => handleInputKeyDown(e, "premisesConditions[0].condition", null)}
          className={`${styles.inlineInput} ${styles.shortInlineInput} ${touched.premisesArea_appendix2 && getNestedError(errors, 'premisesArea_appendix2') ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current["premisesArea_appendix2"] = el)}
          placeholder="00.0"
        />{" "}
        м² у наступному стані:
      </p>
      {touched.premisesArea_appendix2 && getNestedError(errors, 'premisesArea_appendix2') && <p className={styles.error}>{getNestedError(errors, 'premisesArea_appendix2')}</p>}

      <div>
        {(defaultPremisesConditionsItems || []).map((defaultItem, index) => (
          <div key={index} className={styles.conditionItem}>
            {index < 4 ? (
              <>
                <label htmlFor={`premisesConditions[${index}].condition`}>
                  {defaultItem.description}:
                </label>
                <select
                  name={`premisesConditions[${index}].condition`}
                  value={formData.premisesConditions[index]?.condition || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.conditionSelect} ${getNestedError(errors, `premisesConditions[${index}].condition`) ? styles.errorInput : ""}`}
                  ref={(el) => (inputRefs.current[`premisesConditions[${index}].condition`] = el)}
                >
                  <option value="">Виберіть стан</option>
                  {conditionOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {getNestedError(errors, `premisesConditions[${index}].condition`) && (
                  <p className={styles.error}>{getNestedError(errors, `premisesConditions[${index}].condition`)}</p>
                )}
              </>
            ) : (
              <>
                <input
                  type="text"
                  name={`premisesConditions[${index}].description`}
                  value={formData.premisesConditions[index]?.description || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.descriptionInput} ${getNestedError(errors, `premisesConditions[${index}].description`) ? styles.errorInput : ""}`}
                  ref={(el) => (inputRefs.current[`premisesConditions[${index}].description`] = el)}
                  placeholder="Введіть опис"
                />
                <select
                  name={`premisesConditions[${index}].condition`}
                  value={formData.premisesConditions[index]?.condition || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.conditionSelect} ${getNestedError(errors, `premisesConditions[${index}].condition`) ? styles.errorInput : ""}`}
                  ref={(el) => (inputRefs.current[`premisesConditions[${index}].condition`] = el)}
                >
                  <option value="">Виберіть стан</option>
                  {conditionOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {getNestedError(errors, `premisesConditions[${index}].description`) && (
                  <p className={styles.error}>{getNestedError(errors, `premisesConditions[${index}].description`)}</p>
                )}
                {getNestedError(errors, `premisesConditions[${index}].condition`) && (
                  <p className={styles.error}>{getNestedError(errors, `premisesConditions[${index}].condition`)}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page12Content;