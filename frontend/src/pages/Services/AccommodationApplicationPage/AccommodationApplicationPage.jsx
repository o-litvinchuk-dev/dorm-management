import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import { ToastService } from "../../../utils/toastConfig";
import Sidebar from "../../../components/UI/Sidebar/Sidebar";
import Navbar from "../../../components/UI/Navbar/Navbar";
import styles from "./styles/AccommodationApplicationPage.module.css";
import { fullSchema, validateForm, scrollToErrorFieldFixed } from "./validation";
import { CheckIcon } from "@heroicons/react/24/solid";

// Функція для отримання user_id (замініть на реальну логіку автентифікації)
const getUserId = () => 1; // Приклад user_id, замініть на динамічне значення з вашої системи автентифікації

const AccommodationApplicationPage = () => {
  const navigate = useNavigate();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const [formData, setFormData] = useState({
    course: "",
    group: "",
    faculty: "",
    fullName: "",
    residentPhone: "",
    dormNumber: "",
    startDay: "",
    startMonth: "",
    startYear: "",
    endDay: "",
    endMonth: "",
    endYear: "",
    applicationDateDay: "",
    applicationDateMonth: "",
    applicationDateYear: "",
    surname: "",
  });
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef({});

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    calculateProgress();
  }, [isSidebarExpanded, formData]);

  useEffect(() => {
    if (showErrors && Object.keys(errors).length > 0) {
      const errorFields = getAllErrorFields(errors);
      if (errorFields.length > 0) {
        scrollToErrorFieldFixed(errorFields[currentErrorIndex]);
      }
    }
  }, [currentErrorIndex, errors, showErrors]);

  const calculateProgress = () => {
    const requiredFields = [
      "course",
      "group",
      "faculty",
      "fullName",
      "residentPhone",
      "dormNumber",
      "startDay",
      "startMonth",
      "startYear",
      "endDay",
      "endMonth",
      "endYear",
      "applicationDateDay",
      "applicationDateMonth",
      "applicationDateYear",
      "surname",
    ];
    const totalRequired = requiredFields.length;
    const filledRequired = requiredFields.filter((field) => {
      const value = formData[field];
      return value !== "" && value !== undefined && value !== null;
    }).length;
    const progressPercentage = totalRequired === 0 ? 0 : (filledRequired / totalRequired) * 100;
    setProgress(progressPercentage);
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

  const formatErrorMessage = (field) => {
    const labels = {
      course: "Курс",
      group: "Група",
      faculty: "Факультет",
      fullName: "П.І.Б.",
      residentPhone: "Телефон",
      dormNumber: "Номер гуртожитку",
      startDay: "День початку",
      startMonth: "Місяць початку",
      startYear: "Рік початку",
      endDay: "День закінчення",
      endMonth: "Місяць закінчення",
      endYear: "Рік закінчення",
      applicationDateDay: "День дати заяви",
      applicationDateMonth: "Місяць дати заяви",
      applicationDateYear: "Рік дати заяви",
      surname: "Прізвище",
    };
    return labels[field] || field;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFocus = (fieldName) => {
    const element = inputRefs.current[fieldName];
    if (element) {
      element.classList.add(styles.focusedInput);
    }
  };

  const handleBlur = (fieldName) => {
    const element = inputRefs.current[fieldName];
    if (element) {
      element.classList.remove(styles.focusedInput);
    }
  };

  const handleDateKeyDown = (e, currentField, nextField, prevField) => {
    if (e.key === "ArrowRight" && formData[currentField].length >= 2) {
      inputRefs.current[nextField]?.focus();
    } else if (e.key === "ArrowLeft" && formData[currentField].length === 0) {
      inputRefs.current[prevField]?.focus();
    } else if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
      inputRefs.current[nextField]?.focus();
      e.preventDefault();
    } else if (e.key === "Tab" && e.shiftKey) {
      inputRefs.current[prevField]?.focus();
      e.preventDefault();
    }
  };

  const handleInputKeyDown = (e, currentField, nextField, prevField) => {
    if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
      inputRefs.current[nextField]?.focus();
      e.preventDefault();
    } else if (e.key === "Tab" && e.shiftKey) {
      inputRefs.current[prevField]?.focus();
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { isValid, errors: validationErrors } = await validateForm(formData, fullSchema);
    setErrors(validationErrors);

    if (!isValid) {
      const errorFields = getAllErrorFields(validationErrors);
      if (errorFields.length > 0) {
        setCurrentErrorIndex(0);
        scrollToErrorFieldFixed(errorFields[0]);
      }
      setShowErrors(true);
      setIsSubmitting(false);
      return;
    }

    // Форматування номера телефону: беремо останні 9 цифр і додаємо префікс +380
    const rawPhone = formData.residentPhone; // Наприклад, "0681002393"
    const formattedPhone = `+380${rawPhone.slice(1)}`; // Беремо останні 9 цифр: "0681002393" -> "+380681002393"

    // Підготовка даних для відправки
    const submitData = {
      course: parseInt(formData.course, 10),
      group: formData.group,
      faculty: formData.faculty,
      fullName: formData.fullName,
      residentPhone: formattedPhone,
      dormNumber: parseInt(formData.dormNumber, 10),
      startDay: formData.startDay,
      startMonth: formData.startMonth,
      startYear: formData.startYear,
      endDay: formData.endDay,
      endMonth: formData.endMonth,
      endYear: formData.endYear,
      applicationDay: formData.applicationDateDay,
      applicationMonth: formData.applicationDateMonth,
      applicationYear: formData.applicationDateYear,
      surname: formData.surname,
    };

    try {
      await api.post("/services/accommodation-application", submitData);
      ToastService.success(
        "Заяву подано на розгляд",
        "Очікуйте підтвердження прийняття заяви, після чого ви зможете подати договір на поселення."
      );
      navigate("/dashboard");
    } catch (error) {
      if (error.response?.status === 400 && error.response.data?.details) {
        ToastService.validationError(error.response.data.details);
      } else {
        ToastService.handleApiError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorKeys = getAllErrorFields(errors);
  const currentErrorKey = errorKeys[currentErrorIndex] || null;
  const errorMenuItems = currentErrorKey
    ? [
        {
          key: currentErrorKey,
          message: `${formatErrorMessage(currentErrorKey)}: ${errors[currentErrorKey]}`,
          index: currentErrorIndex,
        },
      ]
    : [];

  return (
    <div className={styles.layout}>
      <Sidebar onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)}
        />
        <div className={styles.container}>
          <div className={styles.book}>
            <div className={styles.pageLeft}>
              <div className={styles.contractText}>
                <div className={styles.topHeader}>
                  <p>Зразок заяви на поселення студентів магістратури <span className={styles.redText}>першого року</span> навчання,</p>
                  <p>студентів <span className={styles.redText}>першого курсу</span> та <span className={styles.redText}>скороченого терміну</span> навчання</p>
                </div>
                <div className={styles.recipientBlock}>
                  <p className={styles.rightText}>Ректору Національного університету</p>
                  <p className={styles.rightText}>біоресурсів і природокористування України</p>
                  <p className={styles.rightText}>проф. Ткачуку В.А.</p>
                  <p className={styles.rightText}>
                    студента{" "}
                    <input
                      type="text"
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleChange}
                      onFocus={() => handleFocus("faculty")}
                      onBlur={() => handleBlur("faculty")}
                      onKeyDown={(e) => handleInputKeyDown(e, "faculty", "course", null)}
                      className={`${styles.inlineInput} ${errors.faculty ? styles.errorInput : ""}`}
                      required
                      ref={(el) => {
                        if (el) inputRefs.current["faculty"] = el;
                        else delete inputRefs.current["faculty"];
                      }}
                      data-error-field="faculty"
                      aria-label="Факультет"
                      aria-invalid={!!errors.faculty}
                      aria-describedby={errors.faculty ? "faculty-error" : undefined}
                      autoComplete="off"
                    />{" "}
                    факультету
                  </p>
                  {errors.faculty && (
                    <p id="faculty-error" className={styles.error}>
                      {errors.faculty}
                    </p>
                  )}
                  <p className={styles.rightText}>
                    <input
                      type="number"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      onFocus={() => handleFocus("course")}
                      onBlur={() => handleBlur("course")}
                      onKeyDown={(e) => handleInputKeyDown(e, "course", "group", "faculty")}
                      min="1"
                      max="6"
                      className={`${styles.shortInlineInput} ${errors.course ? styles.errorInput : ""}`}
                      required
                      ref={(el) => {
                        if (el) inputRefs.current["course"] = el;
                        else delete inputRefs.current["course"];
                      }}
                      data-error-field="course"
                      aria-label="Курс"
                      aria-invalid={!!errors.course}
                      aria-describedby={errors.course ? "course-error" : undefined}
                      autoComplete="off"
                    />{" "}
                    курсу{" "}
                    <input
                      type="text"
                      name="group"
                      value={formData.group}
                      onChange={handleChange}
                      onFocus={() => handleFocus("group")}
                      onBlur={() => handleBlur("group")}
                      onKeyDown={(e) => handleInputKeyDown(e, "group", "fullName", "course")}
                      className={`${styles.inlineInput} ${errors.group ? styles.errorInput : ""}`}
                      required
                      ref={(el) => {
                        if (el) inputRefs.current["group"] = el;
                        else delete inputRefs.current["group"];
                      }}
                      data-error-field="group"
                      aria-label="Група"
                      aria-invalid={!!errors.group}
                      aria-describedby={errors.group ? "group-error" : undefined}
                      autoComplete="off"
                    />{" "}
                    групи
                  </p>
                  {errors.course && (
                    <p id="course-error" className={styles.error}>
                      {errors.course}
                    </p>
                  )}
                  {errors.group && (
                    <p id="group-error" className={styles.error}>
                      {errors.group}
                    </p>
                  )}
                  <div className={styles.fullNameWrapper}>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onFocus={() => handleFocus("fullName")}
                      onBlur={() => handleBlur("fullName")}
                      onKeyDown={(e) => handleInputKeyDown(e, "fullName", "residentPhone", "group")}
                      className={`${styles.fullWidthInput} ${errors.fullName ? styles.errorInput : ""}`}
                      required
                      ref={(el) => {
                        if (el) inputRefs.current["fullName"] = el;
                        else delete inputRefs.current["fullName"];
                      }}
                      data-error-field="fullName"
                      aria-label="П.І.Б."
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? "fullName-error" : undefined}
                      autoComplete="name"
                    />
                    <span className={styles.inputLabel}>(П.І.Б)</span>
                  </div>
                  {errors.fullName && (
                    <p id="fullName-error" className={styles.error}>
                      {errors.fullName}
                    </p>
                  )}
                  <p className={styles.rightText}>
                    конт. тел.:{" "}
                    <input
                      type="text"
                      name="residentPhone"
                      value={formData.residentPhone}
                      onChange={handleChange}
                      onFocus={() => handleFocus("residentPhone")}
                      onBlur={() => handleBlur("residentPhone")}
                      onKeyDown={(e) => handleInputKeyDown(e, "residentPhone", "dormNumber", "fullName")}
                      className={`${styles.inlineInput} ${errors.residentPhone ? styles.errorInput : ""}`}
                      required
                      ref={(el) => {
                        if (el) inputRefs.current["residentPhone"] = el;
                        else delete inputRefs.current["residentPhone"];
                      }}
                      data-error-field="residentPhone"
                      aria-label="Телефон"
                      aria-invalid={!!errors.residentPhone}
                      aria-describedby={errors.residentPhone ? "residentPhone-error" : undefined}
                      autoComplete="tel"
                      placeholder="0681234567"
                    />
                  </p>
                  {errors.residentPhone && (
                    <p id="residentPhone-error" className={styles.error}>
                      {errors.residentPhone}
                    </p>
                  )}
                </div>
                <h2 className={styles.centeredTitle}>Заява</h2>
                <p className={styles.justifiedText}>
                  Прошу поселити мене на 2024-2025 навчальний рік в гуртожиток №{" "}
                  <input
                    type="text"
                    name="dormNumber"
                    value={formData.dormNumber}
                    onChange={handleChange}
                    onFocus={() => handleFocus("dormNumber")}
                    onBlur={() => handleBlur("dormNumber")}
                    onKeyDown={(e) => handleInputKeyDown(e, "dormNumber", "startDay", "residentPhone")}
                    className={`${styles.shortInlineInput} ${errors.dormNumber ? styles.errorInput : ""}`}
                    required
                    ref={(el) => {
                      if (el) inputRefs.current["dormNumber"] = el;
                      else delete inputRefs.current["dormNumber"];
                    }}
                    data-error-field="dormNumber"
                    aria-label="Номер гуртожитку"
                    aria-invalid={!!errors.dormNumber}
                    aria-describedby={errors.dormNumber ? "dormNumber-error" : undefined}
                    autoComplete="off"
                  />{" "}
                  на ліжко-місці з «
                  <input
                    type="text"
                    name="startDay"
                    value={formData.startDay}
                    onChange={handleChange}
                    onFocus={() => handleFocus("startDay")}
                    onBlur={() => handleBlur("startDay")}
                    onKeyDown={(e) => handleDateKeyDown(e, "startDay", "startMonth", "dormNumber")}
                    maxLength="2"
                    placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.startDay ? styles.errorInput : ""}`}
                    required
                    ref={(el) => {
                      if (el) inputRefs.current["startDay"] = el;
                      else delete inputRefs.current["startDay"];
                    }}
                    data-error-field="startDay"
                    aria-label="День початку"
                    aria-invalid={!!errors.startDay}
                    aria-describedby={errors.startDay ? "startDay-error" : undefined}
                    autoComplete="off"
                  />
                  »{" "}
                  <input
                    type="text"
                    name="startMonth"
                    value={formData.startMonth}
                    onChange={handleChange}
                    onFocus={() => handleFocus("startMonth")}
                    onBlur={() => handleBlur("startMonth")}
                    onKeyDown={(e) => handleDateKeyDown(e, "startMonth", "startYear", "startDay")}
                    maxLength="2"
                    placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.startMonth ? styles.errorInput : ""}`}
                    required
                    ref={(el) => {
                      if (el) inputRefs.current["startMonth"] = el;
                      else delete inputRefs.current["startMonth"];
                    }}
                    data-error-field="startMonth"
                    aria-label="Місяць початку"
                    aria-invalid={!!errors.startMonth}
                    aria-describedby={errors.startMonth ? "startMonth-error" : undefined}
                    autoComplete="off"
                  />{" "}
                  20
                  <input
                    type="text"
                    name="startYear"
                    value={formData.startYear}
                    onChange={handleChange}
                    onFocus={() => handleFocus("startYear")}
                    onBlur={() => handleBlur("startYear")}
                    onKeyDown={(e) => handleDateKeyDown(e, "startYear", "endDay", "startMonth")}
                    maxLength="2"
                    placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.startYear ? styles.errorInput : ""}`}
                    required
                    ref={(el) => {
                      if (el) inputRefs.current["startYear"] = el;
                      else delete inputRefs.current["startYear"];
                    }}
                    data-error-field="startYear"
                    aria-label="Рік початку (останні дві цифри)"
                    aria-invalid={!!errors.startYear}
                    aria-describedby={errors.startYear ? "startYear-error" : undefined}
                    autoComplete="off"
                  />{" "}
                  року по «
                  <input
                    type="text"
                    name="endDay"
                    value={formData.endDay}
                    onChange={handleChange}
                    onFocus={() => handleFocus("endDay")}
                    onBlur={() => handleBlur("endDay")}
                    onKeyDown={(e) => handleDateKeyDown(e, "endDay", "endMonth", "startYear")}
                    maxLength="2"
                    placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.endDay ? styles.errorInput : ""}`}
                    required
                    ref={(el) => {
                      if (el) inputRefs.current["endDay"] = el;
                      else delete inputRefs.current["endDay"];
                    }}
                    data-error-field="endDay"
                    aria-label="День закінчення"
                    aria-invalid={!!errors.endDay}
                    aria-describedby={errors.endDay ? "endDay-error" : undefined}
                    autoComplete="off"
                  />
                  »{" "}
                  <input
                    type="text"
                    name="endMonth"
                    value={formData.endMonth}
                    onChange={handleChange}
                    onFocus={() => handleFocus("endMonth")}
                    onBlur={() => handleBlur("endMonth")}
                    onKeyDown={(e) => handleDateKeyDown(e, "endMonth", "endYear", "endDay")}
                    maxLength="2"
                    placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.endMonth ? styles.errorInput : ""}`}
                    required
                    ref={(el) => {
                      if (el) inputRefs.current["endMonth"] = el;
                      else delete inputRefs.current["endMonth"];
                    }}
                    data-error-field="endMonth"
                    aria-label="Місяць закінчення"
                    aria-invalid={!!errors.endMonth}
                    aria-describedby={errors.endMonth ? "endMonth-error" : undefined}
                    autoComplete="off"
                  />{" "}
                  20
                  <input
                    type="text"
                    name="endYear"
                    value={formData.endYear}
                    onChange={handleChange}
                    onFocus={() => handleFocus("endYear")}
                    onBlur={() => handleBlur("endYear")}
                    onKeyDown={(e) => handleInputKeyDown(e, "endYear", "applicationDateDay", "endMonth")}
                    maxLength="2"
                    placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.endYear ? styles.errorInput : ""}`}
                    required
                    ref={(el) => {
                      if (el) inputRefs.current["endYear"] = el;
                      else delete inputRefs.current["endYear"];
                    }}
                    data-error-field="endYear"
                    aria-label="Рік закінчення (останні дві цифри)"
                    aria-invalid={!!errors.endYear}
                    aria-describedby={errors.endYear ? "endYear-error" : undefined}
                    autoComplete="off"
                  />{" "}
                  року.
                </p>
                {errors.dormNumber && (
                  <p id="dormNumber-error" className={styles.error}>
                    {errors.dormNumber}
                  </p>
                )}
                {errors.startDay && (
                  <p id="startDay-error" className={styles.error}>
                    {errors.startDay}
                  </p>
                )}
                {errors.startMonth && (
                  <p id="startMonth-error" className={styles.error}>
                    {errors.startMonth}
                  </p>
                )}
                {errors.startYear && (
                  <p id="startYear-error" className={styles.error}>
                    {errors.startYear}
                  </p>
                )}
                {errors.endDay && (
                  <p id="endDay-error" className={styles.error}>
                    {errors.endDay}
                  </p>
                )}
                {errors.endMonth && (
                  <p id="endMonth-error" className={styles.error}>
                    {errors.endMonth}
                  </p>
                )}
                {errors.endYear && (
                  <p id="endYear-error" className={styles.error}>
                    {errors.endYear}
                  </p>
                )}
                <p className={styles.justifiedText}>
                  Зобов’язуюсь дотримуватись Правил внутрішнього розпорядку у студентських гуртожитках НУБіП України та своєчасно здійснювати оплату за проживання в гуртожитку згідно укладеного договору та чинних тарифів, що діють в НУБіП України.
                </p>
                <div className={styles.signatureSection}>
                  <div className={styles.signatureBlock}>
                    <div className={styles.dateInputGroup}>
                      <input
                        type="text"
                        name="applicationDateDay"
                        value={formData.applicationDateDay}
                        onChange={handleChange}
                        onFocus={() => handleFocus("applicationDateDay")}
                        onBlur={() => handleBlur("applicationDateDay")}
                        onKeyDown={(e) => handleDateKeyDown(e, "applicationDateDay", "applicationDateMonth", "endYear")}
                        maxLength="2"
                        placeholder="__"
                        className={`${styles.inlineInputDate} ${errors.applicationDateDay ? styles.errorInput : ""}`}
                        required
                        ref={(el) => {
                          if (el) inputRefs.current["applicationDateDay"] = el;
                          else delete inputRefs.current["applicationDateDay"];
                        }}
                        data-error-field="applicationDateDay"
                        aria-label="День дати заяви"
                        aria-invalid={!!errors.applicationDateDay}
                        aria-describedby={errors.applicationDateDay ? "applicationDateDay-error" : undefined}
                        autoComplete="off"
                      />
                      <input
                        type="text"
                        name="applicationDateMonth"
                        value={formData.applicationDateMonth}
                        onChange={handleChange}
                        onFocus={() => handleFocus("applicationDateMonth")}
                        onBlur={() => handleBlur("applicationDateMonth")}
                        onKeyDown={(e) => handleDateKeyDown(e, "applicationDateMonth", "applicationDateYear", "applicationDateDay")}
                        maxLength="2"
                        placeholder="__"
                        className={`${styles.inlineInputDate} ${errors.applicationDateMonth ? styles.errorInput : ""}`}
                        required
                        ref={(el) => {
                          if (el) inputRefs.current["applicationDateMonth"] = el;
                          else delete inputRefs.current["applicationDateMonth"];
                        }}
                        data-error-field="applicationDateMonth"
                        aria-label="Місяць дати заяви"
                        aria-invalid={!!errors.applicationDateMonth}
                        aria-describedby={errors.applicationDateMonth ? "applicationDateMonth-error" : undefined}
                        autoComplete="off"
                      />
                      <span>20</span>
                      <input
                        type="text"
                        name="applicationDateYear"
                        value={formData.applicationDateYear}
                        onChange={handleChange}
                        onFocus={() => handleFocus("applicationDateYear")}
                        onBlur={() => handleBlur("applicationDateYear")}
                        onKeyDown={(e) => handleInputKeyDown(e, "applicationDateYear", "surname", "applicationDateMonth")}
                        maxLength="2"
                        placeholder="__"
                        className={`${styles.inlineInputDate} ${errors.applicationDateYear ? styles.errorInput : ""}`}
                        required
                        ref={(el) => {
                          if (el) inputRefs.current["applicationDateYear"] = el;
                          else delete inputRefs.current["applicationDateYear"];
                        }}
                        data-error-field="applicationDateYear"
                        aria-label="Рік дати заяви (останні дві цифри)"
                        aria-invalid={!!errors.applicationDateYear}
                        aria-describedby={errors.applicationDateYear ? "applicationDateYear-error" : undefined}
                        autoComplete="off"
                      />
                      <span>р.</span>
                    </div>
                    <span className={styles.inputLabel}>(дата)</span>
                  </div>
                  {errors.applicationDateDay && (
                    <p id="applicationDateDay-error" className={styles.error}>
                      {errors.applicationDateDay}
                    </p>
                  )}
                  {errors.applicationDateMonth && (
                    <p id="applicationDateMonth-error" className={styles.error}>
                      {errors.applicationDateMonth}
                    </p>
                  )}
                  {errors.applicationDateYear && (
                    <p id="applicationDateYear-error" className={styles.error}>
                      {errors.applicationDateYear}
                    </p>
                  )}
                  <div className={styles.signatureBlock}>
                    <input
                      type="text"
                      name="surname"
                      value={formData.surname}
                      onChange={handleChange}
                      onFocus={() => handleFocus("surname")}
                      onBlur={() => handleBlur("surname")}
                      onKeyDown={(e) => handleInputKeyDown(e, "surname", null, "applicationDateYear")}
                      className={`${styles.inlineInput} ${errors.surname ? styles.errorInput : ""}`}
                      required
                      ref={(el) => {
                        if (el) inputRefs.current["surname"] = el;
                        else delete inputRefs.current["surname"];
                      }}
                      data-error-field="surname"
                      aria-label="Прізвище"
                      aria-invalid={!!errors.surname}
                      aria-describedby={errors.surname ? "surname-error" : undefined}
                      autoComplete="off"
                    />
                    <span className={styles.inputLabel}>(прізвище)</span>
                  </div>
                  {errors.surname && (
                    <p id="surname-error" className={styles.error}>
                      {errors.surname}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
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
                      scrollToErrorFieldFixed(item.key);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setCurrentErrorIndex(item.index);
                        scrollToErrorFieldFixed(item.key);
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
            <div className={styles.backButtonWrapper}></div>
            <div className={styles.progressBarWrapper}>
              <div className={styles.progressBar}>
                <progress value={progress} max="100" aria-label={`Прогрес заповнення форми: ${Math.round(progress)}%`} />
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
            <div className={styles.nextButtonWrapper}>
              <button
                className={`${styles.navButton} ${styles.nextButton}`}
                onClick={handleSubmit}
                disabled={isSubmitting}
                aria-label={isSubmitting ? "Відправлення форми" : "Подати заяву"}
              >
                <span>{isSubmitting ? "Відправлення..." : "Подати заяву"}</span>
                {!isSubmitting && <CheckIcon className={styles.buttonIcon} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccommodationApplicationPage;