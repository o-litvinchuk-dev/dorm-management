import React from "react";
import styles from "../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";

const InventoryTable = ({
  inventory,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
  handleTableKeyDown, // Added for consistency
  defaultInventoryItems, // Pass the static default items for comparison
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
              {defaultInventoryItems && defaultInventoryItems[index] && defaultInventoryItems[index].name ? ( // Check if it's a default item with a pre-filled name
                 <span className={styles.tableInput}>{defaultInventoryItems[index].name}</span>
              ) : (
                <input
                  type="text"
                  name={`inventory[${index}].name`}
                  value={item.name || ""}
                  onChange={(e) => handleChange(e, "inventory", index, "name")}
                  onFocus={() => handleFocus(`inventory[${index}].name`)}
                  onBlur={() => handleBlur(`inventory[${index}].name`)}
                  onKeyDown={(e) => handleTableKeyDown && handleTableKeyDown(e, index, "name", "quantity", null, "quantity", `inventory[${index-1}].note`)}
                  className={`${styles.tableInput} ${
                    errors && errors[index]?.name ? styles.errorInput : ""
                  }`}
                  ref={(el) => (inputRefs.current[`inventory[${index}].name`] = el)}
                  data-error-table={`inventory-${index}-name`}
                  aria-label={`Назва предмету ${index + 1}`}
                />
              )}
            </td>
            <td>
              <input
                type="text"
                name={`inventory[${index}].quantity`}
                value={item.quantity || ""}
                onChange={(e) => handleChange(e, "inventory", index, "quantity")}
                onFocus={() => handleFocus(`inventory[${index}].quantity`)}
                onBlur={() => handleBlur(`inventory[${index}].quantity`)}
                onKeyDown={(e) => handleTableKeyDown && handleTableKeyDown(e, index, "quantity", "note", defaultInventoryItems && defaultInventoryItems[index] && defaultInventoryItems[index].name ? null : "name", "quantity", null)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.quantity ? styles.errorInput : ""
                }`}
                ref={(el) => (inputRefs.current[`inventory[${index}].quantity`] = el)}
                data-error-table={`inventory-${index}-quantity`}
                aria-label={`Кількість предмету ${index + 1}`}
              />
            </td>
            <td>
              <input
                type="text"
                name={`inventory[${index}].note`}
                value={item.note || ""}
                onChange={(e) => handleChange(e, "inventory", index, "note")}
                onFocus={() => handleFocus(`inventory[${index}].note`)}
                onBlur={() => handleBlur(`inventory[${index}].note`)}
                onKeyDown={(e) => handleTableKeyDown && handleTableKeyDown(e, index, "note", null, "quantity", "quantity", null)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.note ? styles.errorInput : ""
                }`}
                ref={(el) => (inputRefs.current[`inventory[${index}].note`] = el)}
                 data-error-table={`inventory-${index}-note`}
                 aria-label={`Примітка до предмету ${index + 1}`}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InventoryTable;