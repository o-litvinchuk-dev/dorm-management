import React from "react";
import styles from "../../../../pages/Services/Settlement agreement/styles/SettlementAgreementPage.module.css";

const Page9Content = ({
  formData,
  errors,
  handleChange,
  handleFocus,
  handleBlur,
  inputRefs,
}) => {
  return (
    <div className={styles.contractText}>
        <h3 className={styles.centeredTitle}>8. ПРИКІНЦЕВІ ПОЛОЖЕННЯ</h3>
        <p className={styles.justifiedText}>
          8.1. Спірні питання, які можуть виникнути між Сторонами у зв'язку з виконанням цього Договору, вирішуються шляхом проведення переговорів. Якщо таке врегулювання стає неможливим і Сторонам не вдалося досягти згоди, всі спори між Сторонами вирішуються у судовому порядку за місцем знаходження Університету.
        </p>
        <p className={styles.justifiedText}>
          8.2. Взаємовідносини Сторін, що не врегульовані цим Договором, регулюються чинним законодавством України та локальними актами Університету.
        </p>
        <p className={styles.justifiedText}>
          8.3. Недійсність окремих положень цього Договору не тягне за собою недійсність Договору в цілому.
        </p>
        <p className={styles.justifiedText}>
          8.4. Цей Договір складений при повному розумінні Сторонами його умов та термінології українською мовою у двох автентичних примірниках, які мають однакову юридичну силу, по одному для кожної із Сторін.
        </p>
        <p className={styles.justifiedText}>
          8.5. Додаткові угоди та додатки до цього Договору є його невід'ємною частиною і мають юридичну силу у разі, якщо вони викладені у письмовій формі, підписані Сторонами.
        </p>
        <p className={styles.justifiedText}>
          8.6. Мешканець, підписуючи цей Договір, підтверджує, що він ознайомлений з Правилами внутрішнього розпорядку в гуртожитках Університету, Положенням про студентський гуртожиток та іншими нормативно-правовими актами, що регулюють предмет цього Договору.
        </p>
        <h4>Додатки:</h4>
        <p className={styles.justifiedText}>
          1. Перелік меблів і м'якого інвентарю.
        </p>
        <p className={styles.justifiedText}>
          2. Акт приймання передачі житлового приміщення.
        </p>
        <p className={styles.justifiedText}>
          3. Перелік власних приладів, що споживають електроенергію, оплата за яку здійснюється Мешканцем додатково.
        </p>
      </div>
  );
};

export default Page9Content;