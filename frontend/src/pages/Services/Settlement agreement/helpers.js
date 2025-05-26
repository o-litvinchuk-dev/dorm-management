// --- START OF FILE helpers.js ---
 export const isValidDate = (day, month, year) => { // Expects YYYY year
     if (!day || !month || !year) return false;
     // Allow day/month to be numbers or strings
     const sDay = String(day);
     const sMonth = String(month);
     const sYear = String(year);

     if (sDay.length > 2 || sMonth.length > 2 || sYear.length !== 4) return false;

     const d = parseInt(sDay, 10);
     const m = parseInt(sMonth, 10) -1; // Months in JS are 0-indexed
     const y = parseInt(sYear, 10);

     // Basic range check before creating Date object
     if (y < 1000 || y > 3000 || m < 0 || m > 11 || d < 1 || d > 31) {
         return false;
     }

     const date = new Date(y, m, d);
     return (
         date.getFullYear() === y &&
         date.getMonth() === m &&
         date.getDate() === d
     );
 };


 export const formatErrorMessage = (fieldName) => {
     const fieldLabels = {
         contractDay: "День укладання договору", contractMonth: "Місяць укладання договору", contractYear: "Рік укладання договору",
         proxyNumber: "Номер довіреності", proxyDay: "День довіреності", proxyMonth: "Місяць довіреності", proxyYear: "Рік довіреності",
         course: "Курс", group: "Група", faculty: "Факультет", fullName: "П.І.Б. студента",
         passportSeries: "Серія паспорта", passportNumber: "Номер паспорта", passportIssued: "Ким виданий паспорт",
         taxId: "ІПН",
         dormStreet: "Вулиця гуртожитку", dormBuilding: "Будинок гуртожитку", dormNumber: "Номер гуртожитку (стор.1)", roomNumber: "Номер кімнати (стор.1)",
         academicYearStart: "Початок навчального року", academicYearEnd: "Кінець навчального року",
         startDay: "День початку проживання", startMonth: "Місяць початку проживання", startYear: "Рік початку проживання",
         endDay: "День кінця проживання", endMonth: "Місяць кінця проживання", endYear: "Рік кінця проживання",
         applicationDateDay: "День подання заяви", applicationDateMonth: "Місяць подання заяви", applicationDateYear: "Рік подання заяви",
         
         residentFullName: "П.І.Б. мешканця (реквізити)", residentRegion: "Область (реквізити)", residentDistrict: "Район (реквізити)",
         residentCity: "Населений пункт (реквізити)", residentPostalCode: "Поштовий індекс (реквізити)",
         residentPhone: "Телефон мешканця (реквізити)", motherPhone: "Телефон матері", fatherPhone: "Телефон батька",
         parentFullName: "П.І.Б. одного з батьків", atLeastOneParentPhone: "Телефон батьків",
         residentSignature_p10: "Підпис мешканця (стор. 10)",

         day_appendix1: "День (Додаток 1)", month_appendix1: "Місяць (Додаток 1)", year_appendix1: "Рік (Додаток 1)",
         address_appendix1: "Адреса (Додаток 1)", roomNumber_appendix1: "Номер кімнати (Додаток 1)", dormNumber_appendix1: "Номер гуртожитку (Додаток 1)",
         inventory: "Інвентар (Додаток 1)",
         dormManagerName_appendix1: "П.І.Б. зав. гуртожитком (Додаток 1)", residentName_appendix1: "П.І.Б. мешканця (Додаток 1)",
         dormManagerSignature_appendix1: "Підпис зав. гуртожитком (Додаток 1)", residentSignature_appendix1: "Підпис мешканця (Додаток 1)",

         day_appendix2: "День (Додаток 2)", month_appendix2: "Місяць (Додаток 2)", year_appendix2: "Рік (Додаток 2)",
         dormNumber_appendix2: "Номер гуртожитку (Додаток 2)", dormManagerName_appendix2: "П.І.Б. зав. гуртожитком (Додаток 2)",
         roomNumber_appendix2: "Номер кімнати (Додаток 2)", address_appendix2: "Адреса (Додаток 2)",
         residentName_appendix2: "П.І.Б. мешканця (Додаток 2, текст)", residentName_appendix2_sig: "П.І.Б. мешканця (Додаток 2, підпис)",
         premisesNumber_appendix2: "Номер приміщення (Додаток 2)", premisesArea_appendix2: "Площа приміщення (Додаток 2)",
         premisesConditions: "Стан приміщення (Додаток 2)",
         dormManagerSignature_appendix2: "Підпис зав. гуртожитком (Додаток 2)", residentSignature_appendix2: "Підпис мешканця (Додаток 2)",
        
         day_appendix3: "День (Додаток 3)", month_appendix3: "Місяць (Додаток 3)", year_appendix3: "Рік (Додаток 3)",
         electricalAppliances: "Електроприлади (Додаток 3)",
         dormManagerName_appendix3: "П.І.Б. зав. гуртожитком (Додаток 3)", residentName_appendix3: "П.І.Б. мешканця (Додаток 3)",
         dormManagerSignature_appendix3: "Підпис зав. гуртожитком (Додаток 3)", residentSignature_appendix3: "Підпис мешканця (Додаток 3)",

         dataProcessingConsent: "Згода на обробку даних", contractTermsConsent: "Згода з умовами договору", dataAccuracyConsent: "Підтвердження правильності даних",
     };

     const match = fieldName.match(/^(\w+)\[(\d+)\]\.?(\w+)?$/);
     if (match) {
         const [, arrayName, index, subField] = match;
         const arrayLabel = fieldLabels[arrayName] || arrayName;
         const subFieldLabels = { name: "Назва", quantity: "Кількість", note: "Примітка", description: "Опис", condition: "Стан", brand: "Марка", year: "Рік випуску" };
         const subFieldLabel = subField ? (subFieldLabels[subField] || subField) : "";
         return `${arrayLabel}, рядок ${parseInt(index) + 1}${subFieldLabel ? `: ${subFieldLabel}` : ""}`;
     }
     return fieldLabels[fieldName] || fieldName;
 };

 export const scrollToErrorFieldFixed = (fieldName, inputRefsCurrent, taxIdRefsCurrent, pageLeftClass, pageRightClass, errorInputClass) => {
     let element;
     if (inputRefsCurrent[fieldName]) {
         element = inputRefsCurrent[fieldName];
     } else if (fieldName.startsWith("taxId[")) {
         const index = parseInt(fieldName.match(/\[(\d+)\]/)[1], 10);
         element = taxIdRefsCurrent[index]?.current;
     } else {
         element = document.querySelector(`[data-error-field="${fieldName}"]`) ||
                   document.querySelector(`[name="${fieldName}"]`) ||
                   document.querySelector(`[data-error-table^="${fieldName.split('[')[0]}-${fieldName.match(/\[(\d+)\]/)?.[1]}"]`);
     }

     if (element) {
         const pageElement = element.closest(`.${pageLeftClass.split(' ')[0]}, .${pageRightClass.split(' ')[0]}`);
         
         const scrollAndFocus = () => {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            if (typeof element.focus === 'function' && !element.disabled && !element.readOnly) {
                 element.focus({ preventScroll: true });
            }
            if (element.classList && typeof element.classList.add === 'function') {
                element.classList.add(errorInputClass.split(' ')[0]);
                setTimeout(() => {
                    element.classList.remove(errorInputClass.split(' ')[0]);
                }, 3000);
            }
         };

         if (pageElement && typeof pageElement.scrollIntoView === 'function') {
              pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
             setTimeout(scrollAndFocus, 300); 
         } else {
             scrollAndFocus(); 
         }
     } else {
         console.warn(`[scrollToErrorField] Елемент для поля "${fieldName}" не знайдено.`);
     }
 };

 export const getFieldValue = (obj, path) => {
    if (!path || typeof path !== 'string') return undefined;
    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.'); 
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
// --- END OF FILE helpers.js ---