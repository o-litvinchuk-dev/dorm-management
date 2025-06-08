// src/pages/Services/Settlement agreement/helpers.js

export const isValidDate = (day, month, year) => { // Expects YYYY year
    if (!day || !month || !year) return false;
    const d = parseInt(day, 10), m = parseInt(month, 10) - 1, y = parseInt(year, 10);
    const date = new Date(y, m, d);
    return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
};

export const formatErrorMessage = (fieldName) => {
    const fieldLabels = {
        applicationId: "Заявка на поселення",
        contractDay: "День договору", contractMonth: "Місяць договору", contractYear: "Рік договору",
        proxyNumber: "Номер довіреності", proxyDay: "День довіреності", proxyMonth: "Місяць довіреності", proxyYear: "Рік довіреності",
        course: "Курс", group: "Група", faculty: "Факультет", fullName: "П.І.Б. студента",
        passportSeries: "Серія паспорта", passportNumber: "Номер паспорта", passportIssued: "Ким виданий паспорт",
        taxId: "ІПН",
        dormStreet: "Вулиця гуртожитку", dormBuilding: "Будинок гуртожитку", dormNumber: "Номер гуртожитку", roomNumber: "Номер кімнати",
        academicYearStart: "Початок навч. року", academicYearEnd: "Кінець навч. року",
        startDay: "День початку", startMonth: "Місяць початку", startYear: "Рік початку",
        endDay: "День кінця", endMonth: "Місяць кінця", endYear: "Рік кінця",
        applicationDateDay: "День заяви", applicationDateMonth: "Місяць заяви", applicationDateYear: "Рік заяви",
        residentFullName: "П.І.Б. мешканця (реквізити)", residentRegion: "Область", residentDistrict: "Район",
        residentCity: "Населений пункт", residentPostalCode: "Поштовий індекс",
        residentPhone: "Телефон мешканця", motherPhone: "Телефон матері", fatherPhone: "Телефон батька",
        parentFullName: "П.І.Б. одного з батьків", atLeastOneParentPhone: "Телефон батьків",
        inventory: "Інвентар", premisesArea_appendix2: "Площа приміщення",
        premisesConditions: "Стан приміщення", electricalAppliances: "Електроприлади",
        dataProcessingConsent: "Згода на обробку даних", contractTermsConsent: "Згода з умовами", dataAccuracyConsent: "Підтвердження даних",
    };
    const match = fieldName.match(/^(\w+)\[(\d+)\]\.?(\w+)?$/);
    if (match) {
        const [, arrayName, index, subField] = match;
        const arrayLabel = fieldLabels[arrayName] || arrayName;
        const subFieldLabels = { name: "Назва", quantity: "К-ть", note: "Примітка", description: "Опис", condition: "Стан", brand: "Марка", year: "Рік" };
        const subFieldLabel = subField ? (subFieldLabels[subField] || subField) : "";
        return `${arrayLabel}, рядок ${parseInt(index) + 1}${subFieldLabel ? `: ${subFieldLabel}` : ""}`;
    }
    return fieldLabels[fieldName] || fieldName;
};

export const scrollToErrorFieldFixed = (fieldName, inputRefsCurrent, taxIdRefsCurrent, errorInputClass) => {
     let element;
     if (inputRefsCurrent[fieldName]) {
         element = inputRefsCurrent[fieldName];
     } else if (fieldName.startsWith("taxId[")) {
         const index = parseInt(fieldName.match(/\[(\d+)\]/)[1], 10);
         element = taxIdRefsCurrent[index]?.current;
     } else {
         element = document.querySelector(`[name="${fieldName}"]`) || document.querySelector(`[data-error-field="${fieldName}"]`);
     }

     if (element) {
         element.scrollIntoView({ behavior: "smooth", block: "center" });
         if (typeof element.focus === 'function') element.focus({ preventScroll: true });
         if (element.classList) {
             const errorClass = errorInputClass.split(' ')[0];
             element.classList.add(errorClass);
             setTimeout(() => {
                 element.classList.remove(errorClass);
             }, 3000);
         }
     } else {
         console.warn(`[scrollToErrorField] Елемент для поля "${fieldName}" не знайдено.`);
     }
};

export const getNestedError = (errorsObj, path) => {
    if (!errorsObj || !path) return undefined;
    const pathParts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current = errorsObj;
    for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            return undefined;
        }
    }
    return typeof current === 'string' ? current : undefined;
};

export const getAllErrorFields = (errors) => {
    const errorFields = [];
    const findPaths = (obj, currentPath = '') => {
        if (!obj) return;
        Object.keys(obj).forEach(key => {
            const newPath = currentPath ? (key.match(/^\d+$/) ? `${currentPath}[${key}]` : `${currentPath}.${key}`) : key;
            if (typeof obj[key] === 'string') {
                errorFields.push(newPath);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                findPaths(obj[key], newPath);
            }
        });
    };
    findPaths(errors);
    return errorFields;
};