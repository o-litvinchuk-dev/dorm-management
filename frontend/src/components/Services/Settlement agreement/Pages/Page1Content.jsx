import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";

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
  handleInputKeyDown,
  handleDateKeyDown,
  allFaculties,
  groupsForFaculty,
  allDormitories,
  dataLoading,
  isPresetActive,
  selectedPreset,
}) => {
  return (
    <div className={styles.contractText}>
      <h2 className={styles.centeredTitle}>1ДОГОВІР</h2>
      <p className={styles.centeredText}>
        про надання в тимчасове платне користування житлового приміщення в гуртожитку
      </p>
      <p className={styles.rightText}>
        м. Київ «
        <input
          type="text"
          name="proxyDay"
          value={formData.proxyDay || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("proxyDay")}
          onBlur={() => handleBlur("proxyDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "proxyDay", "proxyMonth", null)}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.proxyDay ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["proxyDay"] = el; }}
          data-error-field="proxyDay"
          aria-label="День довіреності"
        />
        »{" "}
        <input
          type="text"
          name="proxyMonth"
          value={formData.proxyMonth || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("proxyMonth")}
          onBlur={() => handleBlur("proxyMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "proxyMonth", "proxyYear", "proxyDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.proxyMonth ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["proxyMonth"] = el; }}
          data-error-field="proxyMonth"
          aria-label="Місяць довіреності"
        />{" "}
        <span>20</span>
        <input
          type="text"
          name="proxyYear"
          value={formData.proxyYear || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("proxyYear")}
          onBlur={() => handleBlur("proxyYear")}
          onKeyDown={(e) => handleDateKeyDown(e, "proxyYear", "faculty", "proxyMonth")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.proxyYear ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["proxyYear"] = el; }}
          data-error-field="proxyYear"
          aria-label="Рік довіреності (останні дві цифри)"
        />{" "}
        р., з одного боку і студент (аспірант, докторант)
      </p>
      {errors.proxyDay && ( <p id="proxyDay-error" className={styles.error}> {errors.proxyDay} </p> )}
      {errors.proxyMonth && ( <p id="proxyMonth-error" className={styles.error}> {errors.proxyMonth} </p> )}
      {errors.proxyYear && ( <p id="proxyYear-error" className={styles.error}> {errors.proxyYear} </p> )}
      <p className={styles.justifiedText}>
        <select
          name="faculty"
          value={formData.faculty || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("faculty")}
          onBlur={() => handleBlur("faculty")}
          onKeyDown={(e) => handleInputKeyDown(e, "faculty", "group", "proxyYear")}
          className={`${styles.inlineSelectFaculty} ${errors.faculty ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["faculty"] = el; }}
          data-error-field="faculty"
          aria-label="Факультет"
          disabled={dataLoading.faculties}
        >
          <option value="" disabled>{dataLoading.faculties ? "Завантаження..." : "Оберіть факультет"}</option>
          {allFaculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name}
            </option>
          ))}
        </select>{" "}
        ННІ/факультету,{" "}
        <select
          name="group"
          value={formData.group || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("group")}
          onBlur={() => handleBlur("group")}
          onKeyDown={(e) => handleInputKeyDown(e, "group", "course", "faculty")}
          className={`${styles.inlineSelectGroup} ${errors.group ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["group"] = el; }}
          data-error-field="group"
          aria-label="Група"
          disabled={!formData.faculty || dataLoading.groups || groupsForFaculty.length === 0}
        >
          <option value="" disabled>
            {dataLoading.groups ? "Завантаження..." :
            !formData.faculty ? "Спочатку факультет" :
            groupsForFaculty.length === 0 ? "Немає груп" : "Оберіть групу"}
          </option>
          {groupsForFaculty.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>{" "}
        групи,{" "}
        <input
          type="text"
          name="course"
          value={formData.course || ""}
          readOnly
          className={`${styles.inlineInputCourse} ${styles.readOnlyCourse} ${errors.course ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["course"] = el; }}
          data-error-field="course"
          aria-label="Курс (автоматично)"
          placeholder="Курс"
        />{" "}
        курсу
      </p>
      {errors.faculty && ( <p id="faculty-error" className={styles.error}> {errors.faculty} </p> )}
      {errors.group && ( <p id="group-error" className={styles.error}> {errors.group} </p> )}
      {errors.course && ( <p id="course-error" className={styles.error}> {errors.course} </p> )}

      <div className={styles.fullNameWrapper}>
        <input
          type="text"
          name="fullName"
          value={formData.fullName || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("fullName")}
          onBlur={() => handleBlur("fullName")}
          onKeyDown={(e) => handleInputKeyDown(e, "fullName", "passportSeries", "faculty")}
          className={`${styles.fullWidthInput} ${errors.fullName ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["fullName"] = el; }}
          data-error-field="fullName"
          aria-label="П.І.Б."
        />
        <span className={styles.inputLabel}>(П.І.Б.)</span>
      </div>
      {errors.fullName && ( <p id="fullName-error" className={styles.error}> {errors.fullName} </p> )}

      <p className={styles.justifiedText}>
        Паспорт серії{" "}
        <input
          type="text"
          name="passportSeries"
          value={formData.passportSeries || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("passportSeries")}
          onBlur={() => handleBlur("passportSeries")}
          onKeyDown={(e) => handleInputKeyDown(e, "passportSeries", "passportNumber", "fullName")}
          maxLength="2"
          placeholder="АБ"
          className={`${styles.inlineInput} ${errors.passportSeries ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["passportSeries"] = el; }}
          data-error-field="passportSeries"
          aria-label="Серія паспорта"
        />{" "}
        №{" "}
        <input
          type="text"
          name="passportNumber"
          value={formData.passportNumber || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("passportNumber")}
          onBlur={() => handleBlur("passportNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "passportNumber", "passportIssued", "passportSeries")}
          maxLength="6"
          placeholder="123456"
          className={`${styles.inlineInput} ${errors.passportNumber ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["passportNumber"] = el; }}
          data-error-field="passportNumber"
          aria-label="Номер паспорта"
        />{" "}
        виданий{" "}
        <input
          type="text"
          name="passportIssued"
          value={formData.passportIssued || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("passportIssued")}
          onBlur={() => handleBlur("passportIssued")}
          onKeyDown={(e) => handleInputKeyDown(e, "passportIssued", taxIdRefs.current[0]?.current ? `taxId[0]` : "dormStreet", "passportNumber")}
          className={`${styles.inlineInput} ${errors.passportIssued ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["passportIssued"] = el; }}
          data-error-field="passportIssued"
          aria-label="Ким виданий паспорт"
        />
      </p>
      {errors.passportSeries && ( <p id="passportSeries-error" className={styles.error}> {errors.passportSeries} </p> )}
      {errors.passportNumber && ( <p id="passportNumber-error" className={styles.error}> {errors.passportNumber} </p> )}
      {errors.passportIssued && ( <p id="passportIssued-error" className={styles.error}> {errors.passportIssued} </p> )}

      <div className={styles.taxIdWrapper}>
        <table className={styles.taxIdTable} role="grid" aria-label="Ідентифікаційний номер">
          <tbody>
            <tr>
              <td className={styles.taxIdLabel}>Ідентифікаційний номер</td>
              <td className={styles.taxIdInputs}>
                {Array.isArray(formData.taxId) && formData.taxId.map((char, index) => (
                  <input
                    key={index}
                    type="text"
                    value={char || ""}
                    onChange={(e) => handleTaxIdChange(index, e.target.value)}
                    onKeyDown={(e) => handleTaxIdKeyDown(index, e)}
                    onFocus={() => handleFocus(`taxId[${index}]`)}
                    onBlur={() => handleBlur(`taxId[${index}]`)}
                    maxLength="1"
                    className={`${styles.taxIdInput} ${errors.taxId && errors.taxId[index] ? styles.errorInput : ""}`}
                    ref={taxIdRefs.current[index]}
                    data-error-field={`taxId[${index}]`}
                    aria-label={`Цифра ${index + 1} ІПН`}
                  />
                ))}
              </td>
            </tr>
          </tbody>
        </table>
        {errors.taxId && typeof errors.taxId === "string" && (
          <p id="taxId-error" className={styles.error}> {errors.taxId} </p>
        )}
        {errors.taxId && Array.isArray(errors.taxId) && errors.taxId.map((error, index) =>
          error && typeof error === 'string' ? (
            <p key={index} id={`taxId-${index}-error`} className={styles.error}> {error} </p>
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
          value={formData.dormStreet || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("dormStreet")}
          onBlur={() => handleBlur("dormStreet")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormStreet", "dormBuilding", taxIdRefs.current[9]?.current ? `taxId[9]` : "passportIssued")}
          className={`${styles.inlineInput} ${errors.dormStreet ? styles.errorInput : ""} ${isPresetActive && selectedPreset?.dormitory_address ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["dormStreet"] = el; }}
          data-error-field="dormStreet"
          aria-label="Вулиця гуртожитку"
          readOnly={isPresetActive && !!selectedPreset?.dormitory_address}
          disabled={dataLoading.preset}
        />{" "}
        буд.{" "}
        <input
          type="text"
          name="dormBuilding"
          value={formData.dormBuilding || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("dormBuilding")}
          onBlur={() => handleBlur("dormBuilding")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormBuilding", "dormNumber", "dormStreet")}
          className={`${styles.inlineInput} ${errors.dormBuilding ? styles.errorInput : ""} ${isPresetActive && selectedPreset?.dormitory_address ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["dormBuilding"] = el; }}
          data-error-field="dormBuilding"
          aria-label="Будинок гуртожитку"
          readOnly={isPresetActive && !!selectedPreset?.dormitory_address}
          disabled={dataLoading.preset}
        />{" "}
        гуртожиток №{" "}
        <select
          name="dormNumber"
          value={formData.dormNumber || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("dormNumber")}
          onBlur={() => handleBlur("dormNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormNumber", "roomNumber", "dormBuilding")}
          className={`${styles.inlineSelectDorm} ${errors.dormNumber ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["dormNumber"] = el; }}
          data-error-field="dormNumber"
          aria-label="Номер гуртожитку"
          disabled={dataLoading.dormitories || dataLoading.preset}
        >
          <option value="" disabled>{dataLoading.dormitories ? "Завантаження..." : "Оберіть гуртожиток"}</option>
          {allDormitories.map(dorm => (
            <option key={dorm.id} value={dorm.id}>{dorm.name}</option>
          ))}
        </select>{" "}
        кімната №{" "}
        <input
          type="text"
          name="roomNumber"
          value={formData.roomNumber || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("roomNumber")}
          onBlur={() => handleBlur("roomNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "roomNumber", "startDay", "dormNumber")}
          className={`${styles.inlineInput} ${errors.roomNumber ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["roomNumber"] = el; }}
          data-error-field="roomNumber"
          aria-label="Номер кімнати"
        />
      </p>
      {errors.dormStreet && ( <p id="dormStreet-error" className={styles.error}> {errors.dormStreet} </p> )}
      {errors.dormBuilding && ( <p id="dormBuilding-error" className={styles.error}> {errors.dormBuilding} </p> )}
      {errors.dormNumber && ( <p id="dormNumber-error" className={styles.error}> {errors.dormNumber} </p> )}
      {errors.roomNumber && ( <p id="roomNumber-error" className={styles.error}> {errors.roomNumber} </p> )}
      <p className={styles.justifiedText}>
        Строк користування житловим приміщенням за цим договором становить з «{" "}
        <input
          type="text"
          name="startDay"
          value={formData.startDay || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("startDay")}
          onBlur={() => handleBlur("startDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "startDay", "startMonth", "roomNumber")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.startDay ? styles.errorInput : ""} ${isPresetActive && selectedPreset?.start_date ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["startDay"] = el; }}
          data-error-field="startDay"
          aria-label="День початку"
          readOnly={isPresetActive && !!selectedPreset?.start_date}
          disabled={dataLoading.preset}
        />{" "}
        »{" "}
        <input
          type="text"
          name="startMonth"
          value={formData.startMonth || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("startMonth")}
          onBlur={() => handleBlur("startMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "startMonth", "startYear", "startDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.startMonth ? styles.errorInput : ""} ${isPresetActive && selectedPreset?.start_date ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["startMonth"] = el; }}
          data-error-field="startMonth"
          aria-label="Місяць початку"
          readOnly={isPresetActive && !!selectedPreset?.start_date}
          disabled={dataLoading.preset}
        />{" "}
        <span>20</span>
        <input
          type="text"
          name="startYear"
          value={formData.startYear || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("startYear")}
          onBlur={() => handleBlur("startYear")}
          onKeyDown={(e) => handleDateKeyDown(e, "startYear", "endDay", "startMonth")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.startYear ? styles.errorInput : ""} ${isPresetActive && selectedPreset?.start_date ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["startYear"] = el; }}
          data-error-field="startYear"
          aria-label="Рік початку (останні дві цифри)"
          readOnly={isPresetActive && !!selectedPreset?.start_date}
          disabled={dataLoading.preset}
        />{" "}
        р. по «{" "}
        <input
          type="text"
          name="endDay"
          value={formData.endDay || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("endDay")}
          onBlur={() => handleBlur("endDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "endDay", "endMonth", "startYear")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endDay ? styles.errorInput : ""} ${isPresetActive && selectedPreset?.end_date ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["endDay"] = el; }}
          data-error-field="endDay"
          aria-label="День закінчення"
          readOnly={isPresetActive && !!selectedPreset?.end_date}
          disabled={dataLoading.preset}
        />{" "}
        »{" "}
        <input
          type="text"
          name="endMonth"
          value={formData.endMonth || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("endMonth")}
          onBlur={() => handleBlur("endMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "endMonth", "endYear", "endDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endMonth ? styles.errorInput : ""} ${isPresetActive && selectedPreset?.end_date ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["endMonth"] = el; }}
          data-error-field="endMonth"
          aria-label="Місяць закінчення"
          readOnly={isPresetActive && !!selectedPreset?.end_date}
          disabled={dataLoading.preset}
        />{" "}
        <span>20</span>
        <input
          type="text"
          name="endYear"
          value={formData.endYear || ""}
          onChange={handleChange}
          onFocus={() => handleFocus("endYear")}
          onBlur={() => handleBlur("endYear")}
          onKeyDown={(e) => handleInputKeyDown(e, "endYear", null, "endMonth")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endYear ? styles.errorInput : ""} ${isPresetActive && selectedPreset?.end_date ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["endYear"] = el; }}
          data-error-field="endYear"
          aria-label="Рік закінчення (останні дві цифри)"
          readOnly={isPresetActive && !!selectedPreset?.end_date}
          disabled={dataLoading.preset}
        />{" "}
        р.
      </p>
      {errors.startDay && ( <p id="startDay-error" className={styles.error}> {errors.startDay} </p> )}
      {errors.startMonth && ( <p id="startMonth-error" className={styles.error}> {errors.startMonth} </p> )}
      {errors.startYear && ( <p id="startYear-error" className={styles.error}> {errors.startYear} </p> )}
      {errors.endDay && ( <p id="endDay-error" className={styles.error}> {errors.endDay} </p> )}
      {errors.endMonth && ( <p id="endMonth-error" className={styles.error}> {errors.endMonth} </p> )}
      {errors.endYear && ( <p id="endYear-error" className={styles.error}> {errors.endYear} </p> )}
    </div>
  );
};

export default Page1Content;