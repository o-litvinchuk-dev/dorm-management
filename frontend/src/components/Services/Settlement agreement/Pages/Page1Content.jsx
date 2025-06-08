import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";
import { getNestedError } from "../../../../pages/Services/Settlement agreement/helpers";

const Page1Content = ({
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  inputRefs,
  taxIdRefs,
  allFaculties,
  groupsForFaculty,
  allDormitories,
  userApprovedApps,
  dataLoading,
  isPresetActive,
  selectedPreset,
  autoSelectedRoomInfo,
}) => {
  const handleTaxIdChange = (e, index) => {
    const { value } = e.target;
    if (!/^\d*$/.test(value)) return;
    
    const newTaxId = [...formData.taxId];
    newTaxId[index] = value;
    
    handleChange({ target: { name: 'taxId', value: newTaxId } });

    if (value.length === 1 && index < 9) {
      taxIdRefs.current[index + 1]?.current?.focus();
    }
  };
  
  const handleTaxIdKeyDown = (e, index) => {
    if (e.key === "Backspace" && !formData.taxId[index] && index > 0) {
      e.preventDefault(); 
      taxIdRefs.current[index - 1]?.current?.focus();
    } 
    else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      taxIdRefs.current[index - 1]?.current?.focus();
    } else if (e.key === "ArrowRight" && index < 9) {
      e.preventDefault();
      taxIdRefs.current[index + 1]?.current?.focus();
    } 
    else if ((e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) && index === 9) {
       e.preventDefault();
       const nextMainInput = inputRefs.current["dormNumber"] || inputRefs.current["dormStreet"];
       if (nextMainInput) {
          nextMainInput.focus();
       }
    }
  };

  const getDormNameById = (dormId) => {
    if (!dormId || !allDormitories) return "";
    const dorm = allDormitories.find(d => String(d.id) === String(dormId));
    return dorm ? dorm.name : "";
  };

  const handleInputKeyDown = (e, nextField, prevField) => {
    if ((e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) && inputRefs.current[nextField]) {
        e.preventDefault();
        inputRefs.current[nextField].focus();
    } else if (e.key === "Tab" && e.shiftKey && inputRefs.current[prevField]) {
        e.preventDefault();
        inputRefs.current[prevField].focus();
    }
  };

  const handleDateKeyDown = (e, currentField, nextField, prevField) => {
     if (e.key === "ArrowRight" && formData[currentField]?.length >= e.target.maxLength) {
          if (inputRefs.current[nextField]) inputRefs.current[nextField].focus();
      } else if (e.key === "ArrowLeft" && formData[currentField]?.length === 0) {
          if (inputRefs.current[prevField]) inputRefs.current[prevField].focus();
      } else handleInputKeyDown(e, nextField, prevField);
  };
  
  const taxIdTouched = formData.taxId.some((_, index) => touched[`taxId[${index}]`]);
  
  const roomSourceText = () => {
    if (autoSelectedRoomInfo?.source === 'reservation') return "(З вашого бронювання)";
    if (autoSelectedRoomInfo?.source === 'application') return "(Призначено у заявці)";
    if (autoSelectedRoomInfo?.source === 'auto-select') return "(Автоматично підібрано)";
    return "";
  };
  
  return (
    <div className={styles.contractText}>
      <h2 className={styles.centeredTitle}>ДОГОВІР</h2>
      <p className={styles.centeredText}>
        про надання в тимчасове платне користування житлового приміщення в гуртожитку
      </p>
      
      <div className={styles.dateRight}>
        м. Київ «
        <input
          type="text" name="contractDay" value={formData.contractDay || ""}
          onChange={handleChange} onBlur={handleBlur} onKeyDown={(e) => handleDateKeyDown(e, "contractDay", "contractMonth", null)}
          maxLength="2" placeholder="__"
          className={`${styles.inlineInputDate} ${touched.contractDay && getNestedError(errors, 'contractDay') ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["contractDay"] = el; }}
        />
        »{" "}
        <input
          type="text" name="contractMonth" value={formData.contractMonth || ""}
          onChange={handleChange} onBlur={handleBlur} onKeyDown={(e) => handleDateKeyDown(e, "contractMonth", "contractYear", "contractDay")}
          maxLength="2" placeholder="__"
          className={`${styles.inlineInputDate} ${touched.contractMonth && getNestedError(errors, 'contractMonth') ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["contractMonth"] = el; }}
        />{" "}
        <span>20</span>
        <input
          type="text" name="contractYear" value={formData.contractYear || ""}
          onChange={handleChange} onBlur={handleBlur} onKeyDown={(e) => handleInputKeyDown(e, "contractYear", "applicationId", "contractMonth")}
          maxLength="2" placeholder="__"
          className={`${styles.inlineInputDate} ${touched.contractYear && getNestedError(errors, 'contractYear') ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["contractYear"] = el; }}
        />{" "}р.
      </div>
      
      <p className={styles.justifiedText}>
          Національний університет біоресурсів і природокористування України (далі – Університет), в особі
          проректора з науково-педагогічної роботи та студентських справ Стецюка Сергія Васильовича, що діє на підставі довіреності №{" "}
        <select
          name="applicationId"
          value={formData.applicationId || ""}
          onChange={handleChange} onBlur={handleBlur}
          onKeyDown={(e) => handleInputKeyDown(e, "faculty", "contractYear")}
          className={`${styles.inlineInput} ${touched.applicationId && getNestedError(errors, 'applicationId') ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["applicationId"] = el; }}
          disabled={dataLoading.userApps} style={{width: '200px'}}
        >
          <option value="" disabled>{dataLoading.userApps ? "Завантаження..." : "Оберіть вашу заявку"}</option>
          {userApprovedApps.map(app => (
            <option key={app.id} value={app.id}>Заявка №{app.id}</option>
          ))}
        </select>
        {" "}від «{" "}
        <input type="text" name="proxyDay" value={formData.proxyDay || ""} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        »{" "}
        <input type="text" name="proxyMonth" value={formData.proxyMonth || ""} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />{" "}
        <span>20</span>
        <input type="text" name="proxyYear" value={formData.proxyYear || ""} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />{" "}
        р., з одного боку і студент (аспірант, докторант)
      </p>
      {touched.applicationId && getNestedError(errors, 'applicationId') && <p className={styles.error}>{getNestedError(errors, 'applicationId')}</p>}
      
      <p className={styles.justifiedText}>
        <select
          name="faculty" value={formData.faculty || ""} onChange={handleChange} onBlur={handleBlur}
          onKeyDown={(e) => handleInputKeyDown(e, "group", "applicationId")}
          className={`${styles.inlineSelectFaculty} ${touched.faculty && getNestedError(errors, 'faculty') ? styles.errorInput : ""} ${!!formData.faculty ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["faculty"] = el; }} disabled={dataLoading.faculties || !!formData.faculty}
        >
          <option value="" disabled>{dataLoading.faculties ? "Завантаження..." : "Оберіть факультет"}</option>
          {allFaculties.map((faculty) => (<option key={faculty.id} value={faculty.id}>{faculty.name}</option>))}
        </select>{" "}
        ННІ/факультету,{" "}
        <select
          name="group" value={formData.group || ""} onChange={handleChange} onBlur={handleBlur}
          onKeyDown={(e) => handleInputKeyDown(e, "fullName", "faculty")}
          className={`${styles.inlineSelectGroup} ${touched.group && getNestedError(errors, 'group') ? styles.errorInput : ""} ${!!formData.group ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["group"] = el; }}
          disabled={!formData.faculty || dataLoading.groups || groupsForFaculty.length === 0 || !!formData.group}
        >
          <option value="" disabled>{dataLoading.groups ? "Завантаження..." : !formData.faculty ? "Спочатку факультет" : groupsForFaculty.length === 0 ? "Немає груп" : "Оберіть групу"}</option>
          {groupsForFaculty.map((group) => (<option key={group.id} value={group.id}>{group.name}</option>))}
        </select>{" "}
        групи,{" "}
        <input
          type="text" name="course" value={formData.course || ""} readOnly
          className={`${styles.inlineInputCourse} ${styles.readOnlyField}`} ref={(el) => { inputRefs.current["course"] = el; }} placeholder="Курс"
        />{" "}
        курсу
      </p>
      
      <div className={styles.fullNameWrapper}>
        <input
          type="text" name="fullName" value={formData.fullName || ""} readOnly
          className={`${styles.fullWidthInput} ${styles.readOnlyField}`}
          ref={(el) => { inputRefs.current["fullName"] = el; }}
        />
        <span className={styles.inputLabel}>(П.І.Б.)</span>
      </div>

      <p className={styles.justifiedText}>
        Паспорт серії{" "}
        <input
          type="text" name="passportSeries" value={formData.passportSeries || ""}
          onChange={handleChange} onBlur={handleBlur} onKeyDown={(e) => handleInputKeyDown(e, "passportNumber", "fullName")}
          maxLength="2" placeholder="АБ"
          className={`${styles.inlineInput} ${touched.passportSeries && getNestedError(errors, 'passportSeries') ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["passportSeries"] = el; }}
        />{" "}
        №{" "}
        <input
          type="text" name="passportNumber" value={formData.passportNumber || ""}
          onChange={handleChange} onBlur={handleBlur} onKeyDown={(e) => handleInputKeyDown(e, "passportIssued", "passportSeries")}
          maxLength="6" placeholder="123456"
          className={`${styles.inlineInput} ${touched.passportNumber && getNestedError(errors, 'passportNumber') ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["passportNumber"] = el; }}
        />{" "}
        виданий{" "}
        <input
          type="text" name="passportIssued" value={formData.passportIssued || ""}
          onChange={handleChange} onBlur={handleBlur} onKeyDown={(e) => handleInputKeyDown(e, "taxId[0]", "passportNumber")}
          className={`${styles.inlineInput} ${touched.passportIssued && getNestedError(errors, 'passportIssued') ? styles.errorInput : ""}`}
          ref={(el) => { inputRefs.current["passportIssued"] = el; }}
          style={{width: '300px'}}
        />
      </p>
      
      <div className={styles.taxIdWrapper}>
        <span className={styles.taxIdLabel}>Ідентифікаційний номер</span>
        <div className={styles.taxIdInputs}>
            {Array.isArray(formData.taxId) && formData.taxId.map((char, index) => (
              <input
                key={index}
                type="text"
                name={`taxId[${index}]`}
                value={char || ""}
                onChange={(e) => handleTaxIdChange(e, index)}
                onKeyDown={(e) => handleTaxIdKeyDown(e, index)}
                onBlur={handleBlur}
                maxLength="1"
                className={`${styles.taxIdInput} ${taxIdTouched && getNestedError(errors, 'taxId') ? styles.errorInput : ""}`}
                ref={taxIdRefs.current[index]}
                autoComplete="off"
              />
            ))}
        </div>
      </div>
      {taxIdTouched && getNestedError(errors, 'taxId') && <p className={styles.error}>{getNestedError(errors, 'taxId')}</p>}

      <p className={styles.justifiedText}>
        (далі - Мешканець), з іншого боку (далі разом Сторони, а кожна окремо Сторона), уклали цей Договір (далі - Договір) про наступне:
      </p>
      <h3 className={styles.centeredTitle}>1. ПРЕДМЕТ ДОГОВОРУ</h3>
      <p className={styles.justifiedText}>
        1.1. Університет надає, а Мешканець приймає в тимчасове платне користування житлове
        приміщення (ліжко місце, кімната) для проживання та місця загального користування...
      </p>
      
      <div className={styles.justifiedText}>
        Житлове приміщення знаходиться за адресою м. Київ вул.{" "}
        <input
          type="text" name="dormStreet" value={formData.dormStreet || ""} readOnly
          className={`${styles.inlineInput} ${styles.readOnlyField}`}
          ref={(el) => { inputRefs.current["dormStreet"] = el; }}
        />{" "}
        буд.{" "}
        <input
          type="text" name="dormBuilding" value={formData.dormBuilding || ""} readOnly
          className={`${styles.inlineInput} ${styles.shortInlineInput} ${styles.readOnlyField}`}
          ref={(el) => { inputRefs.current["dormBuilding"] = el; }}
        />{" "}
        гуртожиток №{" "}
        <input
          type="text" name="dormNumberDisplay" value={getDormNameById(formData.dormNumber)} readOnly
          className={`${styles.inlineSelectDorm} ${styles.readOnlyField}`}
          ref={(el) => { inputRefs.current["dormNumber"] = el; }}
        />{" "}
        кімната №{" "}
        <div className={styles.roomNumberWrapper}>
           <input
              type="text"
              name="roomNumber"
              value={formData.roomNumber || ""}
              readOnly
              className={`${styles.inlineInput} ${styles.shortInlineInput} ${styles.readOnlyField} ${touched.roomNumber && getNestedError(errors, 'roomNumber') ? styles.errorInput : ""}`}
              ref={(el) => { inputRefs.current["roomNumber"] = el; }}
              placeholder={dataLoading.autoSelectRooms ? "Пошук..." : "–"}
              aria-label="Номер кімнати (заповнюється автоматично)"
            />
            {autoSelectedRoomInfo?.source && autoSelectedRoomInfo.source !== 'manual' && (
              <span className={styles.roomSourceInfo}>{roomSourceText()}</span>
            )}
        </div>
      </div>
      {dataLoading.autoSelectRooms && (
        <p className={styles.infoText}>Автоматичний пошук призначеної вам кімнати...</p>
      )}
      {!dataLoading.autoSelectRooms && !formData.roomNumber && formData.applicationId && (
        <p className={styles.warningText}>Кімнату ще не призначено. Переконайтесь, що вашу заявку затверджено комендантом, або оберіть іншу заявку, якщо є.</p>
      )}
      {getNestedError(errors, 'roomNumber') && <p className={styles.error}>{getNestedError(errors, 'roomNumber')}</p>}

      <p className={styles.justifiedText}>
        Строк користування житловим приміщенням... з «{" "}
        <input type="text" name="startDay" value={formData.startDay || ""} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        »{" "}
        <input type="text" name="startMonth" value={formData.startMonth || ""} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        {" "}<span>20</span>
        <input type="text" name="startYear" value={formData.startYear || ""} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        {" "}р. по «{" "}
        <input type="text" name="endDay" value={formData.endDay || ""} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        »{" "}
        <input type="text" name="endMonth" value={formData.endMonth || ""} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        {" "}<span>20</span>
        <input type="text" name="endYear" value={formData.endYear || ""} readOnly className={`${styles.inlineInputDate} ${styles.readOnlyField}`} />
        {" "}р.
      </p>
    </div>
  );
};

export default Page1Content;