import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import Navbar from "../../../components/UI/Navbar/Navbar";
import Sidebar from "../../../components/UI/Sidebar/Sidebar";
import styles from "./styles/SettlementApplicationPage.module.css";
import { simplifiedSchema, fullSchema, validateForm } from "./validationSchemas";
import { isValidDate, formatErrorMessage, scrollToErrorFieldFixed as scrollToErrorField } from "./helpers";
import { useFormSync } from "../../../contexts/FormSyncContext";
import api from "../../../utils/api";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/24/solid";
import Page1Content from "../../../components/Services/Settlement agreement/Pages/Page1Content";
import Page2Content from "../../../components/Services/Settlement agreement/Pages/Page2Content";
import Page3Content from "../../../components/Services/Settlement agreement/Pages/Page3Content";
import Page4Content from "../../../components/Services/Settlement agreement/Pages/Page4Content";
import Page5Content from "../../../components/Services/Settlement agreement/Pages/Page5Content";
import Page6Content from "../../../components/Services/Settlement agreement/Pages/Page6Content";
import Page7Content from "../../../components/Services/Settlement agreement/Pages/Page7Content";
import Page8Content from "../../../components/Services/Settlement agreement/Pages/Page8Content";
import Page9Content from "../../../components/Services/Settlement agreement/Pages/Page9Content";
import Page10Content from "../../../components/Services/Settlement agreement/Pages/Page10Content";
import Page11Content from "../../../components/Services/Settlement agreement/Pages/Page11Content";
import Page12Content from "../../../components/Services/Settlement agreement/Pages/Page12Content";
import Page13Content from "../../../components/Services/Settlement agreement/Pages/Page13Content";
import Page14Content from "../../../components/Services/Settlement agreement/Pages/Page14Content";

const SECRET_KEY = "your_secret_key_here"; // Замініть на ваш секретний ключ

const defaultInventory = [
  { name: "Ліжко", quantity: "", note: "" },
  { name: "Матрац", quantity: "", note: "" },
  { name: "Подушка", quantity: "", note: "" },
  { name: "Ковдра", quantity: "", note: "" },
  { name: "Стільці", quantity: "", note: "" },
  { name: "Стіл", quantity: "", note: "" },
  { name: "Шафа", quantity: "", note: "" },
  { name: "Тумбочка", quantity: "", note: "" },
  { name: "Лампа", quantity: "", note: "" },
  { name: "Вішалка", quantity: "", note: "" },
  { name: "Дзеркало", quantity: "", note: "" },
  { name: "Поличка", quantity: "", note: "" },
  { name: "Килимок", quantity: "", note: "" },
  { name: "Штори", quantity: "", note: "" },
  { name: "", quantity: "", note: "" },
  { name: "", quantity: "", note: "" },
];

const defaultElectricalAppliances = Array(7).fill({
  name: "",
  brand: "",
  year: "",
  quantity: "",
  note: "",
});

const defaultPremisesConditions = [
  { condition: "" },
  { condition: "" },
  { condition: "" },
  { condition: "" },
  { description: "", condition: "" },
  { description: "", condition: "" },
];

