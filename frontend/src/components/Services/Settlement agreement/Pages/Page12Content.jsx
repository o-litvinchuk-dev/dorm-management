import React, { useRef } from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementApplicationPage.module.css";

const Page12Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
}) => {
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  // Опції для випадаючих списків стану
  const conditionOptions = [
    { value: "Добрий", label: "Добрий" },
    { value: "Задовільний", label: "Задовільний" },
    { value: "Потребує косметичного ремонту", label: "Потребує косметичного ремонту" },
    { value: "Потребує капітального ремонту", label: "Потребує капітального ремонту" },
    { value: "Непридатний", label: "Непридатний" },
    { value: "Відсутній", label: "Відсутній" },
  ];

  // Обробка клавіатурної навігації для полів дати
  const handleDateKeyDown = (e, currentField, nextField, prevField) => {
    if (e.key === "ArrowRight" && formData[currentField]?.length >= 2) {
      inputRefs.current[nextField]?.focus();
    } else if (e.key === "ArrowLeft" && !formData[currentField]) {
      inputRefs.current[prevField]?.focus();
    } else if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
      inputRefs.current[nextField]?.focus();
      e.preventDefault();
    } else if (e.key === "Tab" && e.shiftKey) {
      inputRefs.current[prevField]?.focus();
      e.preventDefault();
    }
  };

  // Обробка клавіатурної навігації для звичайних полів
  const handleInputKeyDown = (e, currentField, nextField, prevField) => {
    if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
      inputRefs.current[nextField]?.focus();
      e.preventDefault();
    } else if (e.key === "Tab" && e.shiftKey) {
      inputRefs.current[prevField]?.focus();
      e.preventDefault();
    }
  };

  // Обробка клавіатурної навігації для полів стану з урахуванням блокування
  const getNextConditionField = (index) => {
    if (index === 3) {
      // Якщо description[4] порожнє, пропускаємо condition[4]
      return formData.premisesConditions[4]?.description?.trim()
        ? "premisesConditions[4].condition"
        : formData.premisesConditions[5]?.description?.trim()
        ? "premisesConditions[5].description"
        : "dormManagerName";
    }
    if (index === 4) {
      return formData.premisesConditions[5]?.description?.trim()
        ? "premisesConditions[5].description"
        : "dormManagerName";
    }
    return index === 5 ? "dormManagerName" : `premisesConditions[${index + 1}].condition`;
  };

  return (
    <div className={styles.contractText} role="region" aria-labelledby="act-title">
      <p className={styles.rightText}>Додаток №2</p>
      <h2 id="act-title" className={styles.centeredTitle}>АКТ</h2>
      <p className={styles.centeredText}>прийому–передачі житлового приміщення</p>

      {/* Поле введення дати */}
      <div className={styles.dateRight}>
        <span>«</span>
        <input
          type="text"
          name="day"
          value={formData.day || ""}
          onChange={(e) => handleChange(e, "day")}
          onFocus={() => handleFocus("day")}
          onBlur={() => handleBlur("day")}
          onKeyDown={(e) => handleDateKeyDown(e, "day", "month", "residentName")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.day ? styles.errorInput : ""}`}
          ref={(el) => {
            dayRef.current = el;
            inputRefs.current.day = el;
          }}
          required
          aria-label="День"
          autoComplete="off"
        />
        <span>»</span>
        <input
          type="text"
          name="month"
          value={formData.month || ""}
          onChange={(e) => handleChange(e, "month")}
          onFocus={() => handleFocus("month")}
          onBlur={() => handleBlur("month")}
          onKeyDown={(e) => handleDateKeyDown(e, "month", "year", "day")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.month ? styles.errorInput : ""}`}
          ref={(el) => {
            monthRef.current = el;
            inputRefs.current.month = el;
          }}
          required
          aria-label="Місяць"
          autoComplete="off"
        />
        <span>20</span>
        <input
          type="text"
          name="year"
          value={formData.year || ""}
          onChange={(e) => handleChange(e, "year")}
          onFocus={() => handleFocus("year")}
          onBlur={() => handleBlur("year")}
          onKeyDown={(e) => handleDateKeyDown(e, "year", "dormNumber", "month")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputYear} ${errors.year ? styles.errorInput : ""}`}
          ref={(el) => {
            yearRef.current = el;
            inputRefs.current.year = el;
          }}
          required
          aria-label="Рік (останні дві цифри)"
          autoComplete="off"
        />
        <span>р.</span>
      </div>
      {errors.day && <p id="day-error" className={styles.error}>{errors.day}</p>}
      {errors.month && <p id="month-error" className={styles.error}>{errors.month}</p>}
      {errors.year && <p id="year-error" className={styles.error}>{errors.year}</p>}

      <p className={styles.justifiedText}>
        Цей акт складено завідувачем гуртожитку №{" "}
        <input
          type="text"
          name="dormNumber"
          value={formData.dormNumber || ""}
          onChange={(e) => handleChange(e, "dormNumber")}
          onFocus={() => handleFocus("dormNumber")}
          onBlur={() => handleBlur("dormNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormNumber", "dormManagerName", "year")}
          className={`${styles.inlineInput} ${errors.dormNumber ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current.dormNumber = el)}
          required
          aria-label="Номер гуртожитку"
          autoComplete="off"
        />
      </p>
      <div className={styles.fullNameWrapper}>
        <input
          type="text"
          name="dormManagerName"
          value={formData.dormManagerName || ""}
          onChange={(e) => handleChange(e, "dormManagerName")}
          onFocus={() => handleFocus("dormManagerName")}
          onBlur={() => handleBlur("dormManagerName")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormManagerName", "roomNumber", "dormNumber")}
          className={`${styles.fullWidthInput} ${errors.dormManagerName ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current.dormManagerName = el)}
          required
          placeholder="П.І.Б. завідувача гуртожитку"
          aria-label="П.І.Б. завідувача гуртожитку"
          autoComplete="name"
        />
        <span className={styles.inputLabel}>(П.І.Б. завідувача гуртожитку)</span>
      </div>
      <p className={styles.justifiedText}>з одного боку</p>
      <p className={styles.justifiedText}>
        та Мешканцем кімнати №{" "}
        <input
          type="text"
          name="roomNumber"
          value={formData.roomNumber || ""}
          onChange={(e) => handleChange(e, "roomNumber")}
          onFocus={() => handleFocus("roomNumber")}
          onBlur={() => handleBlur("roomNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "roomNumber", "dormNumber2", "dormManagerName")}
          className={`${styles.shortInlineInput} ${errors.roomNumber ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current.roomNumber = el)}
          required
          aria-label="Номер кімнати"
          autoComplete="off"
        />{" "}
        гуртожитку №{" "}
        <input
          type="text"
          name="dormNumber2"
          value={formData.dormNumber || ""}
          onChange={(e) => handleChange(e, "dormNumber")}
          onFocus={() => handleFocus("dormNumber")}
          onBlur={() => handleBlur("dormNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormNumber2", "address", "roomNumber")}
          className={`${styles.shortInlineInput} ${errors.dormNumber ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current.dormNumber2 = el)}
          required
          aria-label="Номер гуртожитку"
          autoComplete="off"
        />
        , розташованого за адресою:{" "}
        <input
          type="text"
          name="address"
          value={formData.address || ""}
          onChange={(e) => handleChange(e, "address")}
          onFocus={() => handleFocus("address")}
          onBlur={() => handleBlur("address")}
          onKeyDown={(e) => handleInputKeyDown(e, "address", "residentName", "dormNumber2")}
          className={`${styles.fullWidthInput} ${errors.address ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current.address = el)}
          required
          aria-label="Адреса гуртожитку"
          autoComplete="street-address"
        />
      </p>
      <div className={styles.fullNameWrapper}>
        <input
          type="text"
          name="residentName"
          value={formData.residentName || ""}
          onChange={(e) => handleChange(e, "residentName")}
          onFocus={() => handleFocus("residentName")}
          onBlur={() => handleBlur("residentName")}
          onKeyDown={(e) => handleInputKeyDown(e, "residentName", "premisesNumber", "address")}
          className={`${styles.fullWidthInput} ${errors.residentName ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current.residentName = el)}
          required
          placeholder="П.І.Б. Мешканця"
          aria-label="П.І.Б. Мешканця"
          autoComplete="name"
        />
        <span className={styles.inputLabel}>(П.І.Б. Мешканця)</span>
      </div>
      <p className={styles.justifiedText}>з другого боку</p>
      <p className={styles.justifiedText}>
        в тому, що завідувач гуртожитку передав, а Мешканець прийняв житлове приміщення №{" "}
        <input
          type="text"
          name="premisesNumber"
          value={formData.premisesNumber || ""}
          onChange={(e) => handleChange(e, "premisesNumber")}
          onFocus={() => handleFocus("premisesNumber")}
          onBlur={() => handleBlur("premisesNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "premisesNumber", "premisesArea", "residentName")}
          className={`${styles.inlineInput} ${errors.premisesNumber ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current.premisesNumber = el)}
          required
          aria-label="Номер приміщення"
          autoComplete="off"
        />{" "}
        площею{" "}
        <input
          type="text"
          name="premisesArea"
          value={formData.premisesArea || ""}
          onChange={(e) => handleChange(e, "premisesArea")}
          onFocus={() => handleFocus("premisesArea")}
          onBlur={() => handleBlur("premisesArea")}
          onKeyDown={(e) =>
            handleInputKeyDown(e, "premisesArea", "premisesConditions[0].condition", "premisesNumber")
          }
          className={`${styles.inlineInput} ${errors.premisesArea ? styles.errorInput : ""}`}
          ref={(el) => (inputRefs.current.premisesArea = el)}
          required
          aria-label="Площа приміщення"
          autoComplete="off"
        />{" "}
        м² у наступному стані:
      </p>

      {/* Умови приміщення */}
      <div>
        {[
          { label: "Стіни, підлога, стеля (штукатурка, побілка, фарбування, тощо)", index: 0 },
          { label: "Двері і вікна (фарбування, замки)", index: 1 },
          { label: "Електромережа (стан проводки, розеток, вимикачів)", index: 2 },
          { label: "Сантехнічне обладнання", index: 3 },
        ].map(({ label, index }) => (
          <div key={index} className={styles.conditionItem}>
            <label>{label}:</label>
            <select
              name={`premisesConditions[${index}].condition`}
              value={formData.premisesConditions[index]?.condition || ""}
              onChange={(e) => handleChange(e, "premisesConditions", index, "condition")}
              onFocus={() => handleFocus(`premisesConditions[${index}].condition`)}
              onBlur={() => handleBlur(`premisesConditions[${index}].condition`)}
              onKeyDown={(e) =>
                handleInputKeyDown(
                  e,
                  `premisesConditions[${index}].condition`,
                  getNextConditionField(index),
                  index === 0 ? "premisesArea" : `premisesConditions[${index - 1}].condition`
                )
              }
              className={`${styles.conditionSelect} ${
                errors.premisesConditions?.[index]?.condition ? styles.errorInput : ""
              }`}
              ref={(el) => (inputRefs.current[`premisesConditions[${index}].condition`] = el)}
              required
              aria-label={`Стан ${label.toLowerCase()}`}
              aria-invalid={!!errors.premisesConditions?.[index]?.condition}
              aria-describedby={
                errors.premisesConditions?.[index]?.condition
                  ? `premises-condition-${index}-error`
                  : undefined
              }
            >
              <option value="">Виберіть стан</option>
              {conditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.premisesConditions?.[index]?.condition && (
              <p id={`premises-condition-${index}-error`} className={styles.error}>
                {errors.premisesConditions[index].condition}
              </p>
            )}
          </div>
        ))}
        {[4, 5].map((index) => {
          const isDescriptionFilled = formData.premisesConditions[index]?.description?.trim();
          return (
            <div key={index} className={styles.conditionItem}>
              <input
                type="text"
                name={`premisesConditions[${index}].description`}
                value={formData.premisesConditions[index]?.description || ""}
                onChange={(e) => handleChange(e, "premisesConditions", index, "description")}
                onFocus={() => handleFocus(`premisesConditions[${index}].description`)}
                onBlur={() => handleBlur(`premisesConditions[${index}].description`)}
                onKeyDown={(e) =>
                  handleInputKeyDown(
                    e,
                    `premisesConditions[${index}].description`,
                    isDescriptionFilled
                      ? `premisesConditions[${index}].condition`
                      : index === 4 && formData.premisesConditions[5]?.description?.trim()
                      ? "premisesConditions[5].description"
                      : "dormManagerName",
                    index === 4 ? "premisesConditions[3].condition" : "premisesConditions[4].condition"
                  )
                }
                className={`${styles.descriptionInput} ${
                  errors.premisesConditions?.[index]?.description ? styles.errorInput : ""
                }`}
                ref={(el) => (inputRefs.current[`premisesConditions[${index}].description`] = el)}
                placeholder="Введіть опис (наприклад, лічильник води)"
                aria-label={`Опис стану додаткового пункту ${index - 3}`}
                autoComplete="off"
              />
              <select
                name={`premisesConditions[${index}].condition`}
                value={formData.premisesConditions[index]?.condition || ""}
                onChange={(e) => handleChange(e, "premisesConditions", index, "condition")}
                onFocus={() => handleFocus(`premisesConditions[${index}].condition`)}
                onBlur={() => handleBlur(`premisesConditions[${index}].condition`)}
                onKeyDown={(e) =>
                  handleInputKeyDown(
                    e,
                    `premisesConditions[${index}].condition`,
                    index === 5 ? "dormManagerName" : "premisesConditions[5].description",
                    `premisesConditions[${index}].description`
                  )
                }
                className={`${styles.conditionSelect} ${
                  errors.premisesConditions?.[index]?.condition ? styles.errorInput : ""
                }`}
                ref={(el) => (inputRefs.current[`premisesConditions[${index}].condition`] = el)}
                disabled={!isDescriptionFilled}
                aria-label={`Стан додаткового пункту ${index - 3}`}
                aria-invalid={!!errors.premisesConditions?.[index]?.condition}
                aria-describedby={
                  errors.premisesConditions?.[index]?.condition
                    ? `premises-condition-${index}-error`
                    : undefined
                }
              >
                <option value="">Виберіть стан</option>
                {conditionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.premisesConditions?.[index]?.description && (
                <p id={`premises-description-${index}-error`} className={styles.error}>
                  {errors.premisesConditions[index].description}
                </p>
              )}
              {errors.premisesConditions?.[index]?.condition && (
                <p id={`premises-condition-${index}-error`} className={styles.error}>
                  {errors.premisesConditions[index].condition}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Секція підписів */}
      <div className={styles.signatureSection}>
        <div className={styles.signatureBlock}>
          <p>Здав: Завідувач гуртожитку</p>
          <div className={styles.signatureInputs}>
            <input
              type="text"
              name="dormManagerName"
              value={formData.dormManagerName || ""}
              onChange={(e) => handleChange(e, "dormManagerName")}
              onFocus={() => handleFocus("dormManagerName")}
              onBlur={() => handleBlur("dormManagerName")}
              onKeyDown={(e) =>
                handleInputKeyDown(
                  e,
                  "dormManagerName",
                  "residentName",
                  formData.premisesConditions[5]?.description?.trim()
                    ? "premisesConditions[5].condition"
                    : formData.premisesConditions[4]?.description?.trim()
                    ? "premisesConditions[4].condition"
                    : "premisesConditions[3].condition"
                )
              }
              className={`${styles.signatureInput} ${errors.dormManagerName ? styles.errorInput : ""}`}
              placeholder="П.І.Б."
              aria-label="П.І.Б. завідувача гуртожитку"
              aria-invalid={!!errors.dormManagerName}
              aria-describedby={errors.dormManagerName ? "dormManagerName-error" : undefined}
              ref={(el) => (inputRefs.current.dormManagerName = el)}
              autoComplete="name"
            />
          </div>
        </div>
        <div className={styles.signatureBlock}>
          <p>Прийняв: Мешканець</p>
          <div className={styles.signatureInputs}>
            <input
              type="text"
              name="residentName"
              value={formData.residentName || ""}
              onChange={(e) => handleChange(e, "residentName")}
              onFocus={() => handleFocus("residentName")}
              onBlur={() => handleBlur("residentName")}
              onKeyDown={(e) => handleInputKeyDown(e, "residentName", null, "dormManagerName")}
              className={`${styles.signatureInput} ${errors.residentName ? styles.errorInput : ""}`}
              placeholder="П.І.Б."
              aria-label="П.І.Б. мешканця"
              aria-invalid={!!errors.residentName}
              aria-describedby={errors.residentName ? "residentName-error" : undefined}
              ref={(el) => (inputRefs.current.residentName = el)}
              autoComplete="name"
            />
          </div>
        </div>
      </div>
      {errors.dormManagerName && (
        <p id="dormManagerName-error" className={styles.error}>{errors.dormManagerName}</p>
      )}
      {errors.residentName && (
        <p id="residentName-error" className={styles.error}>{errors.residentName}</p>
      )}
    </div>
  );
};

export default Page12Content;