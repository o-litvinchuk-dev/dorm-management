export const isValidDate = (day, month, year) => {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === parseInt(year, 10) &&
    date.getMonth() + 1 === parseInt(month, 10) &&
    date.getDate() === parseInt(day, 10)
  );
};

export const formatErrorMessage = (fieldName) => {
  const fieldLabels = {
    contractDay: "День договору",
    contractMonth: "Місяць договору",
    contractYear: "Рік договору",
    proxyNumber: "Номер довіреності",
    proxyDay: "День довіреності",
    proxyMonth: "Місяць довіреності",
    proxyYear: "Рік довіреності",
    course: "Курс",
    group: "Група",
    faculty: "Факультет",
    fullName: "ПІБ",
    passportSeries: "Серія паспорта",
    passportNumber: "Номер паспорта",
    passportIssued: "Ким виданий паспорт",
    taxId: "Ідентифікаційний номер",
    dormStreet: "Вулиця гуртожитку",
    dormBuilding: "Будинок гуртожитку",
    dormNumber: "Номер гуртожитку",
    roomNumber: "Номер кімнати",
    address: "Адреса",
    startDay: "День початку",
    startMonth: "Місяць початку",
    startYear: "Рік початку",
    endDay: "День закінчення",
    endMonth: "Місяць закінчення",
    endYear: "Рік закінчення",
    residentFullName: "ПІБ мешканця",
    residentRegion: "Область",
    residentDistrict: "Район",
    residentCity: "Населений пункт",
    residentPostalCode: "Поштовий індекс",
    residentPhone: "Контактний телефон",
    motherPhone: "Телефон мами",
    fatherPhone: "Телефон тата",
    parentFullName: "ПІБ одного з батьків",
    day: "День",
    month: "Місяць",
    year: "Рік",
    dormManagerName: "ПІБ завідувача гуртожитку",
    residentName: "ПІБ мешканця",
    dormManagerSignature: "Підпис завідувача",
    residentSignature: "Підпис мешканця",
    premisesNumber: "Номер приміщення",
    premisesArea: "Площа приміщення",
    dormManagerNameSignature: "ПІБ завідувача для підпису",
    residentNameSignature: "ПІБ мешканця для підпису",
  };

  const match = fieldName.match(/^(\w+)\[(\d+)\]\.?(\w+)?$/);
  if (match) {
    const [, arrayName, index, subField] = match;
    const arrayLabels = {
      inventory: `Інвентар (елемент ${parseInt(index) + 1})`,
      premisesConditions: `Стан приміщення (елемент ${parseInt(index) + 1})`,
      electricalAppliances: `Електроприлади (елемент ${parseInt(index) + 1})`,
    };
    const subFieldLabels = {
      name: "Назва",
      quantity: "Кількість",
      note: "Примітка",
      description: "Опис",
      brand: "Марка",
      year: "Рік",
    };
    return `${arrayLabels[arrayName] || arrayName}: ${subFieldLabels[subField] || subField}`;
  }

  return fieldLabels[fieldName] || fieldName;
};

export const scrollToErrorFieldFixed = (fieldName) => {
  let element;
  if (fieldName.includes("[")) {
    const match = fieldName.match(/^(\w+)\[(\d+)\]\.?(\w+)?$/);
    if (match) {
      const [, , index, subField] = match;
      element = document.querySelector(`[data-error-table="${fieldName.replace(/[\[\]]/g, '-')}-${index}-${subField}"]`) ||
                document.querySelector(`[data-error-table="${fieldName.replace(/[\[\]]/g, '-')}-${index}"]`);
    }
  } else {
    element = document.querySelector(`[data-error-field="${fieldName}"]`) ||
              document.querySelector(`input[name="${fieldName}"]`);
  }

  if (element) {
    element.classList.add("error-highlight");
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus();
    setTimeout(() => {
      element.classList.remove("error-highlight");
    }, 3000);
  }
};