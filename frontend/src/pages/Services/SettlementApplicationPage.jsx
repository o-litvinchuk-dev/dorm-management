import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import styles from "./styles/SettlementApplicationPage.module.css";
import { simplifiedSchema, fullSchema, validateForm } from "../../utils/validation";
import { useFormSync } from "../../contexts/FormSyncContext";
import api from "../../utils/api";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/24/solid";

// Define the default inventory with 14 predefined items and 2 user-editable slots
const defaultInventory = [
  { name: "Ліжко", quantity: "", purpose: "" },
  { name: "Матрац", quantity: "", purpose: "" },
  { name: "Подушка", quantity: "", purpose: "" },
  { name: "Ковдра", quantity: "", purpose: "" },
  { name: "Стільці", quantity: "", purpose: "" },
  { name: "Стіл", quantity: "", purpose: "" },
  { name: "Шафа", quantity: "", purpose: "" },
  { name: "Тумбочка", quantity: "", purpose: "" },
  { name: "Лампа", quantity: "", purpose: "" },
  { name: "Вішалка", quantity: "", purpose: "" },
  { name: "Дзеркало", quantity: "", purpose: "" },
  { name: "Поличка", quantity: "", purpose: "" },
  { name: "Килимок", quantity: "", purpose: "" },
  { name: "Штори", quantity: "", purpose: "" },
  { name: "", quantity: "", purpose: "" },
  { name: "", quantity: "", purpose: "" },
];

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
      inventory: defaultInventory,
      premisesConditions: Array(5).fill({ description: "" }),
      electricalAppliances: Array(7).fill({
        name: "",
        brand: "",
        year: "",
        quantity: "",
        note: "",
      }),
      dormManagerSignature: "",
      residentSignature: "",
      premisesNumber: "",
      premisesArea: "",
      dormManagerNameSignature: "",
      residentNameSignature: "",
    };
    return savedData ? { ...defaultFormData, ...JSON.parse(savedData) } : defaultFormData;
  });
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0);
  const { sharedData, updateSharedData } = useFormSync();
  const [isSimplified, setIsSimplified] = useState(false);
  const [progress, setProgress] = useState(0);

  const taxIdRefs = useRef([]);
  const inputRefs = useRef({});
  const startDayRef = useRef(null);
  const startMonthRef = useRef(null);
  const startYearSuffixRef = useRef(null);
  const endDayRef = useRef(null);
  const endMonthRef = useRef(null);
  const endYearSuffixRef = useRef(null);
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const yearSuffixRef = useRef(null);


  const handleFocus = (fieldName) => {
    console.log(`Field ${fieldName} gained focus`);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleBlur = async (fieldName) => {
    console.log(`Field ${fieldName} lost focus`);
    const schema = isSimplified ? simplifiedSchema : fullSchema;
    const { errors } = await validateForm({ ...formData }, schema);
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: errors[fieldName] || null,
    }));
    setShowErrors(Object.keys(errors).length > 0);
  };
  
  useEffect(() => {
    localStorage.setItem("settlementFormData", JSON.stringify(formData));
    calculateProgress();
  }, [formData]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...sharedData }));
  }, [sharedData]);

  // Cycle through errors every 5 seconds in the error panel
  useEffect(() => {
    if (showErrors && Object.keys(errors).length > 0) {
      const interval = setInterval(() => {
        setCurrentErrorIndex((prev) => (prev + 1) % Object.keys(errors).length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showErrors, errors]);

  // Validate form on every change to show errors under inputs
  useEffect(() => {
    const validate = async () => {
      const schema = isSimplified ? simplifiedSchema : fullSchema;
      const { isValid, errors } = await validateForm(formData, schema);
      setErrors(errors);
      setShowErrors(!isValid);
    };
    validate();
  }, [formData, isSimplified]);

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

  const handleChange = (e, fieldName, index, subField) => {
    let value = e.target.value;
    console.log(`handleChange: field=${fieldName}, index=${index}, subField=${subField}, value=${value}`);

    if (["contractDay", "proxyDay", "startDay", "endDay", "day"].includes(fieldName)) {
      value = value.replace(/\D/g, "").slice(0, 2);
    } else if (["contractMonth", "proxyMonth", "startMonth", "endMonth", "month"].includes(fieldName)) {
      value = value.replace(/\D/g, "").slice(0, 2);
    } else if (["contractYear", "proxyYear", "startYear", "endYear", "year"].includes(fieldName)) {
      value = value.replace(/\D/g, "").slice(0, 4);
      if (value.length === 2) value = `20${value}`;
    } else if (fieldName === "taxId" && typeof index === "number") {
      value = value.replace(/\D/g, "").slice(0, 1);
      setFormData((prev) => {
        const newTaxId = [...prev.taxId];
        newTaxId[index] = value;
        return { ...prev, taxId: newTaxId };
      });
      if (value && index < 9) {
        taxIdRefs.current[index + 1]?.focus();
      }
      return;
    } else if (fieldName === "residentPhone" || fieldName === "motherPhone" || fieldName === "fatherPhone") {
      value = value.replace(/\D/g, "");
      if (value.startsWith("380")) {
        value = `+${value.slice(0, 12)}`;
      } else if (value.startsWith("0")) {
        value = `+38${value.slice(0, 12)}`;
      } else {
        value = `+380${value.slice(0, 9)}`;
      }
    } else if (fieldName === "course") {
      value = value.replace(/\D/g, "");
      if (value === "") value = "";
      else value = Math.min(parseInt(value) || 1, 6).toString();
    } else if (["dormNumber", "roomNumber"].includes(fieldName)) {
      value = value.replace(/\D/g, "");
    } else if (fieldName === "residentPostalCode") {
      value = value.replace(/\D/g, "").slice(0, 5);
    } else if (fieldName === "passportNumber") {
      value = value.replace(/\D/g, "").slice(0, 6);
    } else if (fieldName === "passportSeries") {
      value = value.replace(/[^А-Я]/g, "").slice(0, 2).toUpperCase();
    }

    if (typeof index === "number" && subField) {
      setFormData((prev) => {
        const newArray = [...prev[fieldName]];
        newArray[index] = { ...newArray[index], [subField]: value };
        return { ...prev, [fieldName]: newArray };
      });
    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
    }

    const syncFields = ["residentFullName", "residentPhone", "dormNumber", "roomNumber", "address"];
    if (fieldName && syncFields.includes(fieldName)) {
      updateSharedData({ [fieldName]: value });
    }
  };

  const handleYearChange = (e, field) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 2);
    const fullYear = value ? `20${value.padStart(2, "0")}` : "";
    setFormData((prev) => ({ ...prev, [field]: fullYear }));
  };

  const handleTaxIdChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newTaxId = [...formData.taxId];
      newTaxId[index] = value;
      setFormData({ ...formData, taxId: newTaxId });
      if (value.length === 1 && index < 9) {
        taxIdRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleTaxIdKeyDown = (index, e) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0) {
      taxIdRefs.current[index - 1]?.focus();
    }
  };

  const formatErrorMessage = (path) => {
    const match = path.match(/\[(\d+)\]\.(\w+)/);
    if (match) {
      const index = parseInt(match[1]) + 1;
      const field = match[2];
      const table = path.includes("inventory")
        ? "інвентарю"
        : path.includes("electricalAppliances")
        ? "електроприладів"
        : "стану приміщень";
      const fieldNames = {
        name: "Назва",
        quantity: "Кількість",
        purpose: "Призначення",
        brand: "Марка",
        year: "Рік випуску",
        note: "Примітка",
        description: "Опис",
      };
      return `${fieldNames[field] || field} в рядку ${index} ${table}`;
    }
    const fieldNames = {
      fullName: "П.І.Б.",
      passportSeries: "Серія паспорта",
      passportNumber: "Номер паспорта",
      passportIssued: "Ким виданий паспорт",
      taxId: "Ідентифікаційний номер",
      dormStreet: "Вулиця гуртожитку",
      dormBuilding: "Будівля гуртожитку",
      dormNumber: "Номер гуртожитку",
      roomNumber: "Номер кімнати",
      residentFullName: "П.І.Б. мешканця",
      residentRegion: "Область",
      residentDistrict: "Район",
      residentCity: "Населений пункт",
      residentPostalCode: "Поштовий індекс",
      residentPhone: "Контактний телефон",
      motherPhone: "Телефон мами",
      fatherPhone: "Телефон тата",
      parentFullName: "П.І.Б. одного з батьків",
      address: "Адреса",
      mechanizatorReceivedName: "П.І.Б. завідувача (отримано)",
      mechanizatorCalledName: "П.І.Б. мешканця (викликано)",
      dormManagerName: "П.І.Б. завідувача",
      residentName: "П.І.Б. мешканця",
      group: "Група",
      faculty: "Факультет",
      proxyNumber: "Номер довіреності",
      contractDay: "День договору",
      contractMonth: "Місяць договору",
      contractYear: "Рік договору",
      proxyDay: "День довіреності",
      proxyMonth: "Місяць довіреності",
      proxyYear: "Рік довіреності",
      startDay: "День початку",
      startMonth: "Місяць початку",
      startYear: "Рік початку",
      endDay: "День закінчення",
      endMonth: "Місяць закінчення",
      endYear: "Рік закінчення",
      day: "День додатка",
      month: "Місяць додатка",
      year: "Рік додатка",
      course: "Курс",
      dormManagerSignature: "Підпис завідувача",
      residentSignature: "Підпис мешканця",
      premisesNumber: "Номер приміщення",
      premisesArea: "Площа приміщення",
      dormManagerNameSignature: "П.І.Б. завідувача (підпис)",
      residentNameSignature: "П.І.Б. мешканця (підпис)",
    };
    return fieldNames[path] || path;
  };

  const scrollToErrorField = (path) => {
    const match = path.match(/\[(\d+)\]\.(\w+)/);
    if (match) {
      const index = match[1];
      const table = path.includes("inventory")
        ? "inventory"
        : path.includes("electricalAppliances")
        ? "electricalAppliances"
        : "premisesConditions";
      const field = match[2];
      const element = document.querySelector(`[data-error-table="${table}-${index}-${field}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
    } else {
      const element = document.querySelector(`[data-error-field="${path}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const schema = isSimplified ? simplifiedSchema : fullSchema;
    const { isValid, errors } = await validateForm(formData, schema);
    setErrors(errors);
    setShowErrors(true);
    setCurrentErrorIndex(0); // Reset to first error on submit

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
          inventory: defaultInventory,
          premisesConditions: Array(5).fill({ description: "" }),
          electricalAppliances: Array(7).fill({
            name: "",
            brand: "",
            year: "",
            quantity: "",
            note: "",
          }),
          dormManagerSignature: "",
          residentSignature: "",
          premisesNumber: "",
          premisesArea: "",
          dormManagerNameSignature: "",
          residentNameSignature: "",
        });
      } catch (error) {
        console.error("Помилка при подачі заявки:", error);
        alert("Сталася помилка при подачі заявки. Спробуйте ще раз.");
      }
    } else {
      alert("Будь ласка, виправте помилки у формі.");
      scrollToErrorField(Object.keys(errors)[0]);
    }
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
              className={`${styles.inlineInputDate} ${errors.contractDay ? styles.errorInput : ''}`}
              required
              ref={(el) => (inputRefs.current.contractDay = el)}
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
              className={`${styles.inlineInputDate} ${errors.contractMonth ? styles.errorInput : ''}`}
              required
              ref={(el) => (inputRefs.current.contractMonth = el)}
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
              className={`${styles.inlineInputDate} ${errors.contractYear ? styles.errorInput : ''}`}
              required
              ref={(el) => (inputRefs.current.contractYear = el)}
            />{" "}
            р.
          </span>
        </p>
        {errors.contractDay && <p className={styles.error}>{errors.contractDay}</p>}
        {errors.contractMonth && <p className={styles.error}>{errors.contractMonth}</p>}
        {errors.contractYear && <p className={styles.error}>{errors.contractYear}</p>}
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
            className={`${styles.inlineInput} ${errors.proxyNumber ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.proxyNumber = el)}
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
            className={`${styles.inlineInputDate} ${errors.proxyDay ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.proxyDay = el)}
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
            className={`${styles.inlineInputDate} ${errors.proxyMonth ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.proxyMonth = el)}
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
            className={`${styles.inlineInputDate} ${errors.proxyYear ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.proxyYear = el)}
          />{" "}
          р., з одного боку і студент (аспірант, докторант)
        </p>
        {errors.proxyNumber && <p className={styles.error}>{errors.proxyNumber}</p>}
        {errors.proxyDay && <p className={styles.error}>{errors.proxyDay}</p>}
        {errors.proxyMonth && <p className={styles.error}>{errors.proxyMonth}</p>}
        {errors.proxyYear && <p className={styles.error}>{errors.proxyYear}</p>}
        <p className={styles.justifiedText}>
          <input
            type="number"
            name="course"
            value={formData.course}
            onChange={handleChange}
            onFocus={() => handleFocus("course")}
            onBlur={handleBlur}
            className={`${styles.inlineInput} ${errors.course ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.course = el)}
          />{" "}
          курсу{" "}
          <input
            type="text"
            name="group"
            value={formData.group}
            onChange={handleChange}
            onFocus={() => handleFocus("group")}
            onBlur={handleBlur}
            className={`${styles.inlineInput} ${errors.group ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.group = el)}
          />{" "}
          групи,{" "}
          <input
            type="text"
            name="faculty"
            value={formData.faculty}
            onChange={handleChange}
            onFocus={() => handleFocus("faculty")}
            onBlur={handleBlur}
            className={`${styles.inlineInput} ${errors.faculty ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.faculty = el)}
          />{" "}
          ННІ/факультету
        </p>
        {errors.course && <p className={styles.error}>{errors.course}</p>}
        {errors.group && <p className={styles.error}>{errors.group}</p>}
        {errors.faculty && <p className={styles.error}>{errors.faculty}</p>}
        <div className={styles.fullNameWrapper}>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            onFocus={() => handleFocus("fullName")}
            onBlur={handleBlur}
            className={`${styles.fullWidthInput} ${errors.fullName ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.fullName = el)}
          />
          <span className={styles.inputLabel}>(П.І.Б.)</span>
        </div>
        {errors.fullName && <p className={styles.error}>{errors.fullName}</p>}
        <p className={styles.justifiedText}>
          Паспорт серії{" "}
          <input
            type="text"
            name="passportSeries"
            value={formData.passportSeries}
            onChange={handleChange}
            onFocus={() => handleFocus("passportSeries")}
            onBlur={handleBlur}
            className={`${styles.inlineInput} ${errors.passportSeries ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.passportSeries = el)}
          />{" "}
          №{" "}
          <input
            type="text"
            name="passportNumber"
            value={formData.passportNumber}
            onChange={handleChange}
            onFocus={() => handleFocus("passportNumber")}
            onBlur={handleBlur}
            className={`${styles.inlineInput} ${errors.passportNumber ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.passportNumber = el)}
          />{" "}
          виданий{" "}
          <input
            type="text"
            name="passportIssued"
            value={formData.passportIssued}
            onChange={handleChange}
            onFocus={() => handleFocus("passportIssued")}
            onBlur={handleBlur}
            className={`${styles.inlineInput} ${errors.passportIssued ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.passportIssued = el)}
          />
        </p>
        {errors.passportSeries && <p className={styles.error}>{errors.passportSeries}</p>}
        {errors.passportNumber && <p className={styles.error}>{errors.passportNumber}</p>}
        {errors.passportIssued && <p className={styles.error}>{errors.passportIssued}</p>}
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
                      className={`${styles.taxIdInput} ${errors.taxId ? styles.errorInput : ''}`}
                      ref={(el) => {
                        taxIdRefs.current[index] = el;
                        inputRefs.current[`taxId[${index}]`] = el;
                      }}
                    />
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
          {errors.taxId && <p className={styles.error}>{errors.taxId}</p>}
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
            className={`${styles.inlineInput} ${errors.dormStreet ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.dormStreet = el)}
          />{" "}
          буд.{" "}
          <input
            type="text"
            name="dormBuilding"
            value={formData.dormBuilding}
            onChange={handleChange}
            onFocus={() => handleFocus("dormBuilding")}
            onBlur={handleBlur}
            className={`${styles.inlineInput} ${errors.dormBuilding ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.dormBuilding = el)}
          />{" "}
          гуртожиток №{" "}
          <input
            type="text"
            name="dormNumber"
            value={formData.dormNumber}
            onChange={handleChange}
            onFocus={() => handleFocus("dormNumber")}
            onBlur={handleBlur}
            className={`${styles.inlineInput} ${errors.dormNumber ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.dormNumber = el)}
          />{" "}
          кімната №{" "}
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            onFocus={() => handleFocus("roomNumber")}
            onBlur={handleBlur}
            className={`${styles.inlineInput} ${errors.roomNumber ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.roomNumber = el)}
          />
        </p>
        {errors.dormStreet && <p className={styles.error}>{errors.dormStreet}</p>}
        {errors.dormBuilding && <p className={styles.error}>{errors.dormBuilding}</p>}
        {errors.dormNumber && <p className={styles.error}>{errors.dormNumber}</p>}
        {errors.roomNumber && <p className={styles.error}>{errors.roomNumber}</p>}
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
            className={`${styles.inlineInputDate} ${errors.startDay ? styles.errorInput : ''}`}
            ref={(el) => {
              startDayRef.current = el;
              inputRefs.current.startDay = el;
            }}
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
            className={`${styles.inlineInputDate} ${errors.startMonth ? styles.errorInput : ''}`}
            ref={(el) => {
              startMonthRef.current = el;
              inputRefs.current.startMonth = el;
            }}
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
            className={`${styles.inlineInputDate} ${errors.startYear ? styles.errorInput : ''}`}
            ref={(el) => {
              startYearSuffixRef.current = el;
              inputRefs.current.startYear = el;
            }}
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
            className={`${styles.inlineInputDate} ${errors.endDay ? styles.errorInput : ''}`}
            ref={(el) => {
              endDayRef.current = el;
              inputRefs.current.endDay = el;
            }}
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
            className={`${styles.inlineInputDate} ${errors.endMonth ? styles.errorInput : ''}`}
            ref={(el) => {
              endMonthRef.current = el;
              inputRefs.current.endMonth = el;
            }}
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
            className={`${styles.inlineInputDate} ${errors.endYear ? styles.errorInput : ''}`}
            ref={(el) => {
              endYearSuffixRef.current = el;
              inputRefs.current.endYear = el;
            }}
            required
          />{" "}
          р.
        </p>
        {errors.startDay && <p className={styles.error}>{errors.startDay}</p>}
        {errors.startMonth && <p className={styles.error}>{errors.startMonth}</p>}
        {errors.startYear && <p className={styles.error}>{errors.startYear}</p>}
        {errors.endDay && <p className={styles.error}>{errors.endDay}</p>}
        {errors.endMonth && <p className={styles.error}>{errors.endMonth}</p>}
        {errors.endYear && <p className={styles.error}>{errors.endYear}</p>}
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
          3.2.5. Своєчасно сплачувати за проживання у гуртожитку.
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
            className={`${styles.inlineInputDate} ${errors.endDay ? styles.errorInput : ''}`}
            ref={(el) => {
              endDayRef.current = el;
              inputRefs.current.endDay = el;
            }}
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
            className={`${styles.inlineInputDate} ${errors.endMonth ? styles.errorInput : ''}`}
            ref={(el) => {
              endMonthRef.current = el;
              inputRefs.current.endMonth = el;
            }}
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
            className={`${styles.inlineInputDate} ${errors.endYear ? styles.errorInput : ''}`}
            ref={(el) => {
              endYearSuffixRef.current = el;
              inputRefs.current.endYear = el;
            }}
            required
          />{" "}
          р.
        </p>
        {errors.endDay && <p className={styles.error}>{errors.endDay}</p>}
        {errors.endMonth && <p className={styles.error}>{errors.endMonth}</p>}
        {errors.endYear && <p className={styles.error}>{errors.endYear}</p>}
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
                className={`${styles.fullWidthInput} ${errors.residentFullName ? styles.errorInput : ''}`}
                required
                ref={(el) => (inputRefs.current.residentFullName = el)}
              />
              <span className={styles.inputLabel}>(П.І.Б.)</span>
            </div>
            {errors.residentFullName && <p className={styles.error}>{errors.residentFullName}</p>}
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
                className={`${styles.stretchedInput} ${errors.residentRegion ? styles.errorInput : ''}`}
                required
                ref={(el) => (inputRefs.current.residentRegion = el)}
              />
            </div>
            {errors.residentRegion && <p className={styles.error}>{errors.residentRegion}</p>}
            <div className={styles.inputRow}>
              <label className={styles.label}>Район:</label>
              <input
                type="text"
                name="residentDistrict"
                value={formData.residentDistrict}
                onChange={handleChange}
                onFocus={() => handleFocus("residentDistrict")}
                onBlur={handleBlur}
                className={`${styles.stretchedInput} ${errors.residentDistrict ? styles.errorInput : ''}`}
                required
                ref={(el) => (inputRefs.current.residentDistrict = el)}
              />
            </div>
            {errors.residentDistrict && <p className={styles.error}>{errors.residentDistrict}</p>}
            <div className={styles.inputRow}>
              <label className={styles.label}>Населений пункт:</label>
              <input
                type="text"
                name="residentCity"
                value={formData.residentCity}
                onChange={handleChange}
                onFocus={() => handleFocus("residentCity")}
                onBlur={handleBlur}
                className={`${styles.stretchedInput} ${errors.residentCity ? styles.errorInput : ''}`}
                required
                ref={(el) => (inputRefs.current.residentCity = el)}
              />
            </div>
            {errors.residentCity && <p className={styles.error}>{errors.residentCity}</p>}
            <div className={styles.inputRow}>
              <label className={styles.label}>Поштовий індекс:</label>
              <input
                type="text"
                name="residentPostalCode"
                value={formData.residentPostalCode}
                onChange={handleChange}
                onFocus={() => handleFocus("residentPostalCode")}
                onBlur={handleBlur}
                className={`${styles.stretchedInput} ${errors.residentPostalCode ? styles.errorInput : ''}`}
                required
                ref={(el) => (inputRefs.current.residentPostalCode = el)}
              />
            </div>
            {errors.residentPostalCode && <p className={styles.error}>{errors.residentPostalCode}</p>}
            <div className={styles.inputRow}>
              <label className={styles.label}>Контактний тел.:</label>
              <input
                type="text"
                name="residentPhone"
                value={formData.residentPhone}
                onChange={handleChange}
                onFocus={() => handleFocus("residentPhone")}
                onBlur={handleBlur}
                className={`${styles.stretchedInput} ${errors.residentPhone ? styles.errorInput : ''}`}
                required
                ref={(el) => (inputRefs.current.residentPhone = el)}
              />
            </div>
            {errors.residentPhone && <p className={styles.error}>{errors.residentPhone}</p>}
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
                className={`${styles.stretchedInput} ${errors.motherPhone ? styles.errorInput : ''}`}
                required
                ref={(el) => (inputRefs.current.motherPhone = el)}
              />
            </div>
            {errors.motherPhone && <p className={styles.error}>{errors.motherPhone}</p>}
            <div className={styles.inputRow}>
              <label className={styles.label}>Тато:</label>
              <input
                type="text"
                name="fatherPhone"
                value={formData.fatherPhone}
                onChange={handleChange}
                onFocus={() => handleFocus("fatherPhone")}
                onBlur={handleBlur}
                className={`${styles.stretchedInput} ${errors.fatherPhone ? styles.errorInput : ''}`}
                required
                ref={(el) => (inputRefs.current.fatherPhone = el)}
              />
            </div>
            {errors.fatherPhone && <p className={styles.error}>{errors.fatherPhone}</p>}
            <div className={styles.fullNameWrapper}>
              <input
                type="text"
                name="parentFullName"
                value={formData.parentFullName}
                onChange={handleChange}
                onFocus={() => handleFocus("parentFullName")}
                onBlur={handleBlur}
                className={`${styles.fullWidthInput} ${errors.parentFullName ? styles.errorInput : ''}`}
                required
                ref={(el) => (inputRefs.current.parentFullName = el)}
              />
              <span className={styles.inputLabel}>(П.І.Б. одного з батьків)</span>
            </div>
            {errors.parentFullName && <p className={styles.error}>{errors.parentFullName}</p>}
          </div>
        </div>
      </div>
    );
  };

  const page11Content = () => {
    return (
      <div className={styles.contractText}>
        <p className={styles.rightText}>Додаток № 1</p>
        <h3 className={styles.centeredTitle}>ПЕРЕЛІК</h3>
        <p className={styles.centeredText}>меблів і м’якого інвентарю</p>
        <div className={styles.dateRight}>
          <span>«</span>
          <input
            type="text"
            name="day"
            value={formData.day}
            onChange={(e) => handleChange(e, "day")}
            onFocus={() => handleFocus("day")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={`${styles.inlineInputDate} ${errors.day ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.day = el)}
          />
          <span>»</span>
          <input
            type="text"
            name="month"
            value={formData.month}
            onChange={(e) => handleChange(e, "month")}
            onFocus={() => handleFocus("month")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={`${styles.inlineInputDate} ${errors.month ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.month = el)}
          />
          <span>20</span>
          <input
            type="text"
            value={formData.year.slice(2)}
            onChange={(e) => handleYearChange(e, "year")}
            onFocus={() => handleFocus("year")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={`${styles.inlineInputDate} ${errors.year ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.year = el)}
          />
          <span>р.</span>
        </div>
        <div className={styles.infoRow}>
          <span>за адресою</span>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={(e) => handleChange(e, "address")}
            onFocus={() => handleFocus("address")}
            onBlur={handleBlur}
            className={`${styles.longInput} ${errors.address ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.address = el)}
          />
          <span>кімнати №</span>
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={(e) => handleChange(e, "roomNumber")}
            onFocus={() => handleFocus("roomNumber")}
            onBlur={handleBlur}
            className={`${styles.shortInput} ${errors.roomNumber ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.roomNumber = el)}
          />
          <span>гуртожитку №</span>
          <input
            type="text"
            name="dormNumber"
            value={formData.dormNumber}
            onChange={(e) => handleChange(e, "dormNumber")}
            onFocus={() => handleFocus("dormNumber")}
            onBlur={handleBlur}
            className={`${styles.shortInput} ${errors.dormNumber ? styles.errorInput : ''}`}
            required
            ref={(el) => (inputRefs.current.dormNumber = el)}
          />
        </div>
        {errors.day && <p className={styles.error}>{errors.day}</p>}
        {errors.month && <p className={styles.error}>{errors.month}</p>}
        {errors.year && <p className={styles.error}>{errors.year}</p>}
        {errors.address && <p className={styles.error}>{errors.address}</p>}
        {errors.roomNumber && <p className={styles.error}>{errors.roomNumber}</p>}
        {errors.dormNumber && <p className={styles.error}>{errors.dormNumber}</p>}
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
            {formData.inventory.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  {index < 14 ? (
                    <span>{formData.inventory[index].name}</span>
                  ) : (
                    <input
                      type="text"
                      name={`inventory[${index}].name`}
                      value={formData.inventory[index].name}
                      onChange={(e) => handleChange(e, "inventory", index, "name")}
                      onFocus={() => handleFocus(`inventory[${index}].name`)}
                      onBlur={handleBlur}
                      className={`${styles.tableInput} ${errors[`inventory[${index}].name`] ? styles.errorInput : ''}`}
                      data-error-table={`inventory-${index}-name`}
                    />
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    name={`inventory[${index}].quantity`}
                    value={formData.inventory[index].quantity}
                    onChange={(e) => handleChange(e, "inventory", index, "quantity")}
                    onFocus={() => handleFocus(`inventory[${index}].quantity`)}
                    onBlur={handleBlur}
                    className={`${styles.tableInput} ${errors[`inventory[${index}].quantity`] ? styles.errorInput : ''}`}
                    min="0"
                    data-error-table={`inventory-${index}-quantity`}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name={`inventory[${index}].purpose`}
                    value={formData.inventory[index].purpose}
                    onChange={(e) => handleChange(e, "inventory", index, "purpose")}
                    onFocus={() => handleFocus(`inventory[${index}].purpose`)}
                    onBlur={handleBlur}
                    className={`${styles.tableInput} ${errors[`inventory[${index}].purpose`] ? styles.errorInput : ''}`}
                    data-error-table={`inventory-${index}-purpose`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.signatureSection}>
          <div className={styles.signatureBlock}>
            <p>Здав: Завідувач гуртожитку</p>
            <div className={styles.signatureInputs}>
              <input
                type="text"
                name="dormManagerName"
                value={formData.dormManagerName}
                onChange={(e) => handleChange(e, "dormManagerName")}
                onFocus={() => handleFocus("dormManagerName")}
                onBlur={handleBlur}
                className={`${styles.signatureInput} ${errors.dormManagerName ? styles.errorInput : ''}`}
                placeholder="П.І.Б."
                data-error-field="dormManagerName"
              />
              <span>/</span>
              <input
                type="text"
                name="dormManagerSignature"
                value={formData.dormManagerSignature}
                onChange={(e) => handleChange(e, "dormManagerSignature")}
                onFocus={() => handleFocus("dormManagerSignature")}
                onBlur={handleBlur}
                className={`${styles.signatureInput} ${errors.dormManagerSignature ? styles.errorInput : ''}`}
                placeholder="Підпис"
                data-error-field="dormManagerSignature"
              />
            </div>
          </div>
          <div className={styles.signatureBlock}>
            <p>Прийняв: Мешканець</p>
            <div className={styles.signatureInputs}>
              <input
                type="text"
                name="residentName"
                value={formData.residentName}
                onChange={(e) => handleChange(e, "residentName")}
                onFocus={() => handleFocus("residentName")}
                onBlur={handleBlur}
                className={`${styles.signatureInput} ${errors.residentName ? styles.errorInput : ''}`}
                placeholder="П.І.Б."
                data-error-field="residentName"
              />
              <span>/</span>
              <input
                type="text"
                name="residentSignature"
                value={formData.residentSignature}
                onChange={(e) => handleChange(e, "residentSignature")}
                onFocus={() => handleFocus("residentSignature")}
                onBlur={handleBlur}
                className={`${styles.signatureInput} ${errors.residentSignature ? styles.errorInput : ''}`}
                placeholder="Підпис"
                data-error-field="residentSignature"
              />
            </div>
          </div>
        </div>
        {errors.dormManagerName && <p className={styles.error}>{errors.dormManagerName}</p>}
        {errors.dormManagerSignature && <p className={styles.error}>{errors.dormManagerSignature}</p>}
        {errors.residentName && <p className={styles.error}>{errors.residentName}</p>}
        {errors.residentSignature && <p className={styles.error}>{errors.residentSignature}</p>}
      </div>
    );
  };

  const page12Content = () => {
    return (
      <div className={styles.contractText}>
      <p className={styles.rightText}>Додаток №2</p>
      <h2 className={styles.centeredTitle}>АКТ</h2>
      <p className={styles.centeredText}>прийому–передачі житлового приміщення</p>
      <div className={styles.dateRight}>
        <span>«</span>
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
        />
        <span>»</span>
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
        />
        <span>20</span>
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
        />
        <span>р.</span>
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
        <span className={styles.inputLabel}>(П.І.Б. завідувача гуртожитку)</span>
      </div>
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
        <span className={styles.inputLabel}>(П.І.Б. Мешканця)</span>
      </div>
      <p className={styles.justifiedText}>з другого боку</p>
      <p className={styles.justifiedText}>
        в тому, що завідувач гуртожитку передав, а Мешканець прийняв житлове приміщення №{" "}
        <input
          type="text"
          name="premisesNumber"
          value={formData.premisesNumber}
          onChange={handleChange}
          onFocus={() => handleFocus("premisesNumber")}
          onBlur={handleBlur}
          className={styles.inlineInput}
          required
        />{" "}
        площею{" "}
        <input
          type="text"
          name="premisesArea"
          value={formData.premisesArea}
          onChange={handleChange}
          onFocus={() => handleFocus("premisesArea")}
          onBlur={handleBlur}
          className={styles.inlineInput}
          required
        />{" "}
        м² у наступному стані:
      </p>
      <ol className={styles.numberedList}>
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
      </ol>
      <div className={styles.signatureSection}>
        <div className={styles.signatureBlock}>
          <p>Здав: Завідувач гуртожитку</p>
          <div className={styles.signatureInputs}>
            <input
              type="text"
              name="dormManagerNameSignature"
              value={formData.dormManagerNameSignature}
              onChange={handleChange}
              onFocus={() => handleFocus("dormManagerNameSignature")}
              onBlur={handleBlur}
              className={styles.signatureInput}
              placeholder="П.І.Б."
            />
            <span>/</span>
            <input
              type="text"
              name="dormManagerSignature"
              value={formData.dormManagerSignature}
              onChange={handleChange}
              onFocus={() => handleFocus("dormManagerSignature")}
              onBlur={handleBlur}
              className={styles.signatureInput}
              placeholder="Підпис"
            />
          </div>
          <div className={styles.inputLabel}>(П.І.Б.)</div>
          <div className={styles.inputLabel}>(підпис)</div>
        </div>
        <div className={styles.signatureBlock}>
          <p>Прийняв: Мешканець</p>
          <div className={styles.signatureInputs}>
            <input
              type="text"
              name="residentNameSignature"
              value={formData.residentNameSignature}
              onChange={handleChange}
              onFocus={() => handleFocus("residentNameSignature")}
              onBlur={handleBlur}
              className={styles.signatureInput}
              placeholder="П.І.Б."
            />
            <span>/</span>
            <input
              type="text"
              name="residentSignature"
              value={formData.residentSignature}
              onChange={handleChange}
              onFocus={() => handleFocus("residentSignature")}
              onBlur={handleBlur}
              className={styles.signatureInput}
              placeholder="Підпис"
            />
          </div>
          <div className={styles.inputLabel}>(П.І.Б.)</div>
          <div className={styles.inputLabel}>(підпис)</div>
        </div>
      </div>
    </div>
    );
  };

  const page13Content = () => {
    return (
      <div className={styles.contractText}>
        <p className={styles.rightText}>Додаток № 3</p>
        <h3 className={styles.centeredTitle}>ПЕРЕЛІК</h3>
        <p className={styles.centeredText}>власних приладів, що споживають електроенергію, оплата за яку здійснюється Мешканцем</p>
        <p className={styles.centeredText}>додатково</p>
        <div className={styles.dateInput}>
          « <input
            type="text"
            name="day"
            value={formData.day}
            onChange={handleChange}
            onFocus={() => handleFocus("day")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputDate}
            ref={dayRef}
            required
          /> »{" "}
          <input
            type="text"
            name="month"
            value={formData.month}
            onChange={handleChange}
            onFocus={() => handleFocus("month")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInput}
            ref={monthRef}
            required
          />{" "}
          20 <input
            type="text"
            name="year"
            value={formData.year.slice(2)}
            onChange={(e) => handleYearChange(e, "year")}
            onFocus={() => handleFocus("year")}
            onBlur={handleBlur}
            maxLength="2"
            placeholder="__"
            className={styles.inlineInputYear}
            ref={yearRef}
            required
          /> р.
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
            {formData.electricalAppliances.map((_, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <input
                    type="text"
                    name={`electricalAppliances[${index}].name`}
                    value={formData.electricalAppliances[index].name}
                    onChange={handleChange}
                    onFocus={() => handleFocus(`electricalAppliances[${index}].name`)}
                    onBlur={handleBlur}
                    className={styles.tableInput}
                  />
                  {errors[`electricalAppliances[${index}].name`] && (
                    <p className={styles.error}>{errors[`electricalAppliances[${index}].name`]}</p>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    name={`electricalAppliances[${index}].brand`}
                    value={formData.electricalAppliances[index].brand}
                    onChange={handleChange}
                    onFocus={() => handleFocus(`electricalAppliances[${index}].brand`)}
                    onBlur={handleBlur}
                    className={styles.tableInput}
                  />
                  {errors[`electricalAppliances[${index}].brand`] && (
                    <p className={styles.error}>{errors[`electricalAppliances[${index}].brand`]}</p>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    name={`electricalAppliances[${index}].year`}
                    value={formData.electricalAppliances[index].year}
                    onChange={handleChange}
                    onFocus={() => handleFocus(`electricalAppliances[${index}].year`)}
                    onBlur={handleBlur}
                    className={styles.tableInput}
                  />
                  {errors[`electricalAppliances[${index}].year`] && (
                    <p className={styles.error}>{errors[`electricalAppliances[${index}].year`]}</p>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    name={`electricalAppliances[${index}].quantity`}
                    value={formData.electricalAppliances[index].quantity}
                    onChange={handleChange}
                    onFocus={() => handleFocus(`electricalAppliances[${index}].quantity`)}
                    onBlur={handleBlur}
                    className={styles.tableInput}
                    min="0"
                  />
                  {errors[`electricalAppliances[${index}].quantity`] && (
                    <p className={styles.error}>{errors[`electricalAppliances[${index}].quantity`]}</p>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    name={`electricalAppliances[${index}].note`}
                    value={formData.electricalAppliances[index].note}
                    onChange={handleChange}
                    onFocus={() => handleFocus(`electricalAppliances[${index}].note`)}
                    onBlur={handleBlur}
                    className={styles.tableInput}
                  />
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
      <h3 className={styles.centeredTitle}>Завершення та Наступні Кроки</h3>

      <div className={styles.infoSection}>
        <h4 className={styles.sectionTitle}>Перевірка даних</h4>
        <p className={styles.justifiedText}>
          Перед натисканням кнопки "Подати заявку" уважно перевірте всі введені дані: ПІБ, паспортні дані, ідентифікаційний номер, контактну інформацію, номер гуртожитку та кімнати.
        </p>
        <p className={`${styles.warningText} ${styles.justifiedText}`}>
          <strong>Важливо:</strong> Ви несете відповідальність за правильність інформації. Помилки можуть призвести до відмови в поселенні.
        </p>
      </div>

      <div className={styles.infoSection}>
        <h4 className={styles.sectionTitle}>Подальші дії для поселення на 2025/2026 н.р.</h4>
        <p className={styles.justifiedText}>
          Після успішної відправки електронного Договору виконайте наступні кроки для завершення процедури поселення:
        </p>
        <ol className={styles.orderedList}>
          <li>
            <strong>Написати заяву на поселення</strong> за зразком, доступним на сайті НУБіП або в деканаті вашого факультету/ННІ.
          </li>
          <li>
            <strong>Здійснити оплату</strong> за проживання згідно з тарифами, вказаними на офіційному сайті НУБіП. Абітурієнти оплачують після розподілу по гуртожитках.
          </li>
          <li>
            <strong>Подати заяву та копію квитанції про оплату</strong> через Google Форму, посилання на яку надасть деканат або буде опубліковано на сайті НУБіП. Наприклад: <a href="https://forms.gle/nV5373yTzkJcyFpMA" target="_blank" rel="noopener noreferrer">forms.gle/nV5373yTzkJcyFpMA</a> (<em>використовуйте актуальне посилання!</em>).
          </li>
        </ol>
        <p className={styles.justifiedText}>
          <strong>Важливі терміни:</strong>
        </p>
        <ul className={styles.unorderedList}>
          <li>Подання заяви: <strong>до середини травня</strong> (уточнюйте в деканаті).</li>
          <li>Подання копії квитанції: <strong>до середини липня</strong> (уточнюйте в деканаті).</li>
        </ul>
        <p className={`${styles.warningText} ${styles.justifiedText}`}>
          Неподання документів у встановлені терміни може призвести до відмови від місця в гуртожитку.
        </p>
        <p className={styles.justifiedText}>
          <strong>Для пільгових категорій:</strong> Оплату не здійснюйте. Подайте заяву на пільгу та підтверджуючі документи до деканату. Перелік документів доступний на сайті НУБіП або в деканаті.
        </p>
      </div>

      <div className={styles.infoSection}>
        <h4 className={styles.sectionTitle}>Підтвердження подання Договору</h4>
        <p className={styles.justifiedText}>
          Після натискання кнопки "Подати заявку" ви побачите повідомлення про успішне відправлення. Якщо підтвердження не з’явилося, зверніться до деканату або служби підтримки.
        </p>
        <p className={styles.justifiedText}>
          <strong>Порада:</strong> Зробіть скріншот або збережіть дані після відправки для власної зручності.
        </p>
      </div>

      <div className={styles.infoSection}>
        <h4 className={styles.sectionTitle}>Виникли проблеми у гуртожитку?</h4>
        <p className={styles.justifiedText}>
          Якщо у вас є проблеми з проживанням, повідомте про них (за потреби анонімно) через форму зворотного зв’язку, якщо така доступна (посилання уточнюйте в деканаті).
        </p>
      </div>

      <div className={styles.infoSection}>
        <h4 className={styles.sectionTitle}>Контактна інформація</h4>
        <p className={styles.justifiedText}>
          З питань поселення, оплати чи подання документів звертайтесь до деканату вашого факультету/ННІ або адміністрації Студентського містечка НУБіП України:
        </p>
        <ul className={styles.unorderedList}>
          <li>
            Офіційний сайт НУБіП: <a href="https://nubip.edu.ua" target="_blank" rel="noopener noreferrer">nubip.edu.ua</a>
          </li>
        </ul>
      </div>

      <div className={styles.submitSection}>
        <p className={styles.centeredText}>
          Дякуємо за уважне заповнення Договору!
        </p>
      </div>
    </div>
    );
  };

  const allPages = isSimplified
    ? [page1Content]
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
          {showErrors && Object.keys(errors).length > 0 && (
            <div className={styles.errorPanel}>
              <h3>Помилка у формі:</h3>
              <div className={styles.errorContainer}>
                <div
                  className={styles.errorItem}
                  onClick={() => scrollToErrorField(Object.keys(errors)[currentErrorIndex])}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && scrollToErrorField(Object.keys(errors)[currentErrorIndex])
                  }
                >
                  {formatErrorMessage(Object.keys(errors)[currentErrorIndex])}: {errors[Object.keys(errors)[currentErrorIndex]]}
                </div>
                {Object.keys(errors).length > 1 && (
                  <button
                    className={styles.nextErrorButton}
                    onClick={() => setCurrentErrorIndex((prev) => (prev + 1) % Object.keys(errors).length)}
                  >
                    Наступна помилка
                  </button>
                )}
              </div>
            </div>
          )}
          <div className={styles.controls}>
            {currentSpread > 0 && (
              <button
                className={`${styles.navButton} ${styles.backButton}`}
                onClick={() => setCurrentSpread((prev) => prev - 1)}
              >
                <ArrowLeftIcon className={styles.buttonIcon} aria-label="Назад" />
                <span>Назад</span>
              </button>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementApplicationPage;