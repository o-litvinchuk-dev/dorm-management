// src/components/Services/Settlement agreement/Pages/Page11Content.jsx
import React, { useEffect } from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";
import InventoryTable from "../InventoryTable"; // Assuming InventoryTable is now a shared UI component
import SignatureBlock from "../SignatureBlock"; // Assuming SignatureBlock is a shared UI component

const Page11Content = ({
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
  defaultInventoryItems, // Pass the default inventory structure for read-only names
  handleTableKeyDown, // For table navigation
}) => {

  useEffect(() => {
    const today = new Date();
    const updates = {};

    if (!formData.day_appendix1 && !isPresetActive) { // Only set if not empty and no preset active (preset might have its own date logic if needed)
        updates.day_appendix1 = String(today.getDate()).padStart(2, '0');
    }
    if (!formData.month_appendix1 && !isPresetActive) {
        updates.month_appendix1 = String(today.getMonth() + 1).padStart(2, '0');
    }
    if (!formData.year_appendix1 && !isPresetActive) {
        updates.year_appendix1 = String(today.getFullYear()).slice(-2);
    }
    
    let currentDormAddress = formData.dormStreet && formData.dormBuilding ? `${formData.dormStreet}, ${formData.dormBuilding}` : (selectedPreset?.dormitory_address || "");
    if (isPresetActive && selectedPreset?.dormitory_address) {
        currentDormAddress = selectedPreset.dormitory_address;
    } else if (formData.dormNumber) { // Try to get from main page if no preset
        const dorm = allDormitories.find(d => String(d.id) === String(formData.dormNumber));
        if (dorm) currentDormAddress = dorm.address;
    }


    if (!formData.address_appendix1 && currentDormAddress) {
        updates.address_appendix1 = currentDormAddress;
    }


    if (formData.roomNumber && formData.roomNumber_appendix1 !== formData.roomNumber) {
      updates.roomNumber_appendix1 = formData.roomNumber;
    }

    if (formData.dormNumber && formData.dormNumber_appendix1 !== formData.dormNumber) {
      updates.dormNumber_appendix1 = formData.dormNumber;
    }

    // Auto-fill signature names if they are empty and main names are present
    if (!formData.dormManagerName_appendix1 && formData.dormManagerName_main) { // Assuming dormManagerName_main is the one from page 12
        updates.dormManagerName_appendix1 = formData.dormManagerName_main;
    }
    if (!formData.residentName_appendix1 && formData.fullName) { // Use fullName from page 1 for resident
        updates.residentName_appendix1 = formData.fullName;
    }


    if (Object.keys(updates).length > 0) {
        Object.entries(updates).forEach(([key, value]) => {
            handleChange({ target: { name: key, value: String(value) } });
        });
    }
  }, [
      formData.day_appendix1, formData.month_appendix1, formData.year_appendix1,
      formData.dormStreet, formData.dormBuilding, formData.roomNumber, formData.dormNumber,
      formData.address_appendix1, formData.roomNumber_appendix1, formData.dormNumber_appendix1,
      formData.dormManagerName_main, formData.fullName, // For signature auto-fill
      formData.dormManagerName_appendix1, formData.residentName_appendix1,
      handleChange, isPresetActive, selectedPreset, allDormitories
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
    <div className={styles.contractText} role="region" aria-labelledby="appendix-title-1">
      <p className={styles.rightText}>Додаток № 1</p>
      <h3 id="appendix-title-1" className={styles.centeredTitle}>ПЕРЕЛІК</h3>
      <p className={styles.centeredText}>меблів і м’якого інвентарю</p>
      <div className={styles.dateRight}>
        <span>«</span>
        <input
          type="text"
          name="day_appendix1"
          value={formData.day_appendix1 || ""}
          onChange={(e) => handleChange(e, "day_appendix1")}
          onFocus={() => handleFocus("day_appendix1")}
          onBlur={() => handleBlur("day_appendix1")}
          onKeyDown={(e) => handleDateKeyDown(e, "day_appendix1", "month_appendix1", null)} // prev field from prev page (Page 10 last interactive)
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.day_appendix1 ? styles.errorInput : ''}`}
          required
          ref={(el) => { inputRefs.current["day_appendix1"] = el; }}
          data-error-field="day_appendix1"
          aria-label="День для Додатку 1"
        />
        <span>»</span>
        <input
          type="text"
          name="month_appendix1"
          value={formData.month_appendix1 || ""}
          onChange={(e) => handleChange(e, "month_appendix1")}
          onFocus={() => handleFocus("month_appendix1")}
          onBlur={() => handleBlur("month_appendix1")}
          onKeyDown={(e) => handleDateKeyDown(e, "month_appendix1", "year_appendix1", "day_appendix1")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.month_appendix1 ? styles.errorInput : ''}`}
          required
          ref={(el) => { inputRefs.current["month_appendix1"] = el; }}
          data-error-field="month_appendix1"
          aria-label="Місяць для Додатку 1"
        />
        <span>20</span>
        <input
          type="text"
          name="year_appendix1"
          value={formData.year_appendix1 || ""}
          onChange={(e) => handleChange(e, "year_appendix1")}
          onFocus={() => handleFocus("year_appendix1")}
          onBlur={() => handleBlur("year_appendix1")}
          onKeyDown={(e) => handleDateKeyDown(e, "year_appendix1", "address_appendix1", "month_appendix1")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.year_appendix1 ? styles.errorInput : ''}`}
          required
          ref={(el) => {inputRefs.current["year_appendix1"] = el; }}
          data-error-field="year_appendix1"
          aria-label="Рік для Додатку 1 (останні дві цифри)"
        />
        <span>р.</span>
      </div>
      {errors.day_appendix1 && <p id="day_appendix1-error-p11" className={styles.error}>{errors.day_appendix1}</p>}
      {errors.month_appendix1 && <p id="month_appendix1-error-p11" className={styles.error}>{errors.month_appendix1}</p>}
      {errors.year_appendix1 && <p id="year_appendix1-error-p11" className={styles.error}>{errors.year_appendix1}</p>}


      <div className={styles.infoRow}>
        <span>за адресою</span>
        <input
          type="text"
          name="address_appendix1"
          value={formData.address_appendix1 || ""}
          onChange={(e) => handleChange(e, "address_appendix1")}
          onFocus={() => handleFocus("address_appendix1")}
          onBlur={() => handleBlur("address_appendix1")}
          onKeyDown={(e) => handleInputKeyDown(e, "address_appendix1", "roomNumberInput_appendix1_display", "year_appendix1")}
          className={`${styles.longInput} ${errors.address_appendix1 ? styles.errorInput : ''} ${
            (isPresetActive && selectedPreset?.dormitory_address) || (formData.dormNumber && !isPresetActive) ? styles.readOnlyField : "" // readOnly if from preset or auto-filled from main page
          }`}
          required
          ref={(el) => { inputRefs.current["address_appendix1"] = el; }}
          data-error-field="address_appendix1"
          aria-label="Адреса для Додатку 1"
          readOnly={(isPresetActive && !!selectedPreset?.dormitory_address) || (!!formData.dormNumber && !isPresetActive)}
          disabled={dataLoading.preset}
        />
        <span>кімнати №</span>
        <input
          type="text"
          name="roomNumberInput_appendix1_display" // For display, actual data in formData.roomNumber_appendix1
          value={formData.roomNumber_appendix1 || ""}
          readOnly // Always read-only as it's auto-filled from main page
          className={`${styles.roomNumberAppendix} ${styles.readOnlyField} ${errors.roomNumber_appendix1 ? styles.errorInput : ''}`}
          ref={(el) => { inputRefs.current["roomNumberInput_appendix1_display"] = el; }}
          data-error-field="roomNumber_appendix1"
          aria-label="Номер кімнати для Додатку 1 (автоматично)"
          onKeyDown={(e) => handleInputKeyDown(e, "roomNumberInput_appendix1_display", "dormNumberInput_appendix1_display", "address_appendix1")}
        />
         {autoSelectedRoomInfo?.source && autoSelectedRoomInfo.source !== 'manual' && formData.roomNumber_appendix1 && (
          <span className={styles.roomSourceInfo} style={{fontSize: '12px', marginLeft: '3px'}}>
            {roomSourceText()}
          </span>
        )}
        <span>гуртожитку №</span>
        <input
          type="text"
          name="dormNumberInput_appendix1_display" // For display
          value={getDormNameById(formData.dormNumber_appendix1)}
          readOnly // Always read-only
          className={`${styles.inlineInputDormNameAppendix} ${styles.readOnlyField} ${errors.dormNumber_appendix1 ? styles.errorInput : ''}`}
          ref={(el) => { inputRefs.current["dormNumberInput_appendix1_display"] = el; }}
          aria-label="Назва гуртожитку для Додатку 1 (автоматично)"
          data-error-field="dormNumber_appendix1"
          onKeyDown={(e) => handleInputKeyDown(e, "dormNumberInput_appendix1_display", `inventory[0].quantity`, "roomNumberInput_appendix1_display")} // Assuming first item in inventory is quantity
        />
      </div>
      {errors.address_appendix1 && <p id="address_appendix1-error-p11" className={styles.error}>{errors.address_appendix1}</p>}
      {errors.roomNumber_appendix1 && <p id="roomNumber_appendix1-error-p11" className={styles.error}>{errors.roomNumber_appendix1}</p>}
      {errors.dormNumber_appendix1 && <p id="dormNumber_appendix1-error-p11" className={styles.error}>{errors.dormNumber_appendix1}</p>}

      <InventoryTable
        inventory={formData.inventory}
        errors={errors.inventory}
        handleChange={handleChange}
        handleFocus={handleFocus}
        handleBlur={handleBlur}
        inputRefs={inputRefs}
        handleTableKeyDown={handleTableKeyDown} // Pass down the generic handler
        defaultInventoryItems={defaultInventoryItems} // Pass default items
      />
       {/* Errors for inventory table will be shown by InventoryTable component if designed so, or loop here */}
       {formData.inventory.map((_, index) => (
        errors.inventory?.[index] ? (
          <div key={`inventory-error-group-${index}`}>
            {errors.inventory[index].name && (
              <p id={`inventory-${index}-name-error-p11`} className={styles.error}>
                {`Інвентар, рядок ${index + 1}, Назва: ${errors.inventory[index].name}`}
              </p>
            )}
            {errors.inventory[index].quantity && (
              <p id={`inventory-${index}-quantity-error-p11`} className={styles.error}>
                 {`Інвентар, рядок ${index + 1}, Кількість: ${errors.inventory[index].quantity}`}
              </p>
            )}
            {errors.inventory[index].note && (
              <p id={`inventory-${index}-note-error-p11`} className={styles.error}>
                {`Інвентар, рядок ${index + 1}, Примітка: ${errors.inventory[index].note}`}
              </p>
            )}
          </div>
        ) : null
      ))}
    </div>
  );
};

export default Page11Content;