import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import Navbar from "../../../components/UI/Navbar/Navbar";
import Sidebar from "../../../components/UI/Sidebar/Sidebar";
import styles from "./styles/SettlementAgreementPage.module.css";
import { settlementAgreementFullSchema, validateForm } from "./validationSchemas";
import { formatErrorMessage, scrollToErrorFieldFixed as scrollToErrorField, getFieldValue } from "./helpers";
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
const SECRET_KEY = import.meta.env.VITE_SETTLEMENT_ENCRYPTION_KEY || "fallback_strong_key_if_env_is_not_set_!@#$";
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
const initialData = {
contractDay: "", contractMonth: "", contractYear: "",
proxyNumber: "11/04-20",
proxyDay: currentDay, proxyMonth: currentMonth, proxyYear: currentYearShort,
course: user?.course || "",
faculty: user?.faculty_id ? String(user.faculty_id) : "",
group: user?.group_id ? String(user.group_id) : "",
fullName: user?.name || "",
passportSeries: "", passportNumber: "", passportIssued: "",
taxId: Array(10).fill(""),
dormStreet: "", dormBuilding: "",
dormNumber: user?.dormitory_id ? String(user.dormitory_id) : "",
roomNumber: "",
academicYearStart: "", academicYearEnd: "",
startDay: "", startMonth: "", startYear: "",
endDay: "", endMonth: "", endYear: "",
applicationDateDay: currentDay, applicationDateMonth: currentMonth, applicationDateYear: currentYearShort,
residentFullName: user?.name || "",
residentRegion: "", residentDistrict: "", residentCity: "", residentPostalCode: "",
residentPhone: user?.phone?.replace("+380", "") || "",
userProfilePhone: user?.phone || "",
motherPhone: "", fatherPhone: "", parentFullName: "",
day_appendix1: "", month_appendix1: "", year_appendix1: "",
address_appendix1: "",
roomNumber_appendix1: "",
dormNumber_appendix1: "",
inventory: JSON.parse(JSON.stringify(defaultInventory)),
dormManagerName_appendix1: "", residentName_appendix1: user?.name || "",
day_appendix2: "", month_appendix2: "", year_appendix2: "",
dormNumber_appendix2: "",
dormManagerName_appendix2: "",
roomNumber_appendix2: "",
address_appendix2: "",
residentName_appendix2: user?.name || "",
residentName_appendix2_sig: user?.name || "",
premisesNumber_appendix2: "",
premisesArea_appendix2: "",
premisesConditions: JSON.parse(JSON.stringify(defaultPremisesConditions)),
day_appendix3: "", month_appendix3: "", year_appendix3: "",
electricalAppliances: JSON.parse(JSON.stringify(defaultElectricalAppliances)),
dormManagerName_appendix3: "", residentName_appendix3: user?.name || "",
dataProcessingConsent: false, contractTermsConsent: false, dataAccuracyConsent: false,
dormManagerName_main: "",
};
const savedData = localStorage.getItem("settlementAgreementFormData");
if (savedData) {
try {
const parsedSavedData = JSON.parse(savedData);
const mergedData = {
...initialData,
...parsedSavedData,
course: user?.course || parsedSavedData.course || initialData.course,
faculty: user?.faculty_id ? String(user.faculty_id) : (parsedSavedData.faculty || initialData.faculty),
group: user?.group_id ? String(user.group_id) : (parsedSavedData.group || initialData.group),
fullName: user?.name || parsedSavedData.fullName || initialData.fullName,
residentFullName: user?.name || parsedSavedData.residentFullName || initialData.residentFullName,
residentPhone: user?.phone?.replace("+380", "") || parsedSavedData.residentPhone || initialData.residentPhone,
userProfilePhone: user?.phone || parsedSavedData.userProfilePhone || initialData.userProfilePhone,
dormNumber: user?.dormitory_id ? String(user.dormitory_id) : (parsedSavedData.dormNumber || initialData.dormNumber),
taxId: Array.isArray(parsedSavedData.taxId) && parsedSavedData.taxId.length === 10 ? parsedSavedData.taxId : Array(10).fill(""),
inventory: Array.isArray(parsedSavedData.inventory) && parsedSavedData.inventory.length === defaultInventory.length ? parsedSavedData.inventory : JSON.parse(JSON.stringify(defaultInventory)),
premisesConditions: Array.isArray(parsedSavedData.premisesConditions) && parsedSavedData.premisesConditions.length === defaultPremisesConditions.length ? parsedSavedData.premisesConditions : JSON.parse(JSON.stringify(defaultPremisesConditions)),
electricalAppliances: Array.isArray(parsedSavedData.electricalAppliances) && parsedSavedData.electricalAppliances.length === defaultElectricalAppliances.length ? parsedSavedData.electricalAppliances : JSON.parse(JSON.stringify(defaultElectricalAppliances)),
residentName_appendix1: user?.name || parsedSavedData.residentName_appendix1 || initialData.residentName_appendix1,
residentName_appendix2: user?.name || parsedSavedData.residentName_appendix2 || initialData.residentName_appendix2,
residentName_appendix2_sig: user?.name || parsedSavedData.residentName_appendix2_sig || initialData.residentName_appendix2_sig,
residentName_appendix3: user?.name || parsedSavedData.residentName_appendix3 || initialData.residentName_appendix3,
dormManagerName_main: parsedSavedData.dormManagerName_main || initialData.dormManagerName_main,
dormManagerName_appendix1: parsedSavedData.dormManagerName_appendix1 || initialData.dormManagerName_appendix1,
dormManagerName_appendix2: parsedSavedData.dormManagerName_appendix2 || initialData.dormManagerName_appendix2,
dormManagerName_appendix3: parsedSavedData.dormManagerName_appendix3 || initialData.dormManagerName_appendix3,
};
if (!parsedSavedData.applicationDateDay || !parsedSavedData.applicationDateMonth || !parsedSavedData.applicationDateYear) {
mergedData.applicationDateDay = currentDay;
mergedData.applicationDateMonth = currentMonth;
mergedData.applicationDateYear = currentYearShort;
}
if (!parsedSavedData.proxyDay || !parsedSavedData.proxyMonth || !parsedSavedData.proxyYear) {
mergedData.proxyDay = currentDay;
mergedData.proxyMonth = currentMonth;
mergedData.proxyYear = currentYearShort;
}
return mergedData;
} catch (e) {
console.error("Error parsing saved form data, returning default.", e);
localStorage.removeItem("settlementAgreementFormData");
}
}
return initialData;
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
faculties: false, groups: false, dormitories: false, preset: false,
userReservations: false, autoSelectRooms: false,
});
const [userReservations, setUserReservations] = useState([]);
const [autoSelectedRoomInfo, setAutoSelectedRoomInfo] = useState({ number: '', source: '' });
const inputRefs = useRef({});
const taxIdRefs = useRef(Array(10).fill(null).map(() => React.createRef()));
const navigate = useNavigate();
useEffect(() => {
if (!userIsLoading) {
setFormData(getInitialFormData());
}
}, [user, userIsLoading, getInitialFormData]);
const getRequiredFieldsForSchema = useCallback((schema, currentFormData) => {
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
const refValue = getFieldValue(currentFormData, refFieldKey);
if (cond.options.is && typeof cond.options.is === 'function') {
return cond.options.is(refValue);
} else if (cond.options.is !== undefined) {
if (Array.isArray(cond.options.is)) return cond.options.is.includes(refValue);
return refValue === cond.options.is;
} else if (cond.options.then && cond.options.then.describe?.().tests?.some(t => t.name === 'required')) {
return true;
}
return false;
});
}
return false;
});
if (conditionMet && fieldSchema.then?.describe?.().tests.some(t => t.name === 'required')) {
isRequired = true;
} else if (!conditionMet && fieldSchema.otherwise?.describe?.().tests.some(t => t.name === 'required')) {
isRequired = true;
}
}
if (isRequired) {
if (fieldSchema.type === 'array' && fieldSchema.innerType?.fields) {
fields.push(fullKey.replace(/\.(\d+)(?=\[|\.|$)/g, '[$1]'));
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
}, []);
const calculateProgress = useCallback(() => {
const requiredFieldsFromSchema = getRequiredFieldsForSchema(settlementAgreementFullSchema, formData);
let filledRequired = 0;
const processedFields = new Set();
requiredFieldsFromSchema.forEach(fieldPath => {
if (processedFields.has(fieldPath.split('[')[0])) return;
const value = getFieldValue(formData, fieldPath);
let isFilled = false;
if (fieldPath === "taxId") {
if (Array.isArray(value) && value.length === 10 && value.every(digit => digit && digit.trim() !== "" && /^\d$/.test(digit))) {
isFilled = true;
}
processedFields.add("taxId");
} else if (fieldPath === "atLeastOneParentPhone") {
const motherPhoneVal = getFieldValue(formData, 'motherPhone');
const fatherPhoneVal = getFieldValue(formData, 'fatherPhone');
if ((motherPhoneVal && /^\+380\d{9}$/.test(motherPhoneVal)) || (fatherPhoneVal && /^\+380\d{9}$/.test(fatherPhoneVal))) {
isFilled = true;
}
processedFields.add("atLeastOneParentPhone");
processedFields.add("motherPhone");
processedFields.add("fatherPhone");
} else if (fieldPath.startsWith("inventory[")) {
let allInventoryQuantitiesFilled = true;
for(let i=0; i < defaultInventory.length; i++) {
const item = formData.inventory[i];
const isDefaultItemWithFixedName = defaultInventory.some(di => di.name === item.name && !!di.name);
if ((item.name || isDefaultItemWithFixedName) && (!item.quantity || !/^[1-9]\d*$/.test(item.quantity))) {
allInventoryQuantitiesFilled = false;
break;
}
}
if(allInventoryQuantitiesFilled) isFilled = true;
processedFields.add("inventory");
} else if (fieldPath.startsWith("electricalAppliances[")) {
let allAppliancesFilled = true;
for(let i=0; i < defaultElectricalAppliances.length; i++) {
const item = formData.electricalAppliances[i];
if (item.name && (!item.brand || !item.year || !item.quantity || !/^[1-9]\d*$/.test(item.quantity) || !(parseInt(item.year) >= 1900 && parseInt(item.year) <= new Date().getFullYear()) )) {
allAppliancesFilled = false;
break;
}
}
if(allAppliancesFilled) isFilled = true;
processedFields.add("electricalAppliances");
} else if (fieldPath.startsWith("premisesConditions[")) {
let allConditionsFilled = true;
for(let i=0; i < defaultPremisesConditions.length; i++) {
const item = formData.premisesConditions[i];
if ((i < 4 && !item.condition) || (i >= 4 && item.description && !item.condition)) {
allConditionsFilled = false;
break;
}
}
if(allConditionsFilled) isFilled = true;
processedFields.add("premisesConditions");
} else if (typeof value === 'boolean') {
if (value === true) isFilled = true;
}
else if (value !== "" && value !== undefined && value !== null) {
isFilled = true;
}
if(isFilled && !processedFields.has(fieldPath)) {
filledRequired++;
}
});
const totalRequired = requiredFieldsFromSchema.filter(f => !f.includes('[') && !f.includes('.')).length +
(requiredFieldsFromSchema.includes("taxId") ? 1 : 0) +
(requiredFieldsFromSchema.includes("atLeastOneParentPhone") ? 1 : 0) +
(requiredFieldsFromSchema.some(f => f.startsWith("inventory[")) ? 1 : 0) +
(requiredFieldsFromSchema.some(f => f.startsWith("electricalAppliances[")) ? 1 : 0) +
(requiredFieldsFromSchema.some(f => f.startsWith("premisesConditions[")) ? 1 : 0);
setProgress(totalRequired === 0 ? 0 : Math.min(100, (filledRequired / totalRequired) * 100));
}, [formData, getRequiredFieldsForSchema]);
useEffect(() => {
localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
}, [isSidebarExpanded]);
useEffect(() => {
localStorage.setItem("settlementAgreementFormData", JSON.stringify(formData));
calculateProgress();
}, [formData, calculateProgress]);
useEffect(() => {
if (showErrors && Object.keys(errors).length > 0) {
const errorFields = getAllErrorFields(errors);
if (errorFields.length > 0 && currentErrorIndex < errorFields.length && errorFields[currentErrorIndex]) {
const fieldToScroll = errorFields[currentErrorIndex];
scrollToErrorField(fieldToScroll, inputRefs.current, taxIdRefs.current, styles.pageLeft, styles.pageRight, styles.errorInput);
const pageIndex = getPageIndexForField(fieldToScroll, currentSpread);
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
} else if (!formData.group && fetchedGroups.length > 0 && user?.group_id) {
const userGroupInList = fetchedGroups.find(g => String(g.id) === String(user.group_id));
if (userGroupInList) {
setFormData(prev => ({ ...prev, group: String(userGroupInList.id), course: String(userGroupInList.course) }));
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
}, [formData.faculty, allFaculties, user]);
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
const updateManagerNames = (managerName) => ({
dormManagerName_main: managerName,
dormManagerName_appendix1: managerName,
dormManagerName_appendix2: managerName,
dormManagerName_appendix3: managerName,
});
useEffect(() => {
if (formData.dormNumber && allDormitories.length > 0) {
const selectedDorm = allDormitories.find(d => String(d.id) === String(formData.dormNumber));
const updates = {};
if (selectedDorm) {
const managerName = typeof selectedDorm.manager_name === 'string' ? selectedDorm.manager_name : "";
if (formData.dormManagerName_main !== managerName) {
Object.assign(updates, updateManagerNames(managerName));
if (managerName) {
ToastService.info(`ПІБ завідувача гуртожитку "${selectedDorm.name}" автоматично встановлено: ${managerName}.`);
} else if (formData.dormManagerName_main) {
ToastService.info(`Для гуртожитку "${selectedDorm.name}" не призначено завідувача. Поле очищено.`);
}
}
if (!selectedPreset && selectedDorm.address) {
const addressParts = selectedDorm.address.split(',');
updates.dormStreet = addressParts[0]?.trim() || "";
updates.dormBuilding = addressParts[1]?.trim() || "";
updates.address_appendix1 = selectedDorm.address;
updates.address_appendix2 = selectedDorm.address;
}
} else {
if (formData.dormManagerName_main !== "") {
Object.assign(updates, updateManagerNames(""));
}
if (!selectedPreset) {
updates.dormStreet = "";
updates.dormBuilding = "";
updates.address_appendix1 = "";
updates.address_appendix2 = "";
}
}
if (Object.keys(updates).length > 0) {
setFormData(prev => ({ ...prev, ...updates }));
}
} else if (!formData.dormNumber) {
const updatesToClear = {};
if (formData.dormManagerName_main !== "") {
Object.assign(updatesToClear, updateManagerNames(""));
}
if (!selectedPreset) {
updatesToClear.dormStreet = "";
updatesToClear.dormBuilding = "";
updatesToClear.address_appendix1 = "";
updatesToClear.address_appendix2 = "";
}
if (Object.keys(updatesToClear).length > 0) {
setFormData(prev => ({ ...prev, ...updatesToClear }));
}
}
}, [formData.dormNumber, allDormitories, selectedPreset, formData.dormManagerName_main]);
useEffect(() => {
const fetchPresetForSpecificYear = async (dormId, academicYearQuery) => {
if (!dormId || !academicYearQuery) return null;
setDataLoading(prev => ({ ...prev, preset: true }));
try {
const response = await api.get(`/application-presets/dormitory/${dormId}?academic_year=${academicYearQuery}`);
return response.data;
} catch (error) {
console.warn(`[Preset Fetch] No preset for dorm ${dormId}, year ${academicYearQuery}:`, error.response?.status);
return null;
} finally {
setDataLoading(prev => ({ ...prev, preset: false }));
}
};
const loadDormPreset = async () => {
if (!formData.dormNumber || !allDormitories.length) {
setSelectedPreset(null);
setFormData(prev => ({
...prev,
dormStreet: "", dormBuilding: "",
address_appendix1: "", address_appendix2: "",
startDay: "", startMonth: "", startYear: "",
endDay: "", endMonth: "", endYear: ""
}));
return;
}
let foundPreset = null;
const formAcademicYear = (formData.academicYearStart && String(formData.academicYearStart).length === 4 && formData.academicYearEnd && String(formData.academicYearEnd).length === 4)
? `${formData.academicYearStart}-${formData.academicYearEnd}`
: null;
if (formAcademicYear) {
foundPreset = await fetchPresetForSpecificYear(formData.dormNumber, formAcademicYear);
}
if (!foundPreset) {
const relevantYears = calculateRelevantAcademicYears();
for (const year of relevantYears) {
foundPreset = await fetchPresetForSpecificYear(formData.dormNumber, year);
if (foundPreset) {
const [pStart, pEnd] = year.split('-');
if (!formAcademicYear || (formAcademicYear && !(await fetchPresetForSpecificYear(formData.dormNumber, formAcademicYear)))) {
setFormData(prev => ({...prev, academicYearStart: pStart, academicYearEnd: pEnd}));
}
break;
}
}
}
setSelectedPreset(foundPreset);
if (!foundPreset) {
const selectedDorm = allDormitories.find(d => String(d.id) === String(formData.dormNumber));
if (selectedDorm) {
ToastService.info(`Для гуртожитку №${selectedDorm?.name || formData.dormNumber} не знайдено активних налаштувань дат для вказаного або поточного навчального року. Дати проживання потрібно ввести вручну.`);
const addressParts = selectedDorm.address?.split(',') || ["", ""];
setFormData(prev => ({
...prev,
dormStreet: addressParts[0]?.trim() || "",
dormBuilding: addressParts[1]?.trim() || "",
address_appendix1: selectedDorm.address || "",
address_appendix2: selectedDorm.address || "",
startDay: "", startMonth: "", startYear: "",
endDay: "", endMonth: "", endYear: "",
}));
} else {
setFormData(prev => ({
...prev,
dormStreet: "", dormBuilding: "",
address_appendix1: "", address_appendix2: "",
startDay: "", startMonth: "", startYear: "",
endDay: "", endMonth: "", endYear: "",
}));
}
}
};
if (allDormitories.length > 0 && formData.dormNumber) {
loadDormPreset();
} else if (!formData.dormNumber) {
setSelectedPreset(null);
setFormData(prev => ({
...prev,
dormStreet: "", dormBuilding: "",
address_appendix1: "", address_appendix2: "",
academicYearStart: "", academicYearEnd: "",
startDay: "", startMonth: "", startYear: "",
endDay: "", endMonth: "", endYear: ""
}));
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
const dormDetailsForPreset = allDormitories.find(d => String(d.id) === String(selectedPreset.dormitory_id));
if (dormDetailsForPreset && dormDetailsForPreset.address) {
const addressParts = dormDetailsForPreset.address.split(',');
updates.dormStreet = addressParts[0]?.trim() || "";
updates.dormBuilding = addressParts[1]?.trim() || "";
updates.address_appendix1 = dormDetailsForPreset.address;
updates.address_appendix2 = dormDetailsForPreset.address;
}
if (Object.keys(updates).length > 0) {
setFormData(prev => ({ ...prev, ...updates }));
}
}
}, [selectedPreset, allDormitories, formData.dormNumber]);
useEffect(() => {
const fetchUserReservations = async () => {
if (user && user.id) {
setDataLoading(prev => ({ ...prev, userReservations: true }));
try {
const response = await api.get('/secure/my-reservations');
setUserReservations(response.data || []);
} catch (error) {
console.error("Error fetching user reservations:", error);
} finally {
setDataLoading(prev => ({ ...prev, userReservations: false }));
}
}
};
if(!userIsLoading) {
fetchUserReservations();
}
}, [user, userIsLoading]);
useEffect(() => {
if (autoSelectedRoomInfo.source === 'manual' || !user || userIsLoading || dataLoading.userReservations || dataLoading.preset) {
return;
}
const agreementAcademicYear = (formData.academicYearStart && formData.academicYearEnd &&
String(formData.academicYearStart).length === 4 && String(formData.academicYearEnd).length === 4)
? `${formData.academicYearStart}-${formData.academicYearEnd}`
: null;
if (!agreementAcademicYear || !formData.dormNumber) {
if (formData.roomNumber && autoSelectedRoomInfo.source !== 'manual') {
setFormData(prev => ({
...prev,
roomNumber: "",
premisesNumber_appendix2: "",
roomNumber_appendix1: "",
roomNumber_appendix2: ""
}));
setAutoSelectedRoomInfo({ number: '', source: '' });
}
return;
}
const confirmedReservation = userReservations.find(
(res) =>
res.status === "confirmed" &&
res.academic_year === agreementAcademicYear &&
String(res.dormitory_id) === String(formData.dormNumber) &&
res.room_number
);
if (confirmedReservation) {
if (formData.roomNumber !== confirmedReservation.room_number || autoSelectedRoomInfo.source !== 'reservation') {
setFormData((prev) => ({
...prev,
roomNumber: confirmedReservation.room_number,
premisesNumber_appendix2: confirmedReservation.room_number,
roomNumber_appendix1: confirmedReservation.room_number,
roomNumber_appendix2: confirmedReservation.room_number,
}));
setAutoSelectedRoomInfo({ number: confirmedReservation.room_number, source: 'reservation' });
ToastService.info(`Кімната №${confirmedReservation.room_number} встановлена з вашого підтвердженого бронювання.`);
}
return;
}
const attemptAutoSelection = async () => {
if (!user.gender || !['male', 'female'].includes(user.gender)) {
if (autoSelectedRoomInfo.source === 'auto-select' && formData.roomNumber) {
setFormData(prev => ({ ...prev, roomNumber: '', premisesNumber_appendix2: '', roomNumber_appendix1: '', roomNumber_appendix2: '' }));
setAutoSelectedRoomInfo({ number: '', source: '' });
}
return;
}
setDataLoading(prev => ({ ...prev, autoSelectRooms: true }));
try {
const searchParams = {
dormitory_id: formData.dormNumber,
gender: user.gender,
academic_year_for_search: agreementAcademicYear,
};
const response = await api.get('/services/rooms/search', { params: searchParams });
const availableRooms = response.data || [];
if (availableRooms.length > 0) {
const sortedRooms = [...availableRooms].sort((a, b) => {
if ((a.floor ?? Infinity) !== (b.floor ?? Infinity)) {
return (a.floor ?? Infinity) - (b.floor ?? Infinity);
}
return String(a.number).localeCompare(String(b.number), undefined, { numeric: true });
});
const selectedRoom = sortedRooms[0];
if (formData.roomNumber !== selectedRoom.number || autoSelectedRoomInfo.source !== 'auto-select') {
setFormData((prev) => ({
...prev,
roomNumber: selectedRoom.number,
premisesNumber_appendix2: selectedRoom.number,
roomNumber_appendix1: selectedRoom.number,
roomNumber_appendix2: selectedRoom.number,
}));
setAutoSelectedRoomInfo({ number: selectedRoom.number, source: 'auto-select' });
ToastService.info(`Кімната №${selectedRoom.number} автоматично підібрана.`);
}
} else {
if (autoSelectedRoomInfo.source === 'auto-select' && formData.roomNumber) {
setFormData(prev => ({ ...prev, roomNumber: '', premisesNumber_appendix2: '', roomNumber_appendix1: '', roomNumber_appendix2: '' }));
setAutoSelectedRoomInfo({ number: '', source: '' });
}
ToastService.info("Вільних кімнат для автоматичного підбору не знайдено. Введіть номер вручну, якщо знаєте, або зверніться до адміністрації.");
}
} catch (error) {
console.error("Error auto-selecting room:", error);
if (autoSelectedRoomInfo.source === 'auto-select' && formData.roomNumber) {
setFormData(prev => ({ ...prev, roomNumber: '', premisesNumber_appendix2: '', roomNumber_appendix1: '', roomNumber_appendix2: '' }));
setAutoSelectedRoomInfo({ number: '', source: '' });
}
} finally {
setDataLoading(prev => ({ ...prev, autoSelectRooms: false }));
}
};
if (autoSelectedRoomInfo.source !== 'reservation' && autoSelectedRoomInfo.source !== 'manual') {
attemptAutoSelection();
}
}, [
user, userIsLoading,
formData.dormNumber, formData.academicYearStart, formData.academicYearEnd,
userReservations, dataLoading.userReservations, dataLoading.preset,
autoSelectedRoomInfo.source, formData.roomNumber
]);
const handleChange = (e, fieldNameFromArgs, index, subField) => {
const { name, value, type, checked } = e.target;
const field = fieldNameFromArgs || name;
if (["dormManagerName_appendix1", "dormManagerName_appendix2", "dormManagerName_appendix3"].includes(field) && formData.dormManagerName_main) {
return;
}
setFormData((prev) => {
let updatedData = { ...prev };
let valToSet = type === 'checkbox' ? checked : value;
if (field === "roomNumber") {
setAutoSelectedRoomInfo({ number: valToSet, source: 'manual' });
updatedData.roomNumber_appendix1 = valToSet;
updatedData.roomNumber_appendix2 = valToSet;
updatedData.premisesNumber_appendix2 = valToSet;
}
if (field.startsWith("premisesConditions") && index !== undefined && subField !== undefined) {
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
} else if (subField === "quantity" && (arrayName === "inventory" || arrayName === "electricalAppliances")) {
valToSet = valToSet.replace(/\D/g, "");
}
updatedArray[index] = { ...updatedArray[index], [subField]: valToSet };
updatedData[arrayName] = updatedArray;
}
} else {
const fullNameFields = [
"fullName", "residentFullName", "parentFullName",
"residentName_appendix1",
"residentName_appendix2", "residentName_appendix2_sig",
"residentName_appendix3"
];
const dormManagerAppendixFields = ["dormManagerName_appendix1", "dormManagerName_appendix2", "dormManagerName_appendix3"];
if (fullNameFields.includes(field) || (dormManagerAppendixFields.includes(field) && !prev.dormManagerName_main)) {
valToSet = valToSet
.replace(/[^А-Яа-яІіЇїЄєҐґЁё'\s-]/g, "")
.replace(/\s+/g, " ")
.replace(/(^|\s|-|')[а-яіїєґё]/g, (match) => match.toUpperCase())
.trimStart();
} else if (["contractYear", "proxyYear", "startYear", "endYear", "applicationDateYear",
"year_appendix1", "year_appendix2", "year_appendix3"].includes(field)) {
valToSet = valToSet.replace(/\D/g, "").slice(0, 2);
} else if (["academicYearStart", "academicYearEnd"].includes(field)) {
valToSet = valToSet.replace(/\D/g, "").slice(0, 4);
} else if (["residentPhone", "motherPhone", "fatherPhone"].includes(field)) {
valToSet = valToSet.replace(/\D/g, "").slice(0, 9);
} else if (field === "course" && !prev.group) {
const numValue = parseInt(valToSet, 10);
valToSet = valToSet === "" || (!isNaN(numValue) && numValue >= 1 && numValue <= 6) ? valToSet : prev[field];
} else if (["dormNumber", "residentPostalCode", "passportNumber",
"contractDay", "proxyDay", "startDay", "endDay", "applicationDateDay",
"day_appendix1", "day_appendix2", "day_appendix3",
"contractMonth", "proxyMonth", "startMonth", "endMonth", "applicationDateMonth",
"month_appendix1", "month_appendix2", "month_appendix3",
"proxyNumber"].includes(field)) {
valToSet = valToSet.replace(/\D/g, "");
if (field === "residentPostalCode") valToSet = valToSet.slice(0, 5);
} else if (field === "premisesArea_appendix2") {
valToSet = valToSet.replace(/[^\d.,]/g, "").replace(",", ".").replace(/(\.\d{2})\d+$/, '$1').replace(/^0+(\d)/, '$1');
} else if (field === "passportSeries") {
valToSet = valToSet.replace(/[^А-ЯІЇЄҐа-яіїєґ]/g, "").slice(0, 2).toUpperCase();
}
updatedData[field] = valToSet;
if (field === "faculty") {
updatedData.group = "";
updatedData.course = "";
if (autoSelectedRoomInfo.source !== 'manual') {
updatedData.roomNumber = ""; updatedData.roomNumber_appendix1 = ""; updatedData.roomNumber_appendix2 = "";
updatedData.premisesNumber_appendix2 = "";
setAutoSelectedRoomInfo({ number: '', source: '' });
}
}
if (field === "group" && groupsForFaculty.length > 0) {
const selectedGroup = groupsForFaculty.find(g => String(g.id) === String(valToSet));
updatedData.course = selectedGroup ? String(selectedGroup.course) : "";
}
if (field === "dormNumber") {
updatedData.roomNumber = ""; updatedData.premisesNumber_appendix2 = "";
updatedData.roomNumber_appendix1 = ""; updatedData.roomNumber_appendix2 = "";
setAutoSelectedRoomInfo({ number: '', source: '' });
updatedData.dormStreet = ""; updatedData.dormBuilding = "";
updatedData.address_appendix1 = ""; updatedData.address_appendix2 = "";
updatedData.academicYearStart = ""; updatedData.academicYearEnd = "";
updatedData.startDay = ""; updatedData.startMonth = ""; updatedData.startYear = "";
updatedData.endDay = ""; updatedData.endMonth = ""; updatedData.endYear = "";
setSelectedPreset(null);
}
if ((field === 'academicYearStart' || field === 'academicYearEnd') && autoSelectedRoomInfo.source !== 'manual') {
updatedData.roomNumber = ""; updatedData.roomNumber_appendix1 = ""; updatedData.roomNumber_appendix2 = "";
updatedData.premisesNumber_appendix2 = "";
setAutoSelectedRoomInfo({ number: '', source: '' });
setSelectedPreset(null);
}
if (field === "roomNumber" && autoSelectedRoomInfo.source === 'manual') {
updatedData.roomNumber_appendix1 = valToSet;
updatedData.roomNumber_appendix2 = valToSet;
updatedData.premisesNumber_appendix2 = valToSet;
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
const element = inputRefs.current[fieldName] || (fieldName.startsWith("taxId") && taxIdRefs.current[parseInt(fieldName.match(/\[(\d+)\]/)?.[1])]?.current);
if (element && typeof element.classList?.add === 'function') {
element.classList.add(styles.focusedInput);
}
};
const handleBlur = (fieldName) => {
const element = inputRefs.current[fieldName] || (fieldName.startsWith("taxId") && taxIdRefs.current[parseInt(fieldName.match(/\[(\d+)\]/)?.[1])]?.current);
if (element && typeof element.classList?.remove === 'function') {
element.classList.remove(styles.focusedInput);
}
};
const handleInputKeyDown = (e, currentField, nextField, prevField) => {
if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
if (nextField) {
e.preventDefault();
if (inputRefs.current[nextField]) {
inputRefs.current[nextField]?.focus();
} else if (nextField.startsWith("taxId[")) {
const taxIdIndex = parseInt(nextField.match(/\[(\d+)\]/)[1], 10);
if (taxIdRefs.current[taxIdIndex]?.current) taxIdRefs.current[taxIdIndex].current.focus();
} else if (nextField.startsWith("inventory[") || nextField.startsWith("electricalAppliances[") || nextField.startsWith("premisesConditions[")) {
if (inputRefs.current[nextField]) inputRefs.current[nextField].focus();
}
}
} else if (e.key === "Tab" && e.shiftKey) {
if (prevField) {
e.preventDefault();
if (inputRefs.current[prevField]) {
inputRefs.current[prevField]?.focus();
} else if (prevField.startsWith("taxId[")) {
const taxIdIndex = parseInt(prevField.match(/\[(\d+)\]/)[1], 10);
if (taxIdRefs.current[taxIdIndex]?.current) taxIdRefs.current[taxIdIndex].current.focus();
} else if (prevField.startsWith("inventory[") || prevField.startsWith("electricalAppliances[") || prevField.startsWith("premisesConditions[")) {
if (inputRefs.current[prevField]) inputRefs.current[prevField].focus();
}
}
}
};
const handleTableKeyDown = (e, rowIndex, currentSubField, nextSubFieldInRow, prevSubFieldInRow, nextRowFirstSubFieldIfAny, prevRowLastSubFieldBaseIfAny) => {
const arrayName = e.target.name.split('[')[0];
const currentArray = formData[arrayName];
const nextRowFirstSubField = nextRowFirstSubFieldIfAny || (arrayName === "inventory" ? "quantity" : (arrayName === "electricalAppliances" && defaultElectricalAppliances[rowIndex+1]?.name === "Холодильник" ? "brand" : "name"));
const prevRowLastSubFieldBase = prevRowLastSubFieldBaseIfAny || "note";
if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
e.preventDefault();
if (nextSubFieldInRow && inputRefs.current[`${arrayName}[${rowIndex}].${nextSubFieldInRow}`]) {
inputRefs.current[`${arrayName}[${rowIndex}].${nextSubFieldInRow}`].focus();
} else if (rowIndex < currentArray.length - 1 && inputRefs.current[`${arrayName}[${rowIndex + 1}].${nextRowFirstSubField}`]) {
inputRefs.current[`${arrayName}[${rowIndex + 1}].${nextRowFirstSubField}`].focus();
} else {
let nextFocusField = null;
if (arrayName === "inventory") nextFocusField = "day_appendix2";
else if (arrayName === "electricalAppliances") nextFocusField = "dataProcessingConsent";
if (nextFocusField && inputRefs.current[nextFocusField]) inputRefs.current[nextFocusField].focus();
}
} else if (e.key === "Tab" && e.shiftKey) {
e.preventDefault();
if (prevSubFieldInRow && inputRefs.current[`${arrayName}[${rowIndex}].${prevSubFieldInRow}`]) {
inputRefs.current[`${arrayName}[${rowIndex}].${prevSubFieldInRow}`].focus();
} else if (rowIndex > 0 && inputRefs.current[`${arrayName}[${rowIndex - 1}].${prevRowLastSubFieldBase}`]) {
inputRefs.current[`${arrayName}[${rowIndex - 1}].${prevRowLastSubFieldBase}`].focus();
} else {
let prevFocusField = null;
if (arrayName === "inventory") prevFocusField = "dormNumberInput_appendix1_display";
else if (arrayName === "electricalAppliances") prevFocusField = "year_appendix3";
if (prevFocusField && inputRefs.current[prevFocusField]) inputRefs.current[prevFocusField].focus();
}
}
};
const handleDateKeyDown = (e, currentField, nextField, prevField) => {
const currentValue = formData[currentField] || "";
const isYearField = currentField.toLowerCase().includes("year") && !currentField.toLowerCase().includes("academicyear");
const maxLength = isYearField ? 2 : 2;
if (e.key === "ArrowRight" && currentValue.length >= maxLength && inputRefs.current[nextField]) {
inputRefs.current[nextField]?.focus();
e.preventDefault();
} else if (e.key === "ArrowLeft" && currentValue.length === 0 && inputRefs.current[prevField]) {
inputRefs.current[prevField]?.focus();
e.preventDefault();
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
if (typeof current === 'object' && current !== null && current.message && typeof current.message === 'string') {
return current.message;
}
return undefined;
};
const handleSubmit = async () => {
setIsSubmitting(true);
setShowErrors(false);
const currentFullYearVal = new Date().getFullYear();
const currentCenturyVal = Math.floor(currentFullYearVal / 100) * 100;
const getFullYearFromYY = (yy) => (yy && String(yy).length === 2 ? String(currentCenturyVal + parseInt(yy, 10)) : yy);
const validationData = {
...formData,
contractYear: getFullYearFromYY(formData.contractYear),
proxyYear: getFullYearFromYY(formData.proxyYear),
startYear: getFullYearFromYY(formData.startYear),
endYear: getFullYearFromYY(formData.endYear),
applicationDateYear: getFullYearFromYY(formData.applicationDateYear),
year_appendix1: getFullYearFromYY(formData.year_appendix1),
year_appendix2: getFullYearFromYY(formData.year_appendix2),
year_appendix3: getFullYearFromYY(formData.year_appendix3),
electricalAppliances: formData.electricalAppliances.map(appliance => ({
...appliance,
})),
residentPhone: formData.residentPhone,
motherPhone: formData.motherPhone,
fatherPhone: formData.fatherPhone,
};
validationData.taxId = [...formData.taxId];
const { isValid, errors: validationErrors } = await validateForm(validationData, settlementAgreementFullSchema);
setErrors(validationErrors);
if (!isValid) {
const errorFields = getAllErrorFields(validationErrors);
if (errorFields.length > 0) {
setCurrentErrorIndex(0);
const firstErrorPage = getPageIndexForField(errorFields[0], currentSpread);
if (firstErrorPage !== -1 && Math.floor(firstErrorPage / 2) !== currentSpread) {
setCurrentSpread(Math.floor(firstErrorPage / 2));
}
setTimeout(() => {
scrollToErrorField(errorFields[0], inputRefs.current, taxIdRefs.current, styles.pageLeft, styles.pageRight, styles.errorInput);
}, 100);
}
setShowErrors(true);
setIsSubmitting(false);
ToastService.error("Будь ласка, виправте помилки у формі.");
return;
}
setShowErrors(false);
const dataToSend = {
...formData,
contractYear: formData.contractYear,
proxyYear: formData.proxyYear,
startYear: formData.startYear,
endYear: formData.endYear,
applicationDateDay: formData.applicationDateDay,
applicationDateMonth: formData.applicationDateMonth,
applicationDateYear: formData.applicationDateYear,
year: formData.year_appendix1,
day: formData.day_appendix1,
month: formData.month_appendix1,
residentPhone: formData.residentPhone,
motherPhone: formData.motherPhone || null,
fatherPhone: formData.fatherPhone || null,
};
delete dataToSend.userProfilePhone;
delete dataToSend.dormManagerName_main;
delete dataToSend.day_appendix1;
delete dataToSend.month_appendix1;
delete dataToSend.year_appendix1;
delete dataToSend.day_appendix2;
delete dataToSend.month_appendix2;
delete dataToSend.year_appendix2;
delete dataToSend.day_appendix3;
delete dataToSend.month_appendix3;
delete dataToSend.year_appendix3;
dataToSend.dormManagerNameSignature = "";
dataToSend.residentNameSignature = "";
const fieldsToEncryptClientSide = [
'fullName', 'passportSeries', 'passportNumber', 'passportIssued',
'residentFullName', 'motherPhone', 'fatherPhone', 'parentFullName'
];
const taxIdToEncrypt = Array.isArray(dataToSend.taxId) ? dataToSend.taxId : Array(10).fill("");
const encryptedPayload = { ...dataToSend };
fieldsToEncryptClientSide.forEach(field => {
if (encryptedPayload[field]) {
encryptedPayload[field] = encryptSensitiveData(encryptedPayload[field]);
}
});
if (encryptedPayload.residentPhone) {
encryptedPayload.residentPhone = encryptSensitiveData(`+380${encryptedPayload.residentPhone}`);
}
encryptedPayload.taxId = taxIdToEncrypt.map(digit => encryptSensitiveData(digit || ""));
console.log("[Frontend Submit] Submitting data to API:", encryptedPayload);
try {
await api.post("/services/settlement-agreement", encryptedPayload);
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
formData, errors, handleChange, handleFocus, handleBlur,
inputRefs, taxIdRefs, handleTaxIdChange, handleTaxIdKeyDown,
handleInputKeyDown, handleDateKeyDown, handleTableKeyDown,
allFaculties, groupsForFaculty, allDormitories,
dataLoading, isPresetActive: !!selectedPreset, selectedPreset, autoSelectedRoomInfo,
defaultInventoryItems: defaultInventory,
defaultElectricalAppliancesItems: defaultElectricalAppliances,
defaultPremisesConditionsItems: defaultPremisesConditions,
displayFacultyName: allFaculties.find(f => String(f.id) === formData.faculty)?.name || "Не обрано",
displayGroupName: groupsForFaculty.find(g => String(g.id) === formData.group)?.name || "Не обрано",
displayDormName: allDormitories.find(d => String(d.id) === formData.dormNumber)?.name || "Не обрано",
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
onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCurrentErrorIndex(index); }}
>
{formatErrorMessage(key)}: {getNestedError(errors, key) || "Невідома помилка валідації"}
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
type="button"
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
type="button"
className={`${styles.navButton} ${styles.nextButton}`}
onClick={handleSubmit}
disabled={isSubmitting || userIsLoading || Object.values(dataLoading).some(Boolean)}
aria-label={isSubmitting || userIsLoading ? "Обробка форми" : "Подати Договір"}
>
<span>{isSubmitting || userIsLoading || Object.values(dataLoading).some(Boolean) ? "Обробка..." : "Подати Договір"}</span>
{!(isSubmitting || userIsLoading || Object.values(dataLoading).some(Boolean)) && <CheckIcon className={styles.buttonIcon} />}
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
const fieldNameBase = fieldName.split('[')[0];
const pageFieldMap = {
contractDay: 0, contractMonth: 0, contractYear: 0,
proxyNumber: 0, proxyDay: 0, proxyMonth: 0, proxyYear: 0,
course: 0, group: 0, faculty: 0, fullName: 0,
passportSeries: 0, passportNumber: 0, passportIssued: 0,
taxId: 0,
dormStreet: 0, dormBuilding: 0,
dormNumber: 0, roomNumber: 0,
academicYearStart: 0, academicYearEnd: 0,
startDay: 0, startMonth: 0, startYear: 0,
endDay: 0, endMonth: 0, endYear: 0,
applicationDateDay: 0, applicationDateMonth: 0, applicationDateYear: 0,
residentFullName: 9, residentRegion: 9, residentDistrict: 9, residentCity: 9,
residentPostalCode: 9, residentPhone: 9, motherPhone: 9, fatherPhone: 9, parentFullName: 9,
atLeastOneParentPhone: 9,
day_appendix1: 10, month_appendix1: 10, year_appendix1: 10,
address_appendix1: 10,
roomNumber_appendix1: 10,
dormNumber_appendix1: 10,
inventory: 10,
dormManagerName_appendix1: 10, residentName_appendix1: 10,
day_appendix2: 11, month_appendix2: 11, year_appendix2: 11,
dormNumber_appendix2: 11,
dormManagerName_appendix2: 11,
roomNumber_appendix2: 11,
address_appendix2: 11,
residentName_appendix2: 11,
residentName_appendix2_sig: 11,
premisesNumber_appendix2: 11,
premisesArea_appendix2: 11,
premisesConditions: 11,
day_appendix3: 12, month_appendix3: 12, year_appendix3: 12,
electricalAppliances: 12,
dormManagerName_appendix3: 12, residentName_appendix3: 12,
dataProcessingConsent: 13, contractTermsConsent: 13, dataAccuracyConsent: 13,
};
if (['endDay', 'endMonth', 'endYear'].includes(fieldNameBase)) {
const currentLeftPage = currentSpreadForContext * 2;
if (currentLeftPage === 6 || currentLeftPage === 7) {
return 7;
}
return 0;
}
const pageIndex = pageFieldMap[fieldNameBase];
if (pageIndex === undefined) {
console.warn(`[getPageIndexForField] Field mapping not found for base: ${fieldNameBase} (original: ${fieldName}). Defaulting to current spread's first page.`);
return currentSpreadForContext * 2;
}
return pageIndex;
};
export default SettlementAgreementPage;