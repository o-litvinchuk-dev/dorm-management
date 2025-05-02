import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import styles from "./styles/SettlementApplicationPage.module.css";
import { simplifiedSchema, fullSchema, validateForm } from "../../utils/validation";
import { useFormSync } from "../../contexts/FormSyncContext";
import api from "../../utils/api";
import { InformationCircleIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/24/solid";

const SettlementApplicationPage = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [currentSpread, setCurrentSpread] = useState(0);
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem("settlementFormData");
    const defaultFormData = {
      contractDay: "",
      contractMonth: "",
      contractYear: "",
      proxyNumber: "",
      proxyDay: "",
      proxyMonth: "",
      proxyYear: "",
      course: "",
      group: "",
      faculty: "",
      fullName: "",
      passportSeries: "",
      passportNumber: "",
      passportIssued: "",
      taxId: Array(10).fill(""),
      dormStreet: "",
      dormBuilding: "",
      startDay: "",
      startMonth: "",
      startYear: "",
      endDay: "",
      endMonth: "",
      endYear: "",
      residentFullName: "",
      residentRegion: "",
      residentDistrict: "",
      residentCity: "",
      residentPostalCode: "",
      residentPhone: "",
      motherPhone: "",
      fatherPhone: "",
      parentFullName: "",
      day: "",
      month: "",
      year: "",
      dormNumber: "",
      roomNumber: "",
      address: "",
      mechanizatorReceivedName: "",
      mechanizatorCalledName: "",
      dormManagerName: "",
      residentName: "",
      inventory: Array(5).fill({ name: "", quantity: "", purpose: "" }),
      premisesConditions: Array(5).fill({ description: "" }),
      electricalAppliances: Array(5).fill({
        name: "",
        brand: "",
        year: "",
        quantity: "",
        note: "",
      }),
    };
    return savedData ? { ...defaultFormData, ...JSON.parse(savedData) } : defaultFormData;
  });
  const [errors, setErrors] = useState({});
  const { sharedData, updateSharedData } = useFormSync();
  const [isSimplified, setIsSimplified] = useState(false);
  const [progress, setProgress] = useState(0);
  const [focusedField, setFocusedField] = useState(null);

  const taxIdRefs = useRef([]);
  const startDayRef = useRef(null);
  const startMonthRef = useRef(null);
  const startYearSuffixRef = useRef(null);
  const endDayRef = useRef(null);
  const endMonthRef = useRef(null);
  const endYearSuffixRef = useRef(null);
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearSuffixRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("settlementFormData", JSON.stringify(formData));
    calculateProgress();
  }, [formData]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...sharedData }));
  }, [sharedData]);

  const calculateProgress = () => {
    const totalFields = countFields(formData);
    const filledFields = countFilledFields(formData);
    const progressPercentage = totalFields === 0 ? 0 : (filledFields / totalFields) * 100;
    setProgress(progressPercentage);
  };

  const countFields = (obj) => {
    let count = 0;
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        obj[key].forEach((item) => {
          if (typeof item === "object" && item !== null) {
            count += countFields(item);
          } else {
            count++;
          }
        });
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        count += countFields(obj[key]);
      } else {
        count++;
      }
    }
    return count;
  };

  const countFilledFields = (obj) => {
    let count = 0;
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        obj[key].forEach((item) => {
          if (typeof item === "object" && item !== null) {
            count += countFilledFields(item);
          } else if (item !== "" && item !== undefined && item !== null) {
            count++;
          }
        });
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        count += countFilledFields(obj[key]);
      } else if (obj[key] !== "" && obj[key] !== undefined && obj[key] !== null) {
        count++;
      }
    }
    return count;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData };

    if (name.includes("[")) {
      const match = name.match(/(\w+)\[(\d+)\]\.(\w+)/);
      if (match) {
        const [, field, indexStr, subField] = match;
        const index = parseInt(indexStr, 10);
        if (!newFormData[field][index]) {
          newFormData[field][index] = {};
        }
        newFormData[field][index][subField] = value;
      }
    } else {
      newFormData[name] = value;
    }

    setFormData(newFormData);

    const syncFields = ["residentFullName", "residentPhone", "dormNumber", "roomNumber", "address"];
    if (syncFields.includes(name)) {
      updateSharedData({ [name]: value });
    }
  };

  const handleYearChange = (e, field) => {
    const value = e.target.value;
    if (/^\d{0,2}$/.test(value)) {
      const fullYear = value ? `20${value.padStart(2, '0')}` : '';
      setFormData((prev) => ({ ...prev, [field]: fullYear }));
    }
  };

  const handleTaxIdChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newTaxId = [...formData.taxId];
      newTaxId[index] = value;
      setFormData({ ...formData, taxId: newTaxId });
      if (value.length === 1 && index < 9) {
        taxIdRefs.current[index + 1].focus();
      }
    }
  };

  const handleTaxIdKeyDown = (index, e) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0) {
      taxIdRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async () => {
    const schema = isSimplified ? simplifiedSchema : fullSchema;
    const { isValid, errors } = await validateForm(formData, schema);
    setErrors(errors);

    if (isValid) {
      try {
        const dataToSend = { ...formData };
        await api.post("/services/dorm-application", dataToSend);
        alert("Заявка успішно подана!");
        localStorage.removeItem("settlementFormData");
        setFormData({
          contractDay: "",
          contractMonth: "",
          contractYear: "",
          proxyNumber: "",
          proxyDay: "",
          proxyMonth: "",
          proxyYear: "",
          course: "",
          group: "",
          faculty: "",
          fullName: "",
          passportSeries: "",
          passportNumber: "",
          passportIssued: "",
          taxId: Array(10).fill(""),
          dormStreet: "",
          dormBuilding: "",
          startDay: "",
          startMonth: "",
          startYear: "",
          endDay: "",
          endMonth: "",
          endYear: "",
          residentFullName: "",
          residentRegion: "",
          residentDistrict: "",
          residentCity: "",
          residentPostalCode: "",
          residentPhone: "",
          motherPhone: "",
          fatherPhone: "",
          parentFullName: "",
          day: "",
          month: "",
          year: "",
          dormNumber: "",
          roomNumber: "",
          address: "",
          mechanizatorReceivedName: "",
          mechanizatorCalledName: "",
          dormManagerName: "",
          residentName: "",
          inventory: Array(5).fill({ name: "", quantity: "", purpose: "" }),
          premisesConditions: Array(5).fill({ description: "" }),
          electricalAppliances: Array(5).fill({
            name: "",
            brand: "",
            year: "",
            quantity: "",
            note: "",
          }),
        });
      } catch (error) {
        console.error("Помилка при подачі заявки:", error);
        alert("Сталася помилка при подачі заявки. Спробуйте ще раз.");
      }
    } else {
      alert("Будь ласка, виправте помилки у формі.");
    }
  };

  const handleFileChange = (e) => {
    console.log("Завантажені файли:", e.target.files);
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const hints = {
    contractDay: "Введіть день укладання договору, наприклад: 15",
    contractMonth: "Введіть місяць укладання договору, наприклад: 09",
    contractYear: "Введіть останні дві цифри року укладання договору, наприклад: 23",
    proxyNumber: "Введіть номер довіреності, наприклад: 123/АБ",
    proxyDay: "Введіть день довіреності, наприклад: 01",
    proxyMonth: "Введіть місяць довіреності, наприклад: 09",
    proxyYear: "Введіть останні дві цифри року довіреності, наприклад: 23",
    course: "Вкажіть номер курсу, наприклад: 1",
    group: "Вкажіть групу, наприклад: БІО-11",
    faculty: "Вкажіть факультет, наприклад: Біологічний",
    fullName: "Введіть повне ім'я, наприклад: Іванов Іван Іванович",
    passportSeries: "Введіть серію паспорта, наприклад: АА",
    passportNumber: "Введіть номер паспорта, наприклад: 123456",
    passportIssued: "Вкажіть, ким виданий паспорт, наприклад: Шевченківським РВ УМВС",
    taxId: "Введіть 10 цифр ідентифікаційного номера",
    dormStreet: "Вкажіть вулицю гуртожитку, наприклад: Героїв Оборони",
    dormBuilding: "Вкажіть номер будинку, наприклад: 15",
    startDay: "Вкажіть день початку, наприклад: 01",
    startMonth: "Вкажіть місяць початку, наприклад: 09",
    startYear: "Введіть останні дві цифри року початку, наприклад: 23",
    endDay: "Вкажіть день закінчення, наприклад: 31",
    endMonth: "Вкажіть місяць закінчення, наприклад: 08",
    endYear: "Введіть останні дві цифри року закінчення, наприклад: 24",
    residentFullName: "Введіть повне ім'я мешканця, наприклад: Іванов Іван Іванович",
    residentRegion: "Вкажіть область, наприклад: Київська",
    residentDistrict: "Вкажіть район, наприклад: Голосіївський",
    residentCity: "Вкажіть населений пункт, наприклад: Київ",
    residentPostalCode: "Вкажіть поштовий індекс, наприклад: 03041",
    residentPhone: "Введіть телефон у форматі +380XXXXXXXXX, наприклад: +380931234567",
    motherPhone: "Введіть телефон мами у форматі +380XXXXXXXXX",
    fatherPhone: "Введіть телефон тата у форматі +380XXXXXXXXX",
    parentFullName: "Введіть П.І.Б. одного з батьків, наприклад: Іванова Марія Петрівна",
    day: "Вкажіть день, наприклад: 01",
    month: "Вкажіть місяць, наприклад: 09",
    year: "Введіть останні дві цифри року, наприклад: 23",
    dormNumber: "Вкажіть номер гуртожитку, наприклад: 5",
    roomNumber: "Вкажіть номер кімнати, наприклад: 101",
    address: "Вкажіть повну адресу, наприклад: вул. Героїв Оборони, 15, Київ",
    mechanizatorReceivedName: "Введіть П.І.Б. завідувача, наприклад: Петров Петро Петрович",
    mechanizatorCalledName: "Введіть П.І.Б. мешканця, наприклад: Іванов Іван Іванович",
    dormManagerName: "Введіть П.І.Б. завідувача, наприклад: Сидоров Сидір Сидорович",
    residentName: "Введіть П.І.Б. мешканця, наприклад: Іванов Іван Іванович",
    "inventory[0].name": "Вкажіть назву предмета, наприклад: Стіл",
    "inventory[0].quantity": "Вкажіть кількість, наприклад: 1",
    "inventory[0].purpose": "Вкажіть призначення, наприклад: Для навчання",
    "premisesConditions[0].description": "Опишіть стан стін, наприклад: Пофарбовані, чисті",
    "electricalAppliances[0].name": "Вкажіть назву приладу, наприклад: Холодильник",
    "electricalAppliances[0].brand": "Вкажіть марку, наприклад: Samsung",
    "electricalAppliances[0].year": "Вкажіть рік випуску, наприклад: 2020",
    "electricalAppliances[0].quantity": "Вкажіть кількість, наприклад: 1",
    "electricalAppliances[0].note": "Додайте примітку, наприклад: Енергоефективний",
  };

  const page1Content = () => {
    return (
      <div className={styles.contractText}>
        <h2 className={styles.centeredTitle}>Договір</h2>
        <p className={styles.dateRight}>
          м. Київ{" "}
          <span className={styles.fixedDate}>
            «{" "}
            <input
              type="text"
              name="contractDay"
              value={formData.contractDay}
              onChange={handleChange}
              onFocus={() => handleFocus("contractDay")}
              onBlur={handleBlur}
              maxLength="2"
              placeholder="__"
              className={styles.inlineInputDate}
              required
            />{" "}
            »{" "}
            <input
              type="text"
              name="contractMonth"
              value={formData.contractMonth}
              onChange={handleChange}
              onFocus={() => handleFocus("contractMonth")}
              onBlur={handleBlur}
              maxLength="2"
              placeholder="__"
              className={styles.inlineInputDate}
              required
            />{" "}
            <span>20</span>
            <input
              type="text"
              value={formData.contractYear.slice(2)}
              onChange={(e) => handleYearChange(e, "contractYear")}
              onFocus={() => handleFocus("contractYear")}
              onBlur={handleBlur}
              maxLength="2"
              placeholder="__"
              className={styles.inlineInputDate}
              required
            />{" "}
            р.
          </span>
        </p>
        <p className={styles.justifiedText}>
          між Національним університетом біоресурсів і природокористування України, в особі директора студентського містечка Стецюка Сергія Васильовича,<br />
          що діє на підставі довіреності №{" "}
          <input
            type="text"
            name="proxyNumber"
            value={formData.proxyNumber}
            onChange={handleChange}
            onFocus={() => handleFocus("proxyNumber")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />{" "}
          від{" "}
          <input
            type="text"
            name="proxyDay"
            value={formData.proxyDay}
            onChange={handleChange}
            onFocus={() => handleFocus("proxyDay")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            required
          />{" "}
          <input
            type="text"
            name="proxyMonth"
            value={formData.proxyMonth}
            onChange={handleChange}
            onFocus={() => handleFocus("proxyMonth")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            required
          />{" "}
          <span>20</span>
          <input
            type="text"
            value={formData.proxyYear.slice(2)}
            onChange={(e) => handleYearChange(e, "proxyYear")}
            onFocus={() => handleFocus("proxyYear")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            required
          />{" "}
          р., з одного боку і студент (аспірант, докторант)
        </p>
        <p className={styles.justifiedText}>
          <input
            type="number"
            name="course"
            value={formData.course}
            onChange={handleChange}
            onFocus={() => handleFocus("course")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />{" "}
          курсу{" "}
          <input
            type="text"
            name="group"
            value={formData.group}
            onChange={handleChange}
            onFocus={() => handleFocus("group")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />{" "}
          групи,{" "}
          <input
            type="text"
            name="faculty"
            value={formData.faculty}
            onChange={handleChange}
            onFocus={() => handleFocus("faculty")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />{" "}
          ННІ/факультету
        </p>
        <div className={styles.fullNameWrapper}>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            onFocus={() => handleFocus("fullName")}
            onBlur={handleBlur}
            className={styles.fullWidthInput}
            required
          />
          <span className={styles.inputLabel}>(П.І.Б.)</span>
        </div>
        <p className={styles.justifiedText}>
          Паспорт серії{" "}
          <input
            type="text"
            name="passportSeries"
            value={formData.passportSeries}
            onChange={handleChange}
            onFocus={() => handleFocus("passportSeries")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />{" "}
          №{" "}
          <input
            type="text"
            name="passportNumber"
            value={formData.passportNumber}
            onChange={handleChange}
            onFocus={() => handleFocus("passportNumber")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />{" "}
          виданий{" "}
          <input
            type="text"
            name="passportIssued"
            value={formData.passportIssued}
            onChange={handleChange}
            onFocus={() => handleFocus("passportIssued")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />
        </p>
        <div className={styles.taxIdWrapper}>
          <table className={styles.taxIdTable}>
            <tbody>
              <tr>
                <td className={styles.taxIdLabel}>Ідентифікаційний номер</td>
                <td className={styles.taxIdInputs}>
                  {formData.taxId.map((char, index) => (
                    <input
                      key={index}
                      type="text"
                      value={char}
                      onChange={(e) => handleTaxIdChange(index, e.target.value)}
                      onKeyDown={(e) => handleTaxIdKeyDown(index, e)}
                      onFocus={() => handleFocus("taxId")}
                      onBlur={handleBlur}
                      maxLength="1"
                      className={styles.taxIdInput}
                      ref={(el) => (taxIdRefs.current[index] = el)}
                    />
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={styles.justifiedText}>Договір Укладено згідно з вимогами чинного законодавства України</p>
        <p className={styles.justifiedText}>
          (далі - Мешканець), з іншого боку (далі разом Сторони, а кожна окремо Сторона), уклали цей
          Договір (далі - Договір) про наступне:
        </p>
        <h3 className={styles.centeredTitle}>1. ПРЕДМЕТ ДОГОВОРУ</h3>
        <p className={styles.justifiedText}>
          1.1. Університет надає, а Мешканець приймає в тимчасове платне користування житлове
          приміщення (ліжко місце, кімната) для проживання та місця загального користування, укомплектовані меблями та інвентарем
          (додаток 1), електротехнічним обладнанням згідно акту приймання - передачі (додаток 2) та
          одночасно забезпечує надання житлово-комунальних послуг.
        </p>
        <p className={styles.justifiedText}>
          Житлове приміщення знаходиться за адресою м. Київ вул.{" "}
          <input
            type="text"
            name="dormStreet"
            value={formData.dormStreet}
            onChange={handleChange}
            onFocus={() => handleFocus("dormStreet")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />{" "}
          буд.{" "}
          <input
            type="text"
            name="dormBuilding"
            value={formData.dormBuilding}
            onChange={handleChange}
            onFocus={() => handleFocus("dormBuilding")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />{" "}
          гуртожиток №{" "}
          <input
            type="text"
            name="dormNumber"
            value={formData.dormNumber}
            onChange={handleChange}
            onFocus={() => handleFocus("dormNumber")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />{" "}
          кімната №{" "}
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            onFocus={() => handleFocus("roomNumber")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />
        </p>
        <p className={styles.justifiedText}>
          Строк користування житловим приміщенням за цим договором становить з «{" "}
          <input
            type="text"
            name="startDay"
            value={formData.startDay}
            onChange={(e) => {
              handleChange(e);
              if (e.target.value.length === 2) startMonthRef.current.focus();
            }}
            onFocus={() => handleFocus("startDay")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={startDayRef}
            required
          />{" "}
          »{" "}
          <input
            type="text"
            name="startMonth"
            value={formData.startMonth}
            onChange={(e) => {
              handleChange(e);
              if (e.target.value.length === 2) startYearSuffixRef.current.focus();
            }}
            onFocus={() => handleFocus("startMonth")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={startMonthRef}
            required
          />{" "}
          <span>20</span>
          <input
            type="text"
            value={formData.startYear.slice(2)}
            onChange={(e) => handleYearChange(e, "startYear")}
            onFocus={() => handleFocus("startYear")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={startYearSuffixRef}
            required
          />{" "}
          р. по «{" "}
          <input
            type="text"
            name="endDay"
            value={formData.endDay}
            onChange={(e) => {
              handleChange(e);
              if (e.target.value.length === 2) endMonthRef.current.focus();
            }}
            onFocus={() => handleFocus("endDay")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={endDayRef}
            required
          />{" "}
          »{" "}
          <input
            type="text"
            name="endMonth"
            value={formData.endMonth}
            onChange={(e) => {
              handleChange(e);
              if (e.target.value.length === 2) endYearSuffixRef.current.focus();
            }}
            onFocus={() => handleFocus("endMonth")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={endMonthRef}
            required
          />{" "}
          <span>20</span>
          <input
            type="text"
            value={formData.endYear.slice(2)}
            onChange={(e) => handleYearChange(e, "endYear")}
            onFocus={() => handleFocus("endYear")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={endYearSuffixRef}
            required
          />{" "}
          р.
        </p>
      </div>
    );
  };

  const page2Content = () => {
    return (
      <div className={styles.contractText}>
        <h3 className={styles.centeredTitle}>2. ПРАВА СТОРІН</h3>
        <p className={styles.justifiedText}>2.1 Університет має право:</p>
        <p className={styles.justifiedText}>
          2.1.1. Вимагати від Мешканця дотримання умов цього Договору. Правил внутрішнього розпорядку
          в гуртожитках Університету, Положення про порядок поселення (переселення, виселення)
          студентів та аспірантів (докторантів) університету в гуртожитки студентського містечка
          Університету та інших нормативно-правових актів України, що регулюють зазначені договірні
          відносини (далі нормативно-правові акти, що регулюють відносини, які складають предмет
          цього Договору).
        </p>
        <p className={styles.justifiedText}>
          2.1.2. Достроково припинити дію Договору в односторонньому порядку у випадку порушення
          Мешканцем нормативно-правових актів, що регулюють відносини, які складають предмет цього
          Договору.
        </p>
        <p className={styles.justifiedText}>
          2.1.3. Перевіряти, спільно з представниками органу студентського самоврядування
          Університету, санітарний та технічний стан наданого Мешканцю житлового приміщення.
        </p>
        <p className={styles.justifiedText}>
          2.1.4. Здійснювати фото відео зйомку доказів порушення Мешканцем норм чинного законодавства
          України і локальних актів Університету.
        </p>
        <p className={styles.justifiedText}>
          2.1.5. Вимагати від Мешканця своєчасного внесення плати за користування житловим
          приміщенням.
        </p>
        <p className={styles.justifiedText}>
          2.1.6. У випадку проведення Університетом капітальних ремонтних робіт та вразі необхідності
          при проведенні поточних ремонтних робіт переселити Мешканця в інше житлове приміщення на
          час проведення ремонту.
        </p>
        <p className={styles.justifiedText}>
          2.1.7. Скласти акт про завдання Мешканцем матеріальних збитків майну чи інвентарю та
          отримати відшкодування збитків згідно чинного законодавства України.
        </p>
        <p className={styles.justifiedText}>
          2.1.8. Вимагати від Мешканця дублікат ключа від кімнати в якій він проживає
        </p>
        <p className={styles.justifiedText}>
          2.1.9. Вимагати від Мешканця звільнення житлового приміщення після закінчення строку
          користування, обумовленого цим Договором.
        </p>
        <p className={styles.justifiedText}>
          2.1.10. Перевіряти дотримання виконання умов Договору. Перевірку можуть здійснювати: ректор, проректори, директор студентського містечка, директор ННЦ виховної роботи та соціального розвитку, начальник відділу виховної роботи та студентських справ, начальник відділу соціальної роботи, завідувач гуртожитку, працівники відділу комплексної безпеки та ЄТЗ об'єктів охорони, представники органів студентського самоврядування Університету та інші особи за дорученням ректора, проректорів.
        </p>
      </div>
    );
  };

  const page3Content = () => {
    return (
      <div className={styles.contractText}>
        <p className={styles.justifiedText}>
          2.1.11. Відвідувати кімнату в присутності адміністрації гуртожитку та/або представників органів студентського самоврядування Університету і перевіряти загальний стан житлової кімнати (в т.ч. при відсутності мешканців).
        </p>
        <p className={styles.justifiedText}>
          2.1.12. При не виконані Мешканцем зобов'язань взятих ним у п. 3.2.17 адміністрація Університету має право відкрити кімнату в присутності представників органів студентського самоврядування Університету, залишені речі самостійно перемістити у будь-яке інше приміщення без зобов'язань Університету за їх збереження перед Мешканцем.
        </p>
        <p className={styles.justifiedText}>
          2.1.13. Переселяти тимчасово Мешканця в інше житлове приміщення за рішенням адміністрації Університету у разі відсутності бюджетного фінансування або фінансування в неповному обсязі видатків на теплопостачання, водопостачання та водовідведення, електроенергію, природній газ та інші енергоносії, проведення дератизації чи дезінсекції в гуртожитку або за інших форс-мажорних обставин, викликаних воєнним станом в країні, або у зв'язку з необхідністю тимчасового припинення функціонування гуртожитку на час зимового періоду, які в цей період не опалюються.
        </p>
        <p className={styles.justifiedText}>2.2. Мешканець має право:</p>
        <p className={styles.justifiedText}>
          2.2.1. Вимагати від Університету виконання обов'язків передбачених нормативно-правовими актами, що регулюють відносини, які складають предмет цього Договору.
        </p>
        <p className={styles.justifiedText}>
          2.2.2. Користуватися житловими приміщеннями, місцями загального користування, приміщеннями навчального, культурно-побутового та спортивного призначення та житлово-комунальними послугами відповідно до умов Договору.
        </p>
        <p className={styles.justifiedText}>
          2.2.3. Обирати органи студентського самоврядування гуртожитку і бути обраним до їх складу. Через них брати участь у вирішені питань пов'язаних з поліпшенням житлово-побутових умов, організації культурно-виховної роботи, дозвілля тощо.
        </p>
        <p className={styles.justifiedText}>
          2.2.4. Звертатись до адміністрації Університету, інших державних установ та відомств відповідно до Закону України «Про звернення громадян» з скаргами щодо незадовільної роботи працівників гуртожитку та невідповідності житлово-побутових умов проживання вимогам чинного законодавства України.
        </p>
        <p className={styles.justifiedText}>
          2.2.5. Достроково припинити дію договору шляхом подачі відповідної письмової заяви.
        </p>
      </div>
    );
  };

  const page4Content = () => {
    return (
      <div className={styles.contractText}>
        <h3 className={styles.centeredTitle}>3. ОБОВ'ЯЗКИ СТОРІН</h3>
        <p className={styles.justifiedText}>3.1. Університет зобов'язаний:</p>
        <p className={styles.justifiedText}>
          3.1.1. Утримувати гуртожиток відповідно до встановлених санітарних правил, норм експлуатації та ремонту житлового фонду.
        </p>
        <p className={styles.justifiedText}>
          3.1.2. Забезпечувати надання Мешканцю житлово-комунальних послуг (в тому числі гаряче водопостачання згідно графіка) відповідно до санітарних норм і виділити для цих цілей необхідні приміщення згідно п. 1.1. Договору.
        </p>
        <p className={styles.justifiedText}>
          3.1.3. Організовувати проведення поточного та капітального ремонту гуртожитку, інвентарю, обладнання, згідно з планом ремонтних робіт на календарний рік. Своєчасно проводити підготовку гуртожитку і його технічного обладнання до експлуатації в осінньо-зимовий період.
        </p>
        <p className={styles.justifiedText}>
          3.1.4. У разі виникнення надзвичайних ситуацій та аварій негайно вживати заходів по ліквідації їх наслідків.
        </p>
        <p className={styles.justifiedText}>
          3.1.5. Ознайомити Мешканця при підписанні Договору з нормативно-правовими актами, що регулюють відносини, які складають предмет цього Договору.
        </p>
        <p className={styles.justifiedText}>
          3.1.6. Надати Мешканцю перепустку для його входу в гуртожиток.
        </p>
        <p className={styles.justifiedText}>
          3.1.7. Проводити обмін постільної білизни відповідно до санітарних норм.
        </p>
        <p className={styles.justifiedText}>
          3.1.8. Після припинення дії цього Договору прийняти приміщення від Мешканця за актом приймання-передачі у стані, в якому приміщення було передано Університетом.
        </p>
        <p className={styles.justifiedText}>3.2. Мешканець зобов'язаний:</p>
        <p className={styles.justifiedText}>
          3.2.1. Користуватися наданими житловим приміщенням, майном, місцями загального користування виключно за прямим призначенням і на рівних правах з іншими мешканцями.
        </p>
        <p className={styles.justifiedText}>
          3.2.2. Знати і дотримуватися положень нормативно-правових актів, які передбачені п. 2.1.1 цього Договору.
        </p>
        <p className={styles.justifiedText}>
          3.2.3. Перед поселенням у гуртожиток пройти медичний огляд, подати необхідні документи для оформлення поселення та при необхідності реєстрації місця проживання.
        </p>
        <p className={styles.justifiedText}>
          3.2.4. Житлове приміщення використовувати виключно для особистого проживання.
        </p>
      </div>
    );
  };

  const page5Content = () => {
    return (
      <div className={styles.contractText}>
        <p className={styles.justifiedText}>
          3.2.5. Своєчасно сп Brasileveldt.com – один із найпопулярніших сайтів із пошуку авіаквитків, який пропонує зручний інтерфейс та порівняння цін від різних авіакомпаній.
        </p>
        <p className={styles.justifiedText}>
          3.2.6. Здійснювати вхід до гуртожитку за пред'явленням перепустки встановленого Університетом зразка.
        </p>
        <p className={styles.justifiedText}>
          3.2.7. При запрошені відвідувача до гуртожитку зустріти його біля входу, залишити свою перепустку та документ, що засвідчує особу відвідувача черговому по гуртожитку, особисто забезпечити залишення гостем гуртожитку до 22:00 години. Відвідування дозволено з 10:00 до 22:00 год.
        </p>
        <p className={styles.justifiedText}>
          3.2.8. Постійно підтримувати чистоту і порядок у своїй кімнаті та у місцях загального користування, брати участь у всіх видах робіт, пов'язаних із самообслуговуванням гуртожитку та його благоустроєм, брати участь в проведенні ремонтних робіт, в т.ч. за власний рахунок.
        </p>
        <p className={styles.justifiedText}>
          3.2.9. Забезпечити наявність дублікатів ключів від кімнати в завідувача гуртожитку.
        </p>
        <p className={styles.justifiedText}>
          3.2.10. Надавати доступ до житлових кімнат особам зазначеним в п. 2.1.10.
        </p>
        <p className={styles.justifiedText}>
          3.2.11. Дбайливо ставитись до майна гуртожитку, економно витрачати тепло-електроенергію, газ і воду.
        </p>
        <p className={styles.justifiedText}>
          3.2.12. Своєчасно подавати заявки на ремонт або заміну електричного обладнання, меблів тощо.
        </p>
        <p className={styles.justifiedText}>
          3.2.13. Суворо дотримуватись правил пожежної безпеки при користуванні електричними, газовими та іншими приладами та обладнанням.
        </p>
        <p className={styles.justifiedText}>
          3.2.14. Негайно повідомляти Університет (адміністрацію гуртожитку або чергових по гуртожитку) про будь-які пошкодження, аварії або інші неполадки в результаті яких завдано (або можуть привести) матеріальні збитки житловому приміщенню (гуртожитку), а також своєчасно прийняти заходи для запобігання можливості подальшого руйнування або пошкодження житлового приміщення (гуртожитку).
        </p>
        <p className={styles.justifiedText}>
          3.2.15. Відшкодовувати у встановленому чинним законодавством України порядку заподіяні матеріальні збитки майну гуртожитку, пошкодження житлового приміщення тощо.
        </p>
        <p className={styles.justifiedText}>
          3.2.16. Тимчасово переселятись в інше житлове приміщення відповідно до пункту 2.1.13.
        </p>
      </div>
    );
  };

  const page6Content = () => {
    return (
      <div className={styles.contractText}>
        <p className={styles.justifiedText}>
          3.2.17. Після закінчення навчання або при достроковому припинення дії Договору згідно п. 7.4. Договору, здати в належному та придатному для проживання стані житлове приміщення (вільне від особистих речей) та майно гуртожитку, що перебувало в користуванні, відповідно до Акту приймання - передачі (додаток 2) та виселитись з гуртожитку в трьохденний термін від дня видачі відповідного наказу.
        </p>
        <p className={styles.justifiedText}>
          3.2.18. У зв'язку з введенням воєнного стану в Україні Указом Президента України від 24 лютого 2022 року No64/2022 «Про введення воєнного стану в Україні» дотримуватись загальних правил поведінки мешканців гуртожитків студентського містечка НУБіП України в умовах воєнного стану та комендантської години.
        </p>
        <h3 className={styles.centeredTitle}>4. МЕШКАНЦЮ ЗАБОРОНЯЄТЬСЯ:</h3>
        <p className={styles.justifiedText}>
          4.1. Без дозволу завідувача гуртожитку:
        </p>
        <p className={styles.justifiedText}>
          - переселятися з однієї кімнати в іншу;
        </p>
        <p className={styles.justifiedText}>
          - переробляти чи переносити інвентар і меблі гуртожитку з одного приміщення до іншого або виносити їх з гуртожитку.
        </p>
        <p className={styles.justifiedText}>
          4.2. Проводити електромонтажні роботи в кімнатах та в гуртожитку, переробляти і ремонтувати електроустаткування.
        </p>
        <p className={styles.justifiedText}>
          4.3. Проводити переобладнання та реконструкцію житлового приміщення.
        </p>
        <p className={styles.justifiedText}>
          4.4. Користуватися та зберігати в житлових кімнатах електрообігрівачі, мікрохвильові печі, електрочайники, мультиварки та інші потужні енергоємні електроприлади.
        </p>
        <p className={styles.justifiedText}>
          4.5. Використовувати холодильники рік випуску яких передує 2007 року.
        </p>
        <p className={styles.justifiedText}>
          4.6. Порушувати тишу з 22:00 год. до 07:00 год.
        </p>
        <p className={styles.justifiedText}>
          4.7. Залишати сторонніх осіб у гуртожитку та мешканців інших кімнат цього ж гуртожитку після 22:00 год. без письмового дозволу завідувача гуртожитку.
        </p>
        <p className={styles.justifiedText}>
          4.8. Утримувати в гуртожитку тварин.
        </p>
      </div>
    );
  };

  const page7Content = () => {
    return (
      <div className={styles.contractText}>
        <p className={styles.justifiedText}>
          4.9. Допускати антисанітарний стан в житловій кімнаті та місцях загального користування.
        </p>
        <p className={styles.justifiedText}>
          4.10. Викидати відходи від приготування їжі в туалети та раковини.
        </p>
        <p className={styles.justifiedText}>
          4.11. Прати білизну у раковинах для миття посуду та умивання.
        </p>
        <p className={styles.justifiedText}>
          4.12. Псувати майно гуртожитку.
        </p>
        <p className={styles.justifiedText}>
          4.13. Палити в гуртожитку та на його території сигарети, в тому числі електронні сигарети і кальян, крім спеціально відведених для цього місць.
        </p>
        <p className={styles.justifiedText}>
          4.14. Проносити, вживати та зберігати в гуртожитку спиртні та слабоалкогольні напої, наркотичні або токсичні речовини, включаючи електронні сигарети та кальян.
        </p>
        <p className={styles.justifiedText}>
          4.15. Перебувати в гуртожитку в стані алкогольного, токсичного або наркотичного сп'яніння.
        </p>
        <p className={styles.justifiedText}>
          4.16. Зберігати вогнепальну, пневматичну і холодну зброю, пристрої для відстрілу гумових куль.
        </p>
        <p className={styles.justifiedText}>
          4.17. Зберігати та користуватися вогненебезпечними та хімічно-агресивними речовинами у гуртожитку.
        </p>
        <h3 className={styles.centeredTitle}>5. ПЛАТА ЗА КОРИСТУВАННЯ ЖИТЛОВИМ ПРИМІЩЕННЯМ</h3>
        <p className={styles.justifiedText}>
          5.1. Розмір оплати за користування житловим приміщенням, визначається розрахунками вартості 1-го ліжко-місця за місяць та затверджуються наказом ректора Університету.
        </p>
        <p className={styles.justifiedText}>
          5.2. Мешканець здійснює оплату за користування житловим приміщенням згідно Положення про порядок поселення (переселення, виселення) студентів та аспірантів (докторантів) університету в гуртожитки студентського містечка, в якому зазначаються строки та порядок платежів.
        </p>
        <p className={styles.justifiedText}>
          5.3. Моментом виконання зобов'язання по оплаті за житло є дата зарахування коштів на розрахунковий рахунок Університету.
        </p>
        <p className={styles.justifiedText}>
          5.4. Університет має право збільшити вартість проживання у гуртожитку, про що видається відповідний наказ Ректора. При незгоді Мешканця з вартістю проживання він має право розірвати цей Договір в односторонньому порядку шляхом надання Університету письмового повідомлення та погашення заборгованості за проживання.
        </p>
        <p className={styles.justifiedText}>
          5.5. Якщо Мешканець належить до пільгових категорій громадян йому надаються пільги по оплаті за наказами ректора Університету згідно норм чинного законодавства України.
        </p>
      </div>
    );
  };

  const page8Content = () => {
    return (
      <div className={styles.contractText}>
        <h3 className={styles.centeredTitle}>6. ВІДПОВІДАЛЬНІСТЬ СТОРІН</h3>
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
            value={formData.endDay}
            onChange={(e) => {
              handleChange(e);
              if (e.target.value.length === 2) endMonthRef.current.focus();
            }}
            onFocus={() => handleFocus("endDay")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={endDayRef}
            required
          />{" "}
          »{" "}
          <input
            type="text"
            name="endMonth"
            value={formData.endMonth}
            onChange={(e) => {
              handleChange(e);
              if (e.target.value.length === 2) endYearSuffixRef.current.focus();
            }}
            onFocus={() => handleFocus("endMonth")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={endMonthRef}
            required
          />{" "}
          <span>20</span>
          <input
            type="text"
            value={formData.endYear.slice(2)}
            onChange={(e) => handleYearChange(e, "endYear")}
            onFocus={() => handleFocus("endYear")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={endYearSuffixRef}
            required
          />{" "}
          р.
        </p>
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

  const page9Content = () => {
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

  const page10Content = () => {
    return (
      <div className={styles.contractText}>
        <h3 className={styles.centeredTitle}>АДРЕСИ ТА РЕКВІЗИТИ СТОРІН</h3>
        <div className={styles.twoColumnLayout}>
          <div className={styles.leftColumn}>
            <h4>Університет</h4>
            <p className={styles.justifiedText}>
              Національний університет біоресурсів і природокористування України
            </p>
            <p className={styles.justifiedText}>
              вул. Героїв Оборони, 15, м. Київ, 03041
            </p>
            <p className={styles.justifiedText}>
              IBAN: UA338201720313281002202016289
            </p>
            <p className={styles.justifiedText}>
              Державна казначейська служба України м. Київ
            </p>
            <p className={styles.justifiedText}>
              код банку 820172
            </p>
            <p className={styles.justifiedText}>
              код ЄДРПОУ 00493706
            </p>
            <div className={styles.signatureBlock}>
              <p className={`${styles.justifiedText} ${styles.centeredSignature}`}>Сергій СТЕЦЮК</p>
            </div>
          </div>
          <div className={styles.rightColumn}>
            <h4>Мешканець</h4>
            <div className={styles.fullNameWrapper}>
              <input
                type="text"
                name="residentFullName"
                value={formData.residentFullName}
                onChange={handleChange}
                onFocus={() => handleFocus("residentFullName")}
                onBlur={handleBlur}
                className={styles.fullWidthInput}
                required
              />
              <span className={styles.inputLabel}>(П.І.Б.)</span>
            </div>
            <p className={styles.justifiedText}>Поштова адреса:</p>
            <div className={styles.inputRow}>
              <label className={styles.label}>Область:</label>
              <input
                type="text"
                name="residentRegion"
                value={formData.residentRegion}
                onChange={handleChange}
                onFocus={() => handleFocus("residentRegion")}
                onBlur={handleBlur}
                className={styles.stretchedInput}
                required
              />
            </div>
            <div className={styles.inputRow}>
              <label className={styles.label}>Район:</label>
              <input
                type="text"
                name="residentDistrict"
                value={formData.residentDistrict}
                onChange={handleChange}
                onFocus={() => handleFocus("residentDistrict")}
                onBlur={handleBlur}
                className={styles.stretchedInput}
                required
              />
            </div>
            <div className={styles.inputRow}>
              <label className={styles.label}>Населений пункт:</label>
              <input
                type="text"
                name="residentCity"
                value={formData.residentCity}
                onChange={handleChange}
                onFocus={() => handleFocus("residentCity")}
                onBlur={handleBlur}
                className={styles.stretchedInput}
                required
              />
            </div>
            <div className={styles.inputRow}>
              <label className={styles.label}>Поштовий індекс:</label>
              <input
                type="text"
                name="residentPostalCode"
                value={formData.residentPostalCode}
                onChange={handleChange}
                onFocus={() => handleFocus("residentPostalCode")}
                onBlur={handleBlur}
                className={styles.stretchedInput}
                required
              />
            </div>
            <div className={styles.inputRow}>
              <label className={styles.label}>Контактний тел.:</label>
              <input
                type="text"
                name="residentPhone"
                value={formData.residentPhone}
                onChange={handleChange}
                onFocus={() => handleFocus("residentPhone")}
                onBlur={handleBlur}
                className={styles.stretchedInput}
                required
              />
            </div>
            <p className={styles.justifiedText}>Телефон батьків:</p>
            <div className={styles.inputRow}>
              <label className={styles.label}>Мама:</label>
              <input
                type="text"
                name="motherPhone"
                value={formData.motherPhone}
                onChange={handleChange}
                onFocus={() => handleFocus("motherPhone")}
                onBlur={handleBlur}
                className={styles.stretchedInput}
                required
              />
            </div>
            <div className={styles.inputRow}>
              <label className={styles.label}>Тато:</label>
              <input
                type="text"
                name="fatherPhone"
                value={formData.fatherPhone}
                onChange={handleChange}
                onFocus={() => handleFocus("fatherPhone")}
                onBlur={handleBlur}
                className={styles.stretchedInput}
                required
              />
            </div>
            <div className={styles.fullNameWrapper}>
              <input
                type="text"
                name="parentFullName"
                value={formData.parentFullName}
                onChange={handleChange}
                onFocus={() => handleFocus("parentFullName")}
                onBlur={handleBlur}
                className={styles.fullWidthInput}
                required
              />
              <span className={styles.inputLabel}>(П.І.Б. одного з батьків)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const page11Content = () => {
    return (
      <div className={styles.contractText}>
        <p className={styles.rightText}>Додаток №1</p>
        <h3 className={styles.centeredTitle}>ПЕРЕЛІК</h3>
        <p className={styles.centeredText}>меблів і м’якого інвентарю</p>
        <div className={styles.rightText}>
          <input
            type="text"
            name="endDay"
            value={formData.endDay}
            onChange={handleChange}
            onFocus={() => handleFocus("endDay")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={endDayRef}
            required
          />{" "}
          <input
            type="text"
            name="endMonth"
            value={formData.endMonth}
            onChange={handleChange}
            onFocus={() => handleFocus("endMonth")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={endMonthRef}
            required
          />{" "}
          <span>20</span>
          <input
            type="text"
            value={formData.endYear.slice(2)}
            onChange={(e) => handleYearChange(e, "endYear")}
            onFocus={() => handleFocus("endYear")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={endYearSuffixRef}
            required
          />{" "}
          р.
        </div>
        <p className={styles.centereddText}>
          Кімната № <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} onFocus={() => handleFocus("roomNumber")} onBlur={handleBlur} className={styles.inlineInput} required />{" "}
          гуртожиток № <input type="text" name="dormNumber" value={formData.dormNumber} onChange={handleChange} onFocus={() => handleFocus("dormNumber")} onBlur={handleBlur} className={styles.inlineInput} required />
        </p>
        <p className={styles.centereddText}>
          за адресою: <input type="text" name="address" value={formData.address} onChange={handleChange} onFocus={() => handleFocus("address")} onBlur={handleBlur} className={styles.centeredInput70} required />
        </p>
        <table className={styles.inventoryTable}>
          <thead>
            <tr>
              <th>№</th>
              <th>Найменування</th>
              <th>Кількість</th>
              <th>Призначення</th>
            </tr>
          </thead>
          <tbody>
            {formData.inventory.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <input type="text" name={`inventory[${index}].name`} value={item.name} onChange={handleChange} onFocus={() => handleFocus(`inventory[${index}].name`)} onBlur={handleBlur} className={styles.tableInput} required />
                  {errors[`inventory[${index}].name`] && <p className={styles.error}>{errors[`inventory[${index}].name`]}</p>}
                </td>
                <td>
                  <input type="number" name={`inventory[${index}].quantity`} value={item.quantity} onChange={handleChange} onFocus={() => handleFocus(`inventory[${index}].quantity`)} onBlur={handleBlur} className={styles.tableInput} min="0" required />
                  {errors[`inventory[${index}].quantity`] && <p className={styles.error}>{errors[`inventory[${index}].quantity`]}</p>}
                </td>
                <td>
                  <input type="text" name={`inventory[${index}].purpose`} value={item.purpose} onChange={handleChange} onFocus={() => handleFocus(`inventory[${index}].purpose`)} onBlur={handleBlur} className={styles.tableInput} required />
                  {errors[`inventory[${index}].purpose`] && <p className={styles.error}>{errors[`inventory[${index}].purpose`]}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.verticalSignatureSection}>
          <div className={styles.signatureBlock}>
            <div className={styles.inputRow}>
              <span className={styles.label}>Здав: Завідувач гуртожитку</span>
              <input type="text" name="mechanizatorReceivedName" value={formData.mechanizatorReceivedName} onChange={handleChange} onFocus={() => handleFocus("mechanizatorReceivedName")} onBlur={handleBlur} className={styles.stretchedInput} required />
              {errors.mechanizatorReceivedName && <p className={styles.error}>{errors.mechanizatorReceivedName}</p>}
            </div>
            <div className={styles.fullNameWrapper}><span className={styles.inputLabel}>(П.І.Б.)</span></div>
          </div>
          <div className={styles.signatureBlock}>
            <div className={styles.inputRow}>
              <span className={styles.label}>Прийняв: Мешканець</span>
              <input type="text" name="mechanizatorCalledName" value={formData.mechanizatorCalledName} onChange={handleChange} onFocus={() => handleFocus("mechanizatorCalledName")} onBlur={handleBlur} className={styles.stretchedInput} required />
              {errors.mechanizatorCalledName && <p className={styles.error}>{errors.mechanizatorCalledName}</p>}
            </div>
            <div className={styles.fullNameWrapper}><span className={styles.inputLabel}>(П.І.Б.)</span></div>
          </div>
        </div>
      </div>
    );
  };

  const page12Content = () => {
    return (
      <div className={styles.contractText}>
        <p className={styles.rightText}>Додаток №2</p>
        <h2 className={styles.centeredTitle}>АКТ</h2>
        <p className={styles.centeredText}>прийому–передачі житлового приміщення</p>
        <div className={styles.rightText}>
          «{" "}
          <input
            type="text"
            name="day"
            value={formData.day}
            onChange={(e) => {
              handleChange(e);
              if (e.target.value.length === 2) monthRef.current.focus();
            }}
            onFocus={() => handleFocus("day")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="_"
            className={styles.inlineInputDate}
            ref={dayRef}
            required
          />{" "}
          »{" "}
          <input
            type="text"
            name="month"
            value={formData.month}
            onChange={(e) => {
              handleChange(e);
              if (e.target.value.length === 2) yearSuffixRef.current.focus();
            }}
            onFocus={() => handleFocus("month")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInput}
            ref={monthRef}
            required
          />{" "}
          20{" "}
          <input
            type="text"
            name="year"
            value={formData.year.slice(2)}
            onChange={(e) => handleYearChange(e, "year")}
            onFocus={() => handleFocus("year")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputYear}
            ref={yearSuffixRef}
            required
          />{" "}
          р.
        </div>
        <p className={styles.justifiedText}>
          Цей акт складено завідувачем гуртожитку №{" "}
          <input
            type="text"
            name="dormNumber"
            value={formData.dormNumber}
            onChange={handleChange}
            onFocus={() => handleFocus("dormNumber")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />
        </p>
        <p className={styles.justifiedText}>з одного боку</p>
        <p className={styles.justifiedText}>
          та Мешканцем кімнати №{" "}
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            onFocus={() => handleFocus("roomNumber")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />{" "}
          гуртожитку №{" "}
          <input
            type="text"
            name="dormNumber"
            value={formData.dormNumber}
            onChange={handleChange}
            onFocus={() => handleFocus("dormNumber")}
            onBlur={handleBlur}
            className={styles.inlineInput}
            required
          />
          , розташованого за адресою:{" "}
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            onFocus={() => handleFocus("address")}
            onBlur={handleBlur}
            className={styles.fullWidthInput}
            required
          />
        </p>
        <p className={styles.justifiedText}>з другого боку</p>
        <h4>Стан приміщення:</h4>
        <ol>
          <li>
            Стіни, підлога, стеля (штукатурка, побілка, фарбування, тощо):{" "}
            <input
              type="text"
              name="premisesConditions[0].description"
              value={formData.premisesConditions[0]?.description || ""}
              onChange={handleChange}
              onFocus={() => handleFocus("premisesConditions[0].description")}
              onBlur={handleBlur}
              className={styles.inlineInput}
            />
          </li>
          <li>
            Двері і вікна (фарбування, замки):{" "}
            <input
              type="text"
              name="premisesConditions[1].description"
              value={formData.premisesConditions[1]?.description || ""}
              onChange={handleChange}
              onFocus={() => handleFocus("premisesConditions[1].description")}
              onBlur={handleBlur}
              className={styles.inlineInput}
            />
          </li>
          <li>
            Електромережа (стан проводки, розеток, вимикачів):{" "}
            <input
              type="text"
              name="premisesConditions[2].description"
              value={formData.premisesConditions[2]?.description || ""}
              onChange={handleChange}
              onFocus={() => handleFocus("premisesConditions[2].description")}
              onBlur={handleBlur}
              className={styles.inlineInput}
            />
          </li>
          <li>
            Сантехнічне обладнання:{" "}
            <input
              type="text"
              name="premisesConditions[3].description"
              value={formData.premisesConditions[3]?.description || ""}
              onChange={handleChange}
              onFocus={() => handleFocus("premisesConditions[3].description")}
              onBlur={handleBlur}
              className={styles.inlineInput}
            />
          </li>
          <li>
            Інше:{" "}
            <input
              type="text"
              name="premisesConditions[4].description"
              value={formData.premisesConditions[4]?.description || ""}
              onChange={handleChange}
              onFocus={() => handleFocus("premisesConditions[4].description")}
              onBlur={handleBlur}
              className={styles.inlineInput}
            />
          </li>
        </ol>
        <div className={styles.signatureSection}>
          <div className={styles.signatureBlock}>
            <p className={styles.justifiedText}>Здав: Завідувач гуртожитку</p>
            <div className={styles.fullNameWrapper}>
              <input
                type="text"
                name="dormManagerName"
                value={formData.dormManagerName}
                onChange={handleChange}
                onFocus={() => handleFocus("dormManagerName")}
                onBlur={handleBlur}
                className={styles.fullWidthInput}
                required
              />
              <span className={styles.inputLabel}>(П.І.Б.)</span>
            </div>
            <p>Підпис _______________</p>
          </div>
          <div className={styles.signatureBlock}>
            <p className={styles.justifiedText}>Прийняв: Мешканець</p>
            <div className={styles.fullNameWrapper}>
              <input
                type="text"
                name="residentName"
                value={formData.residentName}
                onChange={handleChange}
                onFocus={() => handleFocus("residentName")}
                onBlur={handleBlur}
                className={styles.fullWidthInput}
                required
              />
              <span className={styles.inputLabel}>(П.І.Б.)</span>
            </div>
            <p>Підпис _______________</p>
          </div>
        </div>
      </div>
    );
  };

  const page13Content = () => {
    return (
      <div className={styles.contractText}>
        <p className={styles.rightText}>Додаток № 3</p>
        <h3 className={styles.centeredTitle}>ПЕРЕЛІК власних приладів, що споживають електроенергію, оплата за яку здійснюється Мешканцем додатково</h3>
        <div className={styles.dateInput}>
          « <input type="text" name="day" value={formData.day} onChange={handleChange} onFocus={() => handleFocus("day")} onBlur={handleBlur} maxLength="2" placeholder="__" className={styles.inlineInputDate} ref={dayRef} required /> »{" "}
          <input type="text" name="month" value={formData.month} onChange={handleChange} onFocus={() => handleFocus("month")} onBlur={handleBlur} maxLength="2" placeholder="___________" className={styles.inlineInput} ref={monthRef} required />{" "}
          20 <input type="text" name="year" value={formData.year} onChange={handleChange} onFocus={() => handleFocus("year")} onBlur={handleBlur} maxLength="2" placeholder="__" className={styles.inlineInputYear} ref={yearRef} required /> р.
        </div>
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
            {formData.electricalAppliances.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <input type="text" name={`electricalAppliances[${index}].name`} value={item.name} onChange={handleChange} onFocus={() => handleFocus(`electricalAppliances[${index}].name`)} onBlur={handleBlur} className={styles.tableInput} required />
                  {errors[`electricalAppliances[${index}].name`] && <p className={styles.error}>{errors[`electricalAppliances[${index}].name`]}</p>}
                </td>
                <td>
                  <input type="text" name={`electricalAppliances[${index}].brand`} value={item.brand} onChange={handleChange} onFocus={() => handleFocus(`electricalAppliances[${index}].brand`)} onBlur={handleBlur} className={styles.tableInput} required />
                  {errors[`electricalAppliances[${index}].brand`] && <p className={styles.error}>{errors[`electricalAppliances[${index}].brand`]}</p>}
                </td>
                <td>
                  <input type="text" name={`electricalAppliances[${index}].year`} value={item.year} onChange={handleChange} onFocus={() => handleFocus(`electricalAppliances[${index}].year`)} onBlur={handleBlur} className={styles.tableInput} required />
                  {errors[`electricalAppliances[${index}].year`] && <p className={styles.error}>{errors[`electricalAppliances[${index}].year`]}</p>}
                </td>
                <td>
                  <input type="number" name={`electricalAppliances[${index}].quantity`} value={item.quantity} onChange={handleChange} onFocus={() => handleFocus(`electricalAppliances[${index}].quantity`)} onBlur={handleBlur} className={styles.tableInput} min="0" required />
                  {errors[`electricalAppliances[${index}].quantity`] && <p className={styles.error}>{errors[`electricalAppliances[${index}].quantity`]}</p>}
                </td>
                <td>
                  <input type="text" name={`electricalAppliances[${index}].note`} value={item.note} onChange={handleChange} onFocus={() => handleFocus(`electricalAppliances[${index}].note`)} onBlur={handleBlur} className={styles.tableInput} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.footnote}>
          *У разі зміни тарифів на електроенергію вартість спожитої електроенергії перераховується та відображається у кошторисі витрат та затверджується наказом ректора.
        </p>
      </div>
    );
  };

  const page14Content = () => {
    return (
      <div className={styles.contractText}>
        <h3 className={styles.centeredTitle}>Корисна інформація</h3>
        <p className={styles.justifiedText}>Для успішного поселення в гуртожиток, будь ласка, підготуйте наступні документи:</p>
        <ul>
          <li>Копія паспорта з двох сторін</li>
          <li>Фотокартки розміром 3х4 (3 шт.)</li>
          <li>Довідка про проходження флюорографії</li>
          <li>Довідка про стан санітарно-епідеміологічного оточення</li>
          <li>Квитанція про оплату за проживання в гуртожитку</li>
        </ul>
        <p className={styles.justifiedText}>Ви можете прикріпити скан-копії цих документів нижче:</p>
        <input type="file" multiple onChange={handleFileChange} />
      </div>
    );
  };

  const allPages = isSimplified
    ? [simplifiedPage1Content]
    : [
        page1Content,
        page2Content,
        page3Content,
        page4Content,
        page5Content,
        page6Content,
        page7Content,
        page8Content,
        page9Content,
        page10Content,
        page11Content,
        page12Content,
        page13Content,
        page14Content,
      ];

  const totalSpreads = Math.ceil(allPages.length / 2);

  const spreadContent = () => {
    const leftPageIndex = currentSpread * 2;
    const rightPageIndex = leftPageIndex + 1;
    const leftPage = allPages[leftPageIndex] ? allPages[leftPageIndex]() : null;
    const rightPage = allPages[rightPageIndex] ? allPages[rightPageIndex]() : null;
    return (
      <>
        <div className={styles.pageLeft}>{leftPage || <p>Порожня сторінка</p>}</div>
        <div className={styles.pageRight}>{rightPage || <p>Порожня сторінка</p>}</div>
      </>
    );
  };

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ''}`}>
        <Navbar
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />
        <div className={styles.container}>
          <div className={styles.book}>{spreadContent()}</div>
        </div>
        <div className={styles.controlsWrapper}>
          {currentSpread > 0 && (
            <button
              className={`${styles.navButton} ${styles.backButton}`}
              onClick={() => setCurrentSpread((prev) => prev - 1)}
            >
              <ArrowLeftIcon className={styles.buttonIcon} aria-label="Назад" />
              <span>Назад</span>
            </button>
          )}

          {focusedField && hints[focusedField] && (
            <div className={styles.hint}>
              <InformationCircleIcon className={styles.hintIcon} />
              <p>{hints[focusedField]}</p>
            </div>
          )}

          <div className={styles.progressBar}>
            <progress value={progress} max="100" />
            <span>{Math.round(progress)}%</span>
          </div>

          {currentSpread < totalSpreads - 1 ? (
            <button
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={() => setCurrentSpread((prev) => prev + 1)}
            >
              <span>Далі</span>
              <ArrowRightIcon className={styles.buttonIcon} aria-label="Далі" />
            </button>
          ) : (
            <button
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={handleSubmit}
            >
              <span>Подати заявку</span>
              <CheckIcon className={styles.buttonIcon} aria-label="Подати заявку" />
            </button>
          )}

          <label className={styles.simplifiedForm}>
            <input
              type="checkbox"
              checked={isSimplified}
              onChange={() => setIsSimplified(!isSimplified)}
            />
            <span>Спрощена форма</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default SettlementApplicationPage;