import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";

const Page8Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
  handleDateKeyDown, // Ensure this specific handler is passed if needed
  isPresetActive, // Added
  selectedPreset, // Added
  dataLoading, // Added
}) => {
  // Using the more generic handleDateKeyDown from props
  // specific handleDateKeyDown from this component removed to avoid conflict

  return (
    <div className={styles.contractText} role="region" aria-labelledby="section-title-p8">
      <h3 id="section-title-p8" className={styles.centeredTitle}>6. ВІДПОВІДАЛЬНІСТЬ СТОРІН</h3>
      <p className={styles.justifiedText}>
        6.1. За порушення умов Договору, його невиконання або неналежне виконання Сторони несуть відповідальність згідно чинного законодавства України.
      </p>
      <p className={styles.justifiedText}>
        6.2. У разі заподіяння збитків майну Університету, житловому приміщенню, місцям загального користування, м'якому чи твердому інвентарю, обладнанню, іншому майну Університету, чи третім особам, Мешканець гуртожитку зобов'язаний відшкодувати їх у повному обсязі згідно з законодавством України.
      </p>
      <p className={styles.justifiedText}>
        6.3. У випадку порушення Мешканцем Правил внутрішнього розпорядку в студентських гуртожитках Університету, систематичного невиконання зобов'язань згідно п. 3.2 Р. 3 Договору, вчинення заборонених дій, передбачених у Р. 4 Договору, адміністрацією та студентською радою гуртожитку може бути ініційоване питання про дострокове припинення дії Договору.
      </p>
      <h3 className={styles.centeredTitle}>7. СТРОК ДІЇ ДОГОВОРУ</h3>
      <p className={styles.justifiedText}>
        7.1. Цей Договір вважається укладеним і набирає чинності з моменту його підписання Сторонами, а закінчується «
        <input
          type="text"
          name="endDay" // This is already on Page1Content and should be the source of truth
          value={formData.endDay || ""}
          onChange={(e) => handleChange(e, "endDay")}
          onFocus={() => handleFocus("endDay")}
          onBlur={() => handleBlur("endDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "endDay", "page8_endMonth_display", null)}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endDay ? styles.errorInput : ''} ${
            (isPresetActive && selectedPreset?.end_date) ? styles.readOnlyField : ""
          }`}
          ref={(el) => {
            if (el) inputRefs.current["page8_endDay_display"] = el; // Unique ref
            else delete inputRefs.current["page8_endDay_display"];
          }}
          data-error-field="endDay"
          aria-label="День закінчення (строк дії)"
          readOnly={isPresetActive && !!selectedPreset?.end_date} // ReadOnly if from preset
          disabled={dataLoading.preset} // Disabled during preset loading
        />{" "}
        »{" "}
        <input
          type="text"
          name="endMonth"
          value={formData.endMonth || ""}
          onChange={(e) => handleChange(e, "endMonth")}
          onFocus={() => handleFocus("endMonth")}
          onBlur={() => handleBlur("endMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "endMonth", "page8_endYear_display", "page8_endDay_display")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endMonth ? styles.errorInput : ''} ${
            (isPresetActive && selectedPreset?.end_date) ? styles.readOnlyField : ""
          }`}
          ref={(el) => {
            if (el) inputRefs.current["page8_endMonth_display"] = el;
            else delete inputRefs.current["page8_endMonth_display"];
          }}
          data-error-field="endMonth"
          aria-label="Місяць закінчення (строк дії)"
          readOnly={isPresetActive && !!selectedPreset?.end_date}
          disabled={dataLoading.preset}
        />{" "}
        <span>20</span>
        <input
          type="text"
          name="endYear"
          value={formData.endYear || ""}
          onChange={(e) => handleChange(e, "endYear")}
          onFocus={() => handleFocus("endYear")}
          onBlur={() => handleBlur("endYear")}
          onKeyDown={(e) => handleDateKeyDown(e, "endYear", null, "page8_endMonth_display")} // No next field in this date sequence
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endYear ? styles.errorInput : ''} ${
            (isPresetActive && selectedPreset?.end_date) ? styles.readOnlyField : ""
          }`}
          ref={(el) => {
            if (el) inputRefs.current["page8_endYear_display"] = el;
            else delete inputRefs.current["page8_endYear_display"];
          }}
          data-error-field="endYear"
          aria-label="Рік закінчення (строк дії, останні дві цифри)"
          readOnly={isPresetActive && !!selectedPreset?.end_date}
          disabled={dataLoading.preset}
        />{" "}
        р.
      </p>
      {/* Errors for endDay, endMonth, endYear are shown on Page1Content, no need to repeat here
          unless you want specific messages for this context */}
      <p className={styles.justifiedText}>
        7.2. Закінчення строку цього Договору не звільняє Сторони від відповідальності за його порушення, яке мало місце під час дії цього Договору.
      </p>
      <p className={styles.justifiedText}>
        7.3. Закінчення строку дії цього Договору не звільняє Сторони від виконання тих зобов'язань, що лишилися невиконаними.
      </p>
      <p className={styles.justifiedText}>
        7.4. Цей Договір може бути достроково розірваний: Університетом в односторонньому порядку з письмовим попередженням за 3 доби Мешканця у будь-яку пору року без надання іншого житлового приміщення. Підставами для дострокового припинення дії Договору є:
      </p>
      <p className={styles.justifiedText}>
        - відрахування Мешканця з Університету або переведення на заочну форму навчання;
      </p>
      <p className={styles.justifiedText}>
        - надання Мешканцю академічної відпустки;
      </p>
      <p className={styles.justifiedText}>
        - рішення Постійно діючої комісії з контролю за дотриманням правил внутрішнього розпорядку;
      </p>
      <p className={styles.justifiedText}>
        - несплата коштів або несвоєчасна сплата (борг більше 2-х місяців) за проживання у гуртожитку.
      </p>
    </div>
  );
};

export default Page8Content;