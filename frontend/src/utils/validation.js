import * as yup from "yup";

export const simplifiedSchema = yup.object().shape({
  fullName: yup.string().required("П.І.Б. обов'язкове"),
  passportSeries: yup.string().required("Серія паспорта обов'язкова"),
  passportNumber: yup.string().required("Номер паспорта обов'язковий"),
  dormNumber: yup.string().required("Номер гуртожитку обов'язковий"),
  roomNumber: yup.string().required("Номер кімнати обов'язковий"),
  residentPhone: yup.string().required("Контактний телефон обов'язковий").matches(/^\+380\d{9}$/, "Формат: +380XXXXXXXXX"),
});

export const fullSchema = yup.object().shape({
  contractDate: yup.string().required("Дата договору обов'язкова"),
  proxyNumber: yup.string().required("Номер довіреності обов'язковий"),
  proxyDate: yup.string().required("Дата довіреності обов'язкова"),
  course: yup.string().required("Курс обов'язковий"),
  group: yup.string().required("Група обов'язкова"),
  faculty: yup.string().required("Факультет обов'язковий"),
  fullName: yup.string().required("П.І.Б. обов'язкове"),
  passportSeries: yup.string().required("Серія паспорта обов'язкова"),
  passportNumber: yup.string().required("Номер паспорта обов'язковий"),
  passportIssued: yup.string().required("Ким виданий паспорт обов'язковий"),
  taxId: yup.array().of(yup.string()).required("Ідентифікаційний номер обов'язковий").test("len", "Має бути 10 цифр", val => val.join("").length === 10),
  dormStreet: yup.string().required("Вулиця гуртожитку обов'язкова"),
  dormBuilding: yup.string().required("Будівля гуртожитку обов'язкова"),
  startDay: yup.string().required("День початку обов'язковий").matches(/^(0[1-9]|[12]\d|3[01])$/, "Невірний формат дня"),
  startMonth: yup.string().required("Місяць початку обов'язковий").matches(/^(0[1-9]|1[0-2])$/, "Невірний формат місяця"),
  startYear: yup.string().required("Рік початку обов'язковий").matches(/^\d{4}$/, "Невірний формат року"),
  endDay: yup.string().required("День закінчення обов'язковий").matches(/^(0[1-9]|[12]\d|3[01])$/, "Невірний формат дня"),
  endMonth: yup.string().required("Місяць закінчення обов'язковий").matches(/^(0[1-9]|1[0-2])$/, "Невірний формат місяця"),
  endYear: yup.string().required("Рік закінчення обов'язковий").matches(/^\d{4}$/, "Невірний формат року"),
  residentFullName: yup.string().required("П.І.Б. мешканця обов'язкове"),
  residentRegion: yup.string().required("Область обов'язкова"),
  residentDistrict: yup.string().required("Район обов'язковий"),
  residentCity: yup.string().required("Населений пункт обов'язковий"),
  residentPostalCode: yup.string().required("Поштовий індекс обов'язковий").matches(/^\d{5}$/, "Поштовий індекс має складатися з 5 цифр"),
  residentPhone: yup.string().required("Контактний телефон обов'язковий").matches(/^\+380\d{9}$/, "Формат: +380XXXXXXXXX"),
  motherPhone: yup.string().required("Телефон мами обов'язковий").matches(/^\+380\d{9}$/, "Формат: +380XXXXXXXXX"),
  fatherPhone: yup.string().required("Телефон тата обов'язковий").matches(/^\+380\d{9}$/, "Формат: +380XXXXXXXXX"),
  parentFullName: yup.string().required("П.І.Б. одного з батьків обов'язкове"),
  day: yup.string().required("День обов'язковий").matches(/^(0[1-9]|[12]\d|3[01])$/, "Невірний формат дня"),
  month: yup.string().required("Місяць обов'язковий").matches(/^(0[1-9]|1[0-2])$/, "Невірний формат місяця"),
  year: yup.string().required("Рік обов'язковий").matches(/^\d{4}$/, "Невірний формат року"),
  dormNumber: yup.string().required("Номер гуртожитку обов'язковий"),
  roomNumber: yup.string().required("Номер кімнати обов'язковий"),
  address: yup.string().required("Адреса обов'язкова"),
  mechanizatorReceivedName: yup.string().required("П.І.Б. завідувача обов'язкове"),
  mechanizatorCalledName: yup.string().required("П.І.Б. мешканця обов'язкове"),
  dormManagerName: yup.string().required("П.І.Б. завідувача обов'язкове"),
  residentName: yup.string().required("П.І.Б. мешканця обов'язкове"),
  inventory: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Назва обов'язкова"),
      quantity: yup.number().required("Кількість обов'язкова").min(0, "Кількість не може бути від'ємною"),
      purpose: yup.string().required("Призначення обов'язкове"),
    })
  ),
  premisesConditions: yup.array().of(
    yup.object().shape({
      description: yup.string().required("Опис стану обов'язковий"),
    })
  ),
  electricalAppliances: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Назва приладу обов'язкова"),
      brand: yup.string().required("Марка обов'язкова"),
      year: yup.string().required("Рік випуску обов'язковий").matches(/^\d{4}$/, "Невірний формат року"),
      quantity: yup.number().required("Кількість обов'язкова").min(0, "Кількість не може бути від'ємною"),
      note: yup.string().optional(),
    })
  ),
});

export const validateForm = async (formData, schema) => {
  try {
    await schema.validate(formData, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    const errors = err.inner.reduce((acc, error) => {
      acc[error.path] = error.message;
      return acc;
    }, {});
    return { isValid: false, errors };
  }
};