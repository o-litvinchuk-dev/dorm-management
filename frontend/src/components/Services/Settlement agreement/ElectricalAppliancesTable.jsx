import React from "react";
import styles from "../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";
import { getNestedError } from "../../../pages/Services/Settlement agreement/helpers";

const ElectricalAppliancesTable = ({
  appliances,
  errors,
  touched,
  handleChange,
  handleBlur,
  inputRefs,
}) => {
  return (
    <>
      <table className={`${styles.inventoryTable} ${styles.electricalApplianceTable}`}>
        <thead>
          <tr>
            <th>№ п/п</th>
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
                  value={appliance.name || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.tableInput} ${
                    touched?.electricalAppliances?.[index]?.name && getNestedError(errors, `electricalAppliances[${index}].name`) ? styles.errorInput : ''
                  }`}
                  ref={el => (inputRefs.current[`electricalAppliances[${index}].name`] = el)}
                  placeholder="Назва приладу"
                />
              </td>
              <td>
                <input
                  type="text"
                  name={`electricalAppliances[${index}].brand`}
                  value={appliance.brand || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.tableInput} ${
                    touched?.electricalAppliances?.[index]?.brand && getNestedError(errors, `electricalAppliances[${index}].brand`) ? styles.errorInput : ''
                  }`}
                  ref={el => (inputRefs.current[`electricalAppliances[${index}].brand`] = el)}
                   placeholder="Марка/Модель"
                />
              </td>
              <td>
                <input
                  type="text"
                  name={`electricalAppliances[${index}].year`}
                  value={appliance.year || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength="4"
                  placeholder="РРРР"
                  className={`${styles.tableInput} ${
                    touched?.electricalAppliances?.[index]?.year && getNestedError(errors, `electricalAppliances[${index}].year`) ? styles.errorInput : ''
                  }`}
                  ref={el => (inputRefs.current[`electricalAppliances[${index}].year`] = el)}
                />
              </td>
              <td>
                <input
                  type="text"
                  name={`electricalAppliances[${index}].quantity`}
                  value={appliance.quantity || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.tableInput} ${
                    touched?.electricalAppliances?.[index]?.quantity && getNestedError(errors, `electricalAppliances[${index}].quantity`) ? styles.errorInput : ''
                  }`}
                  ref={el => (inputRefs.current[`electricalAppliances[${index}].quantity`] = el)}
                  placeholder="К-сть"
                />
              </td>
              <td>
                <input
                  type="text"
                  name={`electricalAppliances[${index}].note`}
                  value={appliance.note || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.tableInput}
                  ref={el => (inputRefs.current[`electricalAppliances[${index}].note`] = el)}
                  placeholder="Примітка"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {Array.isArray(errors.electricalAppliances) && errors.electricalAppliances.map((err, index) => (
        err && Object.entries(err).map(([key, msg]) => (
            <p key={`${index}-${key}`} className={styles.error}>{`Прилад ${index + 1}: ${msg}`}</p>
        ))
      ))}
    </>
  );
};

export default ElectricalAppliancesTable;