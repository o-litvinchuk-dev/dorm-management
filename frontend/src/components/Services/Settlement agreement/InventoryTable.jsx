import React from "react";
import styles from "../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";
import { getNestedError } from "../../../pages/Services/Settlement agreement/helpers";

const InventoryTable = ({
  inventory,
  errors,
  touched,
  handleChange,
  handleBlur,
  inputRefs,
}) => {
  return (
    <>
      <table className={styles.inventoryTable}>
        <thead>
          <tr>
            <th>№ п/п</th>
            <th>Назва предметів</th>
            <th>Кількість</th>
            <th>Примітка</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <input
                  type="text"
                  name={`inventory[${index}].name`}
                  value={item.name || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.tableInput} ${
                    touched?.inventory?.[index]?.name && getNestedError(errors, `inventory[${index}].name`) ? styles.errorInput : ""
                  }`}
                  ref={el => (inputRefs.current[`inventory[${index}].name`] = el)}
                  placeholder="Введіть назву"
                />
              </td>
              <td>
                <input
                  type="text"
                  name={`inventory[${index}].quantity`}
                  value={item.quantity || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.tableInput} ${
                    touched?.inventory?.[index]?.quantity && getNestedError(errors, `inventory[${index}].quantity`) ? styles.errorInput : ""
                  }`}
                  ref={el => (inputRefs.current[`inventory[${index}].quantity`] = el)}
                  placeholder="К-сть"
                />
              </td>
              <td>
                <input
                  type="text"
                  name={`inventory[${index}].note`}
                  value={item.note || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.tableInput}
                  ref={el => (inputRefs.current[`inventory[${index}].note`] = el)}
                  placeholder="Примітка"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Відображення помилок під таблицею, якщо вони є */}
      {Array.isArray(errors.inventory) && errors.inventory.map((itemErrors, index) => (
        <React.Fragment key={`err-group-${index}`}>
          {itemErrors?.name && <p className={styles.error}>Інвентар, рядок {index + 1}: {itemErrors.name}</p>}
          {itemErrors?.quantity && <p className={styles.error}>Інвентар, рядок {index + 1}: {itemErrors.quantity}</p>}
        </React.Fragment>
      ))}
    </>
  );
};

export default InventoryTable;