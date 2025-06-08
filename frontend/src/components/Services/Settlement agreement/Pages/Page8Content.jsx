import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";
import { getNestedError } from "../../../../pages/Services/Settlement agreement/helpers";

const Page8Content = ({
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  inputRefs,
  handleDateKeyDown,
  isPresetActive,
  selectedPreset,
  dataLoading,
}) => {
  const isDateReadOnly = isPresetActive && !!selectedPreset?.end_date;

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
          name="endDay"
          value={formData.endDay || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => handleDateKeyDown(e, "endDay", "endMonth", null)}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${touched.endDay && getNestedError(errors, 'endDay') ? styles.errorInput : ''} ${isDateReadOnly ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["endDay"] = el; }}
          readOnly={isDateReadOnly}
          disabled={dataLoading.preset}
        />
        »{" "}
        <input
          type="text"
          name="endMonth"
          value={formData.endMonth || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => handleDateKeyDown(e, "endMonth", "endYear", "endDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${touched.endMonth && getNestedError(errors, 'endMonth') ? styles.errorInput : ''} ${isDateReadOnly ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["endMonth"] = el; }}
          readOnly={isDateReadOnly}
          disabled={dataLoading.preset}
        />
        {" "}<span>20</span>
        <input
          type="text"
          name="endYear"
          value={formData.endYear || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={(e) => handleDateKeyDown(e, "endYear", null, "endMonth")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${touched.endYear && getNestedError(errors, 'endYear') ? styles.errorInput : ''} ${isDateReadOnly ? styles.readOnlyField : ""}`}
          ref={(el) => { inputRefs.current["endYear"] = el; }}
          readOnly={isDateReadOnly}
          disabled={dataLoading.preset}
        />
        {" "}р.
      </p>
      {touched.endDay && getNestedError(errors, 'endDay') && <p className={styles.error}>{getNestedError(errors, 'endDay')}</p>}
      
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