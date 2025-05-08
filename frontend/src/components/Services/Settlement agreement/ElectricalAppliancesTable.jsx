import React from "react";
import styles from "../../../pages/Services/Settlement agreement/styles/SettlementApplicationPage.module.css";

const ElectricalAppliancesTable = ({
  appliances,
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
          <th>Назва приладів</th>
          <th>Марка (назва)</th>
          <th>Рік випуску</th>
          <th>Кількість (шт.)</th>
          <th>Примітка</th>
        </tr>
      </thead>
      <tbody>
        {appliances.map((appliance, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>
              <input
                type="text"
                name={`electricalAppliances[${index}].name`}
                value={appliance.name}
                onChange={(e) =>
                  handleChange(e, "electricalAppliances", index, "name")
                }
                onFocus={() => handleFocus(`electricalAppliances[${index}].name`)}
                onBlur={() => handleBlur(`electricalAppliances[${index}].name`)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.name ? styles.errorInput : ""
                }`}
                ref={(el) =>
                  (inputRefs.current[`electricalAppliances[${index}].name`] = el)
                }
                data-error-table={`electricalAppliances-${index}-name`}
              />
            </td>
            <td>
              <input
                type="text"
                name={`electricalAppliances[${index}].brand`}
                value={appliance.brand}
                onChange={(e) =>
                  handleChange(e, "electricalAppliances", index, "brand")
                }
                onFocus={() => handleFocus(`electricalAppliances[${index}].brand`)}
                onBlur={() => handleBlur(`electricalAppliances[${index}].brand`)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.brand ? styles.errorInput : ""
                }`}
                ref={(el) =>
                  (inputRefs.current[`electricalAppliances[${index}].brand`] = el)
                }
                 data-error-table={`electricalAppliances-${index}-brand`}
              />
            </td>
            <td>
              <input
                type="text"
                name={`electricalAppliances[${index}].year`}
                value={appliance.year}
                onChange={(e) =>
                  handleChange(e, "electricalAppliances", index, "year")
                }
                onFocus={() => handleFocus(`electricalAppliances[${index}].year`)}
                onBlur={() => handleBlur(`electricalAppliances[${index}].year`)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.year ? styles.errorInput : ""
                }`}
                ref={(el) =>
                  (inputRefs.current[`electricalAppliances[${index}].year`] = el)
                }
                 data-error-table={`electricalAppliances-${index}-year`}
              />
            </td>
            <td>
              <input
                type="text"
                name={`electricalAppliances[${index}].quantity`}
                value={appliance.quantity}
                onChange={(e) =>
                  handleChange(e, "electricalAppliances", index, "quantity")
                }
                onFocus={() => handleFocus(`electricalAppliances[${index}].quantity`)}
                onBlur={() => handleBlur(`electricalAppliances[${index}].quantity`)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.quantity ? styles.errorInput : ""
                }`}
                ref={(el) =>
                  (inputRefs.current[`electricalAppliances[${index}].quantity`] = el)
                }
                 data-error-table={`electricalAppliances-${index}-quantity`}
              />
            </td>
            <td>
              <input
                type="text"
                name={`electricalAppliances[${index}].note`}
                value={appliance.note}
                onChange={(e) =>
                  handleChange(e, "electricalAppliances", index, "note")
                }
                onFocus={() => handleFocus(`electricalAppliances[${index}].note`)}
                onBlur={() => handleBlur(`electricalAppliances[${index}].note`)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.note ? styles.errorInput : ""
                }`}
                ref={(el) =>
                  (inputRefs.current[`electricalAppliances[${index}].note`] = el)
                }
                 data-error-table={`electricalAppliances-${index}-note`}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ElectricalAppliancesTable;