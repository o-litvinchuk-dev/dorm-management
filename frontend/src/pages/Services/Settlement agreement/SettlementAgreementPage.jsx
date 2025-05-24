import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import Navbar from "../../../components/UI/Navbar/Navbar";
import Sidebar from "../../../components/UI/Sidebar/Sidebar";
import styles from "./styles/SettlementAgreementPage.module.css";
import { settlementAgreementFullSchema, validateForm } from "./validationSchemas";
import { formatErrorMessage, scrollToErrorFieldFixed as scrollToErrorField } from "./helpers";
import { useUser } from "../../../contexts/UserContext";
import api from "../../../utils/api";
import { ToastService } from "../../../utils/toastConfig";
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

const SECRET_KEY = import.meta.env.VITE_SETTLEMENT_ENCRYPTION_KEY || "fallback_strong_key_if_env_is_not_set_!@#$";

const defaultInventory = [
    { name: "Ліжко", quantity: "", note: "" }, { name: "Матрац", quantity: "", note: "" },
    { name: "Подушка", quantity: "", note: "" }, { name: "Ковдра", quantity: "", note: "" },
    { name: "Стільці", quantity: "", note: "" }, { name: "Стіл", quantity: "", note: "" },
    { name: "Шафа", quantity: "", note: "" }, { name: "Тумбочка", quantity: "", note: "" },
    { name: "Лампа", quantity: "", note: "" }, { name: "Вішалка", quantity: "", note: "" },
    { name: "Дзеркало", quantity: "", note: "" }, { name: "Поличка", quantity: "", note: "" },
    { name: "Килимок", quantity: "", note: "" }, { name: "Штори", quantity: "", note: "" },
    { name: "", quantity: "", note: "" }, { name: "", quantity: "", note: "" },
];

const defaultElectricalAppliances = Array(7).fill({ name: "", brand: "", year: "", quantity: "", note: "" });
if (defaultElectricalAppliances.length > 0) {
    defaultElectricalAppliances[0].name = "Холодильник";
}

const defaultPremisesConditions = [
    { description: "Стіни, підлога, стеля (штукатурка, побілка, фарбування, тощо)", condition: "" },
    { description: "Двері і вікна (фарбування, замки)", condition: "" },
    { description: "Електромережа (стан проводки, розеток, вимикачів)", condition: "" },
    { description: "Сантехнічне обладнання", condition: "" },
    { description: "", condition: "" },
    { description: "", condition: "" },
];

const encryptSensitiveData = (data) => {
    if (data === null || data === undefined || String(data).trim() === "") return "";
    try {
        return CryptoJS.AES.encrypt(String(data), SECRET_KEY).toString();
    } catch (error) {
        console.error("Encryption error:", error);
        ToastService.error("Помилка шифрування даних");
        return "";
    }
};

