import * as Yup from "yup";

// Функція isValidDate з helpers.js
const isValidDate = (day, month, yearShort) => {
  if (!day || !month || !yearShort) return false;
  const year = parseInt(`20${yearShort}`, 10); // Припускаємо 21 століття
  const date = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10));
  return (
    date.getDate() === parseInt(day, 10) &&
    date.getMonth() + 1 === parseInt(month, 10) &&
    date.getFullYear() === year
  );
};


const dateDaySchema = Yup.string().matches(/^(0[1-9]|[12]\d|3[01])$/, "XX").required("День");
const dateMonthSchema = Yup.string().matches(/^(0[1-9]|1[0-2])$/, "XX").required("Місяць");
const dateYearYYSchema = Yup.string().matches(/^\d{2}$/, "РР").required("Рік");

const fullNameSchema = Yup.string()
  .matches(
    /^[А-ЯІЇЄҐЁ][а-яіїєґё'-]*(\s[А-ЯІЇЄҐЁ][а-яіїєґё'-]*){1,2}$/,
    "П.І.Б. має складатися з 2-3 слів, кожне з великої літери, кирилиця"
  )
  .required("П.І.Б. обов’язкове");

export const settlementAgreementFullSchema = Yup.object().shape({
  // --- Поля з Page1Content ---
  proxyDay: dateDaySchema,
  proxyMonth: dateMonthSchema,
  proxyYear: dateYearYYSchema,
  course: Yup.number().typeError("Курс має бути числом").min(1, "Мін. 1").max(6, "Макс. 6").required("Курс"),
  group: Yup.string().required("Група"),
  faculty: Yup.string().required("Факультет"),
  fullName: fullNameSchema,
  passportSeries: Yup.string().matches(/^[А-ЯІЇЄҐ]{2}$/i, "2 літери").required("Серія"),
  passportNumber: Yup.string().matches(/^\d{6}$/, "6 цифр").required("Номер"),
  passportIssued: Yup.string().required("Ким виданий"),
  taxId: Yup.array()
    .of(Yup.string().matches(/^\d$/, "Цифра").required("Кожна цифра ІПН"))
    .length(10, "ІПН має 10 цифр"),
  dormStreet: Yup.string().required("Вулиця"),
  dormBuilding: Yup.string().required("Буд."),
  dormNumber: Yup.string().matches(/^\d+$/, "Лише цифри").required("№ гурт."),
  roomNumber: Yup.string().matches(/^\d+[А-ЯІЇЄҐа-яіїєґ]?$/, "Цифри, можливо літера").required("№ кімн."),
  startDay: dateDaySchema,
  startMonth: dateMonthSchema,
  startYear: dateYearYYSchema,
  endDay: dateDaySchema,
  endMonth: dateMonthSchema,
  endYear: dateYearYYSchema,
  // ... інші поля з наступних сторінок ...

  // Приклад для чекбоксів на сторінці 14
  dataProcessingConsent: Yup.boolean().oneOf([true], "Згода на обробку даних обов'язкова").required(),
  contractTermsConsent: Yup.boolean().oneOf([true], "Згода з умовами договору обов'язкова").required(),
  dataAccuracyConsent: Yup.boolean().oneOf([true], "Підтвердження правильності даних обов'язкове").required(),

}).test("date-ranges", "Дати вказані некоректно або порушують логіку", function (values) {
    const { proxyDay, proxyMonth, proxyYear, startDay, startMonth, startYear, endDay, endMonth, endYear } = values;
    const errors = [];

    if (!isValidDate(proxyDay, proxyMonth, proxyYear)) {
        errors.push(this.createError({ path: 'proxyDay', message: 'Дата довіреності некоректна' }));
    }
    const startDate = new Date(`20${startYear}`, parseInt(startMonth,10)-1, parseInt(startDay,10));
    const endDate = new Date(`20${endYear}`, parseInt(endMonth,10)-1, parseInt(endDay,10));

    if (!isValidDate(startDay, startMonth, startYear)) {
        errors.push(this.createError({ path: 'startDay', message: 'Дата початку проживання некоректна' }));
    }
    if (!isValidDate(endDay, endMonth, endYear)) {
        errors.push(this.createError({ path: 'endDay', message: 'Дата кінця проживання некоректна' }));
    }
    if (startDate && endDate && startDate > endDate) {
        errors.push(this.createError({ path: 'endDay', message: 'Дата кінця має бути після дати початку' }));
    }
    // Додайте інші перевірки дат, якщо потрібно

    return errors.length > 0 ? new Yup.ValidationError(errors) : true;
});


export const validateForm = async (data, schema) => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    const errors = {};
    if (error.inner) {
      error.inner.forEach((err) => {
        const path = err.path || "general";
        const pathSegments = path.split(/[\.\[\]]/).filter(Boolean);
        if (pathSegments.length > 1) {
          let current = errors;
          for (let i = 0; i < pathSegments.length - 1; i++) {
            const segment = pathSegments[i];
            if (!current[segment]) {
              current[segment] = i === pathSegments.length - 2 ? {} : [];
            }
            current = current[segment];
          }
          current[pathSegments[pathSegments.length - 1]] = err.message;
        } else if (!errors[path]) { // Запобігання перезапису першої помилки для поля
          errors[path] = err.message;
        }
      });
    }
    return { isValid: false, errors };
  }
};