import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementApplicationPage.module.css";

const Page13Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
}) => {
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

  const handleTableKeyDown = (e, index, field, nextField, prevField) => {
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
      <p className={styles.rightText}>Додаток № 3</p>
      <h3 id="appendix-title" className={styles.centeredTitle}>ПЕРЕЛІК</h3>
      <p className={styles.centeredText}>
        власних приладів, що споживають електроенергію, оплата за яку здійснюється Мешканцем
      </p>
      <p className={styles.centeredText}>додатково</p>

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
          onKeyDown={(e) => handleDateKeyDown(e, "day", "month", null)}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.day ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["day"] = el;
            else delete inputRefs.current["day"];
          }}
          aria-label="День"
          aria-invalid={!!errors.day}
          aria-describedby={errors.day ? "day-error" : undefined}
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
          required
          ref={(el) => {
            if (el) inputRefs.current["month"] = el;
            else delete inputRefs.current["month"];
          }}
          aria-label="Місяць"
          aria-invalid={!!errors.month}
          aria-describedby={errors.month ? "month-error" : undefined}
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
          onKeyDown={(e) => handleDateKeyDown(e, "year", "electricalAppliances[0].brand", "month")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputYear} ${errors.year ? styles.errorInput : ""}`}
          required
          ref={(el) => {
            if (el) inputRefs.current["year"] = el;
            else delete inputRefs.current["year"];
          }}
          aria-label="Рік (останні дві цифри)"
          aria-invalid={!!errors.year}
          aria-describedby={errors.year ? "year-error" : undefined}
          autoComplete="off"
        />
        <span>р.</span>
      </div>
      {errors.day && <p id="day-error" className={styles.error}>{errors.day}</p>}
      {errors.month && <p id="month-error" className={styles.error}>{errors.month}</p>}
      {errors.year && <p id="year-error" className={styles.error}>{errors.year}</p>}

      {/* Таблиця для електроприладів */}
      <table className={styles.inventoryTable} role="grid" aria-label="Перелік власних приладів">
        <thead>
          <tr>
            <th>№ з/п</th>
            <th>Назва приладів</th>
            <th>Марка (назва)</th>
            <th>Рік випуску</th>
            <th>Кількість (шт.)</th>
            <th>Примітка</th>
          </tr>
        </thead>
        <tbody>
          {formData.electricalAppliances.map((appliance, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                {index === 0 ? (
                  <span>Холодильник</span>
                ) : (
                  <input
                    type="text"
                    name={`electricalAppliances[${index}].name`}
                    value={appliance.name || ""}
                    onChange={(e) => handleChange(e, "electricalAppliances", index, "name")}
                    onFocus={() => handleFocus(`electricalAppliances[${index}].name`)}
                    onBlur={() => handleBlur(`electricalAppliances[${index}].name`)}
                    onKeyDown={(e) =>
                      handleTableKeyDown(
                        e,
                        index,
                        "name",
                        index < 6
                          ? `electricalAppliances[${index}].brand`
                          : `electricalAppliances[${index + 1}].name`,
                        index === 1
                          ? "year"
                          : `electricalAppliances[${index - 1}].note`
                      )
                    }
                    className={`${styles.tableInput} ${
                      errors.electricalAppliances?.[index]?.name ? styles.errorInput : ""
                    }`}
                    ref={(el) => {
                      if (el) inputRefs.current[`electricalAppliances[${index}].name`] = el;
                      else delete inputRefs.current[`electricalAppliances[${index}].name`];
                    }}
                    aria-label={`Назва приладу ${index + 1}`}
                    aria-invalid={!!errors.electricalAppliances?.[index]?.name}
                    aria-describedby={
                      errors.electricalAppliances?.[index]?.name
                        ? `appliance-${index}-name-error`
                        : undefined
                    }
                    autoComplete="off"
                  />
                )}
              </td>
              <td>
                <input
                  type="text"
                  name={`electricalAppliances[${index}].brand`}
                  value={appliance.brand || ""}
                  onChange={(e) => handleChange(e, "electricalAppliances", index, "brand")}
                  onFocus={() => handleFocus(`electricalAppliances[${index}].brand`)}
                  onBlur={() => handleBlur(`electricalAppliances[${index}].brand`)}
                  onKeyDown={(e) =>
                    handleTableKeyDown(
                      e,
                      index,
                      "brand",
                      `electricalAppliances[${index}].year`,
                      `electricalAppliances[${index}].name`
                    )
                  }
                  className={`${styles.tableInput} ${
                    errors.electricalAppliances?.[index]?.brand ? styles.errorInput : ""
                  }`}
                  ref={(el) => {
                    if (el) inputRefs.current[`electricalAppliances[${index}].brand`] = el;
                    else delete inputRefs.current[`electricalAppliances[${index}].brand`];
                  }}
                  aria-label={`Марка приладу ${index + 1}`}
                  aria-invalid={!!errors.electricalAppliances?.[index]?.brand}
                  aria-describedby={
                    errors.electricalAppliances?.[index]?.brand
                      ? `appliance-${index}-brand-error`
                      : undefined
                  }
                  autoComplete="off"
                />
              </td>
              <td>
                <input
                  type="text"
                  name={`electricalAppliances[${index}].year`}
                  value={appliance.year || ""}
                  onChange={(e) => handleChange(e, "electricalAppliances", index, "year")}
                  onFocus={() => handleFocus(`electricalAppliances[${index}].year`)}
                  onBlur={() => handleBlur(`electricalAppliances[${index}].year`)}
                  onKeyDown={(e) =>
                    handleTableKeyDown(
                      e,
                      index,
                      "year",
                      `electricalAppliances[${index}].quantity`,
                      `electricalAppliances[${index}].brand`
                    )
                  }
                  maxLength="4"
                  placeholder="____"
                  className={`${styles.tableInput} ${
                    errors.electricalAppliances?.[index]?.year ? styles.errorInput : ""
                  }`}
                  ref={(el) => {
                    if (el) inputRefs.current[`electricalAppliances[${index}].year`] = el;
                    else delete inputRefs.current[`electricalAppliances[${index}].year`];
                  }}
                  aria-label={`Рік випуску приладу ${index + 1}`}
                  aria-invalid={!!errors.electricalAppliances?.[index]?.year}
                  aria-describedby={
                    errors.electricalAppliances?.[index]?.year
                      ? `appliance-${index}-year-error`
                      : undefined
                  }
                  autoComplete="off"
                />
              </td>
              <td>
                <input
                  type="text"
                  name={`electricalAppliances[${index}].quantity`}
                  value={appliance.quantity || ""}
                  onChange={(e) => handleChange(e, "electricalAppliances", index, "quantity")}
                  onFocus={() => handleFocus(`electricalAppliances[${index}].quantity`)}
                  onBlur={() => handleBlur(`electricalAppliances[${index}].quantity`)}
                  onKeyDown={(e) =>
                    handleTableKeyDown(
                      e,
                      index,
                      "quantity",
                      `electricalAppliances[${index}].note`,
                      `electricalAppliances[${index}].year`
                    )
                  }
                  className={`${styles.tableInput} ${
                    errors.electricalAppliances?.[index]?.quantity ? styles.errorInput : ""
                  }`}
                  ref={(el) => {
                    if (el) inputRefs.current[`electricalAppliances[${index}].quantity`] = el;
                    else delete inputRefs.current[`electricalAppliances[${index}].quantity`];
                  }}
                  aria-label={`Кількість приладу ${index + 1}`}
                  aria-invalid={!!errors.electricalAppliances?.[index]?.quantity}
                  aria-describedby={
                    errors.electricalAppliances?.[index]?.quantity
                      ? `appliance-${index}-quantity-error`
                      : undefined
                  }
                  autoComplete="off"
                />
              </td>
              <td>
                <input
                  type="text"
                  name={`electricalAppliances[${index}].note`}
                  value={appliance.note || ""}
                  onChange={(e) => handleChange(e, "electricalAppliances", index, "note")}
                  onFocus={() => handleFocus(`electricalAppliances[${index}].note`)}
                  onBlur={() => handleBlur(`electricalAppliances[${index}].note`)}
                  onKeyDown={(e) =>
                    handleTableKeyDown(
                      e,
                      index,
                      "note",
                      index < 6
                        ? `electricalAppliances[${index + 1}].name`
                        : null,
                      `electricalAppliances[${index}].quantity`
                    )
                  }
                  className={`${styles.tableInput} ${
                    errors.electricalAppliances?.[index]?.note ? styles.errorInput : ""
                  }`}
                  ref={(el) => {
                    if (el) inputRefs.current[`electricalAppliances[${index}].note`] = el;
                    else delete inputRefs.current[`electricalAppliances[${index}].note`];
                  }}
                  aria-label={`Примітка до приладу ${index + 1}`}
                  aria-invalid={!!errors.electricalAppliances?.[index]?.note}
                  aria-describedby={
                    errors.electricalAppliances?.[index]?.note
                      ? `appliance-${index}-note-error`
                      : undefined
                  }
                  autoComplete="off"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {formData.electricalAppliances.map((_, index) =>
        errors.electricalAppliances?.[index] ? (
          <div key={index}>
            {errors.electricalAppliances[index].name && (
              <p id={`appliance-${index}-name-error`} className={styles.error}>
                {errors.electricalAppliances[index].name}
              </p>
            )}
            {errors.electricalAppliances[index].brand && (
              <p id={`appliance-${index}-brand-error`} className={styles.error}>
                {errors.electricalAppliances[index].brand}
              </p>
            )}
            {errors.electricalAppliances[index].year && (
              <p id={`appliance-${index}-year-error`} className={styles.error}>
                {errors.electricalAppliances[index].year}
              </p>
            )}
            {errors.electricalAppliances[index].quantity && (
              <p id={`appliance-${index}-quantity-error`} className={styles.error}>
                {errors.electricalAppliances[index].quantity}
              </p>
            )}
            {errors.electricalAppliances[index].note && (
              <p id={`appliance-${index}-note-error`} className={styles.error}>
                {errors.electricalAppliances[index].note}
              </p>
            )}
          </div>
        ) : null
      )}
      <p className={styles.footnote}>
        *У разі зміни тарифів на електроенергію вартість спожитої електроенергії перераховується та
        відображається у кошторисі витрат та затверджується наказом ректора.
      </p>
    </div>
  );
};

export default Page13Content;