const SettlementAgreementPage = () => {
    const { user, isLoading: userIsLoading } = useUser();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const saved = localStorage.getItem("sidebarOpen");
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [currentSpread, setCurrentSpread] = useState(0);

    const getInitialFormData = useCallback(() => {
        const today = new Date();
        const currentYearShort = String(today.getFullYear()).slice(-2);
        const currentDay = String(today.getDate()).padStart(2, '0');
        const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

        const defaultData = {
            contractDay: currentDay, contractMonth: currentMonth, contractYear: currentYearShort,
            proxyNumber: "", proxyDay: currentDay, proxyMonth: currentMonth, proxyYear: currentYearShort,
            course: user?.course || "",
            faculty: user?.faculty_id ? String(user.faculty_id) : "",
            group: user?.group_id ? String(user.group_id) : "",
            fullName: user?.name || "",
            passportSeries: "", passportNumber: "", passportIssued: "",
            taxId: Array(10).fill(""),
            dormStreet: "", dormBuilding: "",
            dormNumber: user?.dormitory_id ? String(user.dormitory_id) : "",
            roomNumber: user?.room || "",
            startDay: "", startMonth: "", startYear: "",
            endDay: "", endMonth: "", endYear: "",
            academicYearStart: "", academicYearEnd: "", // Додано для пресетів
            applicationDateDay: currentDay, applicationDateMonth: currentMonth, applicationDateYear: currentYearShort, // Додано для пресетів і форми
            residentFullName: user?.name || "",
            residentRegion: "", residentDistrict: "", residentCity: "", residentPostalCode: "",
            residentPhone: user?.phone?.replace("+380", "") || "",
            motherPhone: "", fatherPhone: "", parentFullName: "",
            day: currentDay, month: currentMonth, year: currentYearShort,
            address: "",
            dormManagerName: "",
            residentName: user?.name || "",
            inventory: JSON.parse(JSON.stringify(defaultInventory)),
            premisesConditions: JSON.parse(JSON.stringify(defaultPremisesConditions)),
            electricalAppliances: JSON.parse(JSON.stringify(defaultElectricalAppliances)),
            premisesNumber: user?.room || "",
            premisesArea: "",
            dormManagerNameSignature: "", residentNameSignature: "",
            dataProcessingConsent: false, contractTermsConsent: false, dataAccuracyConsent: false,
        };

        const savedData = localStorage.getItem("settlementAgreementFormData");
        if (savedData) {
            try {
                const parsedSavedData = JSON.parse(savedData);
                const mergedData = {
                    ...defaultData,
                    ...parsedSavedData,
                    course: user?.course || parsedSavedData.course || "",
                    group: user?.group_id ? String(user.group_id) : (parsedSavedData.group || ""),
                    faculty: user?.faculty_id ? String(user.faculty_id) : (parsedSavedData.faculty || ""),
                    fullName: user?.name || parsedSavedData.fullName || "",
                    residentFullName: user?.name || parsedSavedData.residentFullName || "",
                    residentPhone: user?.phone?.replace("+380", "") || parsedSavedData.residentPhone || "",
                    residentName: user?.name || parsedSavedData.residentName || "",
                    dormNumber: user?.dormitory_id ? String(user.dormitory_id) : (parsedSavedData.dormNumber || ""),
                    roomNumber: user?.room || parsedSavedData.roomNumber || "",
                    premisesNumber: user?.room || parsedSavedData.premisesNumber || "",
                    inventory: Array.isArray(parsedSavedData.inventory) && parsedSavedData.inventory.length === defaultInventory.length ? parsedSavedData.inventory : JSON.parse(JSON.stringify(defaultInventory)),
                    premisesConditions: Array.isArray(parsedSavedData.premisesConditions) && parsedSavedData.premisesConditions.length === defaultPremisesConditions.length ? parsedSavedData.premisesConditions : JSON.parse(JSON.stringify(defaultPremisesConditions)),
                    electricalAppliances: Array.isArray(parsedSavedData.electricalAppliances) && parsedSavedData.electricalAppliances.length === defaultElectricalAppliances.length ? parsedSavedData.electricalAppliances : JSON.parse(JSON.stringify(defaultElectricalAppliances)),
                    taxId: Array.isArray(parsedSavedData.taxId) && parsedSavedData.taxId.length === 10 ? parsedSavedData.taxId : Array(10).fill(""),
                };

                Object.keys(defaultData).forEach(key => {
                    if (mergedData[key] === undefined) {
                        mergedData[key] = defaultData[key];
                    }
                });
                return mergedData;
            } catch (e) {
                console.error("Error parsing saved form data, returning default.", e);
                localStorage.removeItem("settlementAgreementFormData");
                return defaultData;
            }
        }
        return defaultData;
    }, [user]);

    const [formData, setFormData] = useState(getInitialFormData);
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
        faculties: false,
        groups: false,
        dormitories: false,
        preset: false,
    });

    const inputRefs = useRef({});
    const taxIdRefs = useRef(Array(10).fill(null).map(() => React.createRef()));
    const navigate = useNavigate();

    useEffect(() => {
        if (!userIsLoading) {
            setFormData(getInitialFormData());
        }
    }, [user, userIsLoading, getInitialFormData]);

    const calculateProgress = useCallback(() => {
        const requiredFields = [
            "faculty", "group", "course", "fullName", "residentPhone", "dormNumber",
            "startDay", "startMonth", "startYear", "endDay", "endMonth", "endYear",
            "applicationDateDay", "applicationDateMonth", "applicationDateYear",
            "contractDay", "contractMonth", "contractYear", "proxyNumber", "proxyDay", "proxyMonth", "proxyYear",
            "passportSeries", "passportNumber", "passportIssued",
            "taxId",
            "dormStreet", "dormBuilding",
            "residentFullName", "residentRegion", "residentDistrict", "residentCity", "residentPostalCode",
            "motherPhone",
            "parentFullName",
            "day", "month", "year",
            "address",
            "dormManagerName", "residentName",
            "premisesNumber", "premisesArea",
            "dataProcessingConsent", "contractTermsConsent", "dataAccuracyConsent"
        ];

        let filledRequired = 0;
        const totalBaseRequired = requiredFields.length;
        let totalDynamicRequired = 0;

        requiredFields.forEach(field => {
            if (field === "taxId") {
                if (formData.taxId.every(digit => digit && digit.trim() !== "")) filledRequired++;
            } else if (field === "motherPhone") {
                if ((formData.motherPhone && formData.motherPhone.trim() !== "") || (formData.fatherPhone && formData.fatherPhone.trim() !== "")) {
                    filledRequired++;
                }
            } else {
                const value = formData[field];
                if (value !== "" && value !== undefined && value !== null) filledRequired++;
            }
        });

        defaultInventory.forEach(itemSchema => {
            if (itemSchema.name) totalDynamicRequired += 1;
        });
        formData.inventory.forEach((item, index) => {
            if (defaultInventory[index].name) {
                if (item.quantity && String(item.quantity).trim() !== "") filledRequired++;
            } else if (item.name && item.name.trim() !== "") {
                 totalDynamicRequired += 1;
                 if (item.quantity && String(item.quantity).trim() !== "") filledRequired++; else totalDynamicRequired++;
            }
        });

        defaultPremisesConditions.forEach((itemSchema, index) => {
             if (index < 4 || (itemSchema.description && itemSchema.description.trim() !== "")) {
                totalDynamicRequired += 1;
                if (formData.premisesConditions[index]?.condition && formData.premisesConditions[index].condition.trim() !== "") filledRequired++;
             } else if (index >= 4 && formData.premisesConditions[index]?.description && formData.premisesConditions[index].description.trim() !== "") {
                totalDynamicRequired += 1;
                if (formData.premisesConditions[index]?.condition && formData.premisesConditions[index].condition.trim() !== "") filledRequired++;
             }
        });


        defaultElectricalAppliances.forEach((itemSchema, index) => {
            if (index === 0 || (itemSchema.name && itemSchema.name.trim() !== "")) {
                totalDynamicRequired += 3;
                if (formData.electricalAppliances[index]?.brand && formData.electricalAppliances[index].brand.trim() !== "") filledRequired++;
                if (formData.electricalAppliances[index]?.year && String(formData.electricalAppliances[index].year).trim() !== "") filledRequired++;
                if (formData.electricalAppliances[index]?.quantity && String(formData.electricalAppliances[index].quantity).trim() !== "") filledRequired++;
            } else if (formData.electricalAppliances[index]?.name && formData.electricalAppliances[index].name.trim() !== "") {
                totalDynamicRequired += 3;
                if (formData.electricalAppliances[index]?.brand && formData.electricalAppliances[index].brand.trim() !== "") filledRequired++;
                if (formData.electricalAppliances[index]?.year && String(formData.electricalAppliances[index].year).trim() !== "") filledRequired++;
                if (formData.electricalAppliances[index]?.quantity && String(formData.electricalAppliances[index].quantity).trim() !== "") filledRequired++;
            }
        });


        const totalRequired = totalBaseRequired + totalDynamicRequired;
        setProgress(totalRequired === 0 ? 0 : Math.min(100, (filledRequired / totalRequired) * 100));
    }, [formData]);


    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
        calculateProgress();
    }, [isSidebarExpanded, formData, calculateProgress]);

    useEffect(() => {
        localStorage.setItem("settlementAgreementFormData", JSON.stringify(formData));
        calculateProgress();
    }, [formData, calculateProgress]);


    useEffect(() => {
        if (showErrors && Object.keys(errors).length > 0) {
            const errorFields = getAllErrorFields(errors);
            if (errorFields.length > 0 && currentErrorIndex < errorFields.length && errorFields[currentErrorIndex]) {
                scrollToErrorField(errorFields[currentErrorIndex], inputRefs.current, taxIdRefs.current);
                const pageIndex = getPageIndexForField(errorFields[currentErrorIndex], currentSpread);
                if (pageIndex !== -1 && Math.floor(pageIndex / 2) !== currentSpread) {
                    setCurrentSpread(Math.floor(pageIndex / 2));
                }
            }
        }
    }, [currentErrorIndex, errors, showErrors, currentSpread]);

    useEffect(() => {
        const fetchInitialDropdownData = async () => {
            setDataLoading(prev => ({ ...prev, faculties: true, dormitories: true }));
            try {
                const [facultiesRes, dormitoriesRes] = await Promise.all([
                    api.get("/faculties").catch(e => { console.error("Error fetching faculties:", e); return { data: [] }; }),
                    api.get("/dormitories").catch(e => { console.error("Error fetching dormitories:", e); return { data: [] }; })
                ]);
                setAllFaculties(facultiesRes.data || []);
                setAllDormitories(dormitoriesRes.data || []);
            } catch (error) {
                ToastService.error("Не вдалося завантажити дані для форми.");
            } finally {
                setDataLoading(prev => ({ ...prev, faculties: false, dormitories: false }));
            }
        };
        if (!userIsLoading) {
            fetchInitialDropdownData();
        }
    }, [userIsLoading]);

    useEffect(() => {
        if (formData.faculty && allFaculties.length > 0) {
            const fetchGroups = async () => {
                setDataLoading(prev => ({ ...prev, groups: true }));
                try {
                    const response = await api.get(`/faculties/${formData.faculty}/groups`);
                    const fetchedGroups = response.data || [];
                    setGroupsForFaculty(fetchedGroups);

                    const currentGroupExistsInNewList = fetchedGroups.some(g => String(g.id) === String(formData.group));
                    if (formData.group && !currentGroupExistsInNewList) {
                        setFormData(prev => ({ ...prev, group: "", course: "" }));
                    } else if (formData.group && currentGroupExistsInNewList) {
                        const selectedGroup = fetchedGroups.find(g => String(g.id) === String(formData.group));
                        if (selectedGroup && String(selectedGroup.course) !== String(formData.course)) {
                            setFormData(prev => ({ ...prev, course: String(selectedGroup.course) }));
                        }
                    }
                } catch (error) {
                    ToastService.error("Не вдалося завантажити групи для обраного факультету.");
                    setGroupsForFaculty([]);
                    setFormData(prev => ({ ...prev, group: "", course: "" }));
                } finally {
                    setDataLoading(prev => ({ ...prev, groups: false }));
                }
            };
            fetchGroups();
        } else if (!formData.faculty) {
            setGroupsForFaculty([]);
            if (formData.group || formData.course) {
                setFormData(prev => ({ ...prev, group: "", course: "" }));
            }
        }
    }, [formData.faculty, allFaculties, formData.group, formData.course]);

    const getAcademicYearString = (startYear) => {
        if (!startYear || isNaN(parseInt(startYear))) return "";
        return `${startYear}-${parseInt(startYear) + 1}`;
    };

    const calculateRelevantAcademicYears = useCallback(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const currentAcademicYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;
        return [
            getAcademicYearString(currentAcademicYearStart),
            getAcademicYearString(currentAcademicYearStart + 1)
        ].filter(Boolean);
    }, []);

    useEffect(() => {
        const fetchPresetForSpecificYear = async (dormId, academicYearQuery) => {
            if (!dormId || !academicYearQuery) return null;
            setDataLoading(prev => ({ ...prev, preset: true }));
            try {
                const response = await api.get(`/application-presets/dormitory/${dormId}?academic_year=${academicYearQuery}`);
                return response.data;
            } catch (error) {
                console.warn(`[Preset Fetch] Error for dorm ${dormId}, year ${academicYearQuery}:`, error.response?.status);
                return null;
            } finally {
                setDataLoading(prev => ({ ...prev, preset: false }));
            }
        };

        const loadDormPreset = async () => {
            if (!formData.dormNumber || !allDormitories.length) {
                setSelectedPreset(null);
                setFormData(prev => ({ ...prev, dormStreet: "", dormBuilding: "", address: "", startDay: "", startMonth: "", startYear: "", endDay: "", endMonth: "", endYear: "", academicYearStart: "", academicYearEnd: "" }));
                return;
            }

            let foundPreset = null;
            const formAcademicYear = (formData.academicYearStart && String(formData.academicYearStart).length === 4)
                ? `${formData.academicYearStart}-${parseInt(formData.academicYearStart, 10) + 1}`
                : null;

            if (formAcademicYear) {
                foundPreset = await fetchPresetForSpecificYear(formData.dormNumber, formAcademicYear);
            }

            if (!foundPreset) {
                const relevantYears = calculateRelevantAcademicYears();
                for (const year of relevantYears) {
                    foundPreset = await fetchPresetForSpecificYear(formData.dormNumber, year);
                    if (foundPreset) break;
                }
            }

            setSelectedPreset(foundPreset);

            if (!foundPreset) {
                const selectedDorm = allDormitories.find(d => String(d.id) === String(formData.dormNumber));
                if (selectedDorm) { // Тільки якщо гуртожиток обрано
                    ToastService.info(`Для гуртожитку №${selectedDorm?.name || formData.dormNumber} не знайдено активних налаштувань дат. Дані потрібно ввести вручну.`);
                }
                setFormData(prev => ({
                    ...prev,
                    dormStreet: selectedDorm?.address?.split(',')[0]?.trim() || "",
                    dormBuilding: selectedDorm?.address?.split(',')[1]?.trim() || "",
                    address: selectedDorm?.address || "",
                    startDay: "", startMonth: "", startYear: "",
                    endDay: "", endMonth: "", endYear: "",
                    academicYearStart: prev.academicYearStart, // Зберігаємо, якщо користувач ввів
                    academicYearEnd: prev.academicYearEnd, // Зберігаємо, якщо користувач ввів
                }));
            }
        };

        if (allDormitories.length > 0) {
            loadDormPreset();
        }
    }, [formData.dormNumber, formData.academicYearStart, formData.academicYearEnd, allDormitories, calculateRelevantAcademicYears]);

    useEffect(() => {
        if (selectedPreset) {
            ToastService.info("Дані дат та адреси заповнено з налаштувань гуртожитку.");
            const updates = {};

            const parseAndSetDate = (dateString, dayField, monthField, yearField) => {
                if (dateString && dateString !== "0000-00-00") {
                    const dateObj = new Date(dateString);
                    if (!isNaN(dateObj.getTime())) {
                        updates[dayField] = String(dateObj.getUTCDate()).padStart(2, '0');
                        updates[monthField] = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                        updates[yearField] = String(dateObj.getUTCFullYear()).slice(-2);
                    } else {
                        updates[dayField] = ""; updates[monthField] = ""; updates[yearField] = "";
                    }
                } else {
                    updates[dayField] = ""; updates[monthField] = ""; updates[yearField] = "";
                }
            };

            if (selectedPreset.academic_year) {
                const [pStart, pEnd] = selectedPreset.academic_year.split('-');
                if (pStart && pEnd) {
                    updates.academicYearStart = pStart;
                    updates.academicYearEnd = pEnd;
                }
            }

            parseAndSetDate(selectedPreset.start_date, 'startDay', 'startMonth', 'startYear');
            parseAndSetDate(selectedPreset.end_date, 'endDay', 'endMonth', 'endYear');

            const dormDetails = allDormitories.find(d => String(d.id) === String(selectedPreset.dormitory_id));
            if (dormDetails && dormDetails.address) {
                const addressParts = dormDetails.address.split(',');
                updates.dormStreet = addressParts[0]?.trim() || "";
                updates.dormBuilding = addressParts[1]?.trim() || "";
                updates.address = dormDetails.address;
            }

            if (selectedPreset.application_date && selectedPreset.application_date !== "0000-00-00") {
                 parseAndSetDate(selectedPreset.application_date, 'applicationDateDay', 'applicationDateMonth', 'applicationDateYear');
            } else if (!formData.applicationDateDay && !formData.applicationDateMonth && !formData.applicationDateYear) {
                const today = new Date();
                updates.applicationDateDay = String(today.getDate()).padStart(2, '0');
                updates.applicationDateMonth = String(today.getMonth() + 1).padStart(2, '0');
                updates.applicationDateYear = String(today.getFullYear()).slice(-2);
            }


            if (Object.keys(updates).length > 0) {
                setFormData(prev => ({ ...prev, ...updates }));
            }
        }
    }, [selectedPreset, allDormitories]);

    const handleChange = (e, fieldNameFromArgs, index, subField) => {
        const { name, value, type, checked } = e.target;
        const field = fieldNameFromArgs || name;

        setFormData((prev) => {
            let updatedData = { ...prev };
            let valToSet = type === 'checkbox' ? checked : value;

            if (field.includes("premisesConditions") && index !== undefined && subField !== undefined) {
                const newConditions = [...prev.premisesConditions];
                const currentCondition = { ...(newConditions[index] || {description: "", condition: ""}) };
                currentCondition[subField] = valToSet;
                if (subField === "description" && index >= 4 && !valToSet.trim()) {
                    currentCondition.condition = "";
                }
                newConditions[index] = currentCondition;
                updatedData.premisesConditions = newConditions;
            } else if (index !== undefined && subField !== undefined && prev[field.split('[')[0]]) {
                const arrayName = field.split('[')[0];
                const updatedArray = [...prev[arrayName]];
                if (updatedArray[index]) {
                    if (subField === "year" && arrayName === "electricalAppliances") {
                        valToSet = valToSet.replace(/\D/g, "").slice(0, 4);
                    } else if (subField === "quantity") {
                        valToSet = valToSet.replace(/\D/g, "");
                    }
                    updatedArray[index] = { ...updatedArray[index], [subField]: valToSet };
                    updatedData[arrayName] = updatedArray;
                }
            } else {
                const fullNameFields = ["fullName", "residentFullName", "parentFullName", "dormManagerName", "residentName", "mechanizatorReceivedName", "mechanizatorCalledName"];
                if (fullNameFields.includes(field)) {
                    valToSet = valToSet
                        .replace(/[^А-Яа-яІіЇїЄєҐґ'\s-]/g, "")
                        .replace(/\s+/g, " ")
                        .replace(/(^|\s|-|')[а-яіїєґё]/g, (match) => match.toUpperCase())
                        .trimStart();
                } else if (["contractYear", "proxyYear", "startYear", "endYear", "year", "academicYearStart", "academicYearEnd"].includes(field)) {
                    valToSet = valToSet.replace(/\D/g, "").slice(0, field.includes("academic") ? 4 : 2);
                } else if (["residentPhone", "motherPhone", "fatherPhone"].includes(field)) {
                    valToSet = valToSet.replace(/\D/g, "").slice(0, 9);
                } else if (field === "course" && !prev.group) {
                    const numValue = parseInt(valToSet, 10);
                    valToSet = valToSet === "" || (!isNaN(numValue) && numValue >= 1 && numValue <= 6) ? valToSet : prev[field];
                } else if (["dormNumber", "roomNumber", "residentPostalCode", "passportNumber", "contractDay", "proxyDay", "startDay", "endDay", "day", "contractMonth", "proxyMonth", "startMonth", "endMonth", "month", "proxyNumber", "premisesNumber"].includes(field)) {
                    valToSet = valToSet.replace(/\D/g, "");
                    if(field === "residentPostalCode") valToSet = valToSet.slice(0,5);
                } else if (field === "premisesArea") {
                    valToSet = valToSet.replace(/[^\d.,]/g, "").replace(",", ".").replace(/(\.\d{2})\d+$/, '$1').replace(/^0+(\d)/, '$1');
                } else if (field === "passportSeries") {
                    valToSet = valToSet.replace(/[^А-ЯІЇЄҐа-яіїєґ]/g, "").slice(0, 2).toUpperCase();
                }

                updatedData[field] = valToSet;

                if (field === "faculty") {
                    updatedData.group = "";
                    updatedData.course = "";
                }
                if (field === "group" && groupsForFaculty.length > 0) {
                    const selectedGroup = groupsForFaculty.find(g => String(g.id) === String(valToSet));
                    updatedData.course = selectedGroup ? String(selectedGroup.course) : "";
                }
                if (field === "dormNumber") {
                    updatedData.dormStreet = "";
                    updatedData.dormBuilding = "";
                    updatedData.address = "";
                    updatedData.academicYearStart = ""; // Скидаємо рік при зміні гуртожитку, щоб перезавантажити пресет
                    updatedData.academicYearEnd = "";
                }
            }
            return updatedData;
        });
    };

    const handleTaxIdChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(0, 1);
        setFormData((prev) => ({
            ...prev,
            taxId: prev.taxId.map((d, i) => (i === index ? digit : d)),
        }));
        if (digit.length === 1 && index < 9 && taxIdRefs.current[index + 1]?.current) {
            setTimeout(() => taxIdRefs.current[index + 1].current.focus(), 0);
        }
    };

    const handleTaxIdKeyDown = (index, e) => {
        const currentValue = formData.taxId[index];
        if (e.key === "Backspace" && !currentValue && index > 0 && taxIdRefs.current[index - 1]?.current) {
            taxIdRefs.current[index - 1].current.focus();
            e.preventDefault();
        } else if (e.key === "ArrowRight" && index < 9 && taxIdRefs.current[index + 1]?.current) {
            taxIdRefs.current[index + 1].current.focus();
            e.preventDefault();
        } else if (e.key === "ArrowLeft" && index > 0 && taxIdRefs.current[index - 1]?.current) {
            taxIdRefs.current[index - 1].current.focus();
            e.preventDefault();
        } else if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey) {
            e.preventDefault();
            if (index < 9 && taxIdRefs.current[index + 1]?.current) {
                taxIdRefs.current[index + 1].current.focus();
            } else {
                inputRefs.current["dormStreet"]?.focus();
            }
        } else if (e.key === "Tab" && e.shiftKey) {
            e.preventDefault();
            if (index > 0 && taxIdRefs.current[index - 1]?.current) {
                taxIdRefs.current[index - 1].current.focus();
            } else {
                inputRefs.current["passportIssued"]?.focus();
            }
        }
    };

    const handleFocus = (fieldName) => {
        const element = inputRefs.current[fieldName] || (fieldName.startsWith("taxId") && taxIdRefs.current[parseInt(fieldName.match(/\d+/)[0])]?.current);
        if (element && typeof element.classList?.add === 'function') {
            element.classList.add(styles.focusedInput);
        }
    };

    const handleBlur = (fieldName) => {
        const element = inputRefs.current[fieldName] || (fieldName.startsWith("taxId") && taxIdRefs.current[parseInt(fieldName.match(/\d+/)[0])]?.current);
        if (element && typeof element.classList?.remove === 'function') {
            element.classList.remove(styles.focusedInput);
        }
    };

    const handleInputKeyDown = (e, currentField, nextField, prevField) => {
        if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
            if (nextField && inputRefs.current[nextField]) {
                inputRefs.current[nextField]?.focus();
                e.preventDefault();
            } else if (nextField && nextField.startsWith("taxId[")) {
                const taxIdIndex = parseInt(nextField.match(/\[(\d+)\]/)[1], 10);
                if (taxIdRefs.current[taxIdIndex]?.current) taxIdRefs.current[taxIdIndex].current.focus();
                e.preventDefault();
            }
        } else if (e.key === "Tab" && e.shiftKey) {
            if (prevField && inputRefs.current[prevField]) {
                inputRefs.current[prevField]?.focus();
                e.preventDefault();
            } else if (prevField && prevField.startsWith("taxId[")) {
                const taxIdIndex = parseInt(prevField.match(/\[(\d+)\]/)[1], 10);
                if (taxIdRefs.current[taxIdIndex]?.current) taxIdRefs.current[taxIdIndex].current.focus();
                e.preventDefault();
            }
        }
    };

    const handleDateKeyDown = (e, currentField, nextField, prevField) => {
        const currentValue = formData[currentField] || "";
        if (e.key === "ArrowRight" && currentValue.length >= 2) {
            if (inputRefs.current[nextField]) inputRefs.current[nextField]?.focus();
        } else if (e.key === "ArrowLeft" && currentValue.length === 0) {
            if (inputRefs.current[prevField]) inputRefs.current[prevField]?.focus();
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


    const getAllErrorFields = (errorsObj) => {
        const fields = [];
        function extractPaths(obj, prefix = '') {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const newPrefix = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'string') {
                        fields.push(newPrefix.replace(/\.\[/g, '['));
                    } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        if (obj[key].message && typeof obj[key].message === 'string') {
                            fields.push(newPrefix.replace(/\.\[/g, '['));
                        } else {
                            extractPaths(obj[key], newPrefix);
                        }
                    } else if (Array.isArray(obj[key])) {
                        obj[key].forEach((item, index) => {
                            const arrayElementPrefix = `${newPrefix}[${index}]`;
                            if (typeof item === 'string') {
                                fields.push(arrayElementPrefix);
                            } else if (typeof item === 'object' && item !== null) {
                                if (item.message && typeof item.message === 'string') {
                                    fields.push(arrayElementPrefix);
                                } else {
                                    extractPaths(item, arrayElementPrefix);
                                }
                            }
                        });
                    }
                }
            }
        }
        extractPaths(errorsObj);
        return [...new Set(fields.map(f => f.replace(/\.(\d+)(?=\[|\.|$)/g, '[$1]')))];
    };


    const getNestedError = (errorsObj, path) => {
        const pathParts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
        let current = errorsObj;
        for (const part of pathParts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return undefined;
            }
        }
        if (typeof current === 'string') return current;
        if (typeof current === 'object' && current !== null && current.message && typeof current.message === 'string') return current.message;
        if (typeof current === 'object' && current !== null) {
            for (const key in current) {
                if (typeof current[key] === 'string') return current[key];
            }
        }
        return undefined;
    };


    const handleSubmit = async () => {
        setIsSubmitting(true);
        const validationData = { ...formData };

        const currentFullYear = new Date().getFullYear();
        const currentCentury = Math.floor(currentFullYear / 100) * 100;

        ['contractYear', 'proxyYear', 'startYear', 'endYear', 'year'].forEach(field => {
            if (validationData[field] && String(validationData[field]).length === 2) {
                let yearInt = parseInt(validationData[field], 10);
                validationData[field] = String(currentCentury + yearInt);
            }
        });

        if(validationData.residentPhone && validationData.residentPhone.length === 9 && !validationData.residentPhone.startsWith('+380')) {
            validationData.residentPhone = '+380' + validationData.residentPhone;
        }
        if(validationData.motherPhone && validationData.motherPhone.length === 9 && !validationData.motherPhone.startsWith('+380')) {
            validationData.motherPhone = '+380' + validationData.motherPhone;
        }
        if(validationData.fatherPhone && validationData.fatherPhone.length === 9 && !validationData.fatherPhone.startsWith('+380')) {
            validationData.fatherPhone = '+380' + validationData.fatherPhone;
        }


        const { isValid, errors: validationErrors } = await validateForm(validationData, settlementAgreementFullSchema);
        setErrors(validationErrors);

        if (!isValid) {
            const errorFields = getAllErrorFields(validationErrors);
            if (errorFields.length > 0) {
                setCurrentErrorIndex(0);
            }
            setShowErrors(true);
            setIsSubmitting(false);
            ToastService.error("Будь ласка, виправте помилки у формі.");
            return;
        }
        setShowErrors(false);

        try {
            const dataToSend = { ...formData };
            const facultyObj = allFaculties.find(f => String(f.id) === String(dataToSend.faculty));
            dataToSend.faculty_name = facultyObj ? facultyObj.name : dataToSend.faculty;
            const groupObj = groupsForFaculty.find(g => String(g.id) === String(dataToSend.group));
            dataToSend.group_name = groupObj ? groupObj.name : dataToSend.group;


            await api.post("/services/settlement-agreement", dataToSend);
            ToastService.success("Договір успішно подано!");
            localStorage.removeItem("settlementAgreementFormData");
            setFormData(getInitialFormData());
            setCurrentSpread(0);
            setIsSubmitting(false);
            navigate("/dashboard");
        } catch (error) {
            console.error("Помилка при подачі договору:", error);
            ToastService.handleApiError(error);
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
            handleDateKeyDown,
            allFaculties,
            groupsForFaculty,
            allDormitories,
            dataLoading,
            isPresetActive: !!selectedPreset,
            selectedPreset
        };

        const pageComponents = [
            Page1Content, Page2Content, Page3Content, Page4Content, Page5Content,
            Page6Content, Page7Content, Page8Content, Page9Content, Page10Content,
            Page11Content, Page12Content, Page13Content, Page14Content,
        ];
        const PageComponent = pageComponents[pageIndex];
        return PageComponent ? <PageComponent {...pageProps} /> : <p>Сторінка {pageIndex + 1} не завантажена.</p>;
    };

    const allPagesCount = 14;
    const totalSpreads = Math.ceil(allPagesCount / 2);

    const spreadContent = () => {
        const leftPageIndex = currentSpread * 2;
        const rightPageIndex = leftPageIndex + 1;

        return (
            <>
                <div className={styles.pageLeft}>{renderPageContent(leftPageIndex)}</div>
                {rightPageIndex < allPagesCount && (
                    <div className={styles.pageRight}>{renderPageContent(rightPageIndex)}</div>
                )}
                {rightPageIndex >= allPagesCount && <div className={styles.pageRight}></div>}
            </>
        );
    };

    const errorKeys = getAllErrorFields(errors);

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
                            <h3>Помилки у формі ({errorKeys.length}):</h3>
                            <div className={styles.errorContainer}>
                                {errorKeys.map((key, index) => (
                                    <p
                                        key={key}
                                        className={`${styles.errorItem} ${index === currentErrorIndex ? styles.activeError : ""}`}
                                        onClick={() => setCurrentErrorIndex(index) }
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === "Enter") setCurrentErrorIndex(index); }}
                                    >
                                        {formatErrorMessage(key)}: {getNestedError(errors, key) || "Невідома помилка валідації"}
                                    </p>
                                ))}
                            </div>
                            {errorKeys.length > 1 && (
                                <button
                                    className={styles.nextErrorButton}
                                    onClick={() => setCurrentErrorIndex((prev) => (prev + 1) % errorKeys.length)}
                                >
                                    Наступна помилка ({currentErrorIndex + 1}/{errorKeys.length})
                                </button>
                            )}
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
                                    disabled={isSubmitting || userIsLoading || dataLoading.faculties || dataLoading.groups || dataLoading.dormitories || dataLoading.preset}
                                    aria-label={isSubmitting || userIsLoading ? "Обробка форми" : "Подати Договір"}
                                >
                                    <span>{isSubmitting || userIsLoading || dataLoading.faculties || dataLoading.groups || dataLoading.dormitories || dataLoading.preset ? "Обробка..." : "Подати Договір"}</span>
                                    {!(isSubmitting || userIsLoading || dataLoading.faculties || dataLoading.groups || dataLoading.dormitories || dataLoading.preset) && <CheckIcon className={styles.buttonIcon} />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const getPageIndexForField = (fieldName, currentSpreadForContext) => {
    const pageFieldMap = {
        contractDay: 0, contractMonth: 0, contractYear: 0,
        proxyNumber: 0, proxyDay: 0, proxyMonth: 0, proxyYear: 0,
        course: 0, group: 0, faculty: 0, fullName: 0,
        passportSeries: 0, passportNumber: 0, passportIssued: 0,
        taxId: 0,
        dormStreet: 0, dormBuilding: 0,
        dormNumber: 0,
        roomNumber: 0,
        startDay: 0, startMonth: 0, startYear: 0,
        endDay: 0,
        endMonth: 0,
        endYear: 0,
        residentFullName: 9, residentRegion: 9, residentDistrict: 9, residentCity: 9, residentPostalCode: 9, residentPhone: 9,
        motherPhone: 9, fatherPhone: 9, parentFullName: 9, atLeastOneParentPhone: 9,
        day: 10, month: 10, year: 10,
        address: 10,
        inventory: 10,
        dormManagerName: 10,
        residentName: 10,
        premisesNumber: 11, premisesArea: 11,
        premisesConditions: 11,
        electricalAppliances: 12,
        dataProcessingConsent: 13, contractTermsConsent: 13, dataAccuracyConsent: 13,
    };

    const baseFieldName = fieldName.split('[')[0];
    let pageIndex = pageFieldMap[baseFieldName];

    if (pageIndex === undefined) {
        console.warn(`[getPageIndexForField] Field mapping not found for base: ${baseFieldName}. Defaulting to page 0.`);
        return 0;
    }

    if (baseFieldName === "endDay" || baseFieldName === "endMonth" || baseFieldName === "endYear") {
        const currentLeftPage = currentSpreadForContext * 2;
        const currentRightPage = currentLeftPage + 1;
        if (currentLeftPage === 7 || currentRightPage === 7) return 7;
        return 0;
    }

    if (baseFieldName === "day" || baseFieldName === "month" || baseFieldName === "year") {
        const currentLeftPage = currentSpreadForContext * 2;
        if (currentLeftPage === 10 || (currentSpreadForContext * 2 + 1) === 10 ) return 10;
        if (currentLeftPage === 11 || (currentSpreadForContext * 2 + 1) === 11 ) return 11;
        if (currentLeftPage === 12 || (currentSpreadForContext * 2 + 1) === 12 ) return 12;
        return pageFieldMap[baseFieldName] || 0;
    }

    if (baseFieldName === "dormManagerName" || baseFieldName === "residentName") {
        const currentLeftPage = currentSpreadForContext * 2;
        const currentRightPage = currentLeftPage + 1;
        if (currentLeftPage === 10 || currentRightPage === 10) return 10;
        if (currentLeftPage === 11 || currentRightPage === 11) return 11;
        if (currentLeftPage === 13 || currentRightPage === 13) return 13;
    }

    if (baseFieldName === "dormNumber" || baseFieldName === "roomNumber" || baseFieldName === "address"){
        const currentLeftPage = currentSpreadForContext * 2;
        if (currentLeftPage === 10 || currentLeftPage + 1 === 10) return 10;
        if (currentLeftPage === 11 || currentLeftPage + 1 === 11) return 11;
        return 0;
    }
    return Array.isArray(pageIndex) ? pageIndex[0] : pageIndex;
};

const getFieldValue = (obj, path) => {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return undefined;
        }
    }
    return value;
};

