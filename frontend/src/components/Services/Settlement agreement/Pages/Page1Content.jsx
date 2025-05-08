import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementApplicationPage.module.css";

const Page1Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
  taxIdRefs,
  handleTaxIdChange,
  handleTaxIdKeyDown,
}) => {
  const handleDateKeyDown = (e, currentField, nextField, prevField) => {
    if (e.key === "ArrowRight" && formData[currentField].length >= 2) {
      inputRefs.current[nextField]?.focus();
    } else if (e.key === "ArrowLeft" && formData[currentField].length === 0) {
      inputRefs.current[prevField]?.focus();
    } else if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
      inputRefs.current[nextField]?.focus();
      e.preventDefault();
    } else if (e.key === "Tab" && e.shiftKey) {
      inputRefs.current[prevField]?.focus();
      e.preventDefault();
    }
  };

  const handleInputKeyDown = (e, currentField, nextField, prevField) => {
    if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
      inputRefs.current[nextField]?.focus();
      e.preventDefault();
    } else if (e.key === "Tab" && e.shiftKey) {
      inputRefs.current[prevField]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className={styles.contractText}>
      <h2 className={styles.centeredTitle}>ДОГОВІР</h2>
      <p className={styles.centeredText}>
        про надання в тимчасове платне користування житлового приміщення в гуртожитку
      </p>
      <p className={styles.rightText}>
        м. Київ «
        <input
          type="text"
          name="proxyDay"
          value={formData.proxyDay}
          onChange={(e) => handleChange(e, "proxyDay")}
          onFocus={() => handleFocus("proxyDay")}
          onBlur={() => handleBlur("proxyDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "proxyDay", "proxyMonth", null)}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.proxyDay ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["proxyDay"] = el;
            else delete inputRefs.current["proxyDay"];
          }}
          data-error-field="proxyDay"
          aria-label="День довіреності"
          aria-invalid={!!errors.proxyDay}
          aria-describedby={errors.proxyDay ? "proxyDay-error" : undefined}
          autoComplete="off"
        />
        »{" "}
        <input
          type="text"
          name="proxyMonth"
          value={formData.proxyMonth}
          onChange={(e) => handleChange(e, "proxyMonth")}
          onFocus={() => handleFocus("proxyMonth")}
          onBlur={() => handleBlur("proxyMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "proxyMonth", "proxyYear", "proxyDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.proxyMonth ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["proxyMonth"] = el;
            else delete inputRefs.current["proxyMonth"];
          }}
          data-error-field="proxyMonth"
          aria-label="Місяць довіреності"
          aria-invalid={!!errors.proxyMonth}
          aria-describedby={errors.proxyMonth ? "proxyMonth-error" : undefined}
          autoComplete="off"
        />{" "}
        <span>20</span>
        <input
          type="text"
          name="proxyYear"
          value={formData.proxyYear}
          onChange={(e) => handleChange(e, "proxyYear")}
          onFocus={() => handleFocus("proxyYear")}
          onBlur={() => handleBlur("proxyYear")}
          onKeyDown={(e) => handleDateKeyDown(e, "proxyYear", "course", "proxyMonth")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.proxyYear ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["proxyYear"] = el;
            else delete inputRefs.current["proxyYear"];
          }}
          data-error-field="proxyYear"
          aria-label="Рік довіреності (останні дві цифри)"
          aria-invalid={!!errors.proxyYear}
          aria-describedby={errors.proxyYear ? "proxyYear-error" : undefined}
          autoComplete="off"
        />{" "}
        р., з одного боку і студент (аспірант, докторант)
      </p>
      {errors.proxyDay && (
        <p id="proxyDay-error" className={styles.error}>
          {errors.proxyDay}
        </p>
      )}
      {errors.proxyMonth && (
        <p id="proxyMonth-error" className={styles.error}>
          {errors.proxyMonth}
        </p>
      )}
      {errors.proxyYear && (
        <p id="proxyYear-error" className={styles.error}>
          {errors.proxyYear}
        </p>
      )}
      <p className={styles.justifiedText}>
        <input
          type="number"
          name="course"
          value={formData.course}
          onChange={(e) => handleChange(e, "course")}
          onFocus={() => handleFocus("course")}
          onBlur={() => handleBlur("course")}
          onKeyDown={(e) => handleInputKeyDown(e, "course", "group", "proxyYear")}
          min="1"
          max="6"
          className={`${styles.inlineInput} ${errors.course ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["course"] = el;
            else delete inputRefs.current["course"];
          }}
          data-error-field="course"
          aria-label="Курс"
          aria-invalid={!!errors.course}
          aria-describedby={errors.course ? "course-error" : undefined}
          autoComplete="off"
        />{" "}
        курсу{" "}
        <input
          type="text"
          name="group"
          value={formData.group}
          onChange={(e) => handleChange(e, "group")}
          onFocus={() => handleFocus("group")}
          onBlur={() => handleBlur("group")}
          onKeyDown={(e) => handleInputKeyDown(e, "group", "faculty", "course")}
          className={`${styles.inlineInput} ${errors.group ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["group"] = el;
            else delete inputRefs.current["group"];
          }}
          data-error-field="group"
          aria-label="Група"
          aria-invalid={!!errors.group}
          aria-describedby={errors.group ? "group-error" : undefined}
          autoComplete="off"
        />{" "}
        групи,{" "}
        <input
          type="text"
          name="faculty"
          value={formData.faculty}
          onChange={(e) => handleChange(e, "faculty")}
          onFocus={() => handleFocus("faculty")}
          onBlur={() => handleBlur("faculty")}
          onKeyDown={(e) => handleInputKeyDown(e, "faculty", "fullName", "group")}
          className={`${styles.inlineInput} ${errors.faculty ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["faculty"] = el;
            else delete inputRefs.current["faculty"];
          }}
          data-error-field="faculty"
          aria-label="Факультет"
          aria-invalid={!!errors.faculty}
          aria-describedby={errors.faculty ? "faculty-error" : undefined}
          autoComplete="off"
        />{" "}
        ННІ/факультету
      </p>
      {errors.course && (
        <p id="course-error" className={styles.error}>
          {errors.course}
        </p>
      )}
      {errors.group && (
        <p id="group-error" className={styles.error}>
          {errors.group}
        </p>
      )}
      {errors.faculty && (
        <p id="faculty-error" className={styles.error}>
          {errors.faculty}
        </p>
      )}
      <div className={styles.fullNameWrapper}>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={(e) => handleChange(e, "fullName")}
          onFocus={() => handleFocus("fullName")}
          onBlur={() => handleBlur("fullName")}
          onKeyDown={(e) => handleInputKeyDown(e, "fullName", "passportSeries", "faculty")}
          className={`${styles.fullWidthInput} ${errors.fullName ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["fullName"] = el;
            else delete inputRefs.current["fullName"];
          }}
          data-error-field="fullName"
          aria-label="П.І.Б."
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          autoComplete="name"
        />
        <span className={styles.inputLabel}>(П.І.Б.)</span>
      </div>
      {errors.fullName && (
        <p id="fullName-error" className={styles.error}>
          {errors.fullName}
        </p>
      )}
      <p className={styles.justifiedText}>
        Паспорт серії{" "}
        <input
          type="text"
          name="passportSeries"
          value={formData.passportSeries}
          onChange={(e) => handleChange(e, "passportSeries")}
          onFocus={() => handleFocus("passportSeries")}
          onBlur={() => handleBlur("passportSeries")}
          onKeyDown={(e) => handleInputKeyDown(e, "passportSeries", "passportNumber", "fullName")}
          maxLength="2"
          placeholder="АБ"
          className={`${styles.inlineInput} ${errors.passportSeries ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["passportSeries"] = el;
            else delete inputRefs.current["passportSeries"];
          }}
          data-error-field="passportSeries"
          aria-label="Серія паспорта"
          aria-invalid={!!errors.passportSeries}
          aria-describedby={errors.passportSeries ? "passportSeries-error" : undefined}
          autoComplete="off"
        />{" "}
        №{" "}
        <input
          type="text"
          name="passportNumber"
          value={formData.passportNumber}
          onChange={(e) => handleChange(e, "passportNumber")}
          onFocus={() => handleFocus("passportNumber")}
          onBlur={() => handleBlur("passportNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "passportNumber", "passportIssued", "passportSeries")}
          maxLength="6"
          placeholder="123456"
          className={`${styles.inlineInput} ${errors.passportNumber ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["passportNumber"] = el;
            else delete inputRefs.current["passportNumber"];
          }}
          data-error-field="passportNumber"
          aria-label="Номер паспорта"
          aria-invalid={!!errors.passportNumber}
          aria-describedby={errors.passportNumber ? "passportNumber-error" : undefined}
          autoComplete="off"
        />{" "}
        виданий{" "}
        <input
          type="text"
          name="passportIssued"
          value={formData.passportIssued}
          onChange={(e) => handleChange(e, "passportIssued")}
          onFocus={() => handleFocus("passportIssued")}
          onBlur={() => handleBlur("passportIssued")}
          onKeyDown={(e) => handleInputKeyDown(e, "passportIssued", "taxId[0]", "passportNumber")}
          className={`${styles.inlineInput} ${errors.passportIssued ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["passportIssued"] = el;
            else delete inputRefs.current["passportIssued"];
          }}
          data-error-field="passportIssued"
          aria-label="Ким виданий паспорт"
          aria-invalid={!!errors.passportIssued}
          aria-describedby={errors.passportIssued ? "passportIssued-error" : undefined}
          autoComplete="off"
        />
      </p>
      {errors.passportSeries && (
        <p id="passportSeries-error" className={styles.error}>
          {errors.passportSeries}
        </p>
      )}
      {errors.passportNumber && (
        <p id="passportNumber-error" className={styles.error}>
          {errors.passportNumber}
        </p>
      )}
      {errors.passportIssued && (
        <p id="passportIssued-error" className={styles.error}>
          {errors.passportIssued}
        </p>
      )}
      <div className={styles.taxIdWrapper}>
        <table className={styles.taxIdTable} role="grid" aria-label="Ідентифікаційний номер">
          <tbody>
            <tr>
              <td className={styles.taxIdLabel}>Ідентифікаційний номер</td>
              <td className={styles.taxIdInputs}>
                {formData.taxId.map((char, index) => (
                  <input
                    key={index}
                    type="text"
                    value={char}
                    onChange={(e) => handleTaxIdChange(index, e.target.value)}
                    onKeyDown={(e) => handleTaxIdKeyDown(index, e)}
                    onFocus={() => handleFocus(`taxId[${index}]`)}
                    onBlur={() => handleBlur(`taxId[${index}]`)}
                    maxLength="1"
                    className={`${styles.taxIdInput} ${errors.taxId && errors.taxId[index] ? styles.errorInput : ""}`}
                    ref={(el) => {
                      if (el) taxIdRefs.current[index] = el;
                      else delete taxIdRefs.current[index];
                    }}
                    data-error-field={`taxId[${index}]`}
                    aria-label={`Цифра ${index + 1} ідентифікаційного номера`}
                    aria-invalid={!!errors.taxId && !!errors.taxId[index]}
                    aria-describedby={errors.taxId && errors.taxId[index] ? `taxId-${index}-error` : undefined}
                    autoComplete="off"
                  />
                ))}
              </td>
            </tr>
          </tbody>
        </table>
        {errors.taxId && typeof errors.taxId === "string" && (
          <p id="taxId-error" className={styles.error}>
            {errors.taxId}
          </p>
        )}
        {errors.taxId &&
          Array.isArray(errors.taxId) &&
          errors.taxId.map((error, index) =>
            error ? (
              <p key={index} id={`taxId-${index}-error`} className={styles.error}>
                {error}
              </p>
            ) : null
          )}
      </div>
      <p className={styles.justifiedText}>
        Договір Укладено згідно з вимогами чинного законодавства України
      </p>
      <p className={styles.justifiedText}>
        (далі - Мешканець), з іншого боку (далі разом Сторони, а кожна окремо Сторона), уклали цей
        Договір (далі - Договір) про наступне:
      </p>
      <h3 className={styles.centeredTitle}>1. ПРЕДМЕТ ДОГОВОРУ</h3>
      <p className={styles.justifiedText}>
        1.1. Університет надає, а Мешканець приймає в тимчасове платне користування житлове
        приміщення (ліжко місце, кімната) для проживання та місця загального користування,
        укомплектовані меблями та інвентарем (додаток 1), електротехнічним обладнанням згідно акту
        приймання - передачі (додаток 2) та одночасно забезпечує надання житлово-комунальних послуг.
      </p>
      <p className={styles.justifiedText}>
        Житлове приміщення знаходиться за адресою м. Київ вул.{" "}
        <input
          type="text"
          name="dormStreet"
          value={formData.dormStreet}
          onChange={(e) => handleChange(e, "dormStreet")}
          onFocus={() => handleFocus("dormStreet")}
          onBlur={() => handleBlur("dormStreet")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormStreet", "dormBuilding", "taxId[9]")}
          className={`${styles.inlineInput} ${errors.dormStreet ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["dormStreet"] = el;
            else delete inputRefs.current["dormStreet"];
          }}
          data-error-field="dormStreet"
          aria-label="Вулиця гуртожитку"
          aria-invalid={!!errors.dormStreet}
          aria-describedby={errors.dormStreet ? "dormStreet-error" : undefined}
          autoComplete="street-address"
        />{" "}
        буд.{" "}
        <input
          type="text"
          name="dormBuilding"
          value={formData.dormBuilding}
          onChange={(e) => handleChange(e, "dormBuilding")}
          onFocus={() => handleFocus("dormBuilding")}
          onBlur={() => handleBlur("dormBuilding")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormBuilding", "dormNumber", "dormStreet")}
          className={`${styles.inlineInput} ${errors.dormBuilding ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["dormBuilding"] = el;
            else delete inputRefs.current["dormBuilding"];
          }}
          data-error-field="dormBuilding"
          aria-label="Будинок гуртожитку"
          aria-invalid={!!errors.dormBuilding}
          aria-describedby={errors.dormBuilding ? "dormBuilding-error" : undefined}
          autoComplete="address-line2"
        />{" "}
        гуртожиток №{" "}
        <input
          type="text"
          name="dormNumber"
          value={formData.dormNumber}
          onChange={(e) => handleChange(e, "dormNumber")}
          onFocus={() => handleFocus("dormNumber")}
          onBlur={() => handleBlur("dormNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormNumber", "roomNumber", "dormBuilding")}
          className={`${styles.inlineInput} ${errors.dormNumber ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["dormNumber"] = el;
            else delete inputRefs.current["dormNumber"];
          }}
          data-error-field="dormNumber"
          aria-label="Номер гуртожитку"
          aria-invalid={!!errors.dormNumber}
          aria-describedby={errors.dormNumber ? "dormNumber-error" : undefined}
          autoComplete="off"
        />{" "}
        кімната №{" "}
        <input
          type="text"
          name="roomNumber"
          value={formData.roomNumber}
          onChange={(e) => handleChange(e, "roomNumber")}
          onFocus={() => handleFocus("roomNumber")}
          onBlur={() => handleBlur("roomNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "roomNumber", "startDay", "dormNumber")}
          className={`${styles.inlineInput} ${errors.roomNumber ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["roomNumber"] = el;
            else delete inputRefs.current["roomNumber"];
          }}
          data-error-field="roomNumber"
          aria-label="Номер кімнати"
          aria-invalid={!!errors.roomNumber}
          aria-describedby={errors.roomNumber ? "roomNumber-error" : undefined}
          autoComplete="off"
        />
      </p>
      {errors.dormStreet && (
        <p id="dormStreet-error" className={styles.error}>
          {errors.dormStreet}
        </p>
      )}
      {errors.dormBuilding && (
        <p id="dormBuilding-error" className={styles.error}>
          {errors.dormBuilding}
        </p>
      )}
      {errors.dormNumber && (
        <p id="dormNumber-error" className={styles.error}>
          {errors.dormNumber}
        </p>
      )}
      {errors.roomNumber && (
        <p id="roomNumber-error" className={styles.error}>
          {errors.roomNumber}
        </p>
      )}
      <p className={styles.justifiedText}>
        Строк користування житловим приміщенням за цим договором становить з «{" "}
        <input
          type="text"
          name="startDay"
          value={formData.startDay}
          onChange={(e) => handleChange(e, "startDay")}
          onFocus={() => handleFocus("startDay")}
          onBlur={() => handleBlur("startDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "startDay", "startMonth", "roomNumber")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.startDay ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["startDay"] = el;
            else delete inputRefs.current["startDay"];
          }}
          data-error-field="startDay"
          aria-label="День початку"
          aria-invalid={!!errors.startDay}
          aria-describedby={errors.startDay ? "startDay-error" : undefined}
          autoComplete="off"
        />{" "}
        »{" "}
        <input
          type="text"
          name="startMonth"
          value={formData.startMonth}
          onChange={(e) => handleChange(e, "startMonth")}
          onFocus={() => handleFocus("startMonth")}
          onBlur={() => handleBlur("startMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "startMonth", "startYear", "startDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.startMonth ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["startMonth"] = el;
            else delete inputRefs.current["startMonth"];
          }}
          data-error-field="startMonth"
          aria-label="Місяць початку"
          aria-invalid={!!errors.startMonth}
          aria-describedby={errors.startMonth ? "startMonth-error" : undefined}
          autoComplete="off"
        />{" "}
        <span>20</span>
        <input
          type="text"
          name="startYear"
          value={formData.startYear}
          onChange={(e) => handleChange(e, "startYear")}
          onFocus={() => handleFocus("startYear")}
          onBlur={() => handleBlur("startYear")}
          onKeyDown={(e) => handleDateKeyDown(e, "startYear", "endDay", "startMonth")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.startYear ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["startYear"] = el;
            else delete inputRefs.current["startYear"];
          }}
          data-error-field="startYear"
          aria-label="Рік початку (останні дві цифри)"
          aria-invalid={!!errors.startYear}
          aria-describedby={errors.startYear ? "startYear-error" : undefined}
          autoComplete="off"
        />{" "}
        р. по «{" "}
        <input
          type="text"
          name="endDay"
          value={formData.endDay}
          onChange={(e) => handleChange(e, "endDay")}
          onFocus={() => handleFocus("endDay")}
          onBlur={() => handleBlur("endDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "endDay", "endMonth", "startYear")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endDay ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["endDay"] = el;
            else delete inputRefs.current["endDay"];
          }}
          data-error-field="endDay"
          aria-label="День закінчення"
          aria-invalid={!!errors.endDay}
          aria-describedby={errors.endDay ? "endDay-error" : undefined}
          autoComplete="off"
        />{" "}
        »{" "}
        <input
          type="text"
          name="endMonth"
          value={formData.endMonth}
          onChange={(e) => handleChange(e, "endMonth")}
          onFocus={() => handleFocus("endMonth")}
          onBlur={() => handleBlur("endMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "endMonth", "endYear", "endDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endMonth ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["endMonth"] = el;
            else delete inputRefs.current["endMonth"];
          }}
          data-error-field="endMonth"
          aria-label="Місяць закінчення"
          aria-invalid={!!errors.endMonth}
          aria-describedby={errors.endMonth ? "endMonth-error" : undefined}
          autoComplete="off"
        />{" "}
        <span>20</span>
        <input
          type="text"
          name="endYear"
          value={formData.endYear}
          onChange={(e) => handleChange(e, "endYear")}
          onFocus={() => handleFocus("endYear")}
          onBlur={() => handleBlur("endYear")}
          onKeyDown={(e) => handleInputKeyDown(e, "endYear", null, "endMonth")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endYear ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["endYear"] = el;
            else delete inputRefs.current["endYear"];
          }}
          data-error-field="endYear"
          aria-label="Рік закінчення (останні дві цифри)"
          aria-invalid={!!errors.endYear}
          aria-describedby={errors.endYear ? "endYear-error" : undefined}
          autoComplete="off"
        />{" "}
        р.
      </p>
      {errors.startDay && (
        <p id="startDay-error" className={styles.error}>
          {errors.startDay}
        </p>
      )}
      {errors.startMonth && (
        <p id="startMonth-error" className={styles.error}>
          {errors.startMonth}
        </p>
      )}
      {errors.startYear && (
        <p id="startYear-error" className={styles.error}>
          {errors.startYear}
        </p>
      )}
      {errors.endDay && (
        <p id="endDay-error" className={styles.error}>
          {errors.endDay}
        </p>
      )}
      {errors.endMonth && (
        <p id="endMonth-error" className={styles.error}>
          {errors.endMonth}
        </p>
      )}
      {errors.endYear && (
        <p id="endYear-error" className={styles.error}>
          {errors.endYear}
        </p>
      )}
    </div>
  );
};

export default Page1Content;