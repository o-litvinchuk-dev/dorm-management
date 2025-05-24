 // Цей файл вже існує у вас, я лише адаптую formatErrorMessage
 // та scrollToErrorFieldFixed

 export const isValidDate = (day, month, yearShort) => { // Рік тут вже короткий (YY)
     if (!day || !month || !yearShort) return false;
     if (String(day).length > 2 || String(month).length > 2 || String(yearShort).length > 2) return false;

     const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;
     const year = currentCentury + parseInt(yearShort, 10);
     const d = parseInt(day, 10);
     const m = parseInt(month, 10) -1; // Місяці в JS 0-індексовані

     const date = new Date(year, m, d);
     return (
         date.getFullYear() === year &&
         date.getMonth() === m &&
         date.getDate() === d
     );
 };


 export const formatErrorMessage = (fieldName) => {
     const fieldLabels = {
         contractDay: "День укладання договору", contractMonth: "Місяць укладання договору", contractYear: "Рік укладання договору (РР)",
         proxyNumber: "Номер довіреності", proxyDay: "День довіреності", proxyMonth: "Місяць довіреності", proxyYear: "Рік довіреності (РР)",
         course: "Курс", group: "Група", faculty: "Факультет", fullName: "П.І.Б.",
         passportSeries: "Серія паспорта", passportNumber: "Номер паспорта", passportIssued: "Ким виданий паспорт",
         taxId: "ІПН",
         dormStreet: "Вулиця гуртожитку", dormBuilding: "Будинок гуртожитку", dormNumber: "Номер гуртожитку", roomNumber: "Номер кімнати",
         startDay: "День початку проживання", startMonth: "Місяць початку проживання", startYear: "Рік початку проживання (РР)",
         endDay: "День кінця проживання", endMonth: "Місяць кінця проживання", endYear: "Рік кінця проживання (РР)",
         residentFullName: "П.І.Б. мешканця (реквізити)", residentRegion: "Область (реквізити)", residentDistrict: "Район (реквізити)",
         residentCity: "Населений пункт (реквізити)", residentPostalCode: "Поштовий індекс (реквізити)",
         residentPhone: "Телефон мешканця (реквізити)", motherPhone: "Телефон матері", fatherPhone: "Телефон батька",
         parentFullName: "П.І.Б. одного з батьків",
         day: "День (дата додатку)", month: "Місяць (дата додатку)", year: "Рік (дата додатку, РР)",
         address: "Адреса (у додатку)",
         dormManagerName: "П.І.Б. завідувача гуртожитку (підпис)", residentName: "П.І.Б. мешканця (підпис)",
         premisesNumber: "Номер житлового приміщення (акт)", premisesArea: "Площа житлового приміщення (акт)",
         dataProcessingConsent: "Згода на обробку даних", contractTermsConsent: "Згода з умовами договору", dataAccuracyConsent: "Підтвердження правильності даних",
         // Для масивів
         "inventory": "Інвентар",
         "premisesConditions": "Стан приміщення",
         "electricalAppliances": "Електроприлади",
     };

     const match = fieldName.match(/^(\w+)\[(\d+)\]\.?(\w+)?$/);
     if (match) {
         const [, arrayName, index, subField] = match;
         const arrayLabel = fieldLabels[arrayName] || arrayName;
         const subFieldLabels = { name: "Назва", quantity: "Кількість", note: "Примітка", description: "Опис", condition: "Стан", brand: "Марка", year: "Рік випуску" };
         const subFieldLabel = subFieldLabels[subField] || subField || "";
         return `${arrayLabel}, рядок ${parseInt(index) + 1}${subFieldLabel ? `: ${subFieldLabel}` : ""}`;
     }
     return fieldLabels[fieldName] || fieldName;
 };

 export const scrollToErrorFieldFixed = (fieldName, inputRefsCurrent, taxIdRefsCurrent) => {
     let element;
     if (fieldName.startsWith("taxId[")) {
         const index = parseInt(fieldName.match(/\[(\d+)\]/)[1], 10);
         element = taxIdRefsCurrent[index]?.current;
     } else {
         element = inputRefsCurrent[fieldName] ||
                   document.querySelector(`[data-error-field="${fieldName}"]`) || // Для звичайних полів
                   document.querySelector(`[name="${fieldName}"]`); // Запасний варіант
     }


     if (element) {
         const pageElement = element.closest(`.${styles.pageLeft}, .${styles.pageRight}`); // Припускаємо, що у вас є такі класи для сторінок
         if (pageElement) {
              pageElement.scrollIntoView({ behavior: "smooth", block: "start" }); // Спочатку скрол до сторінки
              // Невеликий таймаут, щоб сторінка встигла проскролитися перед скролом до поля
             setTimeout(() => {
                 element.scrollIntoView({ behavior: "smooth", block: "center" });
                 element.focus({ preventScroll: true });
                 element.classList.add(styles.errorInputStyle); // Додаємо клас для підсвітки
                 setTimeout(() => {
                     element.classList.remove(styles.errorInputStyle);
                 }, 3000);
             }, 300); // 300ms може бути достатньо
         } else {
             // Якщо не знайдено .pageLeft/.pageRight, просто скролимо до елемента
             element.scrollIntoView({ behavior: "smooth", block: "center" });
             element.focus({ preventScroll: true });
             element.classList.add(styles.errorInputStyle);
             setTimeout(() => {
                 element.classList.remove(styles.errorInputStyle);
             }, 3000);
         }
     } else {
         console.warn(`[scrollToErrorField] Елемент для поля "${fieldName}" не знайдено.`);
     }
 };