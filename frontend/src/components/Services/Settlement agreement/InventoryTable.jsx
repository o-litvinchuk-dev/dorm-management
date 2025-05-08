import React from "react";
import styles from "../../../pages/Services/Settlement agreement/styles/SettlementApplicationPage.module.css";

const InventoryTable = ({
  inventory,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
}) => {
  return (
    <table className={styles.inventoryTable}>
      <thead>
        <tr>
          <th>№ з/п</th>
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
              {index < 14 ? (
                 <span className={styles.tableInput}>{item.name}</span>
              ) : (
                <input
                  type="text"
                  name={`inventory[${index}].name`}
                  value={item.name}
                  onChange={(e) => handleChange(e, "inventory", index, "name")}
                  onFocus={() => handleFocus(`inventory[${index}].name`)}
                  onBlur={() => handleBlur(`inventory[${index}].name`)}
                  className={`${styles.tableInput} ${
                    errors && errors[index]?.name ? styles.errorInput : ""
                  }`}
                  ref={(el) => (inputRefs.current[`inventory[${index}].name`] = el)}
                  data-error-table={`inventory-${index}-name`}
                />
              )}
            </td>
            <td>
              <input
                type="text"
                name={`inventory[${index}].quantity`}
                value={item.quantity}
                onChange={(e) => handleChange(e, "inventory", index, "quantity")}
                onFocus={() => handleFocus(`inventory[${index}].quantity`)}
                onBlur={() => handleBlur(`inventory[${index}].quantity`)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.quantity ? styles.errorInput : ""
                }`}
                ref={(el) => (inputRefs.current[`inventory[${index}].quantity`] = el)}
                data-error-table={`inventory-${index}-quantity`}
              />
            </td>
            <td>
              <input
                type="text"
                name={`inventory[${index}].note`}
                value={item.note}
                onChange={(e) => handleChange(e, "inventory", index, "note")}
                onFocus={() => handleFocus(`inventory[${index}].note`)}
                onBlur={() => handleBlur(`inventory[${index}].note`)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.note ? styles.errorInput : ""
                }`}
                ref={(el) => (inputRefs.current[`inventory[${index}].note`] = el)}
                 data-error-table={`inventory-${index}-note`}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InventoryTable;