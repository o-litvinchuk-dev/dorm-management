import * as Yup from "yup";

// Helper function to validate logical dates
const isValidDate = (day, month, year) => {
  if (!day || !month || !year) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getDate() === parseInt(day) &&
    date.getMonth() === parseInt(month) - 1 &&
    date.getFullYear() === parseInt(year)
  );
};

// Simplified schema for minimal form submission
export const simplifiedSchema = Yup.object().shape({
  fullName: Yup.string()
    .required("П.І.Б. обов'язкове")
    .min(2, "П.І.Б. занадто коротке")
    .matches(/^[А-ЯІЄЇҐа-яієїґ\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  passportSeries: Yup.string()
    .required("Серія паспорта обов'язкова")
    .matches(/^[А-Я]{2}$/, "Серія паспорта має складатися з 2 кириличних літер"),
  passportNumber: Yup.string()
    .required("Номер паспорта обов'язковий")
    .matches(/^\d{6}$/, "Номер паспорта має складатися з 6 цифр"),
  dormNumber: Yup.string()
    .required("Номер гуртожитку обов'язковий")
    .matches(/^\d+$/, "Номер гуртожитку має бути числом"),
  roomNumber: Yup.string()
    .required("Номер кімнати обов'язковий")
    .matches(/^\d+$/, "Номер кімнати має бути числом"),
  residentPhone: Yup.string()
    .required("Контактний телефон обов'язковий")
    .matches(/^\+380\d{9}$/, "Формат телефону: +380XXXXXXXXX"),
  taxId: Yup.array()
    .of(Yup.string().matches(/^\d?$/, "Має бути цифра"))
    .required("Ідентифікаційний номер обов'язковий")
    .length(10, "Ідентифікаційний номер має містити 10 цифр")
    .test("valid-taxId", "Усі символи мають бути цифрами", (val) =>
      val.every((char) => /^\d$/.test(char))
    ),
});

// Full schema for complete form submission
export const fullSchema = Yup.object().shape({
  contractDay: Yup.string()
    .required("День договору обов'язковий")
    .matches(/^(0[1-9]|[12]\d|3[01])$/, "Некоректний формат дня"),
  contractMonth: Yup.string()
    .required("Місяць договору обов'язковий")
    .matches(/^(0[1-9]|1[0-2])$/, "Некоректний формат місяця"),
  contractYear: Yup.string()
    .required("Рік договору обов'язковий")
    .matches(/^\d{4}$/, "Некоректний формат року")
    .test("valid-year", "Рік має бути між 2000 і поточним", (value) => {
      const year = parseInt(value, 10);
      const currentYear = new Date().getFullYear();
      return year >= 2000 && year <= currentYear;
    }),
  proxyNumber: Yup.string()
    .required("Номер довіреності обов'язковий")
    .min(1, "Номер довіреності занадто короткий"),
  proxyDay: Yup.string()
    .required("День довіреності обов'язковий")
    .matches(/^(0[1-9]|[12]\d|3[01])$/, "Некоректний формат дня"),
  proxyMonth: Yup.string()
    .required("Місяць довіреності обов'язковий")
    .matches(/^(0[1-9]|1[0-2])$/, "Некоректний формат місяця"),
  proxyYear: Yup.string()
    .required("Рік довіреності обов'язковий")
    .matches(/^\d{4}$/, "Некоректний формат року")
    .test("valid-year", "Рік має бути між 2000 і поточним", (value) => {
      const year = parseInt(value, 10);
      const currentYear = new Date().getFullYear();
      return year >= 2000 && year <= currentYear;
    }),
  course: Yup.number()
    .required("Курс обов'язковий")
    .min(1, "Курс має бути від 1")
    .max(6, "Курс не може бути більше 6"),
  group: Yup.string()
    .required("Група обов'язкова")
    .min(2, "Група занадто коротка")
    .matches(/^[А-Яа-я0-9\s-]+$/, "Дозволені кириличні літери, цифри, пробіли та дефіс"),
  faculty: Yup.string()
    .required("Факультет обов'язковий")
    .min(2, "Факультет занадто короткий")
    .matches(/^[А-Яа-я\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  fullName: Yup.string()
    .required("П.І.Б. обов'язкове")
    .min(2, "П.І.Б. занадто коротке")
    .matches(/^[А-ЯІЄЇҐа-яієїґ\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  passportSeries: Yup.string()
    .required("Серія паспорта обов'язкова")
    .matches(/^[А-Я]{2}$/, "Серія паспорта має складатися з 2 кириличних літер"),
  passportNumber: Yup.string()
    .required("Номер паспорта обов'язковий")
    .matches(/^\d{6}$/, "Номер паспорта має складатися з 6 цифр"),
  passportIssued: Yup.string()
    .required("Ким виданий паспорт обов'язковий")
    .min(5, "Інформація занадто коротка")
    .matches(/^[А-Яа-я0-9\s,.-]+$/, "Дозволені кириличні літери, цифри, пробіли та розділові знаки"),
  taxId: Yup.array()
    .of(Yup.string().matches(/^\d?$/, "Має бути цифра"))
    .required("Ідентифікаційний номер обов'язковий")
    .length(10, "Ідентифікаційний номер має містити 10 цифр")
    .test("valid-taxId", "Усі символи мають бути цифрами", (val) =>
      val.every((char) => /^\d$/.test(char))
    ),
  dormStreet: Yup.string()
    .required("Вулиця гуртожитку обов'язкова")
    .min(2, "Вулиця занадто коротка")
    .matches(/^[А-Яа-я\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  dormBuilding: Yup.string()
    .required("Будівля гуртожитку обов'язкова")
    .matches(/^\d+[А-Яа-я]?$/, "Некоректний формат будівлі"),
  dormNumber: Yup.string()
    .required("Номер гуртожитку обов'язковий")
    .matches(/^\d+$/, "Номер гуртожитку має бути числом"),
  roomNumber: Yup.string()
    .required("Номер кімнати обов'язковий")
    .matches(/^\d+$/, "Номер кімнати має бути числом"),
  startDay: Yup.string()
    .required("День початку обов'язковий")
    .matches(/^(0[1-9]|[12]\d|3[01])$/, "Некоректний формат дня"),
  startMonth: Yup.string()
    .required("Місяць початку обов'язковий")
    .matches(/^(0[1-9]|1[0-2])$/, "Некоректний формат місяця"),
  startYear: Yup.string()
    .required("Рік початку обов'язковий")
    .matches(/^\d{4}$/, "Некоректний формат року")
    .test("valid-year", "Рік має бути між 2000 і поточним", (value) => {
      const year = parseInt(value, 10);
      const currentYear = new Date().getFullYear();
      return year >= 2000 && year <= currentYear;
    }),
  endDay: Yup.string()
    .required("День закінчення обов'язковий")
    .matches(/^(0[1-9]|[12]\d|3[01])$/, "Некоректний формат дня"),
  endMonth: Yup.string()
    .required("Місяць закінчення обов'язковий")
    .matches(/^(0[1-9]|1[0-2])$/, "Некоректний формат місяця"),
  endYear: Yup.string()
    .required("Рік закінчення обов'язковий")
    .matches(/^\d{4}$/, "Некоректний формат року")
    .test("valid-year", "Рік має бути між 2000 і наступним", (value) => {
      const year = parseInt(value, 10);
      const currentYear = new Date().getFullYear();
      return year >= 2000 && year <= currentYear + 1;
    }),
  residentFullName: Yup.string()
    .required("П.І.Б. мешканця обов'язкове")
    .min(2, "П.І.Б. занадто коротке")
    .matches(/^[А-ЯІЄЇҐа-яієїґ\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  residentRegion: Yup.string()
    .required("Область обов'язкова")
    .min(2, "Область занадто коротка")
    .matches(/^[А-Яа-я\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  residentDistrict: Yup.string()
    .required("Район обов'язковий")
    .min(2, "Район занадто короткий")
    .matches(/^[А-Яа-я\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  residentCity: Yup.string()
    .required("Населений пункт обов'язковий")
    .min(2, "Населений пункт занадто короткий")
    .matches(/^[А-Яа-я\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  residentPostalCode: Yup.string()
    .required("Поштовий індекс обов'язковий")
    .matches(/^\d{5}$/, "Поштовий індекс має складатися з 5 цифр"),
  residentPhone: Yup.string()
    .required("Контактний телефон обов'язковий")
    .matches(/^\+380\d{9}$/, "Формат телефону: +380XXXXXXXXX"),
  motherPhone: Yup.string()
    .required("Телефон мами обов'язковий")
    .matches(/^\+380\d{9}$/, "Формат телефону: +380XXXXXXXXX")
    .test("unique-mother-phone", "Телефон мами не може збігатися з іншими", function (value) {
      const { residentPhone, fatherPhone } = this.parent;
      return value !== residentPhone && value !== fatherPhone;
    }),
  fatherPhone: Yup.string()
    .required("Телефон тата обов'язковий")
    .matches(/^\+380\d{9}$/, "Формат телефону: +380XXXXXXXXX")
    .test("unique-father-phone", "Телефон тата не може збігатися з іншими", function (value) {
      const { residentPhone, motherPhone } = this.parent;
      return value !== residentPhone && value !== motherPhone;
    }),
  parentFullName: Yup.string()
    .required("П.І.Б. одного з батьків обов'язкове")
    .min(2, "П.І.Б. занадто коротке")
    .matches(/^[А-ЯІЄЇҐа-яієїґ\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  day: Yup.string()
    .required("День додатка обов'язковий")
    .matches(/^(0[1-9]|[12]\d|3[01])$/, "Некоректний формат дня"),
  month: Yup.string()
    .required("Місяць додатка обов'язковий")
    .matches(/^(0[1-9]|1[0-2])$/, "Некоректний формат місяця"),
  year: Yup.string()
    .required("Рік додатка обов'язковий")
    .matches(/^\d{4}$/, "Некоректний формат року")
    .test("valid-year", "Рік має бути між 2000 і поточним", (value) => {
      const year = parseInt(value, 10);
      const currentYear = new Date().getFullYear();
      return year >= 2000 && year <= currentYear;
    }),
  address: Yup.string()
    .required("Адреса обов'язкова")
    .min(5, "Адреса занадто коротка")
    .matches(
      /^[А-Яа-я0-9\s,.-]+$/,
      "Дозволені кириличні літери, цифри, пробіли та розділові знаки"
    ),
  mechanizatorReceivedName: Yup.string()
    .required("П.І.Б. завідувача обов'язкове")
    .min(2, "П.І.Б. занадто коротке")
    .matches(/^[А-ЯІЄЇҐа-яієїґ\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  mechanizatorCalledName: Yup.string()
    .required("П.І.Б. мешканця обов'язкове")
    .min(2, "П.І.Б. занадто коротке")
    .matches(/^[А-ЯІЄЇҐа-яієїґ\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  dormManagerName: Yup.string()
    .required("П.І.Б. завідувача обов'язкове")
    .min(2, "П.І.Б. занадто коротке")
    .matches(/^[А-ЯІЄЇҐа-яієїґ\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  residentName: Yup.string()
    .required("П.І.Б. мешканця обов'язкове")
    .min(2, "П.І.Б. занадто коротке")
    .matches(/^[А-ЯІЄЇҐа-яієїґ\s-]+$/, "Дозволені лише кириличні літери, пробіли та дефіс"),
  inventory: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string().max(100, "Назва не може перевищувати 100 символів"),
        quantity: Yup.number()
          .nullable()
          .transform((value, originalValue) => (originalValue === "" ? null : value))
          .min(0, "Кількість не може бути від'ємною"),
        purpose: Yup.string().max(200, "Призначення не може перевищувати 200 символів"),
      }).test(
        "inventory-conditional-required",
        "Усі поля (назва, кількість, призначення) обов’язкові, якщо хоча б одне заповнене",
        function (value) {
          const { name, quantity, purpose } = value;
          const isAnyFilled = name || quantity != null || purpose;
          if (!isAnyFilled) return true;
          return (
            Yup.string().required("Назва обов'язкова").isValidSync(name) &&
            Yup.number()
              .required("Кількість обов'язкова")
              .min(0)
              .isValidSync(quantity) &&
            Yup.string().required("Призначення обов'язкове").isValidSync(purpose)
          );
        }
      )
    )
    .length(16, "Має бути точно 16 записів в інвентарі")
    .test("unique-inventory-names", "Назви предметів в інвентарі мають бути унікальними", function (value) {
      const names = value.map((item) => item.name).filter((name) => name);
      const uniqueNames = new Set(names);
      return names.length === uniqueNames.size;
    }),
  premisesConditions: Yup.array()
    .of(
      Yup.object().shape({
        description: Yup.string()
          .max(500, "Опис не може перевищувати 500 символів")
          .notRequired(),
      })
    )
    .length(5, "Має бути точно 5 записів про стан приміщень")
    .test(
      "unique-premises-descriptions",
      "Описи стану приміщень не повинні повторюватися",
      function (value) {
        const descriptions = value
          .map((item) => item.description)
          .filter((desc) => desc);
        const uniqueDescriptions = new Set(descriptions);
        return descriptions.length === uniqueDescriptions.size;
      }
    ),
  electricalAppliances: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string().max(100, "Назва не може перевищувати 100 символів"),
        brand: Yup.string().max(100, "Марка не може перевищувати 100 символів"),
        year: Yup.number()
          .nullable()
          .transform((value, originalValue) => (originalValue === "" ? null : value))
          .min(1900, "Рік випуску не може бути раніше 1900")
          .max(new Date().getFullYear(), "Рік випуску не може бути в майбутньому"),
        quantity: Yup.number()
          .nullable()
          .transform((value, originalValue) => (originalValue === "" ? null : value))
          .min(1, "Кількість має бути не менше 1"),
        note: Yup.string()
          .max(500, "Примітка не може перевищувати 500 символів")
          .notRequired(),
      }).test(
        "conditional-required",
        "Усі поля (окрім примітки) обов’язкові, якщо хоча б одне заповнене",
        function (value) {
          const { name, brand, year, quantity, note } = value;
          const isAnyFilled = name || brand || year != null || quantity != null || note;
          if (!isAnyFilled) return true;
          return (
            Yup.string().required("Назва приладу обов’язкова").isValidSync(name) &&
            Yup.string().required("Марка обов’язкова").isValidSync(brand) &&
            Yup.number()
              .required("Рік випуску обов’язковий")
              .min(1900)
              .max(new Date().getFullYear())
              .isValidSync(year) &&
            Yup.number()
              .required("Кількість обов’язкова")
              .min(1)
              .isValidSync(quantity)
          );
        }
      )
    )
    .length(7, "Має бути точно 7 записів для електроприладів")
    .test(
      "unique-appliances",
      "Комбінація назви та марки приладу має бути унікальною",
      function (value) {
        const identifiers = value
          .filter((item) => item.name && item.brand)
          .map((item) => `${item.name}|${item.brand}`);
        const uniqueIdentifiers = new Set(identifiers);
        return identifiers.length === uniqueIdentifiers.size;
      }
    ),
})
  .test("valid-contract-date", "Дата договору некоректна", function (value) {
    const { contractDay, contractMonth, contractYear } = value;
    return isValidDate(parseInt(contractDay), parseInt(contractMonth), parseInt(contractYear));
  })
  .test("valid-proxy-date", "Дата довіреності некоректна", function (value) {
    const { proxyDay, proxyMonth, proxyYear } = value;
    return isValidDate(parseInt(proxyDay), parseInt(proxyMonth), parseInt(proxyYear));
  })
  .test("valid-start-date", "Дата початку некоректна", function (value) {
    const { startDay, startMonth, startYear } = value;
    return isValidDate(parseInt(startDay), parseInt(startMonth), parseInt(startYear));
  })
  .test("valid-end-date", "Дата закінчення некоректна", function (value) {
    const { endDay, endMonth, endYear } = value;
    return isValidDate(parseInt(endDay), parseInt(endMonth), parseInt(endYear));
  })
  .test("valid-appendix-date", "Дата додатка некоректна", function (value) {
    const { day, month, year } = value;
    return isValidDate(parseInt(day), parseInt(month), parseInt(year));
  })
  .test("start-before-end", "Дата початку має бути раніше дати закінчення", function (value) {
    const { startDay, startMonth, startYear, endDay, endMonth, endYear } = value;
    if (!startDay || !startMonth || !startYear || !endDay || !endMonth || !endYear) return true;
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    return startDate <= endDate;
  });

// Function to validate form data against a schema
export const validateForm = async (data, schema) => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    const errors = {};
    if (err.inner) {
      err.inner.forEach((error) => {
        if (error.path) {
          errors[error.path] = error.message;
        }
      });
    }
    return { isValid: false, errors };
  }
};