import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";

const Page8Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
}) => {
  const handleDateKeyDown = (e, currentField, nextField, prevField) => {
    if (e.key === "ArrowRight" && formData[currentField] && formData[currentField].length >= 2) {
      inputRefs.current[nextField]?.focus();
    } else if (e.key === "ArrowLeft" && formData[currentField] && formData[currentField].length === 0) {
      inputRefs.current[prevField]?.focus();
    } else if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
      if (inputRefs.current[nextField]) {
        inputRefs.current[nextField]?.focus();
        e.preventDefault();
      }
    } else if (e.key === "Tab" && e.shiftKey) {
       if (inputRefs.current[prevField]) {
        inputRefs.current[prevField]?.focus();
        e.preventDefault();
      }
    }
  };

  return (
    <div className={styles.contractText} role="region" aria-labelledby="section-title">
      <h3 id="section-title" className={styles.centeredTitle}>6. ВІДПОВІДАЛЬНІСТЬ СТОРІН</h3>
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
          name="endDay" // Це поле повторюється з Page1Content
          value={formData.endDay || ""}
          onChange={(e) => handleChange(e, "endDay")}
          onFocus={() => handleFocus("endDay")}
          onBlur={() => handleBlur("endDay")}
          onKeyDown={(e) => handleDateKeyDown(e, "endDay", "endMonth", null)} // prevField null, бо це початок секції
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endDay ? styles.errorInput : ''}`}
          ref={(el) => {
            if (el) inputRefs.current["page8_endDay"] = el; // Унікальний ref
            else delete inputRefs.current["page8_endDay"];
          }}
          required
          data-error-field="endDay" // data-error-field може бути однаковим, якщо валідація спільна
          aria-label="День закінчення (строк дії)"
          aria-invalid={!!errors.endDay}
          aria-describedby={errors.endDay ? "endDay-error" : undefined}
        />{" "}
        »{" "}
        <input
          type="text"
          name="endMonth"
          value={formData.endMonth || ""}
          onChange={(e) => handleChange(e, "endMonth")}
          onFocus={() => handleFocus("endMonth")}
          onBlur={() => handleBlur("endMonth")}
          onKeyDown={(e) => handleDateKeyDown(e, "endMonth", "endYear", "page8_endDay")}
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endMonth ? styles.errorInput : ''}`}
          ref={(el) => {
            if (el) inputRefs.current["page8_endMonth"] = el;
            else delete inputRefs.current["page8_endMonth"];
          }}
          required
          data-error-field="endMonth"
          aria-label="Місяць закінчення (строк дії)"
          aria-invalid={!!errors.endMonth}
          aria-describedby={errors.endMonth ? "endMonth-error" : undefined}
        />{" "}
        <span>20</span>
        <input
          type="text"
          name="endYear"
          value={formData.endYear || ""}
          onChange={(e) => handleChange(e, "endYear")}
          onFocus={() => handleFocus("endYear")}
          onBlur={() => handleBlur("endYear")}
          onKeyDown={(e) => handleDateKeyDown(e, "endYear", null, "page8_endMonth")} // nextField null, бо це кінець секції дати
          maxLength="2"
          placeholder="__"
          className={`${styles.inlineInputDate} ${errors.endYear ? styles.errorInput : ''}`}
          ref={(el) => {
            if (el) inputRefs.current["page8_endYear"] = el;
            else delete inputRefs.current["page8_endYear"];
          }}
          required
          data-error-field="endYear"
          aria-label="Рік закінчення (строк дії, останні дві цифри)"
          aria-invalid={!!errors.endYear}
          aria-describedby={errors.endYear ? "endYear-error" : undefined}
        />{" "}
        р.
      </p>
      {errors.endDay && <p id="endDay-error" className={styles.error}>{errors.endDay}</p>}
      {errors.endMonth && <p id="endMonth-error" className={styles.error}>{errors.endMonth}</p>}
      {errors.endYear && <p id="endYear-error" className={styles.error}>{errors.endYear}</p>}
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