const SettlementApplicationPage = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [currentSpread, setCurrentSpread] = useState(0);
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem("settlementFormData");
    const defaultFormData = {
      contractDay: "", contractMonth: "", contractYear: "",
      proxyNumber: "", proxyDay: "", proxyMonth: "", proxyYear: "",
      course: "", group: "", faculty: "", fullName: "",
      passportSeries: "", passportNumber: "", passportIssued: "",
      taxId: Array(10).fill(""),
      dormStreet: "", dormBuilding: "", dormNumber: "", roomNumber: "", address: "",
      startDay: "", startMonth: "", startYear: "", endDay: "", endMonth: "", endYear: "",
      residentFullName: "", residentRegion: "", residentDistrict: "", residentCity: "", residentPostalCode: "",
      residentPhone: "", motherPhone: "", fatherPhone: "", parentFullName: "",
      day: "", month: "", year: "",
      mechanizatorReceivedName: "", mechanizatorCalledName: "", dormManagerName: "", residentName: "",
      inventory: defaultInventory,
      premisesConditions: defaultPremisesConditions,
      electricalAppliances: defaultElectricalAppliances,
      premisesNumber: "", premisesArea: "",
      dormManagerNameSignature: "", residentNameSignature: "",
    };
    const saved = savedData ? JSON.parse(savedData) : {};
    Object.keys(defaultFormData).forEach((key) => {
      if (saved[key] === undefined || saved[key] === null) {
        saved[key] = defaultFormData[key];
      }
    });
    if (saved.taxId && saved.taxId.length !== 10) saved.taxId = Array(10).fill("");
    if (saved.inventory && saved.inventory.length !== defaultInventory.length) saved.inventory = defaultInventory;
    if (saved.premisesConditions && saved.premisesConditions.length !== defaultPremisesConditions.length) {
      saved.premisesConditions = defaultPremisesConditions;
    } else {
      saved.premisesConditions = saved.premisesConditions.map((item, index) => {
        if (index < 4) return { condition: item.condition || "" };
        return { description: item.description || "", condition: item.description?.trim() ? item.condition || "" : "" };
      });
    }
    if (saved.electricalAppliances && saved.electricalAppliances.length !== defaultElectricalAppliances.length) {
      saved.electricalAppliances = defaultElectricalAppliances;
    } else {
      saved.electricalAppliances = saved.electricalAppliances.map((item) => ({
        name: item.name || "",
        brand: item.brand || "",
        year: item.year || "",
        quantity: item.quantity || "",
        note: item.note || "",
      }));
    }
    return { ...defaultFormData, ...saved };
  });
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0);
  const [isValidationStarted, setIsValidationStarted] = useState(false);
  const { sharedData, updateSharedData } = useFormSync();
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRefs = useRef({});
  const taxIdRefs = useRef([]);
  const navigate = useNavigate();

  const syncMappings = {
    fullName: ["residentFullName", "residentName", "dormManagerNameSignature", "residentNameSignature"],
    residentFullName: ["fullName", "residentName", "dormManagerNameSignature", "residentNameSignature"],
    residentName: ["fullName", "residentFullName", "dormManagerNameSignature", "residentNameSignature"],
    dormNumber: ["dormNumber"],
    roomNumber: ["roomNumber"],
  };

  const handleInputKeyDown = (e, currentField, nextField, prevField) => {
    const value = formData[currentField] || "";
    if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
      if (nextField) {
        inputRefs.current[nextField]?.focus();
        e.preventDefault();
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      if (prevField) {
        inputRefs.current[prevField]?.focus();
        e.preventDefault();
      }
    } else if (e.key === "ArrowRight" && value.length >= 1) {
      if (nextField) {
        inputRefs.current[nextField]?.focus();
      }
    } else if (e.key === "ArrowLeft" && !value) {
      if (prevField) {
        inputRefs.current[prevField]?.focus();
      }
    }
  };

  useEffect(() => {
    localStorage.setItem("settlementFormData", JSON.stringify(formData));
    calculateProgress();
  }, [formData]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...sharedData }));
  }, [sharedData]);

  useEffect(() => {
    if (showErrors && Object.keys(errors).length > 0) {
      const errorFields = getAllErrorFields(errors);
      if (errorFields.length > 0) {
        scrollToErrorField(errorFields[currentErrorIndex]);
        const pageIndex = getPageIndexForField(errorFields[currentErrorIndex]);
        if (pageIndex !== -1) setCurrentSpread(Math.floor(pageIndex / 2));
      }
    }
  }, [currentErrorIndex, errors, showErrors]);

  const validateFormData = async () => {
    const schema = fullSchema;
    const validationData = prepareValidationData(formData);
    const { isValid, errors: validationErrors } = await validateForm(validationData, schema);
    setErrors(validationErrors);
    setShowErrors(Object.keys(validationErrors).length > 0);
    return { isValid, validationErrors };
  };

  useEffect(() => {
    if (isValidationStarted) {
      const handler = setTimeout(validateFormData, 300);
      return () => clearTimeout(handler);
    }
  }, [formData, isValidationStarted]);

  const prepareValidationData = (data) => {
    return {
      ...data,
      contractYear: data.contractYear || "",
      proxyYear: data.proxyYear || "",
      startYear: data.startYear || "",
      endYear: data.endYear || "",
      year: data.year || "",
    };
  };

  const calculateProgress = () => {
    const requiredFields = getRequiredFields();
    const totalRequired = requiredFields.length;
    const filledRequired = requiredFields.filter((field) => {
      const value = getFieldValue(formData, field);
      return value !== "" && value !== undefined && value !== null;
    }).length;
    const progressPercentage = totalRequired === 0 ? 0 : (filledRequired / totalRequired) * 100;
    setProgress(progressPercentage);
  };

  const getRequiredFields = () => {
    const fields = [];
    const schemaFields = fullSchema.describe().fields;
    for (const [key, value] of Object.entries(schemaFields)) {
      if (value.tests.some((test) => test.name === "required")) {
        if (key === "taxId") {
          for (let i = 0; i < 10; i++) fields.push(`taxId[${i}]`);
        } else if (key === "inventory") {
          formData.inventory.forEach((_, idx) => {
            fields.push(`inventory[${idx}].quantity`);
          });
        } else if (key === "premisesConditions") {
          formData.premisesConditions.forEach((_, idx) => {
            if (idx < 4 || formData.premisesConditions[idx]?.description?.trim()) {
              fields.push(`premisesConditions[${idx}].condition`);
            }
            if (idx >= 4) fields.push(`premisesConditions[${idx}].description`);
          });
        } else if (key === "electricalAppliances") {
          formData.electricalAppliances.forEach((_, idx) => {
            if (formData.electricalAppliances[idx].name) {
              fields.push(`electricalAppliances[${idx}].quantity`);
            }
          });
        } else {
          fields.push(key);
        }
      }
    }
    return fields;
  };

  const getFieldValue = (obj, path) => {
    const parts = path.match(/(\w+)|\[(\d+)\]|\.(\w+)/g) || [];
    let current = obj;
    for (const part of parts) {
      if (part.startsWith("[")) {
        const index = parseInt(part.slice(1, -1), 10);
        current = current[index];
      } else if (part.startsWith(".")) {
        current = current[part.slice(1)];
      } else {
        current = current[part];
      }
      if (current === undefined || current === null) return current;
    }
    return current;
  };

  const encryptSensitiveData = (data) => {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  };

  const handleChange = (e, field, index, subField) => {
    let value = e.target.value;
    const { selectionStart, selectionEnd } = e.target;

    // Перевірка, чи є e.target текстовим полем
    const isTextInput =
      e.target.tagName === "INPUT" &&
      ["text", "password", "search", "url", "tel"].includes(e.target.type) ||
      e.target.tagName === "TEXTAREA";

    const fullNameFields = [
      "fullName",
      "residentFullName",
      "parentFullName",
      "dormManagerName",
      "residentName",
      "dormManagerNameSignature",
      "residentNameSignature",
    ];

    setFormData((prev) => {
      let updatedData = { ...prev };

      if (field.includes("premisesConditions") && index !== undefined && subField !== undefined) {
        const newConditions = [...prev.premisesConditions];
        if (subField === "description" && index >= 4 && !value.trim()) {
          newConditions[index] = { description: value, condition: "" };
        } else {
          newConditions[index] = { ...newConditions[index], [subField]: value };
        }
        updatedData.premisesConditions = newConditions;
      } else if (index !== undefined && subField !== undefined) {
        const updatedArray = [...prev[field]];
        if (subField === "year" && field === "electricalAppliances") {
          value = value.replace(/\D/g, "").slice(0, 4);
          if (value.length > 0 && value.length < 4) {
            value = prev[field][index][subField];
          }
        } else if (subField === "quantity") {
          value = value.replace(/\D/g, "");
        }
        updatedArray[index] = { ...updatedArray[index], [subField]: value || "" };
        updatedData[field] = updatedArray;
      } else if (fullNameFields.includes(field)) {
        value = value
          .replace(/[^А-Яа-яІіЇїЄєҐґ\s-]/g, "")
          .replace(/\s+/g, " ")
          .replace(/(^|\s|-)[а-яіїєґ]/g, (match) => match.toUpperCase())
          .trimStart();
        updatedData[field] = value;
      } else if (["contractYear", "proxyYear", "startYear", "endYear", "year"].includes(field)) {
        const cleanedValue = value.replace(/\D/g, "").slice(0, 2);
        updatedData[field] = cleanedValue;
      } else if (["residentPhone", "motherPhone", "fatherPhone"].includes(field)) {
        const digits = value.replace(/\D/g, "").slice(0, 10);
        updatedData[field] = digits === "" ? "" : digits;
      } else if (field === "course") {
        const numValue = parseInt(value, 10);
        updatedData[field] = value === "" || (!isNaN(numValue) && numValue >= 1 && numValue <= 6) ? value : prev[field];
      } else if (["dormNumber", "roomNumber", "residentPostalCode", "passportNumber", "day", "month"].includes(field)) {
        updatedData[field] = value.replace(/\D/g, "");
      } else if (field === "passportSeries") {
        updatedData[field] = value.replace(/[^А-Яа-я]/g, "").slice(0, 2).toUpperCase();
      } else {
        updatedData[field] = value;
      }

      if (syncMappings[field]) {
        syncMappings[field].forEach((targetField) => {
          if (!prev[targetField] && targetField !== field) {
            updatedData[targetField] = value;
          }
        });
      }
      return updatedData;
    });

    requestAnimationFrame(() => {
      if (e.target && isTextInput) {
        e.target.setSelectionRange(selectionStart, selectionEnd);
      }
    });

    const fieldTransitions = {
      contractDay: "contractMonth",
      contractMonth: "contractYear",
      contractYear: "proxyNumber",
      proxyDay: "proxyMonth",
      proxyMonth: "proxyYear",
      proxyYear: "course",
      startDay: "startMonth",
      startMonth: "startYear",
      startYear: "endDay",
      endDay: "endMonth",
      endMonth: "endYear",
      day: "month",
      month: "year",
      year: "dormNumber",
      passportSeries: "passportNumber",
      passportNumber: "passportIssued",
      residentRegion: "residentDistrict",
      residentDistrict: "residentCity",
      residentCity: "residentPostalCode",
      residentPostalCode: "residentPhone",
      residentPhone: "motherPhone",
      motherPhone: "fatherPhone",
      fatherPhone: "parentFullName",
    };

    if (fieldTransitions[field] && value.length >= (["passportSeries"].includes(field) ? 2 : ["residentPostalCode"].includes(field) ? 5 : ["passportNumber"].includes(field) ? 6 : ["residentPhone", "motherPhone", "fatherPhone"].includes(field) ? 10 : 2)) {
      inputRefs.current[fieldTransitions[field]]?.focus();
    }

    const syncFields = ["residentFullName", "residentPhone", "dormNumber", "roomNumber", "address"];
    if (field && syncFields.includes(field)) {
      updateSharedData({ [field]: value });
    }
  };

  const handleTaxIdChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    setFormData((prev) => ({
      ...prev,
      taxId: prev.taxId.map((d, i) => (i === index ? digit : d)),
    }));
    if (digit.length === 1 && index < 9) {
      setTimeout(() => taxIdRefs.current[index + 1]?.focus(), 0);
    }
  };

  const handleTaxIdKeyDown = (index, e) => {
    const currentValue = formData.taxId[index];
    if (e.key === "Backspace" && !currentValue && index > 0) {
      taxIdRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && currentValue.length >= 1 && index < 9) {
      taxIdRefs.current[index + 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && !currentValue && index > 0) {
      taxIdRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey) {
      if (index < 9) {
        taxIdRefs.current[index + 1]?.focus();
      } else {
        inputRefs.current["dormStreet"]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "Tab" && e.shiftKey) {
      if (index > 0) {
        taxIdRefs.current[index - 1]?.focus();
      } else {
        inputRefs.current["passportIssued"]?.focus();
      }
      e.preventDefault();
    }
  };

  const handleFocus = (fieldName) => {
    inputRefs.current[fieldName]?.classList.add(styles.focusedInput);
    taxIdRefs.current.forEach((ref, idx) => {
      if (`taxId[${idx}]` === fieldName) ref?.classList.add(styles.focusedInput);
    });
  };

  const handleBlur = (fieldName) => {
    inputRefs.current[fieldName]?.classList.remove(styles.focusedInput);
    taxIdRefs.current.forEach((ref, idx) => {
      if (`taxId[${idx}]` === fieldName) ref?.classList.remove(styles.focusedInput);
    });
  };

  const getAllErrorFields = (errorsObj) => {
    const fields = [];
    for (const key in errorsObj) {
      if (Object.prototype.hasOwnProperty.call(errorsObj, key)) {
        if (Array.isArray(errorsObj[key])) {
          errorsObj[key].forEach((item, index) => {
            if (item && typeof item === "object") {
              Object.keys(item).forEach((subKey) => fields.push(`${key}[${index}].${subKey}`));
            } else if (item) {
              fields.push(`${key}[${index}]`);
            }
          });
        } else if (errorsObj[key]) {
          fields.push(key);
        }
      }
    }
    return fields;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setIsValidationStarted(true);
    const { isValid, validationErrors } = await validateFormData();
    setErrors(validationErrors);

    if (!isValid) {
      const errorFields = getAllErrorFields(validationErrors);
      if (errorFields.length > 0) {
        setCurrentErrorIndex(0);
        scrollToErrorField(errorFields[0]);
        setCurrentSpread(Math.floor(getPageIndexForField(errorFields[0]) / 2));
      }
      setShowErrors(true);
      setIsSubmitting(false);
      alert("Будь ласка, виправте помилки у формі.");
      return;
    }

    try {
      const dataToSend = { ...formData };
      dataToSend.contractYear = dataToSend.contractYear ? `20${dataToSend.contractYear.padStart(2, "0")}` : "";
      dataToSend.proxyYear = dataToSend.proxyYear ? `20${dataToSend.proxyYear.padStart(2, "0")}` : "";
      dataToSend.startYear = dataToSend.startYear ? `20${dataToSend.startYear.padStart(2, "0")}` : "";
      dataToSend.endYear = dataToSend.endYear ? `20${dataToSend.endYear.padStart(2, "0")}` : "";
      dataToSend.year = dataToSend.year ? `20${dataToSend.year.padStart(2, "0")}` : "";

      ["passportSeries", "passportNumber", "passportIssued", "fullName", "residentFullName", "residentPhone", "motherPhone", "fatherPhone", "parentFullName"].forEach((field) => {
        dataToSend[field] = encryptSensitiveData(dataToSend[field]);
      });
      dataToSend.taxId = dataToSend.taxId.map((digit) => encryptSensitiveData(digit));

      await api.post("/services/dorm-application", dataToSend);
      alert("Заявка успішно подана!");
      localStorage.removeItem("settlementFormData");
      setFormData({
        contractDay: "", contractMonth: "", contractYear: "",
        proxyNumber: "", proxyDay: "", proxyMonth: "", proxyYear: "",
        course: "", group: "", faculty: "", fullName: "",
        passportSeries: "", passportNumber: "", passportIssued: "",
        taxId: Array(10).fill(""),
        dormStreet: "", dormBuilding: "", dormNumber: "", roomNumber: "", address: "",
        startDay: "", startMonth: "", startYear: "", endDay: "", endMonth: "", endYear: "",
        residentFullName: "", residentRegion: "", residentDistrict: "", residentCity: "", residentPostalCode: "",
        residentPhone: "", motherPhone: "", fatherPhone: "", parentFullName: "",
        day: "", month: "", year: "",
        mechanizatorReceivedName: "", mechanizatorCalledName: "", dormManagerName: "", residentName: "",
        inventory: defaultInventory,
        premisesConditions: defaultPremisesConditions,
        electricalAppliances: defaultElectricalAppliances,
        premisesNumber: "", premisesArea: "",
        dormManagerNameSignature: "", residentNameSignature: "",
      });
      setErrors({});
      setShowErrors(false);
      setCurrentSpread(0);
      setIsValidationStarted(false);
      navigate("/");
    } catch (error) {
      console.error("Помилка при подачі заявки:", error);
      alert("Сталася помилка при подачі заявки. Спробуйте ще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPageContent = (pageIndex) => {
    const pageProps = {
      formData,
      errors,
      handleChange,
      handleFocus,
      handleBlur,
      inputRefs,
      taxIdRefs,
      handleTaxIdChange,
      handleTaxIdKeyDown,
      handleInputKeyDown,
    };
    const pageComponents = [
      Page1Content, Page2Content, Page3Content, Page4Content, Page5Content,
      Page6Content, Page7Content, Page8Content, Page9Content, Page10Content,
      Page11Content, Page12Content, Page13Content, Page14Content,
    ];
    const PageComponent = pageComponents[pageIndex];
    return PageComponent ? <PageComponent {...pageProps} /> : <p>Сторінка {pageIndex + 1} поки недоступна</p>;
  };

  const allPagesCount = 14;
  const totalSpreads = Math.ceil(allPagesCount / 2);

  const spreadContent = () => {
    const leftPageIndex = currentSpread * 2;
    const rightPageIndex = leftPageIndex + 1;
    return (
      <>
        <div className={styles.pageLeft}>{renderPageContent(leftPageIndex)}</div>
        <div className={styles.pageRight}>{rightPageIndex < allPagesCount ? renderPageContent(rightPageIndex) : null}</div>
      </>
    );
  };

  const errorKeys = getAllErrorFields(errors);
  const currentErrorKey = errorKeys[currentErrorIndex] || null;
  const errorMenuItems = currentErrorKey ? [{
    key: currentErrorKey,
    message: `${formatErrorMessage(currentErrorKey)}: ${errors[currentErrorKey]?.description || errors[currentErrorKey]?.general || errors[currentErrorKey]}`,
    index: currentErrorIndex,
  }] : [];

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />
        <div className={styles.container}>
          <div className={styles.book}>{spreadContent()}</div>
        </div>
        <div className={styles.controlsWrapper}>
          {showErrors && errorKeys.length > 0 && (
            <div className={styles.errorPanel}>
              <h3>Помилка у формі:</h3>
              <div className={styles.errorContainer}>
                {errorMenuItems.map((item) => (
                  <p
                    key={item.key}
                    className={`${styles.errorItem} ${styles.activeError}`}
                    onClick={() => {
                      setCurrentErrorIndex(item.index);
                      scrollToErrorField(item.key);
                      const pageIndex = getPageIndexForField(item.key);
                      if (pageIndex !== -1) setCurrentSpread(Math.floor(pageIndex / 2));
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setCurrentErrorIndex(item.index);
                        scrollToErrorField(item.key);
                        const pageIndex = getPageIndexForField(item.key);
                        if (pageIndex !== -1) setCurrentSpread(Math.floor(pageIndex / 2));
                      }
                    }}
                  >
                    {item.message}
                  </p>
                ))}
              </div>
            </div>
          )}
          <div className={styles.controls}>
            <div className={styles.backButtonWrapper}>
              {currentSpread > 0 && (
                <button
                  className={`${styles.navButton} ${styles.backButton}`}
                  onClick={() => setCurrentSpread((prev) => prev - 1)}
                  disabled={isSubmitting}
                  aria-label="Попередня сторінка"
                >
                  <ArrowLeftIcon className={styles.buttonIcon} />
                  <span>Попередня</span>
                </button>
              )}
            </div>
            <div className={styles.progressBarWrapper}>
              <div className={styles.progressBar}>
                <progress value={progress} max="100" aria-label={`Прогрес заповнення форми: ${Math.round(progress)}%`} />
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
            <div className={styles.nextButtonWrapper}>
              {currentSpread < totalSpreads - 1 ? (
                <button
                  className={`${styles.navButton} ${styles.nextButton}`}
                  onClick={() => setCurrentSpread((prev) => prev + 1)}
                  disabled={isSubmitting}
                  aria-label="Наступна сторінка"
                >
                  <span>Далі</span>
                  <ArrowRightIcon className={styles.buttonIcon} />
                </button>
              ) : (
                <button
                  className={`${styles.navButton} ${styles.nextButton}`}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  aria-label={isSubmitting ? "Відправлення форми" : "Подати заявку"}
                >
                  <span>{isSubmitting ? "Відправлення..." : "Подати заявку"}</span>
                  {!isSubmitting && <CheckIcon className={styles.buttonIcon} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getPageIndexForField = (fieldName) => {
  const pageFieldMap = {
    contractDay: 0, contractMonth: 0, contractYear: 0, proxyNumber: 0, proxyDay: 0, proxyMonth: 0, proxyYear: 0,
    course: 0, group: 0, faculty: 0, fullName: 0, passportSeries: 0, passportNumber: 0, passportIssued: 0, taxId: 0,
    dormStreet: 0, dormBuilding: 0, startDay: 0, startMonth: 0, startYear: 0, endDay: 0, endMonth: 0, endYear: 0,
    residentFullName: 9, residentRegion: 9, residentDistrict: 9, residentCity: 9, residentPostalCode: 9, residentPhone: 9,
    motherPhone: 9, fatherPhone: 9, parentFullName: 9, day: [10, 11, 12], month: [10, 11, 12], year: [10, 11, 12],
    dormNumber: [10, 11], roomNumber: [10, 11], address: [10, 11], dormManagerName: [10, 11], residentName: [10, 11],
    inventory: 10, premisesConditions: 11, electricalAppliances: 12, premisesNumber: 11, premisesArea: 11,
    dormManagerNameSignature: 11, residentNameSignature: 11,
    atLeastOneParentPhone: 9,
  };
  for (const [key, value] of Object.entries(pageFieldMap)) {
    if (fieldName.startsWith(key) || fieldName === key) return Array.isArray(value) ? value[0] : value;
  }
  return -1;
};

export default SettlementApplicationPage;