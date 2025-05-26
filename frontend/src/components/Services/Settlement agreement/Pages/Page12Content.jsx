import React, { useEffect } from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";

const Page12Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
  handleInputKeyDown,
  handleDateKeyDown,
  autoSelectedRoomInfo,
  isPresetActive,
  selectedPreset,
  dataLoading,
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

  const getNextPremisesField = (index, currentSubField) => {
    const conditions = formData.premisesConditions || [];
    if (currentSubField === "description") {
      return `premisesConditions[${index}].condition`;
    }
    if (index < conditions.length - 1) {
      if (index + 1 >= 4 && conditions[index + 1]) {
        return `premisesConditions[${index + 1}].description`;
      }
      return `premisesConditions[${index + 1}].condition`;
    }
    return "day_appendix3";
  };

  const getPrevPremisesField = (index, currentSubField) => {
    if (currentSubField === "condition" && index >= 4 && formData.premisesConditions[index]?.description !== undefined) {
      return `premisesConditions[${index}].description`;
    }
    if (index > 0) {
      if (index - 1 >= 4 && formData.premisesConditions[index - 1]?.description !== undefined) {
        return `premisesConditions[${index - 1}].description`;
      }
      return `premisesConditions[${index - 1}].condition`;
    }
    return "premisesArea_appendix2";
  };

  useEffect(() => {
    const today = new Date();
    const updates = {};

    if (!formData.day_appendix2 && !isPresetActive) updates.day_appendix2 = String(today.getDate()).padStart(2, '0');
    if (!formData.month_appendix2 && !isPresetActive) updates.month_appendix2 = String(today.getMonth() + 1).padStart(2, '0');
    if (!formData.year_appendix2 && !isPresetActive) updates.year_appendix2 = String(today.getFullYear()).slice(-2);

    if (!formData.dormNumber_appendix2 && formData.dormNumber) {
      updates.dormNumber_appendix2 = formData.dormNumber;
    }

    if (formData.roomNumber && formData.roomNumber_appendix2 !== formData.roomNumber) {
      updates.roomNumber_appendix2 = formData.roomNumber;
    }

    let currentDormAddress = "";
    if (isPresetActive && selectedPreset?.dormitory_address) {
      currentDormAddress = selectedPreset.dormitory_address;
    } else if (formData.dormNumber && allDormitories?.length > 0) {
      const dorm = allDormitories.find(d => String(d.id) === String(formData.dormNumber));
      if (dorm && dorm.address) currentDormAddress = dorm.address;
    } else if (formData.dormStreet && formData.dormBuilding) {
      currentDormAddress = `${formData.dormStreet}, ${formData.dormBuilding}`;
    }

    if (!formData.address_appendix2 && currentDormAddress) {
      updates.address_appendix2 = currentDormAddress;
    }

    if (!formData.residentName_appendix2 && formData.fullName) {
      updates.residentName_appendix2 = formData.fullName;
    }
    if (!formData.residentName_appendix2_sig && formData.fullName) {
      updates.residentName_appendix2_sig = formData.fullName;
    }
    if (formData.roomNumber && formData.premisesNumber_appendix2 !== formData.roomNumber) {
      updates.premisesNumber_appendix2 = formData.roomNumber;
    }

    if (Object.keys(updates).length > 0) {
      Object.entries(updates).forEach(([key, value]) => {
        handleChange({ target: { name: key, value: String(value) } });
      });
    }
  }, [
    formData.day_appendix2,
    formData.month_appendix2,
    formData.year_appendix2,
    formData.dormNumber,
    formData.roomNumber,
    formData.dormStreet,
    formData.dormBuilding,
    formData.fullName,
    formData.dormNumber_appendix2,
    formData.residentName_appendix2,
    formData.residentName_appendix2_sig,
    formData.roomNumber_appendix2,
    formData.address_appendix2,
    formData.premisesNumber_appendix2,
    handleChange,
    isPresetActive,
    selectedPreset,
    allDormitories,
  ]);

  const roomSourceText = () => {
    if (autoSelectedRoomInfo?.source === 'reservation') return "(З вашого бронювання)";
    if (autoSelectedRoomInfo?.source === 'auto-select') return "(Автоматично підібрано)";
    return "";
  };

  const getDormNameById = (dormId) => {
    if (!dormId || !allDormitories || allDormitories.length === 0) return `ID: ${dormId || '?'}`;
    const dorm = allDormitories.find(d => String(d.id) === String(dormId));
    return dorm ? dorm.name : `ID: ${dormId}`;
  };

  return (
    <div className={styles.contractText} role="region" aria-labelledby="act-title-p12">
      <p className={styles.rightText}>Додаток №2</p>
      <h2 id="act-title-p12" className={styles.centeredTitle}>АКТ</h2>
      <p className={styles.centeredText}>прийому–передачі житлового приміщення</p>

      <div className={styles.dateRight}>
        <span>«</span>
        <input
          type="text"
          name="day_appendix2"
          value={formData.day_appendix2 || ""}
          onChange={(e) => handleChange(e, "day_appendix2")}
          onFocus={() => handleFocus("day_appendix2")}
          onBlur={() => handleBlur("day_appendix2")}
          onKeyDown={(e) => handleDateKeyDown(e, "day_appendix2", "month_appendix2", "residentName_appendix1")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.day_appendix2 ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current["day_appendix2"] = el)}
          required
          aria-label="День для Додатку 2"
          data-error-field="day_appendix2"
        />
        <span>»</span>
        <input
          type="text"
          name="month_appendix2"
          value={formData.month_appendix2 || ""}
          onChange={(e) => handleChange(e, "month_appendix2")}
          onFocus={() => handleFocus("month_appendix2")}
          onBlur={() => handleBlur("month_appendix2")}
          onKeyDown={(e) => handleDateKeyDown(e, "month_appendix2", "year_appendix2", "day_appendix2")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.month_appendix2 ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current["month_appendix2"] = el)}
          required
          aria-label="Місяць для Додатку 2"
          data-error-field="month_appendix2"
        />
        <span>20</span>
        <input
          type="text"
          name="year_appendix2"
          value={formData.year_appendix2 || ""}
          onChange={(e) => handleChange(e, "year_appendix2")}
          onFocus={() => handleFocus("year_appendix2")}
          onBlur={() => handleBlur("year_appendix2")}
          onKeyDown={(e) => handleDateKeyDown(e, "year_appendix2", "dormNumberInput_appendix2_display", "month_appendix2")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputYear} ${errors.year_appendix2 ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current["year_appendix2"] = el)}
          required
          aria-label="Рік для Додатку 2 (останні дві цифри)"
          data-error-field="year_appendix2"
        />
        <span>р.</span>
      </div>
      {errors.day_appendix2 && <p id="day_appendix2-error-p12" className={styles.error}>{errors.day_appendix2}</p>}
      {errors.month_appendix2 && <p id="month_appendix2-error-p12" className={styles.error}>{errors.month_appendix2}</p>}
      {errors.year_appendix2 && <p id="year_appendix2-error-p12" className={styles.error}>{errors.year_appendix2}</p>}

      <p className={styles.justifiedText}>
        Цей акт складено завідувачем гуртожитку №{" "}
        <input
          type="text"
          name="dormNumberInput_appendix2_display"
          value={getDormNameById(formData.dormNumber_appendix2)}
          readOnly
          className={`${styles.inlineInputDormNameAppendix} ${styles.readOnlyField} ${errors.dormNumber_appendix2 ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current["dormNumberInput_appendix2_display"] = el)}
          aria-label="Назва гуртожитку для Додатку 2 (автоматично)"
          data-error-field="dormNumber_appendix2"
          onKeyDown={(e) => handleInputKeyDown(e, "dormNumberInput_appendix2_display", "dormManagerName_appendix2", "year_appendix2")}
        />
      </p>
      {errors.dormNumber_appendix2 && <p id="dormNumber_appendix2-error-p12" className={styles.error}>{errors.dormNumber_appendix2}</p>}

      <div className={styles.fullNameWrapper}>
        <input
          type="text"
          name="dormManagerName_appendix2"
          value={formData.dormManagerName_appendix2 || ""}
          readOnly={!!formData.dormManagerName_main}
          disabled={!!formData.dormManagerName_main}
          className={`${styles.fullWidthInput} ${formData.dormManagerName_main ? styles.readOnlyField : ""} ${
            errors.dormManagerName_appendix2 ? styles.errorInput : ""
          }`}
          ref={(el) => (inputRefs.current["dormManagerName_appendix2"] = el)}
          required
          placeholder="П.І.Б. завідувача гуртожитку"
          aria-label="П.І.Б. завідувача гуртожитку для Додатку 2 (автоматично)"
          data-error-field="dormManagerName_appendix2"
          onChange={(e) => handleChange(e, "dormManagerName_appendix2")}
          onFocus={() => handleFocus("dormManagerName_appendix2")}
          onBlur={() => handleBlur("dormManagerName_appendix2")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormManagerName_appendix2", "roomNumberInput_appendix2_display", "dormNumberInput_appendix2_display")}
        />
        <span className={styles.inputLabel}>(П.І.Б. завідувача гуртожитку)</span>
      </div>
      {errors.dormManagerName_appendix2 && (
        <p id="dormManagerName_appendix2-error-p12" className={styles.error}>
          {errors.dormManagerName_appendix2}
        </p>
      )}

      <p className={styles.justifiedText}>з одного боку</p>
      <p className={styles.justifiedText}>
        та Мешканцем кімнати №{" "}
        <input
          type="text"
          name="roomNumberInput_appendix2_display"
          value={formData.roomNumber_appendix2 || ""}
          readOnly
          className={`${styles.roomNumberAppendix} ${styles.readOnlyField} ${errors.roomNumber_appendix2 ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current["roomNumberInput_appendix2_display"] = el)}
          aria-label="Номер кімнати для Додатку 2 (автоматично)"
          data-error-field="roomNumber_appendix2"
          onKeyDown={(e) => handleInputKeyDown(e, "roomNumberInput_appendix2_display", "dormNumberInput_appendix2_ref_display", "dormManagerName_appendix2")}
        />{" "}
        {autoSelectedRoomInfo?.source && autoSelectedRoomInfo.source !== "manual" && formData.roomNumber_appendix2 && (
          <span className={styles.roomSourceInfo} style={{ fontSize: "12px", marginLeft: "3px" }}>
            {roomSourceText()}
          </span>
        )}
        гуртожитку №{" "}
        <input
          type="text"
          name="dormNumberInput_appendix2_ref_display"
          value={getDormNameById(formData.dormNumber_appendix2)}
          readOnly
          className={`${styles.inlineInputDormNameAppendix} ${styles.readOnlyField}`}
          ref={(el) => (inputRefs.current["dormNumberInput_appendix2_ref_display"] = el)}
          aria-label="Назва гуртожитку (повтор) для Додатку 2 (автоматично)"
          onKeyDown={(e) => handleInputKeyDown(e, "dormNumberInput_appendix2_ref_display", "address_appendix2", "roomNumberInput_appendix2_display")}
        />
        , розташованого за адресою:{" "}
        <input
          type="text"
          name="address_appendix2"
          value={formData.address_appendix2 || ""}
          onChange={(e) => handleChange(e, "address_appendix2")}
          onFocus={() => handleFocus("address_appendix2")}
          onBlur={() => handleBlur("address_appendix2")}
          onKeyDown={(e) => handleInputKeyDown(e, "address_appendix2", "residentName_appendix2", "dormNumberInput_appendix2_ref_display")}
          className={`${styles.fullWidthInput} ${errors.address_appendix2 ? styles.errorInput : ""} ${
            (isPresetActive && selectedPreset?.dormitory_address) || (formData.dormNumber && !isPresetActive) ? styles.readOnlyField : ""
          }`}
          ref={(el) => (inputRefs.current["address_appendix2"] = el)}
          required
          aria-label="Адреса гуртожитку для Додатку 2"
          data-error-field="address_appendix2"
          readOnly={(isPresetActive && !!selectedPreset?.dormitory_address) || (!!formData.dormNumber && !isPresetActive)}
          disabled={dataLoading.preset}
        />
      </p>
      {errors.roomNumber_appendix2 && (
        <p id="roomNumber_appendix2-error-p12" className={styles.error}>
          {errors.roomNumber_appendix2}
        </p>
      )}
      {errors.address_appendix2 && <p id="address_appendix2-error-p12" className={styles.error}>{errors.address_appendix2}</p>}

      <div className={styles.fullNameWrapper}>
        <input
          type="text"
          name="residentName_appendix2"
          value={formData.residentName_appendix2 || ""}
          onChange={(e) => handleChange(e, "residentName_appendix2")}
          onFocus={() => handleFocus("residentName_appendix2")}
          onBlur={() => handleBlur("residentName_appendix2")}
          onKeyDown={(e) => handleInputKeyDown(e, "residentName_appendix2", "premisesNumberInput_appendix2_display", "address_appendix2")}
          className={`${styles.fullWidthInput} ${errors.residentName_appendix2 ? styles.errorInput : ""} ${!!formData.fullName ? styles.readOnlyField : ""}`}
          ref={(el) => (inputRefs.current["residentName_appendix2"] = el)}
          required
          placeholder="П.І.Б. Мешканця"
          aria-label="П.І.Б. Мешканця для Додатку 2"
          data-error-field="residentName_appendix2"
          readOnly={!!formData.fullName}
        />
        <span className={styles.inputLabel}>(П.І.Б. Мешканця)</span>
      </div>
      {errors.residentName_appendix2 && (
        <p id="residentName_appendix2-error-p12" className={styles.error}>
          {errors.residentName_appendix2}
        </p>
      )}
      <p className={styles.justifiedText}>з другого боку</p>
      <p className={styles.justifiedText}>
        в тому, що завідувач гуртожитку передав, а Мешканець прийняв житлове приміщення №{" "}
        <input
          type="text"
          name="premisesNumberInput_appendix2_display"
          value={formData.premisesNumber_appendix2 || ""}
          readOnly
          className={`${styles.inlineInput} ${styles.shortInlineInput} ${styles.readOnlyField} ${
            errors.premisesNumber_appendix2 ? styles.errorInput : ""
          }`}
          ref={(el) => (inputRefs.current["premisesNumberInput_appendix2_display"] = el)}
          aria-label="Номер приміщення для Додатку 2 (автоматично)"
          data-error-field="premisesNumber_appendix2"
          onKeyDown={(e) => handleInputKeyDown(e, "premisesNumberInput_appendix2_display", "premisesArea_appendix2", "residentName_appendix2")}
        />{" "}
        площею{" "}
        <input
          type="text"
          name="premisesArea_appendix2"
          value={formData.premisesArea_appendix2 || ""}
          onChange={(e) => handleChange(e, "premisesArea_appendix2")}
          onFocus={() => handleFocus("premisesArea_appendix2")}
          onBlur={() => handleBlur("premisesArea_appendix2")}
          onKeyDown={(e) => handleInputKeyDown(e, "premisesArea_appendix2", "premisesConditions[0].condition", "premisesNumberInput_appendix2_display")}
          className={`${styles.inlineInput} ${styles.shortInlineInput} ${errors.premisesArea_appendix2 ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current["premisesArea_appendix2"] = el)}
          required
          aria-label="Площа приміщення для Додатку 2"
          data-error-field="premisesArea_appendix2"
        />{" "}
        м² у наступному стані:
      </p>
      {errors.premisesNumber_appendix2 && (
        <p id="premisesNumber_appendix2-error-p12" className={styles.error}>
          {errors.premisesNumber_appendix2}
        </p>
      )}
      {errors.premisesArea_appendix2 && (
        <p id="premisesArea_appendix2-error-p12" className={styles.error}>
          {errors.premisesArea_appendix2}
        </p>
      )}

      <div>
        {(defaultPremisesConditionsItems || []).map((defaultItem, index) => (
          <div key={index} className={styles.conditionItem}>
            {index < 4 ? (
              <label htmlFor={`premisesConditions[${index}].condition`}>{defaultItem.description}:</label>
            ) : (
              <input
                type="text"
                id={`premisesConditions[${index}].description`}
                name={`premisesConditions[${index}].description`}
                value={formData.premisesConditions[index]?.description || ""}
                onChange={(e) => handleChange(e, "premisesConditions", index, "description")}
                onFocus={() => handleFocus(`premisesConditions[${index}].description`)}
                onBlur={() => handleBlur(`premisesConditions[${index}].description`)}
                onKeyDown={(e) =>
                  handleInputKeyDown(e, `premisesConditions[${index}].description`, getNextPremisesField(index, "description"), getPrevPremisesField(index, "description"))
                }
                className={`${styles.descriptionInput} ${errors.premisesConditions?.[index]?.description ? styles.errorInput : ""}`}
                ref={(el) => (inputRefs.current[`premisesConditions[${index}].description`] = el)}
                placeholder="Введіть опис (наприклад, лічильник води)"
                aria-label={`Опис стану додаткового пункту ${index - 3} для Додатку 2`}
                data-error-field={`premisesConditions[${index}].description`}
              />
            )}
            <select
              id={`premisesConditions[${index}].condition`}
              name={`premisesConditions[${index}].condition`}
              value={formData.premisesConditions[index]?.condition || ""}
              onChange={(e) => handleChange(e, "premisesConditions", index, "condition")}
              onFocus={() => handleFocus(`premisesConditions[${index}].condition`)}
              onBlur={() => handleBlur(`premisesConditions[${index}].condition`)}
              onKeyDown={(e) =>
                handleInputKeyDown(e, `premisesConditions[${index}].condition`, getNextPremisesField(index, "condition"), getPrevPremisesField(index, "condition"))
              }
              className={`${styles.conditionSelect} ${errors.premisesConditions?.[index]?.condition ? styles.errorInput : ""}`}
              ref={(el) => (inputRefs.current[`premisesConditions[${index}].condition`] = el)}
              required={index < 4 || !!formData.premisesConditions[index]?.description?.trim()}
              aria-label={`Стан для "${formData.premisesConditions[index]?.description || defaultItem.description}"`}
              data-error-field={`premisesConditions[${index}].condition`}
            >
              <option value="">Виберіть стан</option>
              {conditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.premisesConditions?.[index]?.description && (
              <p id={`premises-description-${index}-error-p12`} className={styles.error}>
                {`Пункт ${index + 1} Опис: ${errors.premisesConditions[index].description}`}
              </p>
            )}
            {errors.premisesConditions?.[index]?.condition && (
              <p id={`premises-condition-${index}-error-p12`} className={styles.error}>
                {`Пункт ${index + 1} Стан: ${errors.premisesConditions[index].condition}`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page12Content;