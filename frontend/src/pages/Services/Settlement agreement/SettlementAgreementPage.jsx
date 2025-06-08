// src/pages/Services/Settlement agreement/SettlementAgreementPage.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/UI/Navbar/Navbar";
import Sidebar from "../../../components/UI/Sidebar/Sidebar";
import styles from "./styles/SettlementAgreementPage.module.css";
import { pageSchemas, validateField, validatePages } from "./validationSchemas";
import { formatErrorMessage, scrollToErrorFieldFixed as scrollToErrorField, getNestedError, getAllErrorFields } from "./helpers";
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
import {
    defaultInventory,
    defaultElectricalAppliances,
    defaultPremisesConditions
} from "./settlementConstants";

const SettlementAgreementPage = () => {
    const { user, isLoading: userIsLoading } = useUser();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => JSON.parse(localStorage.getItem("sidebarOpen") || "true"));
    const [currentSpread, setCurrentSpread] = useState(0);

    const getInitialFormData = useCallback(() => {
        return {
            contractDay: "", contractMonth: "", contractYear: "",
            applicationId: "",
            proxyNumber: "", proxyDay: "", proxyMonth: "", proxyYear: "",
            course: "", faculty: "", group: "", fullName: "",
            passportSeries: "", passportNumber: "", passportIssued: "",
            taxId: Array(10).fill(""),
            dormStreet: "", dormBuilding: "", dormNumber: "", roomNumber: "",
            academicYearStart: "", academicYearEnd: "",
            startDay: "", startMonth: "", startYear: "",
            endDay: "", endMonth: "", endYear: "",
            applicationDateDay: "", applicationDateMonth: "", applicationDateYear: "",
            residentFullName: "", residentRegion: "", residentDistrict: "", residentCity: "", residentPostalCode: "",
            residentPhone: "", userProfilePhone: "",
            motherPhone: "", fatherPhone: "", parentFullName: "",
            day_appendix1: "", month_appendix1: "", year_appendix1: "",
            address_appendix1: "", roomNumber_appendix1: "", dormNumber_appendix1: "",
            inventory: JSON.parse(JSON.stringify(defaultInventory)),
            dormManagerName_main: "",
            dormManagerName_appendix1: "", residentName_appendix1: "",
            day_appendix2: "", month_appendix2: "", year_appendix2: "",
            dormNumber_appendix2: "", dormManagerName_appendix2: "", roomNumber_appendix2: "",
            address_appendix2: "", residentName_appendix2: "", residentName_appendix2_sig: "",
            premisesNumber_appendix2: "", premisesArea_appendix2: "",
            premisesConditions: JSON.parse(JSON.stringify(defaultPremisesConditions)),
            day_appendix3: "", month_appendix3: "", year_appendix3: "",
            electricalAppliances: JSON.parse(JSON.stringify(defaultElectricalAppliances)),
            dormManagerName_appendix3: "", residentName_appendix3: "",
            dataProcessingConsent: false, contractTermsConsent: false, dataAccuracyConsent: false,
        };
    }, []);

    const [formData, setFormData] = useState(getInitialFormData);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [currentErrorIndex, setCurrentErrorIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [allFaculties, setAllFaculties] = useState([]);
    const [groupsForFaculty, setGroupsForFaculty] = useState([]);
    const [allDormitories, setAllDormitories] = useState([]);
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [userApprovedApps, setUserApprovedApps] = useState([]);
    const [userReservations, setUserReservations] = useState([]);
    const [dataLoading, setDataLoading] = useState({ dependencies: true, groups: false, preset: false });
    const [autoSelectedRoomInfo, setAutoSelectedRoomInfo] = useState({ number: '', source: '' });

    const inputRefs = useRef({});
    const taxIdRefs = useRef(Array(10).fill(null).map(() => React.createRef()));
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            setDataLoading(prev => ({ ...prev, dependencies: true }));
            try {
                const [facultiesRes, dormsRes, userAppsRes, userReservationsRes] = await Promise.all([
                    api.get("/faculties"),
                    api.get("/dormitories"),
                    api.get("/secure/my-accommodation-applications?limit=100"),
                    api.get("/secure/my-reservations"),
                ]);
                setAllFaculties(facultiesRes.data || []);
                setAllDormitories(dormsRes.data || []);
                setUserApprovedApps((userAppsRes.data?.applications || []).filter(app => app.status === 'approved_by_dorm' || app.status === 'settled'));
                setUserReservations(userReservationsRes.data || []);
            } catch (error) {
                ToastService.error("Не вдалося завантажити початкові дані для форми.");
            } finally {
                setDataLoading(prev => ({ ...prev, dependencies: false }));
            }
        };
        if (user && !userIsLoading) fetchInitialData();
    }, [user, userIsLoading]);

    useEffect(() => {
        if (user) {
            console.log("User phone data:", user.phone);
            setFormData(prev => {
                const updates = {};
                if (!prev.fullName) updates.fullName = user.name || "";
                if (!prev.residentFullName) updates.residentFullName = user.name || "";
                if (!prev.residentName_appendix1) updates.residentName_appendix1 = user.name || "";
                if (!prev.residentName_appendix2) updates.residentName_appendix2 = user.name || "";
                if (!prev.residentName_appendix2_sig) updates.residentName_appendix2_sig = user.name || "";
                if (!prev.residentName_appendix3) updates.residentName_appendix3 = user.name || "";
                if (user.phone && user.phone.trim()) {
                    const rawPhone = String(user.phone).trim();
                    const phoneNumber = rawPhone.replace(/^\+380|\D/g, '').trim();
                    updates.residentPhone = phoneNumber.length === 9 ? phoneNumber : rawPhone || "";
                    if (!updates.residentPhone) {
                        console.warn("Phone number format invalid or empty, using raw value:", rawPhone);
                        ToastService.warning("Номер телефону в профілі має неправильний формат. Будь ласка, перевірте або введіть вручну.");
                    }
                } else {
                    updates.residentPhone = "";
                    console.warn("No phone number found in user profile.");
                    ToastService.warning("Номер телефону в профілі відсутній. Будь ласка, введіть його вручну.");
                }
                if (user.role === 'student' && !prev.faculty && user.faculty_id) updates.faculty = String(user.faculty_id);
                if (user.role === 'student' && !prev.group && user.group_id) updates.group = String(user.group_id);
                const today = new Date();
                const defaultDay = String(today.getDate()).padStart(2, '0');
                const defaultMonth = String(today.getMonth() + 1).padStart(2, '0');
                const defaultYear = String(today.getFullYear()).slice(-2);

                if (!prev.contractDay) updates.contractDay = defaultDay;
                if (!prev.contractMonth) updates.contractMonth = defaultMonth;
                if (!prev.contractYear) updates.contractYear = defaultYear;

                return { ...prev, ...updates };
            });
        }
    }, [user]);

    useEffect(() => {
        const app = userApprovedApps.find(a => String(a.id) === String(formData.applicationId));
        if (!app) return;

        const [startYearFull] = (app.start_date || "----").split('-');
        const [endYearFull] = (app.end_date || "----").split('-');
        let academicYear = null;
        if (startYearFull !== "----" && endYearFull !== "----") {
            academicYear = `${startYearFull}-${endYearFull}`;
        }

        const confirmedReservation = userReservations.find(
            (res) => (
                (res.status === 'confirmed' || res.status === 'checked_in') &&
                String(res.dormitory_id) === String(app.dormitory_id) &&
                res.academic_year === academicYear
            )
        );

        let finalRoomNumber = '';
        let roomSource = '';
        if (confirmedReservation && confirmedReservation.room_number) {
            finalRoomNumber = confirmedReservation.room_number;
            roomSource = 'reservation';
        } else if (app.display_room_info && app.display_room_info !== 'Не вказано') {
            finalRoomNumber = app.display_room_info;
            roomSource = 'application';
        }

        const dorm = allDormitories.find(d => String(d.id) === String(app.dormitory_id));
        const [, startMonth, startDay] = (app.start_date || "").split('T')[0].split('-');
        const [, endMonth, endDay] = (app.end_date || "").split('T')[0].split('-');
        const [appYearFull, appMonth, appDay] = (app.application_date || "").split('T')[0].split('-');
        const getShortYear = (fullYear) => fullYear && String(fullYear).length === 4 ? String(fullYear).slice(-2) : "";

        setFormData(prev => ({
            ...prev,
            faculty: String(app.faculty_id),
            group: String(app.group_id),
            course: String(app.course),
            dormNumber: String(app.dormitory_id),
            roomNumber: finalRoomNumber,
            dormStreet: dorm?.address ? dorm.address.split(',')[0].replace(/вул\.|вулиця/g, '').trim() : '',
            dormBuilding: dorm?.address ? dorm.address.split(',')[1]?.trim().split(' ')[0] || '' : '',
            academicYearStart: startYearFull,
            academicYearEnd: endYearFull,
            startDay: startDay || '', startMonth: startMonth || '', startYear: getShortYear(startYearFull),
            endDay: endDay || '', endMonth: endMonth || '', endYear: getShortYear(endYearFull),
            proxyNumber: String(app.id),
            proxyDay: appDay || '',
            proxyMonth: appMonth || '',
            proxyYear: getShortYear(appYearFull),
            applicationDateDay: appDay || '',
            applicationDateMonth: appMonth || '',
            applicationDateYear: getShortYear(appYearFull),
            dormManagerName_main: dorm?.manager_name || "",
            dormManagerName_appendix1: dorm?.manager_name || "",
            dormManagerName_appendix2: dorm?.manager_name || "",
            dormManagerName_appendix3: dorm?.manager_name || "",
            address_appendix1: dorm?.address || '',
            address_appendix2: dorm?.address || '',
            roomNumber_appendix1: finalRoomNumber,
            roomNumber_appendix2: finalRoomNumber,
            premisesNumber_appendix2: finalRoomNumber,
        }));
        setAutoSelectedRoomInfo({ number: finalRoomNumber, source: finalRoomNumber ? roomSource : 'manual' });
    }, [formData.applicationId, userApprovedApps, allDormitories, userReservations]);
    
    useEffect(() => {
        if (formData.faculty) {
            setDataLoading(p => ({ ...p, groups: true }));
            api.get(`/faculties/${formData.faculty}/groups`)
                .then(res => {
                    const fetchedGroups = res.data || [];
                    setGroupsForFaculty(fetchedGroups);
                    const groupExists = fetchedGroups.some(g => String(g.id) === String(formData.group));
                    if (!groupExists) {
                        setFormData(prev => ({ ...prev, group: "", course: "" }));
                    } else {
                        const selectedGroup = fetchedGroups.find(g => String(g.id) === String(formData.group));
                        if (selectedGroup && String(selectedGroup.course) !== String(formData.course)) {
                            setFormData(prev => ({...prev, course: selectedGroup.course}));
                        }
                    }
                })
                .catch(() => ToastService.error("Помилка завантаження груп."))
                .finally(() => setDataLoading(p => ({ ...p, groups: false })));
        } else {
            setGroupsForFaculty([]);
        }
    }, [formData.faculty]);

    const handleChange = useCallback((e) => {
        let { name, value, type, checked } = e.target;
        setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors[name]) delete newErrors[name];
            return newErrors;
        });

        const nestedMatch = name.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
        if (nestedMatch) {
            const [, arrayName, indexStr, fieldName] = nestedMatch;
            const index = parseInt(indexStr, 10);
            setFormData(prev => {
                const newArray = [...(prev[arrayName] || [])];
                newArray[index] = {
                    ...newArray[index],
                    [fieldName]: type === 'checkbox' ? checked : value,
                };
                return { ...prev, [arrayName]: newArray };
            });
        } else {
            if (name === "residentPhone" || name === "motherPhone" || name === "fatherPhone") {
                value = value.replace(/[^0-9]/g, "").slice(0, 9);
            }
            setFormData(prev => {
                let updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
                if (name === "group") {
                    const selectedGroup = groupsForFaculty.find(g => String(g.id) === String(value));
                    updated.course = selectedGroup ? String(selectedGroup.course) : "";
                }
                if (name === "roomNumber") {
                    setAutoSelectedRoomInfo({ number: value, source: 'manual' });
                }
                return updated;
            });
        }
    }, [groupsForFaculty]);

    const handleBlur = async (e) => {
        const { name } = e.target;
        if (!name) return;
        setTouched(prev => ({...prev, [name]: true}));
        if (getNestedError(errors, name)) return;
        const { error } = await validateField(name, formData);
        if (error) {
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };
    
    const handleFocus = (fieldName) => {
        const element = inputRefs.current[fieldName];
        if (element) element.classList.add(styles.focusedInput);
    };
    
    const handleInputKeyDown = useCallback((e, nextField, prevField) => {
        if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            if (nextField && inputRefs.current[nextField]) {
                inputRefs.current[nextField].focus();
            }
        } else if (e.key === "Shift" && e.key === "Tab" && prevField && inputRefs.current[prevField]) {
            e.preventDefault();
            if (prevField && inputRefs.current[prevField]) {
                inputRefs.current[prevField].focus();
            }
        }
    }, []);

    const handleNextSpread = async () => {
        setIsValidating(true);
        const pagesToValidate = [currentSpread * 2, (currentSpread * 2) + 1].filter(p => p < pageSchemas.length);
        const { isValid, errors: validationErrors } = await validatePages(pagesToValidate, formData);
        setIsValidating(false);

        if (!isValid) {
            const allCurrentErrors = { ...errors, ...validationErrors };
            setErrors(allCurrentErrors);
            ToastService.error("Будь ласка, виправте помилки на поточних сторінках.");
            const firstNewErrorField = getAllErrorFields(validationErrors)[0] || Object.keys(validationErrors)[0];
            const allErrorFields = getAllErrorFields(allCurrentErrors);
            const firstErrorIndex = allErrorFields.indexOf(firstNewErrorField);
            setCurrentErrorIndex(firstErrorIndex >= 0 ? firstErrorIndex : 0);
        } else {
            if (currentSpread < (Math.ceil(pageSchemas.length / 2)) - 1) {
                setCurrentSpread(prev => prev + 1);
            }
        }
    };
    
    const handlePrevSpread = () => {
        if (currentSpread > 0) setCurrentSpread(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { isValid, errors: validationErrors } = await validatePages(
            Array.from(Array(pageSchemas.length).keys()),
            formData,
            true
        );

        if (!isValid) {
            setErrors(validationErrors);
            ToastService.error("Форма містить помилки. Перевірте всі сторінки та виправте їх.");
            setCurrentErrorIndex(0);
            setIsSubmitting(false);
            return;
        }
        
        const payload = { ...formData };
        try {
            await api.post("/services/settlement-agreement", payload);
            ToastService.success("Договір успішно відправлено на розгляд!");
            navigate("/dashboard");
        } catch (error) {
            ToastService.handleApiError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderPageContent = (pageIndex) => {
        const pageProps = {
            formData, errors, touched, handleChange, handleBlur, handleFocus,
            inputRefs, taxIdRefs, handleInputKeyDown,
            allFaculties, groupsForFaculty, allDormitories, userApprovedApps,
            dataLoading, isPresetActive: !!selectedPreset, selectedPreset, autoSelectedRoomInfo,
            displayFacultyName: allFaculties.find(f => String(f.id) === String(formData.faculty))?.name,
            displayGroupName: groupsForFaculty.find(g => String(g.id) === String(formData.group))?.name,
            displayDormName: allDormitories.find(d => String(d.id) === String(formData.dormNumber))?.name,
            defaultPremisesConditionsItems: defaultPremisesConditions,
            defaultInventoryItems: defaultInventory
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
    const errorKeys = getAllErrorFields(errors);
    
    return (
        <div className={styles.layout}>
            <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
            <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded(!isSidebarExpanded)} />
                <div className={styles.container}>
                    <div className={styles.book}>
                        <div className={styles.pageLeft}>{renderPageContent(currentSpread * 2)}</div>
                        {(currentSpread * 2 + 1) < allPagesCount ? (
                            <div className={styles.pageRight}>{renderPageContent(currentSpread * 2 + 1)}</div>
                        ) : <div className={styles.pageRight}></div>}
                    </div>
                </div>
                <div className={styles.controlsWrapper}>
                    {errorKeys.length > 0 && (
                        <div className={styles.errorPanel}>
                            <h3>Знайдені помилки ({errorKeys.length}):</h3>
                            <div className={styles.errorContainer}>
                                {errorKeys.map((key, index) => (
                                    <p
                                        key={key}
                                        className={`${styles.errorItem} ${index === currentErrorIndex ? styles.activeError : ""}`}
                                        onClick={() => setCurrentErrorIndex(index)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") setCurrentErrorIndex(index);
                                        }}
                                    >
                                        {formatErrorMessage(key)}: {getNestedError(errors, key)}
                                    </p>
                                ))}
                            </div>
                            {errorKeys.length > 1 && (
                                <button
                                    type="button"
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
                                    type="button"
                                    className={`${styles.navButton} ${styles.backButton}`}
                                    onClick={handlePrevSpread}
                                    disabled={isSubmitting || isValidating}
                                >
                                    <ArrowLeftIcon className={styles.buttonIcon} />
                                    <span>Попередня</span>
                                </button>
                            )}
                        </div>
                        <div className={styles.nextButtonWrapper}>
                            {currentSpread < totalSpreads - 1 ? (
                                <button
                                    type="button"
                                    className={`${styles.navButton} ${styles.nextButton}`}
                                    onClick={handleNextSpread}
                                    disabled={isSubmitting || isValidating}
                                >
                                    <span>{isValidating ? "Перевірка..." : "Далі"}</span>
                                    {!isValidating && <ArrowRightIcon className={styles.buttonIcon} />}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={`${styles.navButton} ${styles.nextButton}`}
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || userIsLoading || isValidating || Object.values(dataLoading).some(Boolean)}
                                >
                                    <span>{isSubmitting || isValidating ? "Обробка..." : "Подати Договір"}</span>
                                    {!(isSubmitting || isValidating) && <CheckIcon className={styles.buttonIcon} />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettlementAgreementPage;