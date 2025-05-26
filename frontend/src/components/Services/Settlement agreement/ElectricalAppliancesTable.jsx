// src/components/Services/Settlement agreement/ElectricalAppliancesTable.jsx
import React from "react";
import styles from "../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";

const ElectricalAppliancesTable = ({
  appliances,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
  handleTableKeyDown,
}) => {
  return (
    <table className={`${styles.inventoryTable} ${styles.electricalApplianceTable}`}>
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
              {/* Для першого рядка (Холодильник) назва нередагована */}
              {index === 0 && appliance.name === "Холодильник" ? (
                <span>{appliance.name}</span>
              ) : (
                <input
                  type="text"
                  name={`electricalAppliances[${index}].name`}
                  value={appliance.name || ""}
                  onChange={(e) =>
                    handleChange(e, "electricalAppliances", index, "name")
                  }
                  onFocus={() => handleFocus(`electricalAppliances[${index}].name`)}
                  onBlur={() => handleBlur(`electricalAppliances[${index}].name`)}
                  onKeyDown={(e) => handleTableKeyDown && handleTableKeyDown(e, index, "name", "brand", null, "name", `electricalAppliances[${index -1}].note`)}
                  className={`${styles.tableInput} ${
                    errors && errors[index]?.name ? styles.errorInput : ""
                  }`}
                  ref={(el) =>
                    (inputRefs.current[`electricalAppliances[${index}].name`] = el)
                  }
                  data-error-table={`electricalAppliances-${index}-name`}
                  aria-label={`Назва приладу ${index + 1}`}
                />
              )}
            </td>
            <td>
              <input
                type="text"
                name={`electricalAppliances[${index}].brand`}
                value={appliance.brand || ""}
                onChange={(e) =>
                  handleChange(e, "electricalAppliances", index, "brand")
                }
                onFocus={() => handleFocus(`electricalAppliances[${index}].brand`)}
                onBlur={() => handleBlur(`electricalAppliances[${index}].brand`)}
                // Для першого рядка, попереднє поле - рік додатка, а не назва приладу, бо назва статична
                onKeyDown={(e) => handleTableKeyDown && handleTableKeyDown(e, index, "brand", "year", (index === 0 && appliance.name === "Холодильник") ? null : "name", "name", (index === 0 && appliance.name === "Холодильник") ? "year_appendix3" : null)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.brand ? styles.errorInput : ""
                }`}
                ref={(el) =>
                  (inputRefs.current[`electricalAppliances[${index}].brand`] = el)
                }
                 data-error-table={`electricalAppliances-${index}-brand`}
                 aria-label={`Марка приладу ${index + 1}`}
              />
            </td>
            <td>
              <input
                type="text"
                name={`electricalAppliances[${index}].year`}
                value={appliance.year || ""}
                onChange={(e) =>
                  handleChange(e, "electricalAppliances", index, "year")
                }
                onFocus={() => handleFocus(`electricalAppliances[${index}].year`)}
                onBlur={() => handleBlur(`electricalAppliances[${index}].year`)}
                onKeyDown={(e) => handleTableKeyDown && handleTableKeyDown(e, index, "year", "quantity", "brand", "name", null)}
                maxLength="4"
                placeholder="РРРР"
                className={`${styles.tableInput} ${
                  errors && errors[index]?.year ? styles.errorInput : ""
                }`}
                ref={(el) =>
                  (inputRefs.current[`electricalAppliances[${index}].year`] = el)
                }
                 data-error-table={`electricalAppliances-${index}-year`}
                 aria-label={`Рік випуску приладу ${index + 1}`}
              />
            </td>
            <td>
              <input
                type="text"
                name={`electricalAppliances[${index}].quantity`}
                value={appliance.quantity || ""}
                onChange={(e) =>
                  handleChange(e, "electricalAppliances", index, "quantity")
                }
                onFocus={() => handleFocus(`electricalAppliances[${index}].quantity`)}
                onBlur={() => handleBlur(`electricalAppliances[${index}].quantity`)}
                onKeyDown={(e) => handleTableKeyDown && handleTableKeyDown(e, index, "quantity", "note", "year", "name", null)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.quantity ? styles.errorInput : ""
                }`}
                ref={(el) =>
                  (inputRefs.current[`electricalAppliances[${index}].quantity`] = el)
                }
                 data-error-table={`electricalAppliances-${index}-quantity`}
                 aria-label={`Кількість приладу ${index + 1}`}
              />
            </td>
            <td>
              <input
                type="text"
                name={`electricalAppliances[${index}].note`}
                value={appliance.note || ""}
                onChange={(e) =>
                  handleChange(e, "electricalAppliances", index, "note")
                }
                onFocus={() => handleFocus(`electricalAppliances[${index}].note`)}
                onBlur={() => handleBlur(`electricalAppliances[${index}].note`)}
                // Для останнього поля в рядку, nextSubFieldInRow = null (перехід на наступний рядок або наступне поле форми)
                // prevRowLastSubFieldBaseIfAny для першого рядка буде null, для інших - "note" з попереднього рядка
                onKeyDown={(e) => handleTableKeyDown && handleTableKeyDown(e, index, "note", null, "quantity", "name", `electricalAppliances[${index-1}].note`)}
                className={`${styles.tableInput} ${
                  errors && errors[index]?.note ? styles.errorInput : ""
                }`}
                ref={(el) =>
                  (inputRefs.current[`electricalAppliances[${index}].note`] = el)
                }
                 data-error-table={`electricalAppliances-${index}-note`}
                 aria-label={`Примітка до приладу ${index + 1}`}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ElectricalAppliancesTable;