const getRequiredFieldsForSchema = (schema, currentFormData) => {
    const fields = [];
    const description = schema.describe();

    function processField(key, fieldSchema, prefix = "") {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        let isRequired = fieldSchema.tests && fieldSchema.tests.some(test => test.name === 'required');

        if (fieldSchema.conditions && fieldSchema.conditions.length > 0) {
            const conditionMet = fieldSchema.conditions.some(cond => {
                if (cond.type === 'when' && cond.references.length > 0) {
                    return cond.references.every(refInfo => {
                        const refFieldKey = typeof refInfo === 'string' ? refInfo : refInfo.key;
                        let refValue;
                        let searchFormData = currentFormData;
                        if (prefix.includes('[') && !refFieldKey.includes('.')) {
                            const parentPath = prefix.substring(0, prefix.lastIndexOf('['));
                            const parentIndexMatch = prefix.match(/\[(\d+)\]$/);
                            if (parentIndexMatch) {
                                const parentIndex = parseInt(parentIndexMatch[1],10);
                                const arrayName = parentPath.split('.').pop();
                                refValue = currentFormData[arrayName]?.[parentIndex]?.[refFieldKey];
                            }
                        } else {
                            refValue = getFieldValue(currentFormData, refFieldKey);
                        }


                        if (cond.options.is && typeof cond.options.is === 'function') {
                            return cond.options.is(refValue);
                        } else if (cond.options.is !== undefined) {
                            if (Array.isArray(cond.options.is)) return cond.options.is.includes(refValue);
                            return refValue === cond.options.is;
                        } else if (cond.options.then && cond.options.then.tests?.some(t => t.name === 'required')) {
                            return true;
                        }
                        return false;
                    });
                }
                return false;
            });

            if (conditionMet && fieldSchema.then?.describe().tests.some(t => t.name === 'required')) {
                isRequired = true;
            } else if (!conditionMet && fieldSchema.otherwise?.describe().tests.some(t => t.name === 'required')) {
                isRequired = true;
            }
        }


        if (isRequired) {
            if (fieldSchema.type === 'array' && fieldSchema.innerType?.fields) {
                const innerFields = fieldSchema.innerType.fields;
                const arrayData = getFieldValue(currentFormData, key.replace(prefix ? prefix + '.' : '', '')) || [];
                const arrayLength = Array.isArray(arrayData) ? arrayData.length : 0;

                for (let i = 0; i < arrayLength; i++) {
                    for (const subKey in innerFields) {
                        processField(subKey, innerFields[subKey], `${fullKey}[${i}]`);
                    }
                }
            } else {
                fields.push(fullKey.replace(/\.(\d+)(?=\[|\.|$)/g, '[$1]'));
            }
        } else if (fieldSchema.type === 'object' && fieldSchema.fields) {
            for (const subKey in fieldSchema.fields) {
                processField(subKey, fieldSchema.fields[subKey], fullKey);
            }
        }
    }

    for (const key in description.fields) {
        processField(key, description.fields[key]);
    }
    return [...new Set(fields)];
};


export default SettlementAgreementPage;