import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import { ToastService } from "../../../utils/toastConfig";
import Sidebar from "../../../components/UI/Sidebar/Sidebar";
import Navbar from "../../../components/UI/Navbar/Navbar";
import styles from "./styles/AccommodationApplicationPage.module.css";
import { fullSchema, validateForm, scrollToErrorFieldFixed } from "./validation";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useUser } from "../../../contexts/UserContext";

const AccommodationApplicationPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  const [formData, setFormData] = useState({
    faculty: "",
    group: "",
    course: "",
    fullName: "",
    residentPhone: "",
    dormNumber: "",
    academicYearStart: "", // YYYY
    academicYearEnd: "",   // YYYY
    startDay: "", startMonth: "", startYear: "", // YY for year
    endDay: "", endMonth: "", endYear: "",       // YY for year
    applicationDateDay: "", applicationDateMonth: "", applicationDateYear: "", // YY for year
    surname: "",
    preferred_room: "",
    comments: "",
  });

  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [allFaculties, setAllFaculties] = useState([]);
  const [groupsForFaculty, setGroupsForFaculty] = useState([]);
  const [allDormitories, setAllDormitories] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const [dataLoading, setDataLoading] = useState({
    faculties: true,
    groups: false,
    dormitories: true,
    preset: false,
  });

  const inputRefs = useRef({});

  const setApplicationDateToToday = useCallback(() => {
    const today = new Date();
    setFormData(prev => ({
      ...prev,
      applicationDateDay: String(today.getDate()).padStart(2, '0'),
      applicationDateMonth: String(today.getMonth() + 1).padStart(2, '0'),
      applicationDateYear: String(today.getFullYear()).slice(-2),
    }));
  }, []);

  useEffect(() => {
    if (user) {
      const phoneDigits = user.phone?.startsWith('+380') ? user.phone.substring(4) : (user.phone || "");
      const userSurname = user.name ? user.name.split(" ")[0] : "";
      const studentFacultyId = user.role === 'student' && user.faculty_id ? user.faculty_id.toString() : "";

      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        residentPhone: phoneDigits || prev.residentPhone,
        surname: userSurname || prev.surname,
        faculty: studentFacultyId || prev.faculty,
      }));
      if (!formData.applicationDateDay && !formData.applicationDateMonth && !formData.applicationDateYear) {
        setApplicationDateToToday();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, setApplicationDateToToday]);


  const calculateProgress = useCallback(() => {
    const requiredFields = [
      "faculty", "group", "course", "fullName", "residentPhone", "dormNumber",
      "academicYearStart", "academicYearEnd",
      "startDay", "startMonth", "startYear", "endDay", "endMonth", "endYear",
      "applicationDateDay", "applicationDateMonth", "applicationDateYear", "surname",
    ];
    const totalRequired = requiredFields.length;
    const filledRequired = requiredFields.filter((field) => {
      const value = formData[field];
      return value !== "" && value !== undefined && value !== null;
    }).length;
    setProgress(totalRequired === 0 ? 0 : (filledRequired / totalRequired) * 100);
  }, [formData]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    calculateProgress();
  }, [isSidebarExpanded, formData, calculateProgress]);

  useEffect(() => {
    if (showErrors && Object.keys(errors).length > 0) {
      const errorFields = getAllErrorFields(errors);
      if (errorFields.length > 0 && errorFields[currentErrorIndex]) {
        scrollToErrorFieldFixed(errorFields[currentErrorIndex], inputRefs.current);
      }
    }
  }, [currentErrorIndex, errors, showErrors]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setDataLoading(prev => ({ ...prev, faculties: true, dormitories: true }));
        const [facultiesRes, dormitoriesRes] = await Promise.all([
          api.get("/faculties"),
          api.get("/dormitories")
        ]);
        setAllFaculties(facultiesRes.data || []);
        setAllDormitories(dormitoriesRes.data || []);
      } catch (error) {
        ToastService.error("Не вдалося завантажити списки факультетів/гуртожитків.");
      } finally {
        setDataLoading(prev => ({ ...prev, faculties: false, dormitories: false }));
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.faculty) {
      const fetchGroups = async () => {
        try {
          setDataLoading(prev => ({ ...prev, groups: true }));
          const response = await api.get(`/faculties/${formData.faculty}/groups`);
          const fetchedGroups = response.data || [];
          setGroupsForFaculty(fetchedGroups);

          let groupToSet = formData.group;
          let courseToSet = formData.course;

          if (user && user.role === 'student' && user.group_id && String(user.faculty_id) === String(formData.faculty)) {
            const userGroupObj = fetchedGroups.find(g => String(g.id) === String(user.group_id));
            if (userGroupObj) {
              groupToSet = String(user.group_id);
              courseToSet = String(userGroupObj.course);
            }
          } else {
            const currentGroupInFetched = fetchedGroups.find(g => String(g.id) === String(formData.group));
            if (formData.group && !currentGroupInFetched) {
              groupToSet = ""; courseToSet = "";
            } else if (formData.group && currentGroupInFetched) {
              courseToSet = String(currentGroupInFetched.course);
            }
          }
          setFormData(prev => ({ ...prev, group: groupToSet, course: courseToSet }));
        } catch (error) {
          ToastService.error("Не вдалося завантажити групи для факультету.");
          setGroupsForFaculty([]);
          setFormData(prev => ({ ...prev, group: "", course: "" }));
        } finally {
          setDataLoading(prev => ({ ...prev, groups: false }));
        }
      };
      fetchGroups();
    } else {
      setGroupsForFaculty([]);
      if (formData.faculty === "") {
          setFormData(prev => ({ ...prev, group: "", course: "" }));
      }
    }
  }, [formData.faculty, user]);

  const getAcademicYearString = (startYear) => {
    if (!startYear || isNaN(parseInt(startYear))) return "";
    return `${startYear}-${parseInt(startYear) + 1}`;
  };

  const calculateRelevantAcademicYears = useCallback(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); 
    const currentAcademicYearStart = currentMonth >= 6 ? currentYear : currentYear - 1; // Assuming July+ starts new acad year
    const currentAcademicQuery = getAcademicYearString(currentAcademicYearStart);
    const nextAcademicYearStart = currentAcademicYearStart + 1;
    const nextAcademicQuery = getAcademicYearString(nextAcademicYearStart);
    return [currentAcademicQuery, nextAcademicQuery].filter(Boolean);
  }, []);

  useEffect(() => {
    const fetchPresetForSpecificYear = async (dormId, academicYearQuery) => {
      if (!dormId || !academicYearQuery) return null;
      try {
        console.log(`[Preset Fetch Specific] DormID: ${dormId}, AcadYear: ${academicYearQuery}`);
        const response = await api.get(
          `/application-presets/dormitory/${dormId}?academic_year=${academicYearQuery}`
        );
        if (response.data) {
          console.log(`[Preset Fetch Specific] Found preset for ${academicYearQuery}:`, response.data);
          return response.data;
        }
      } catch (error) {
        console.warn(`[Preset Fetch Specific] Preset not found for dorm ${dormId}, year ${academicYearQuery} or error:`, error.response?.status);
      }
      return null;
    };
    
    const loadDormPreset = async () => {
      if (!formData.dormNumber) {
        setSelectedPreset(null);
        // Reset related fields if dorm is deselected
        setFormData(prev => {
            const today = new Date();
            return {
                ...prev,
                academicYearStart: "", academicYearEnd: "",
                startDay: "", startMonth: "", startYear: "",
                endDay: "", endMonth: "", endYear: "",
                applicationDateDay: prev.applicationDateDay || String(today.getDate()).padStart(2, '0'),
                applicationDateMonth: prev.applicationDateMonth || String(today.getMonth() + 1).padStart(2, '0'),
                applicationDateYear: prev.applicationDateYear || String(today.getFullYear()).slice(-2),
            };
        });
        return;
      }

      setDataLoading(prev => ({ ...prev, preset: true }));
      let foundPreset = null;
      let academicYearToQueryForPreset = "";

      if (formData.academicYearStart && formData.academicYearEnd &&
          /^\d{4}$/.test(formData.academicYearStart) && /^\d{4}$/.test(formData.academicYearEnd) &&
          parseInt(formData.academicYearEnd) === parseInt(formData.academicYearStart) + 1) {
        academicYearToQueryForPreset = `${formData.academicYearStart}-${formData.academicYearEnd}`;
        foundPreset = await fetchPresetForSpecificYear(formData.dormNumber, academicYearToQueryForPreset);
      }

      if (!foundPreset) {
        const relevantAcademicYears = calculateRelevantAcademicYears();
        if (relevantAcademicYears.length > 0) {
            for (const year of relevantAcademicYears) {
                if (!year) continue;
                foundPreset = await fetchPresetForSpecificYear(formData.dormNumber, year);
                if (foundPreset) {
                    academicYearToQueryForPreset = year; 
                    break;
                }
            }
        }
      }
      
      setSelectedPreset(foundPreset); // Triggers the next useEffect to apply data

      if (!foundPreset) {
        ToastService.info(`Для обраного гуртожитку та вказаного/актуального навчального року немає активних налаштувань. Дати потрібно ввести вручну.`);
        // Clear preset-dependent fields if no preset is found, but keep user-entered app date
         setFormData(prev => {
             const today = new Date();
             return {
                 ...prev,
                 // academicYearStart: "", // Keep user's academic year if they entered one
                 // academicYearEnd: "",
                 startDay: "", startMonth: "", startYear: "",
                 endDay: "", endMonth: "", endYear: "",
                 applicationDateDay: prev.applicationDateDay || String(today.getDate()).padStart(2, '0'),
                 applicationDateMonth: prev.applicationDateMonth || String(today.getMonth() + 1).padStart(2, '0'),
                 applicationDateYear: prev.applicationDateYear || String(today.getFullYear()).slice(-2),
             };
         });
      }
      setDataLoading(prev => ({ ...prev, preset: false }));
    };

    loadDormPreset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.dormNumber, formData.academicYearStart, formData.academicYearEnd]); // Removed calculateRelevantAcademicYears from deps


  useEffect(() => {
    const updates = {};
    let presetActuallyApplied = false;

    const parseAndSetDate = (dateString, dayField, monthField, yearField) => {
      if (dateString && dateString !== "0000-00-00") { // Ensure backend fix for 0000-00-00 returning null
        const dateObj = new Date(dateString); // dateString should be YYYY-MM-DD from backend
        if (!isNaN(dateObj.getTime())) {
          // When parsing YYYY-MM-DD, new Date() treats it as UTC midnight.
          // To get the correct day/month/year components as they were on that UTC date:
          updates[dayField] = String(dateObj.getUTCDate()).padStart(2, '0');
          updates[monthField] = String(dateObj.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
          updates[yearField] = String(dateObj.getUTCFullYear()).slice(-2); // YY
          presetActuallyApplied = true;
          return;
        } else {
            console.warn(`[Preset Apply] Invalid date string from preset after new Date(): ${dateString}`);
        }
      }
      // If dateString is invalid, null, or "0000-00-00", clear fields
      updates[dayField] = ""; updates[monthField] = ""; updates[yearField] = "";
    };

    if (selectedPreset) {
      console.log("[Preset Apply Effect] Applying preset to form:", selectedPreset);

      const presetAcadYear = selectedPreset.academic_year;
      if (presetAcadYear && typeof presetAcadYear === 'string') {
        const [pStart, pEnd] = presetAcadYear.split('-');
        if (pStart && pEnd && pStart.match(/^\d{4}$/) && pEnd.match(/^\d{4}$/)) {
          // Only update if form is empty or different from preset
          if (!formData.academicYearStart || formData.academicYearStart !== pStart) {
            updates.academicYearStart = pStart;
            presetActuallyApplied = true;
          }
          if (!formData.academicYearEnd || formData.academicYearEnd !== pEnd) {
            updates.academicYearEnd = pEnd;
            presetActuallyApplied = true;
          }
        }
      }
      
      parseAndSetDate(selectedPreset.start_date, 'startDay', 'startMonth', 'startYear');
      parseAndSetDate(selectedPreset.end_date, 'endDay', 'endMonth', 'endYear');

      if (selectedPreset.application_date && selectedPreset.application_date !== "0000-00-00") {
        parseAndSetDate(selectedPreset.application_date, 'applicationDateDay', 'applicationDateMonth', 'applicationDateYear');
      } else {
        if (!formData.applicationDateDay || !formData.applicationDateMonth || !formData.applicationDateYear) {
            const today = new Date();
            updates.applicationDateDay = String(today.getDate()).padStart(2, '0');
            updates.applicationDateMonth = String(today.getMonth() + 1).padStart(2, '0');
            updates.applicationDateYear = String(today.getFullYear()).slice(-2);
            presetActuallyApplied = true;
        }
      }
      
      if (Object.keys(updates).length > 0) {
          setFormData(prev => ({ ...prev, ...updates }));
      }
      if (presetActuallyApplied) {
        ToastService.info("Дані автоматично заповнено з налаштувань гуртожитку.");
      }
    } 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset]); 


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
      course: "Курс", group: "Група", faculty: "Факультет", fullName: "П.І.Б.",
      residentPhone: "Телефон", dormNumber: "Гуртожиток",
      academicYearStart: "Початок навч. року", academicYearEnd: "Кінець навч. року",
      startDay: "День початку", startMonth: "Місяць початку", startYear: "Рік початку",
      endDay: "День закінчення", endMonth: "Місяць закінчення", endYear: "Рік закінчення",
      applicationDateDay: "День заяви", applicationDateMonth: "Місяць заяви", applicationDateYear: "Рік заяви",
      surname: "Прізвище",
      preferred_room: "Бажана кімната",
      comments: "Коментарі"
    };
    return labels[field] || field;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };
      if (name === "faculty") {
        newState.group = ""; newState.course = "";
      }
      if (name === "group") {
        const selectedGroup = groupsForFaculty.find(g => g.id.toString() === value);
        newState.course = selectedGroup ? selectedGroup.course.toString() : "";
      }
      return newState;
    });
  };

  const handlePhoneInput = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = value.replace(/[^0-9]/g, "").slice(0, 9);
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleFocus = (fieldName) => {
    const element = inputRefs.current[fieldName];
    if (element) element.classList.add(styles.focusedInput);
  };

  const handleBlur = (fieldName) => {
    const element = inputRefs.current[fieldName];
    if (element) element.classList.remove(styles.focusedInput);
  };

  const handleDateKeyDown = (e, currentField, nextField, prevField) => {
    if (e.key === "ArrowRight" && formData[currentField]?.length >= 2) inputRefs.current[nextField]?.focus();
    else if (e.key === "ArrowLeft" && formData[currentField]?.length === 0) inputRefs.current[prevField]?.focus();
    else if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) { inputRefs.current[nextField]?.focus(); e.preventDefault(); }
    else if (e.key === "Tab" && e.shiftKey) { inputRefs.current[prevField]?.focus(); e.preventDefault(); }
  };

  const handleInputKeyDown = (e, currentField, nextField, prevField) => {
    if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) { inputRefs.current[nextField]?.focus(); e.preventDefault(); }
    else if (e.key === "Tab" && e.shiftKey) { inputRefs.current[prevField]?.focus(); e.preventDefault(); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowErrors(false);

    const applicationFullDate = formData.applicationDateDay && formData.applicationDateMonth && formData.applicationDateYear
      ? `20${formData.applicationDateYear}-${formData.applicationDateMonth.padStart(2, '0')}-${formData.applicationDateDay.padStart(2, '0')}` : null;
    const startFullDate = formData.startDay && formData.startMonth && formData.startYear
      ? `20${formData.startYear}-${formData.startMonth.padStart(2, '0')}-${formData.startDay.padStart(2, '0')}` : null;
    const endFullDate = formData.endDay && formData.endMonth && formData.endYear
      ? `20${formData.endYear}-${formData.endMonth.padStart(2, '0')}-${formData.endDay.padStart(2, '0')}` : null;

    const academicYearCombined = formData.academicYearStart && formData.academicYearEnd
      ? `${formData.academicYearStart}-${formData.academicYearEnd}`
      : "";

    const validationData = {
      ...formData,
      academic_year: academicYearCombined,
      application_date: applicationFullDate,
      start_date: startFullDate,
      end_date: endFullDate,
    };

    const { isValid, errors: validationErrors } = await validateForm(validationData, fullSchema(groupsForFaculty.map(g => g.id.toString())));
    setErrors(validationErrors);

    if (!isValid) {
      const errorFields = getAllErrorFields(validationErrors);
      if (errorFields.length > 0 && errorFields[0]) {
        setCurrentErrorIndex(0);
        scrollToErrorFieldFixed(errorFields[0], inputRefs.current);
      }
      setShowErrors(true);
      setIsSubmitting(false);
      ToastService.error("Будь ласка, виправте помилки у формі.");
      return;
    }

    const rawPhone = formData.residentPhone;
    const formattedPhone = `+380${rawPhone}`;

    const submitData = {
      faculty_id: parseInt(formData.faculty, 10),
      group_id: parseInt(formData.group, 10),
      course: parseInt(formData.course, 10),
      full_name: formData.fullName,
      surname: formData.surname,
      phone_number: formattedPhone,
      dormitory_id: parseInt(formData.dormNumber, 10),
      application_date: applicationFullDate,
      start_date: startFullDate,
      end_date: endFullDate,
      preferred_room: formData.preferred_room || null,
      comments: formData.comments || null,
    };

    try {
      console.log("[Frontend Submit] Submitting data:", submitData);
      await api.post("/services/accommodation-application", submitData);
      ToastService.success("Заяву подано на розгляд", "Очікуйте підтвердження.");
      navigate("/dashboard");
    } catch (error) {
      console.error("API error on submit:", error.response?.data || error.message);
      const errorData = error.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        const backendErrors = errorData.details.reduce((acc, detail) => {
          const fieldName = detail.path ? detail.path.join('.') : detail.field || 'general';
          acc[fieldName] = detail.message;
          return acc;
        }, {});
        setErrors(prev => ({ ...prev, ...backendErrors }));
        const beErrorMessage = errorData.details.map(d => d.message).join('\n');
        ToastService.error("Помилка валідації від сервера", beErrorMessage);
      } else if (errorData?.code === "DUPLICATE_APPLICATION") {
        ToastService.error("Помилка: У вас вже є активна заявка.");
      } else if (errorData?.code === "INCOMPLETE_PROFILE" || (error.response?.status === 400 && errorData?.error?.includes("Профіль користувача не знайдено")) || (errorData?.error?.includes("Не всі дані в профілі заповнені"))) {
        ToastService.error("Помилка: Заповніть профіль (ПІБ, телефон, факультет, група, курс).");
        navigate("/complete-profile");
      } else {
        ToastService.handleApiError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorKeys = getAllErrorFields(errors);
  const errorMenuItems = errorKeys.map((key, index) => ({
    key,
    message: `${formatErrorMessage(key)}: ${errors[key]}`,
    index,
  }));

  const isPresetActive = !!selectedPreset;

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
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
                    <select
                      name="faculty" value={formData.faculty} onChange={handleChange}
                      onFocus={() => handleFocus("faculty")} onBlur={() => handleBlur("faculty")}
                      onKeyDown={(e) => handleInputKeyDown(e, "faculty", "group", null)}
                      className={`${styles.inlineSelect} ${errors.faculty ? styles.errorInput : ""}`}
                      required ref={(el) => { inputRefs.current["faculty"] = el; }}
                      data-error-field="faculty" aria-label="Факультет" aria-invalid={!!errors.faculty}
                      aria-describedby={errors.faculty ? "faculty-error" : undefined}
                      disabled={dataLoading.faculties}
                    >
                      <option value="" disabled>{dataLoading.faculties ? "Завантаження..." : "Оберіть факультет"}</option>
                      {allFaculties.map((faculty) => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name}
                        </option>
                      ))}
                    </select>{" "}
                    факультету
                  </p>
                  {errors.faculty && (<p id="faculty-error" className={styles.error}>{errors.faculty}</p>)}
                  <p className={styles.rightText}>
                    <select
                      name="group" value={formData.group} onChange={handleChange}
                      onFocus={() => handleFocus("group")} onBlur={() => handleBlur("group")}
                      onKeyDown={(e) => handleInputKeyDown(e, "group", "fullName", "faculty")}
                      className={`${styles.inlineSelect} ${errors.group ? styles.errorInput : ""}`}
                      required ref={(el) => { inputRefs.current["group"] = el; }}
                      data-error-field="group" aria-label="Група" aria-invalid={!!errors.group}
                      aria-describedby={errors.group ? "group-error" : undefined}
                      disabled={!formData.faculty || dataLoading.groups}
                    >
                      <option value="" disabled>
                        {dataLoading.groups ? "Завантаження..." : (!formData.faculty ? "Оберіть факультет" : (groupsForFaculty.length === 0 ? "Немає груп" : "Оберіть групу"))}
                      </option>
                      {groupsForFaculty.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    {" "}групи, {" "}
                    <input
                      type="text" name="course" value={formData.course} readOnly
                      className={`${styles.shortInlineInput} ${styles.readOnlyCourse} ${errors.course ? styles.errorInput : ""}`}
                      ref={(el) => { inputRefs.current["course"] = el; }}
                      data-error-field="course" aria-label="Курс (автоматично)" placeholder="Курс"
                    />
                    {" "}курсу
                  </p>
                  {errors.group && (<p id="group-error" className={styles.error}>{errors.group}</p>)}
                  {errors.course && (<p id="course-error" className={styles.error}>{errors.course}</p>)}

                  <div className={styles.fullNameWrapper}>
                    <input
                      type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                      onFocus={() => handleFocus("fullName")} onBlur={() => handleBlur("fullName")}
                      onKeyDown={(e) => handleInputKeyDown(e, "fullName", "residentPhone", "group")}
                      className={`${styles.fullWidthInput} ${errors.fullName ? styles.errorInput : ""}`}
                      required ref={(el) => { inputRefs.current["fullName"] = el; }}
                      data-error-field="fullName" aria-label="П.І.Б." aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? "fullName-error" : undefined} autoComplete="name"
                    />
                    <span className={styles.inputLabel}>(П.І.Б)</span>
                  </div>
                  {errors.fullName && (<p id="fullName-error" className={styles.error}>{errors.fullName}</p>)}

                  <p className={styles.rightText}>
                    конт. тел.: +380
                    <input
                      type="tel" name="residentPhone" value={formData.residentPhone} onChange={handlePhoneInput}
                      onFocus={() => handleFocus("residentPhone")} onBlur={() => handleBlur("residentPhone")}
                      onKeyDown={(e) => handleInputKeyDown(e, "residentPhone", "academicYearStart", "fullName")}
                      className={`${styles.inlineInput} ${styles.phoneInput} ${errors.residentPhone ? styles.errorInput : ""}`}
                      required ref={(el) => { inputRefs.current["residentPhone"] = el; }}
                      data-error-field="residentPhone" aria-label="Телефон (9 цифр)" aria-invalid={!!errors.residentPhone}
                      aria-describedby={errors.residentPhone ? "residentPhone-error" : undefined}
                      autoComplete="tel" placeholder="ХХХХХХХХХ" maxLength="9"
                    />
                  </p>
                  {errors.residentPhone && (<p id="residentPhone-error" className={styles.error}>{errors.residentPhone}</p>)}
                </div>

                <h2 className={styles.centeredTitle}>Заява</h2>
                <p className={styles.justifiedText}>
                  Прошу поселити мене на{" "}
                  <input
                    type="text" name="academicYearStart" value={formData.academicYearStart}
                    onChange={handleChange} ref={(el) => { inputRefs.current["academicYearStart"] = el; }}
                    onFocus={() => handleFocus("academicYearStart")} onBlur={() => handleBlur("academicYearStart")}
                    onKeyDown={(e) => handleInputKeyDown(e, "academicYearStart", "academicYearEnd", "residentPhone")}
                    className={`${styles.inlineInputYear} ${errors.academicYearStart ? styles.errorInput : ""} ${ (isPresetActive && selectedPreset?.academic_year) ? styles.readOnlyField : ""}`}
                    placeholder="YYYY" maxLength="4" data-error-field="academicYearStart"
                    aria-label="Початок навчального року"
                    readOnly={isPresetActive && !!selectedPreset?.academic_year}
                    disabled={dataLoading.preset}
                  />
                  {" - "}
                  <input
                    type="text" name="academicYearEnd" value={formData.academicYearEnd}
                    onChange={handleChange} ref={(el) => { inputRefs.current["academicYearEnd"] = el; }}
                    onFocus={() => handleFocus("academicYearEnd")} onBlur={() => handleBlur("academicYearEnd")}
                    onKeyDown={(e) => handleInputKeyDown(e, "academicYearEnd", "dormNumber", "academicYearStart")}
                    className={`${styles.inlineInputYear} ${errors.academicYearEnd ? styles.errorInput : ""} ${ (isPresetActive && selectedPreset?.academic_year) ? styles.readOnlyField : ""}`}
                    placeholder="YYYY" maxLength="4" data-error-field="academicYearEnd"
                    aria-label="Кінець навчального року"
                    readOnly={isPresetActive && !!selectedPreset?.academic_year}
                    disabled={dataLoading.preset}
                  />
                  {" "}навчальний рік в гуртожиток №{" "}
                  <select
                    name="dormNumber" value={formData.dormNumber} onChange={handleChange}
                    onFocus={() => handleFocus("dormNumber")} onBlur={() => handleBlur("dormNumber")}
                    onKeyDown={(e) => handleInputKeyDown(e, "dormNumber", "startDay", "academicYearEnd")}
                    className={`${styles.inlineSelect} ${errors.dormNumber ? styles.errorInput : ""}`}
                    required ref={(el) => { inputRefs.current["dormNumber"] = el; }}
                    data-error-field="dormNumber" aria-label="Номер гуртожитку" aria-invalid={!!errors.dormNumber}
                    aria-describedby={errors.dormNumber ? "dormNumber-error" : undefined}
                    disabled={dataLoading.dormitories || dataLoading.preset}
                  >
                    <option value="" disabled>{dataLoading.dormitories ? "Завантаження..." : "Оберіть гуртожиток"}</option>
                    {allDormitories.map(dorm => (
                      <option key={dorm.id} value={dorm.id}>{dorm.name}</option>
                    ))}
                  </select>{" "}
                  на ліжко-місці з «
                  <input
                    type="text" name="startDay" value={formData.startDay} onChange={handleChange}
                    onFocus={() => handleFocus("startDay")} onBlur={() => handleBlur("startDay")}
                    onKeyDown={(e) => handleDateKeyDown(e, "startDay", "startMonth", "dormNumber")}
                    maxLength="2" placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.startDay ? styles.errorInput : ""} ${ (isPresetActive && selectedPreset?.start_date) ? styles.readOnlyField : ""}`}
                    required ref={(el) => { inputRefs.current["startDay"] = el; }}
                    data-error-field="startDay" aria-label="День початку" aria-invalid={!!errors.startDay}
                    aria-describedby={errors.startDay ? "startDay-error" : undefined} autoComplete="off"
                    readOnly={isPresetActive && !!selectedPreset?.start_date}
                    disabled={dataLoading.preset}
                  />
                  »{" "}
                  <input
                    type="text" name="startMonth" value={formData.startMonth} onChange={handleChange}
                    onFocus={() => handleFocus("startMonth")} onBlur={() => handleBlur("startMonth")}
                    onKeyDown={(e) => handleDateKeyDown(e, "startMonth", "startYear", "startDay")}
                    maxLength="2" placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.startMonth ? styles.errorInput : ""} ${ (isPresetActive && selectedPreset?.start_date) ? styles.readOnlyField : ""}`}
                    required ref={(el) => { inputRefs.current["startMonth"] = el; }}
                    data-error-field="startMonth" aria-label="Місяць початку" aria-invalid={!!errors.startMonth}
                    aria-describedby={errors.startMonth ? "startMonth-error" : undefined} autoComplete="off"
                    readOnly={isPresetActive && !!selectedPreset?.start_date}
                    disabled={dataLoading.preset}
                  />{" "}
                  20
                  <input
                    type="text" name="startYear" value={formData.startYear} onChange={handleChange}
                    onFocus={() => handleFocus("startYear")} onBlur={() => handleBlur("startYear")}
                    onKeyDown={(e) => handleDateKeyDown(e, "startYear", "endDay", "startMonth")}
                    maxLength="2" placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.startYear ? styles.errorInput : ""} ${ (isPresetActive && selectedPreset?.start_date) ? styles.readOnlyField : ""}`}
                    required ref={(el) => { inputRefs.current["startYear"] = el; }}
                    data-error-field="startYear" aria-label="Рік початку (останні дві цифри)"
                    aria-invalid={!!errors.startYear} aria-describedby={errors.startYear ? "startYear-error" : undefined} autoComplete="off"
                    readOnly={isPresetActive && !!selectedPreset?.start_date}
                    disabled={dataLoading.preset}
                  />{" "}
                  року по «
                  <input
                    type="text" name="endDay" value={formData.endDay} onChange={handleChange}
                    onFocus={() => handleFocus("endDay")} onBlur={() => handleBlur("endDay")}
                    onKeyDown={(e) => handleDateKeyDown(e, "endDay", "endMonth", "startYear")}
                    maxLength="2" placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.endDay ? styles.errorInput : ""} ${ (isPresetActive && selectedPreset?.end_date) ? styles.readOnlyField : ""}`}
                    required ref={(el) => { inputRefs.current["endDay"] = el; }}
                    data-error-field="endDay" aria-label="День закінчення" aria-invalid={!!errors.endDay}
                    aria-describedby={errors.endDay ? "endDay-error" : undefined} autoComplete="off"
                    readOnly={isPresetActive && !!selectedPreset?.end_date}
                    disabled={dataLoading.preset}
                  />
                  »{" "}
                  <input
                    type="text" name="endMonth" value={formData.endMonth} onChange={handleChange}
                    onFocus={() => handleFocus("endMonth")} onBlur={() => handleBlur("endMonth")}
                    onKeyDown={(e) => handleDateKeyDown(e, "endMonth", "endYear", "endDay")}
                    maxLength="2" placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.endMonth ? styles.errorInput : ""} ${ (isPresetActive && selectedPreset?.end_date) ? styles.readOnlyField : ""}`}
                    required ref={(el) => { inputRefs.current["endMonth"] = el; }}
                    data-error-field="endMonth" aria-label="Місяць закінчення" aria-invalid={!!errors.endMonth}
                    aria-describedby={errors.endMonth ? "endMonth-error" : undefined} autoComplete="off"
                    readOnly={isPresetActive && !!selectedPreset?.end_date}
                    disabled={dataLoading.preset}
                  />{" "}
                  20
                  <input
                    type="text" name="endYear" value={formData.endYear} onChange={handleChange}
                    onFocus={() => handleFocus("endYear")} onBlur={() => handleBlur("endYear")}
                    onKeyDown={(e) => handleInputKeyDown(e, "endYear", "preferred_room", "endMonth")}
                    maxLength="2" placeholder="__"
                    className={`${styles.inlineInputDate} ${errors.endYear ? styles.errorInput : ""} ${ (isPresetActive && selectedPreset?.end_date) ? styles.readOnlyField : ""}`}
                    required ref={(el) => { inputRefs.current["endYear"] = el; }}
                    data-error-field="endYear" aria-label="Рік закінчення (останні дві цифри)"
                    aria-invalid={!!errors.endYear} aria-describedby={errors.endYear ? "endYear-error" : undefined} autoComplete="off"
                    readOnly={isPresetActive && !!selectedPreset?.end_date}
                    disabled={dataLoading.preset}
                  />{" "}
                  року.
                </p>
                {errors.academicYearStart && (<p className={styles.error}>{errors.academicYearStart}</p>)}
                {errors.academicYearEnd && (<p className={styles.error}>{errors.academicYearEnd}</p>)}
                {errors.dormNumber && (<p id="dormNumber-error" className={styles.error}>{errors.dormNumber}</p>)}
                {errors.startDay && (<p id="startDay-error" className={styles.error}>{errors.startDay}</p>)}
                {errors.startMonth && (<p id="startMonth-error" className={styles.error}>{errors.startMonth}</p>)}
                {errors.startYear && (<p id="startYear-error" className={styles.error}>{errors.startYear}</p>)}
                {errors.endDay && (<p id="endDay-error" className={styles.error}>{errors.endDay}</p>)}
                {errors.endMonth && (<p id="endMonth-error" className={styles.error}>{errors.endMonth}</p>)}
                {errors.endYear && (<p id="endYear-error" className={styles.error}>{errors.endYear}</p>)}

                <div className={styles.inputGroupRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="preferred_room">Бажана кімната (необов'язково):</label>
                    <input
                      type="text"
                      name="preferred_room"
                      id="preferred_room"
                      value={formData.preferred_room}
                      onChange={handleChange}
                      className={`${styles.inlineInput} ${errors.preferred_room ? styles.errorInput : ""}`}
                      placeholder="Напр. 205A"
                      onFocus={() => handleFocus("preferred_room")}
                      onBlur={() => handleBlur("preferred_room")}
                      onKeyDown={(e) => handleInputKeyDown(e, "preferred_room", "comments", "endYear")}
                      ref={(el) => { inputRefs.current["preferred_room"] = el; }}
                      data-error-field="preferred_room"
                      maxLength="10"
                    />
                    {errors.preferred_room && (<p className={styles.error}>{errors.preferred_room}</p>)}
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="comments">Коментарі (необов'язково):</label>
                  <textarea
                    name="comments"
                    id="comments"
                    value={formData.comments}
                    onChange={handleChange}
                    className={`${styles.fullWidthTextarea} ${errors.comments ? styles.errorInput : ""}`}
                    rows="3"
                    placeholder="Додаткова інформація або побажання"
                    onFocus={() => handleFocus("comments")}
                    onBlur={() => handleBlur("comments")}
                    onKeyDown={(e) => handleInputKeyDown(e, "comments", "applicationDateDay", "preferred_room")}
                    ref={(el) => { inputRefs.current["comments"] = el; }}
                    data-error-field="comments"
                    maxLength="1000"
                  ></textarea>
                  {errors.comments && (<p className={styles.error}>{errors.comments}</p>)}
                </div>


                <p className={styles.justifiedText}>
                  Зобов’язуюсь дотримуватись Правил внутрішнього розпорядку у студентських гуртожитках НУБіП України та своєчасно здійснювати оплату за проживання в гуртожитку згідно укладеного договору та чинних тарифів, що діють в НУБіП України.
                </p>

                <div className={styles.signatureSection}>
                  <div className={styles.signatureBlock}>
                    <div className={styles.dateInputGroup}>
                      <input
                        type="text" name="applicationDateDay" value={formData.applicationDateDay} onChange={handleChange}
                        onFocus={() => handleFocus("applicationDateDay")} onBlur={() => handleBlur("applicationDateDay")}
                        onKeyDown={(e) => handleDateKeyDown(e, "applicationDateDay", "applicationDateMonth", "comments")}
                        maxLength="2" placeholder="__"
                        className={`${styles.inlineInputDate} ${errors.applicationDateDay ? styles.errorInput : ""} ${ (isPresetActive && selectedPreset?.application_date) ? styles.readOnlyField : ""}`}
                        required ref={(el) => { inputRefs.current["applicationDateDay"] = el; }}
                        data-error-field="applicationDateDay" aria-label="День дати заяви"
                        aria-invalid={!!errors.applicationDateDay}
                        aria-describedby={errors.applicationDateDay ? "applicationDateDay-error" : undefined} autoComplete="off"
                        readOnly={isPresetActive && !!selectedPreset?.application_date}
                        disabled={dataLoading.preset}
                      />
                      <input
                        type="text" name="applicationDateMonth" value={formData.applicationDateMonth} onChange={handleChange}
                        onFocus={() => handleFocus("applicationDateMonth")} onBlur={() => handleBlur("applicationDateMonth")}
                        onKeyDown={(e) => handleDateKeyDown(e, "applicationDateMonth", "applicationDateYear", "applicationDateDay")}
                        maxLength="2" placeholder="__"
                        className={`${styles.inlineInputDate} ${errors.applicationDateMonth ? styles.errorInput : ""} ${ (isPresetActive && selectedPreset?.application_date) ? styles.readOnlyField : ""}`}
                        required ref={(el) => { inputRefs.current["applicationDateMonth"] = el; }}
                        data-error-field="applicationDateMonth" aria-label="Місяць дати заяви"
                        aria-invalid={!!errors.applicationDateMonth}
                        aria-describedby={errors.applicationDateMonth ? "applicationDateMonth-error" : undefined} autoComplete="off"
                        readOnly={isPresetActive && !!selectedPreset?.application_date}
                        disabled={dataLoading.preset}
                      />
                      <span>20</span>
                      <input
                        type="text" name="applicationDateYear" value={formData.applicationDateYear} onChange={handleChange}
                        onFocus={() => handleFocus("applicationDateYear")} onBlur={() => handleBlur("applicationDateYear")}
                        onKeyDown={(e) => handleInputKeyDown(e, "applicationDateYear", "surname", "applicationDateMonth")}
                        maxLength="2" placeholder="__"
                        className={`${styles.inlineInputDate} ${errors.applicationDateYear ? styles.errorInput : ""} ${ (isPresetActive && selectedPreset?.application_date) ? styles.readOnlyField : ""}`}
                        required ref={(el) => { inputRefs.current["applicationDateYear"] = el; }}
                        data-error-field="applicationDateYear" aria-label="Рік дати заяви (останні дві цифри)"
                        aria-invalid={!!errors.applicationDateYear}
                        aria-describedby={errors.applicationDateYear ? "applicationDateYear-error" : undefined} autoComplete="off"
                        readOnly={isPresetActive && !!selectedPreset?.application_date}
                        disabled={dataLoading.preset}
                      />
                      <span>р.</span>
                    </div>
                    <span className={styles.inputLabel}>(дата)</span>
                  </div>
                  {errors.applicationDateDay && (<p id="applicationDateDay-error" className={styles.error}>{errors.applicationDateDay}</p>)}
                  {errors.applicationDateMonth && (<p id="applicationDateMonth-error" className={styles.error}>{errors.applicationDateMonth}</p>)}
                  {errors.applicationDateYear && (<p id="applicationDateYear-error" className={styles.error}>{errors.applicationDateYear}</p>)}

                  <div className={styles.signatureBlock}>
                    <input
                      type="text" name="surname" value={formData.surname} onChange={handleChange}
                      onFocus={() => handleFocus("surname")} onBlur={() => handleBlur("surname")}
                      onKeyDown={(e) => handleInputKeyDown(e, "surname", null, "applicationDateYear")}
                      className={`${styles.inlineInput} ${errors.surname ? styles.errorInput : ""}`}
                      required ref={(el) => { inputRefs.current["surname"] = el; }}
                      data-error-field="surname" aria-label="Прізвище"
                      aria-invalid={!!errors.surname}
                      aria-describedby={errors.surname ? "surname-error" : undefined} autoComplete="off"
                    />
                    <span className={styles.inputLabel}>(прізвище)</span>
                  </div>
                  {errors.surname && (<p id="surname-error" className={styles.error}>{errors.surname}</p>)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.controlsWrapper}>
          {showErrors && errorKeys.length > 0 && (
            <div className={styles.errorPanel}>
              <h3>Помилки у формі:</h3>
              <div className={styles.errorContainer}>
                {errorMenuItems.map((item) => (
                  <p
                    key={item.key}
                    className={`${styles.errorItem} ${item.index === currentErrorIndex ? styles.activeError : ""}`}
                    onClick={() => {
                      setCurrentErrorIndex(item.index);
                      scrollToErrorFieldFixed(item.key, inputRefs.current);
                    }}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setCurrentErrorIndex(item.index);
                        scrollToErrorFieldFixed(item.key, inputRefs.current);
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
                disabled={isSubmitting || Object.values(dataLoading).some(Boolean)}
                aria-label={isSubmitting ? "Відправлення форми" : "Подати заяву"}
              >
                <span>{isSubmitting ? "Відправлення..." : (Object.values(dataLoading).some(Boolean) ? "Завантаження даних..." : "Подати заяву")}</span>
                {!isSubmitting && !Object.values(dataLoading).some(Boolean) && <CheckIcon className={styles.buttonIcon} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccommodationApplicationPage;