import React, { useRef } from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementApplicationPage.module.css";

const Page11Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
}) => {
  const yearRef = useRef(null);

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
    <div className={styles.contractText} role="region" aria-labelledby="appendix-title">
      <p className={styles.rightText}>Додаток № 1</p>
      <h3 id="appendix-title" className={styles.centeredTitle}>ПЕРЕЛІК</h3>
      <p className={styles.centeredText}>меблів і м’якого інвентарю</p>
      <div className={styles.dateRight}>
        <span>«</span>
        <input
          type="text"
          name="day"
          value={formData.day}
          onChange={(e) => handleChange(e, "day")}
          onFocus={() => handleFocus("day")}
          onBlur={() => handleBlur("day")}
          onKeyDown={(e) => handleDateKeyDown(e, "day", "month", null)}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.day ? styles.errorInput : ''}`}
          required
          ref={(el) => (inputRefs.current.day = el)}
          data-error-field="day"
          aria-label="День"
          aria-invalid={!!errors.day}
          aria-describedby={errors.day ? "day-error" : undefined}
          autoComplete="off"
        />
        <span>»</span>
        <input
          type="text"
          name="month"
          value={formData.month}
          onChange={(e) => handleChange(e, "month")}
          onFocus={() => handleFocus("month")}
          onBlur={() => handleBlur("month")}
          onKeyDown={(e) => handleDateKeyDown(e, "month", "year", "day")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.month ? styles.errorInput : ''}`}
          required
          ref={(el) => (inputRefs.current.month = el)}
          data-error-field="month"
          aria-label="Місяць"
          aria-invalid={!!errors.month}
          aria-describedby={errors.month ? "month-error" : undefined}
          autoComplete="off"
        />
        <span>20</span>
        <input
          type="text"
          name="year"
          value={formData.year}
          onChange={(e) => handleChange(e, "year")}
          onFocus={() => handleFocus("year")}
          onBlur={() => handleBlur("year")}
          onKeyDown={(e) => handleDateKeyDown(e, "year", "address", "month")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.year ? styles.errorInput : ''}`}
          required
          ref={(el) => {
            yearRef.current = el;
            inputRefs.current.year = el;
          }}
          data-error-field="year"
          aria-label="Рік (останні дві цифри)"
          aria-invalid={!!errors.year}
          aria-describedby={errors.year ? "year-error" : undefined}
          autoComplete="off"
        />
        <span>р.</span>
      </div>
      <div className={styles.infoRow}>
        <span>за адресою</span>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={(e) => handleChange(e, "address")}
          onFocus={() => handleFocus("address")}
          onBlur={() => handleBlur("address")}
          onKeyDown={(e) => handleInputKeyDown(e, "address", "roomNumber", "year")}
          className={`${styles.longInput} ${errors.address ? styles.errorInput : ''}`}
          required
          ref={(el) => (inputRefs.current.address = el)}
          data-error-field="address"
          aria-label="Адреса"
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? "address-error" : undefined}
          autoComplete="street-address"
        />
        <span>кімнати №</span>
        <input
          type="text"
          name="roomNumber"
          value={formData.roomNumber}
          onChange={(e) => handleChange(e, "roomNumber")}
          onFocus={() => handleFocus("roomNumber")}
          onBlur={() => handleBlur("roomNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "roomNumber", "dormNumber", "address")}
          className={`${styles.shortInput} ${errors.roomNumber ? styles.errorInput : ''}`}
          required
          ref={(el) => (inputRefs.current.roomNumber = el)}
          data-error-field="roomNumber"
          aria-label="Номер кімнати"
          aria-invalid={!!errors.roomNumber}
          aria-describedby={errors.roomNumber ? "roomNumber-error" : undefined}
          autoComplete="off"
        />
        <span>гуртожитку №</span>
        <input
          type="text"
          name="dormNumber"
          value={formData.dormNumber}
          onChange={(e) => handleChange(e, "dormNumber")}
          onFocus={() => handleFocus("dormNumber")}
          onBlur={() => handleBlur("dormNumber")}
          onKeyDown={(e) => handleInputKeyDown(e, "dormNumber", "inventory[14].name", "roomNumber")}
          className={`${styles.shortInput} ${errors.dormNumber ? styles.errorInput : ''}`}
          required
          ref={(el) => (inputRefs.current.dormNumber = el)}
          data-error-field="dormNumber"
          aria-label="Номер гуртожитку"
          aria-invalid={!!errors.dormNumber}
          aria-describedby={errors.dormNumber ? "dormNumber-error" : undefined}
          autoComplete="off"
        />
      </div>
      {errors.day && <p id="day-error" className={styles.error}>{errors.day}</p>}
      {errors.month && <p id="month-error" className={styles.error}>{errors.month}</p>}
      {errors.year && <p id="year-error" className={styles.error}>{errors.year}</p>}
      {errors.address && <p id="address-error" className={styles.error}>{errors.address}</p>}
      {errors.roomNumber && <p id="roomNumber-error" className={styles.error}>{errors.roomNumber}</p>}
      {errors.dormNumber && <p id="dormNumber-error" className={styles.error}>{errors.dormNumber}</p>}
      <table className={styles.inventoryTable} role="grid" aria-label="Перелік меблів і м’якого інвентарю">
        <thead>
          <tr>
            <th>№ з/п</th>
            <th>Назва предметів</th>
            <th>Кількість</th>
            <th>Примітка</th>
          </tr>
        </thead>
        <tbody>
          {formData.inventory.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                {index < 14 ? (
                  <span>{formData.inventory[index].name}</span>
                ) : (
                  <input
                    type="text"
                    name={`inventory[${index}].name`}
                    value={formData.inventory[index].name}
                    onChange={(e) => handleChange(e, "inventory", index, "name")}
                    onFocus={() => handleFocus(`inventory[${index}].name`)}
                    onBlur={() => handleBlur(`inventory[${index}].name`)}
                    className={`${styles.tableInput} ${
                      errors.inventory?.[index]?.name ? styles.errorInput : ''
                    }`}
                    data-error-field={`inventory[${index}].name`}
                    aria-label={`Назва предмета ${index + 1}`}
                    aria-invalid={!!errors.inventory?.[index]?.name}
                    aria-describedby={
                      errors.inventory?.[index]?.name ? `inventory-${index}-name-error` : undefined
                    }
                    autoComplete="off"
                  />
                )}
              </td>
              <td>
                <input
                  type="number"
                  name={`inventory[${index}].quantity`}
                  value={formData.inventory[index].quantity}
                  onChange={(e) => handleChange(e, "inventory", index, "quantity")}
                  onFocus={() => handleFocus(`inventory[${index}].quantity`)}
                  onBlur={() => handleBlur(`inventory[${index}].quantity`)}
                  className={`${styles.tableInput} ${
                    errors.inventory?.[index]?.quantity ? styles.errorInput : ''
                  }`}
                  min="0"
                  data-error-field={`inventory[${index}].quantity`}
                  aria-label={`Кількість предмета ${index + 1}`}
                  aria-invalid={!!errors.inventory?.[index]?.quantity}
                  aria-describedby={
                    errors.inventory?.[index]?.quantity ? `inventory-${index}-quantity-error` : undefined
                  }
                  autoComplete="off"
                />
              </td>
              <td>
                <input
                  type="text"
                  name={`inventory[${index}].note`}
                  value={formData.inventory[index].note}
                  onChange={(e) => handleChange(e, "inventory", index, "note")}
                  onFocus={() => handleFocus(`inventory[${index}].note`)}
                  onBlur={() => handleBlur(`inventory[${index}].note`)}
                  className={`${styles.tableInput} ${
                    errors.inventory?.[index]?.note ? styles.errorInput : ''
                  }`}
                  data-error-field={`inventory[${index}].note`}
                  aria-label={`Примітка до предмета ${index + 1}`}
                  aria-invalid={!!errors.inventory?.[index]?.note}
                  aria-describedby={
                    errors.inventory?.[index]?.note ? `inventory-${index}-note-error` : undefined
                  }
                  autoComplete="off"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {formData.inventory.map((_, index) =>
        errors.inventory?.[index] ? (
          <div key={index}>
            {errors.inventory[index].name && (
              <p id={`inventory-${index}-name-error`} className={styles.error}>
                {errors.inventory[index].name}
              </p>
            )}
            {errors.inventory[index].quantity && (
              <p id={`inventory-${index}-quantity-error`} className={styles.error}>
                {errors.inventory[index].quantity}
              </p>
            )}
            {errors.inventory[index].note && (
              <p id={`inventory-${index}-note-error`} className={styles.error}>
                {errors.inventory[index].note}
              </p>
            )}
          </div>
        ) : null
      )}
      <div className={styles.signatureSection}>
        <div className={styles.signatureBlock}>
          <p>Здав: Завідувач гуртожитку</p>
          <div className={styles.signatureInputs}>
            <input
              type="text"
              name="dormManagerName"
              value={formData.dormManagerName}
              onChange={(e) => handleChange(e, "dormManagerName")}
              onFocus={() => handleFocus("dormManagerName")}
              onBlur={() => handleBlur("dormManagerName")}
              className={`${styles.signatureInput} ${
                errors.dormManagerName ? styles.errorInput : ''
              }`}
              placeholder="П.І.Б."
              data-error-field="dormManagerName"
              aria-label="П.І.Б. завідувача гуртожитку"
              aria-invalid={!!errors.dormManagerName}
              aria-describedby={errors.dormManagerName ? "dormManagerName-error" : undefined}
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
              value={formData.residentName}
              onChange={(e) => handleChange(e, "residentName")}
              onFocus={() => handleFocus("residentName")}
              onBlur={() => handleBlur("residentName")}
              className={`${styles.signatureInput} ${errors.residentName ? styles.errorInput : ''}`}
              placeholder="П.І.Б."
              data-error-field="residentName"
              aria-label="П.І.Б. мешканця"
              aria-invalid={!!errors.residentName}
              aria-describedby={errors.residentName ? "residentName-error" : undefined}
              autoComplete="name"
            />
          </div>
        </div>
      </div>
      {errors.dormManagerName && (
        <p id="dormManagerName-error" className={styles.error}>
          {errors.dormManagerName}
        </p>
      )}
      {errors.residentName && (
        <p id="residentName-error" className={styles.error}>
          {errors.residentName}
        </p>
      )}
    </div>
  );
};

export default Page11Content;