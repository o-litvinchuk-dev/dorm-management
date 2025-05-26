// src/components/Services/Settlement agreement/Pages/Page1Content.jsx
import React, { useEffect } from "react";
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
  autoSelectedRoomInfo,
}) => {
  const roomSourceText = () => {
    if (autoSelectedRoomInfo.source === 'reservation') return "(З вашого бронювання)";
    if (autoSelectedRoomInfo.source === 'auto-select') return "(Автоматично підібрано)";
    return "";
  };

  useEffect(() => {
    if (
        (!formData.contractDay && !formData.contractMonth && !formData.contractYear) &&
        !(isPresetActive && selectedPreset?.contract_date)
    ) {
        const today = new Date();
        handleChange({ target: { name: 'contractDay', value: String(today.getDate()).padStart(2, '0') } });
        handleChange({ target: { name: 'contractMonth', value: String(today.getMonth() + 1).padStart(2, '0') } });
        handleChange({ target: { name: 'contractYear', value: String(today.getFullYear()).slice(-2) } });
    }
  }, [
        formData.contractDay, formData.contractMonth, formData.contractYear,
        handleChange, 
        isPresetActive, selectedPreset
    ]);


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
          name="contractDay"
          value={formData.contractDay || ""}
          onChange={(e) => handleChange(e, "contractDay")}
          onFocus={() => handleFocus("contractDay")}
          onBlur={() => handleBlur("contractDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "contractDay", "contractMonth", null)}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.contractDay ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["contractDay"] = el; }}
          data-error-field="contractDay"
          aria-label="День укладання договору"
        />
        »{" "}
        <input
          type="text"
          name="contractMonth"
          value={formData.contractMonth || ""}
          onChange={(e) => handleChange(e, "contractMonth")}
          onFocus={() => handleFocus("contractMonth")}
          onBlur={() => handleBlur("contractMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "contractMonth", "contractYear", "contractDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.contractMonth ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["contractMonth"] = el; }}
          data-error-field="contractMonth"
          aria-label="Місяць укладання договору"
        />{" "}
        <span>20</span>
        <input
          type="text"
          name="contractYear"
          value={formData.contractYear || ""}
          onChange={(e) => handleChange(e, "contractYear")}
          onFocus={() => handleFocus("contractYear")}
          onBlur={() => handleBlur("contractYear")}
          onKeyDown={(e) => handleDateKeyDown(e, "contractYear", "proxyNumber", "contractMonth")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.contractYear ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["contractYear"] = el; }}
          data-error-field="contractYear"
          aria-label="Рік укладання договору (останні дві цифри)"
        />{" "}
        р.
      </p>
      {errors.contractDay && ( <p id="contractDay-error" className={styles.error}> {errors.contractDay} </p> )}
      {errors.contractMonth && ( <p id="contractMonth-error" className={styles.error}> {errors.contractMonth} </p> )}
      {errors.contractYear && ( <p id="contractYear-error" className={styles.error}> {errors.contractYear} </p> )}

      <p className={styles.justifiedText}>
          Національний університет біоресурсів і природокористування України (далі – Університет), в особі
          проректора з науково-педагогічної роботи та студентських справ Стецюка Сергія Васильовича, що діє на підставі довіреності №{" "}
        <input
          type="text"
          name="proxyNumber"
          value={formData.proxyNumber || ""}
          onChange={(e) => handleChange(e, "proxyNumber")}
          onFocus={() => handleFocus("proxyNumber")}
          onBlur={() => handleBlur("proxyNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "proxyNumber", "proxyDay", "contractYear")}
          className={`${styles.inlineInput} ${errors.proxyNumber ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["proxyNumber"] = el; }}
          data-error-field="proxyNumber"
          aria-label="Номер довіреності"
          style={{width: '80px'}}
        />
        {" "}від «{" "}
        <input
          type="text"
          name="proxyDay"
          value={formData.proxyDay || ""}
          onChange={(e) => handleChange(e, "proxyDay")}
          onFocus={() => handleFocus("proxyDay")}
          onBlur={() => handleBlur("proxyDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "proxyDay", "proxyMonth", "proxyNumber")}
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
          onChange={(e) => handleChange(e, "proxyMonth")}
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
          onChange={(e) => handleChange(e, "proxyYear")}
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
      {errors.proxyNumber && ( <p id="proxyNumber-error" className={styles.error}> {errors.proxyNumber} </p> )}
      {errors.proxyDay && ( <p id="proxyDay-error" className={styles.error}> {errors.proxyDay} </p> )}
      {errors.proxyMonth && ( <p id="proxyMonth-error" className={styles.error}> {errors.proxyMonth} </p> )}
      {errors.proxyYear && ( <p id="proxyYear-error" className={styles.error}> {errors.proxyYear} </p> )}


      <p className={styles.justifiedText}>
        <select
          name="faculty"
          value={formData.faculty || ""}
          onChange={(e) => handleChange(e, "faculty")}
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
          onChange={(e) => handleChange(e, "group")}
          onFocus={() => handleFocus("group")}
          onBlur={() => handleBlur("group")}
          onKeyDown={(e) => handleInputKeyDown(e, "group", "fullName", "faculty")} // Next is fullName or course if course becomes interactive
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
          readOnly // Course is typically derived from group
          className={`${styles.inlineInputCourse} ${styles.readOnlyCourse} ${errors.course ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["course"] = el; }}
          data-error-field="course"
          aria-label="Курс (автоматично)"
          placeholder="Курс"
          // onKeyDown={(e) => handleInputKeyDown(e, "course", "fullName", "group")} // If it were interactive
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
          onChange={(e) => handleChange(e, "fullName")}
          onFocus={() => handleFocus("fullName")}
          onBlur={() => handleBlur("fullName")}
          onKeyDown={(e) => handleInputKeyDown(e, "fullName", "passportSeries", "group")}
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
          onChange={(e) => handleChange(e, "passportSeries")}
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
          onChange={(e) => handleChange(e, "passportNumber")}
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
          onChange={(e) => handleChange(e, "passportIssued")}
          onFocus={() => handleFocus("passportIssued")}
          onBlur={() => handleBlur("passportIssued")}
          onKeyDown={(e) => handleInputKeyDown(e, "passportIssued", taxIdRefs.current[0]?.current ? `taxId[0]` : "dormStreet", "passportNumber")}
          className={`${styles.inlineInput} ${errors.passportIssued ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["passportIssued"] = el; }}
          data-error-field="passportIssued"
          aria-label="Ким виданий паспорт"
          style={{width: '300px'}}
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
                    className={`${styles.taxIdInput} ${errors.taxId && (typeof errors.taxId === 'string' || errors.taxId[index]) ? styles.errorInput : ""}`}
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
        {errors.taxId && Array.isArray(errors.taxId) && errors.taxId.some(e => e) && !errors.taxId.every(e => !e) && typeof errors.taxId !== "string" && (
            <p id="taxId-array-error" className={styles.error}>ІПН має містити 10 цифр.</p>
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
          onChange={(e) => handleChange(e, "dormStreet")}
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
          onChange={(e) => handleChange(e, "dormBuilding")}
          onFocus={() => handleFocus("dormBuilding")}
          onBlur={() => handleBlur("dormBuilding")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormBuilding", "dormNumber", "dormStreet")}
          className={`${styles.inlineInput} ${styles.shortInlineInput} ${errors.dormBuilding ? styles.errorInput : ""} ${isPresetActive && selectedPreset?.dormitory_address ? styles.readOnlyField : ""}`}
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
          onChange={(e) => handleChange(e, "dormNumber")}
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
          onChange={(e) => handleChange(e, "roomNumber")}
          onFocus={() => handleFocus("roomNumber")}
          onBlur={() => handleBlur("roomNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "roomNumber", "academicYearStart", "dormNumber")} // Next field changed to academicYearStart
          className={`${styles.inlineInput} ${styles.shortInlineInput} ${errors.roomNumber ? styles.errorInput : ""} ${
            autoSelectedRoomInfo.source === 'reservation' ? styles.readOnlyField : ''
          }`}
          ref={(el) => { inputRefs.current["roomNumber"] = el; }}
          data-error-field="roomNumber"
          aria-label="Номер кімнати"
          readOnly={autoSelectedRoomInfo.source === 'reservation'}
          disabled={dataLoading.autoSelectRooms || dataLoading.preset}
        />
        {autoSelectedRoomInfo.source && autoSelectedRoomInfo.source !== 'manual' && (
          <span className={styles.roomSourceInfo}>
            {roomSourceText()}
          </span>
        )}
      </p>
      {errors.dormStreet && ( <p id="dormStreet-error" className={styles.error}> {errors.dormStreet} </p> )}
      {errors.dormBuilding && ( <p id="dormBuilding-error" className={styles.error}> {errors.dormBuilding} </p> )}
      {errors.dormNumber && ( <p id="dormNumber-error" className={styles.error}> {errors.dormNumber} </p> )}
      {errors.roomNumber && ( <p id="roomNumber-error" className={styles.error}> {errors.roomNumber} </p> )}

      <p className={styles.justifiedText}>
        Навчальний рік:{" "}
        <input
          type="text"
          name="academicYearStart"
          value={formData.academicYearStart || ""}
          onChange={(e) => handleChange(e, "academicYearStart")}
          onFocus={() => handleFocus("academicYearStart")}
          onBlur={() => handleBlur("academicYearStart")}
          onKeyDown={(e) => handleInputKeyDown(e, "academicYearStart", "academicYearEnd", "roomNumber")}
          maxLength="4"
          placeholder="РРРР"
          className={`${styles.inlineInputYear} ${errors.academicYearStart ? styles.errorInput : ""}  ${(isPresetActive && selectedPreset?.academic_year) ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["academicYearStart"] = el; }}
          data-error-field="academicYearStart"
          aria-label="Початок навчального року (РРРР)"
          readOnly={(isPresetActive && !!selectedPreset?.academic_year)}
          disabled={dataLoading.preset}
        />
        {" / "}
        <input
          type="text"
          name="academicYearEnd"
          value={formData.academicYearEnd || ""}
          onChange={(e) => handleChange(e, "academicYearEnd")}
          onFocus={() => handleFocus("academicYearEnd")}
          onBlur={() => handleBlur("academicYearEnd")}
          onKeyDown={(e) => handleInputKeyDown(e, "academicYearEnd", "startDay", "academicYearStart")}
          maxLength="4"
          placeholder="РРРР"
          className={`${styles.inlineInputYear} ${errors.academicYearEnd ? styles.errorInput : ""}  ${(isPresetActive && selectedPreset?.academic_year) ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["academicYearEnd"] = el; }}
          data-error-field="academicYearEnd"
          aria-label="Кінець навчального року (РРРР)"
          readOnly={(isPresetActive && !!selectedPreset?.academic_year)}
          disabled={dataLoading.preset}
        />
      </p>
      {errors.academicYearStart && ( <p id="academicYearStart-error" className={styles.error}> {errors.academicYearStart} </p> )}
      {errors.academicYearEnd && ( <p id="academicYearEnd-error" className={styles.error}> {errors.academicYearEnd} </p> )}


      <p className={styles.justifiedText}>
        Строк користування житловим приміщенням за цим договором становить з «{" "}
        <input
          type="text"
          name="startDay"
          value={formData.startDay || ""}
          onChange={(e) => handleChange(e, "startDay")}
          onFocus={() => handleFocus("startDay")}
          onBlur={() => handleBlur("startDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "startDay", "startMonth", "academicYearEnd")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.startDay ? styles.errorInput : ""} ${
            (isPresetActive && selectedPreset?.start_date) ? styles.readOnlyField : ""
          }`}
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
          onChange={(e) => handleChange(e, "startMonth")}
          onFocus={() => handleFocus("startMonth")}
          onBlur={() => handleBlur("startMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "startMonth", "startYear", "startDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.startMonth ? styles.errorInput : ""} ${
            (isPresetActive && selectedPreset?.start_date) ? styles.readOnlyField : ""
          }`}
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
          onChange={(e) => handleChange(e, "startYear")}
          onFocus={() => handleFocus("startYear")}
          onBlur={() => handleBlur("startYear")}
          onKeyDown={(e) => handleDateKeyDown(e, "startYear", "endDay", "startMonth")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.startYear ? styles.errorInput : ""} ${
            (isPresetActive && selectedPreset?.start_date) ? styles.readOnlyField : ""
          }`}
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
          onChange={(e) => handleChange(e, "endDay")}
          onFocus={() => handleFocus("endDay")}
          onBlur={() => handleBlur("endDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "endDay", "endMonth", "startYear")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endDay ? styles.errorInput : ""} ${
            (isPresetActive && selectedPreset?.end_date) ? styles.readOnlyField : ""
          }`}
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
          onChange={(e) => handleChange(e, "endMonth")}
          onFocus={() => handleFocus("endMonth")}
          onBlur={() => handleBlur("endMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "endMonth", "endYear", "endDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endMonth ? styles.errorInput : ""} ${
            (isPresetActive && selectedPreset?.end_date) ? styles.readOnlyField : ""
          }`}
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
          onChange={(e) => handleChange(e, "endYear")}
          onFocus={() => handleFocus("endYear")}
          onBlur={() => handleBlur("endYear")}
          onKeyDown={(e) => handleInputKeyDown(e, "endYear", "applicationDateDay", "endMonth")} // Next field will be applicationDateDay
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endYear ? styles.errorInput : ""} ${
            (isPresetActive && selectedPreset?.end_date) ? styles.readOnlyField : ""
          }`}
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

      <p className={styles.rightText} style={{marginTop: "20px"}}>
        Дата подання заяви: «
        <input
          type="text"
          name="applicationDateDay"
          value={formData.applicationDateDay || ""}
          onChange={(e) => handleChange(e, "applicationDateDay")}
          onFocus={() => handleFocus("applicationDateDay")}
          onBlur={() => handleBlur("applicationDateDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "applicationDateDay", "applicationDateMonth", "endYear")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.applicationDateDay ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["applicationDateDay"] = el; }}
          data-error-field="applicationDateDay"
          aria-label="День подання заяви"
        />
        »{" "}
        <input
          type="text"
          name="applicationDateMonth"
          value={formData.applicationDateMonth || ""}
          onChange={(e) => handleChange(e, "applicationDateMonth")}
          onFocus={() => handleFocus("applicationDateMonth")}
          onBlur={() => handleBlur("applicationDateMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "applicationDateMonth", "applicationDateYear", "applicationDateDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.applicationDateMonth ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["applicationDateMonth"] = el; }}
          data-error-field="applicationDateMonth"
          aria-label="Місяць подання заяви"
        />{" "}
        <span>20</span>
        <input
          type="text"
          name="applicationDateYear"
          value={formData.applicationDateYear || ""}
          onChange={(e) => handleChange(e, "applicationDateYear")}
          onFocus={() => handleFocus("applicationDateYear")}
          onBlur={() => handleBlur("applicationDateYear")}
           onKeyDown={(e) => handleDateKeyDown(e, "applicationDateYear", null, "applicationDateMonth")} // Assuming this is the last field on this page before page turn
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.applicationDateYear ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["applicationDateYear"] = el; }}
          data-error-field="applicationDateYear"
          aria-label="Рік подання заяви (останні дві цифри)"
        />{" "}
        р.
      </p>
      {errors.applicationDateDay && ( <p id="applicationDateDay-error" className={styles.error}> {errors.applicationDateDay} </p> )}
      {errors.applicationDateMonth && ( <p id="applicationDateMonth-error" className={styles.error}> {errors.applicationDateMonth} </p> )}
      {errors.applicationDateYear && ( <p id="applicationDateYear-error" className={styles.error}> {errors.applicationDateYear} </p> )}
    </div>
  );
};

export default Page1Content;