// src/pages/Services/Settlement agreement/validationSchemas.js
import * as Yup from "yup";
import { isValidDate } from "./helpers";
import {
    defaultInventory as appDefaultInventory,
    defaultElectricalAppliances as appDefaultElectricalAppliances,
    defaultPremisesConditions as appDefaultPremisesConditions
} from "./settlementConstants";


const dateDaySchema = (fieldName = "День") => Yup.string().matches(/^(0[1-9]|[12]\d|3[01])$/, "XX").required(fieldName);
const dateMonthSchema = (fieldName = "Місяць") => Yup.string().matches(/^(0[1-9]|1[0-2])$/, "XX").required(fieldName);
const dateYearYYYYSchema = (fieldName = "Рік") => Yup.string().matches(/^\d{4}$/, "РРРР").required(fieldName);


const fullNameSchema = (fieldName = "П.І.Б.") => Yup.string()
  .matches(
    /^[А-ЯІЇЄҐЁ][а-яіїєґё'-]*(\s[А-ЯІЇЄҐЁ][а-яіїєґё'-]*){1,2}$/,
    `${fieldName} має складатися з 2-3 слів, кожне з великої літери, кирилиця`
  )
  .required(`${fieldName} обов’язкове`);

export const settlementAgreementFullSchema = Yup.object().shape({
  // --- Page 1 ---
  contractDay: dateDaySchema("День договору"),
  contractMonth: dateMonthSchema("Місяць договору"),
  contractYear: dateYearYYYYSchema("Рік договору"),
  proxyDay: dateDaySchema("День довіреності"),
  proxyMonth: dateMonthSchema("Місяць довіреності"),
  proxyYear: dateYearYYYYSchema("Рік довіреності"),
  proxyNumber: Yup.string().required("Номер довіреності обов'язковий"),
  faculty: Yup.string().required("Факультет обов'язковий"),
  group: Yup.string().required("Група обов'язкова"),
  course: Yup.number().typeError("Курс має бути числом").min(1, "Мін. 1 курс").max(6, "Макс. 6 курсів").required("Курс обов'язковий"),
  fullName: fullNameSchema("П.І.Б. студента"),
  passportSeries: Yup.string().matches(/^[А-ЯІЇЄҐ]{2}$/i, "Серія паспорта: 2 кириличні літери").required("Серія паспорта обов'язкова"),
  passportNumber: Yup.string().matches(/^\d{6}$/, "Номер паспорта: 6 цифр").required("Номер паспорта обов'язковий"),
  passportIssued: Yup.string()
    .matches(/^\d{4}$/, "Поле 'Ким виданий паспорт' має містити рівно 4 цифри.")
    .required("Ким виданий паспорт - обов'язково (4 цифри)"),
  taxId: Yup.array()
    .of(Yup.string().matches(/^\d$/, "Кожна цифра ІПН має бути цифрою").required("Цифра ІПН обов'язкова"))
    .length(10, "ІПН має складатися з 10 цифр")
    .test("all-digits-present", "ІПН має містити 10 цифр", value => Array.isArray(value) && value.every(v => v && v.length === 1)),
  dormStreet: Yup.string().required("Вулиця гуртожитку обов'язкова"),
  dormBuilding: Yup.string().required("Номер будинку гуртожитку обов'язковий"),
  dormNumber: Yup.string().matches(/^\d+$/, "Номер гуртожитку: лише цифри").required("Номер гуртожитку обов'язковий"),
  roomNumber: Yup.string().matches(/^\d+[А-ЯІЇЄҐа-яіїєґ]?$/, "Номер кімнати: цифри, можливо літера в кінці").required("Номер кімнати обов'язковий"),
  academicYearStart: dateYearYYYYSchema("Початок навчального року"),
  academicYearEnd: dateYearYYYYSchema("Кінець навчального року")
    .test('academic-year-end-after-start', 'Кінець навчального року має бути на 1 рік більшим за початок', function(value) {
        const start = parseInt(this.parent.academicYearStart, 10);
        const end = parseInt(value, 10);
        return !start || !value || (end === start + 1);
    }),
  startDay: dateDaySchema("День початку проживання"),
  startMonth: dateMonthSchema("Місяць початку проживання"),
  startYear: dateYearYYYYSchema("Рік початку проживання"),
  endDay: dateDaySchema("День кінця проживання"),
  endMonth: dateMonthSchema("Місяць кінця проживання"),
  endYear: dateYearYYYYSchema("Рік кінця проживання"),
  applicationDateDay: dateDaySchema("День заяви"),
  applicationDateMonth: dateMonthSchema("Місяць заяви"),
  applicationDateYear: dateYearYYYYSchema("Рік заяви"),

  // --- Page 10 ---
  residentFullName: fullNameSchema("П.І.Б. мешканця (реквізити)"),
  residentRegion: Yup.string().required("Область проживання обов'язкова"),
  residentDistrict: Yup.string().required("Район проживання обов'язковий"),
  residentCity: Yup.string().required("Населений пункт проживання обов'язковий"),
  residentPostalCode: Yup.string().matches(/^\d{5}$/, "Поштовий індекс: 5 цифр").required("Поштовий індекс обов'язковий"),
  residentPhone: Yup.string() // Фронтенд передає як 9 цифр, Joi на бекенді також очікує 9 цифр
    .matches(/^\d{9}$/, "Телефон мешканця: XXXXXXXXX (9 цифр без +380)")
    .required("Контактний телефон мешканця обов'язковий"),
  motherPhone: Yup.string()
    .matches(/^\d{9}$/, "Телефон мами: XXXXXXXXX (9 цифр без +380)")
    .nullable().transform((value) => (value === "" ? null : value))
    .test("unique-mother-phone", "Телефон мами не може збігатися з телефоном мешканця або тата", function (value) {
        const { residentPhone, fatherPhone } = this.parent;
        if (!value || value.trim() === "") return true; // Якщо поле порожнє, валідація проходить
        return value !== residentPhone && value !== fatherPhone;
    }),
  fatherPhone: Yup.string()
    .matches(/^\d{9}$/, "Телефон тата: XXXXXXXXX (9 цифр без +380)")
    .nullable().transform((value) => (value === "" ? null : value))
    .test("unique-father-phone", "Телефон тата не може збігатися з телефоном мешканця або мами", function (value) {
        const { residentPhone, motherPhone } = this.parent;
        if (!value || value.trim() === "") return true; // Якщо поле порожнє, валідація проходить
        return value !== residentPhone && value !== motherPhone;
    }),
  parentFullName: fullNameSchema("П.І.Б. одного з батьків"),

  // ... (решта схеми залишається без змін)
  day_appendix1: dateDaySchema("День (Додаток 1)"),
  month_appendix1: dateMonthSchema("Місяць (Додаток 1)"),
  year_appendix1: dateYearYYYYSchema("Рік (Додаток 1)"),
  address_appendix1: Yup.string().required("Адреса (Додаток 1) обов'язкова"),
  roomNumber_appendix1: Yup.string().matches(/^\d+[А-ЯІЇЄҐа-яіїєґ]?$/, "Номер кімнати: цифри, можливо літера").required("Номер кімнати (Додаток 1) обов'язковий"),
  dormNumber_appendix1: Yup.string().matches(/^\d+$/, "Номер гуртожитку: лише цифри").required("Номер гуртожитку (Додаток 1) обов'язковий"),
  inventory: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string().max(100, "Назва предмету: макс. 100 символів"),
        quantity: Yup.string()
            .when('name', ([name], schema) => {
                const isDefaultItemWithFixedName = appDefaultInventory.some(di => di.name === name && !!di.name);
                if (name || isDefaultItemWithFixedName) {
                    return schema.matches(/^[1-9]\d*$/, "Кількість: ціле число > 0").required("Кількість обов'язкова");
                }
                return schema.matches(/^\d*$/, "Кількість: лише цифри").nullable();
            }),
        note: Yup.string().max(500, "Примітка: макс. 500 символів").nullable(),
      })
    )
    .length(appDefaultInventory.length),
  dormManagerName_appendix1: fullNameSchema("П.І.Б. зав. гуртожитком (Додаток 1)"),
  residentName_appendix1: fullNameSchema("П.І.Б. мешканця (Додаток 1)"),

  day_appendix2: dateDaySchema("День (Додаток 2)"),
  month_appendix2: dateMonthSchema("Місяць (Додаток 2)"),
  year_appendix2: dateYearYYYYSchema("Рік (Додаток 2)"),
  dormNumber_appendix2: Yup.string().matches(/^\d+$/, "Номер гуртожитку: лише цифри").required("Номер гуртожитку (Додаток 2) обов'язковий"),
  dormManagerName_appendix2: fullNameSchema("П.І.Б. зав. гуртожитком (Додаток 2)"),
  roomNumber_appendix2: Yup.string().matches(/^\d+[А-ЯІЇЄҐа-яіїєґ]?$/, "Номер кімнати: цифри, можливо літера").required("Номер кімнати (Додаток 2) обов'язковий"),
  address_appendix2: Yup.string().required("Адреса (Додаток 2) обов'язкова"),
  residentName_appendix2: fullNameSchema("П.І.Б. мешканця (Додаток 2, в тексті акту)"),
  residentName_appendix2_sig: fullNameSchema("П.І.Б. мешканця (Додаток 2, для підпису)"),
  premisesNumber_appendix2: Yup.string().matches(/^\d+[А-ЯІЇЄҐа-яіїєґ]?$/, "Номер приміщення: цифри, можливо літера").required("Номер приміщення (Додаток 2) обов'язковий"),
  premisesArea_appendix2: Yup.string()
    .matches(/^\d+(\.\d{1,2})?$/, "Площа: число, можливо з 1-2 знаками після коми")
    .required("Площа приміщення (Додаток 2) обов'язкова"),
  premisesConditions: Yup.array()
    .of(
      Yup.object().shape({
        description: Yup.string().max(255, "Опис стану: макс. 255 символів").nullable(),
        condition: Yup.string()
            .when('$originalIndex', { 
                is: (originalIndexValue) => originalIndexValue < 4, 
                then: schema => schema.oneOf(["Добрий", "Задовільний", "Потребує косметичного ремонту", "Потребує капітального ремонту", "Непридатний", "Відсутній"], "Оберіть дійсний стан").required("Стан обов'язковий"),
                otherwise: schema => schema.when('description', { 
                    is: (description) => description && description.trim() !== "",
                    then: s => s.oneOf(["Добрий", "Задовільний", "Потребує косметичного ремонту", "Потребує капітального ремонту", "Непридатний", "Відсутній"], "Оберіть дійсний стан для опису").required("Стан для опису обов'язковий"),
                    otherwise: s => s.oneOf(["Добрий", "Задовільний", "Потребує косметичного ремонту", "Потребує капітального ремонту", "Непридатний", "Відсутній", ""], "Оберіть дійсний стан").nullable()
                })
            }),
      })
    )
    .length(appDefaultPremisesConditions.length)
    .test('first-four-conditions-required', 'Стан для перших чотирьох пунктів обов\'язковий', function(items) {
        if (!items) return true;
        for (let i = 0; i < 4; i++) {
            if (!items[i]?.condition) {
                return this.createError({ path: `premisesConditions[${i}].condition`, message: `Стан для "${appDefaultPremisesConditions[i].description}" обов'язковий` });
            }
        }
        return true;
    }),

  day_appendix3: dateDaySchema("День (Додаток 3)"),
  month_appendix3: dateMonthSchema("Місяць (Додаток 3)"),
  year_appendix3: dateYearYYYYSchema("Рік (Додаток 3)"),
  electricalAppliances: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string().max(100, "Назва приладу: макс. 100 символів")
            .test('first-item-name-check', `Назва першого приладу має бути "${appDefaultElectricalAppliances[0].name || 'Холодильник'}"`, function(value) {
                const index = parseInt(this.path.match(/\[(\d+)\]/)[1]);
                if (index === 0) {
                    return value === (appDefaultElectricalAppliances[0].name || 'Холодильник');
                }
                return true;
            }),
        brand: Yup.string().max(100, "Марка: макс. 100 символів")
            .test('brand-conditionally-required', "Марка обов'язкова", function(value) {
                const index = parseInt(this.path.match(/\[(\d+)\]/)[1]);
                const name = this.parent.name; 
                if (index === 0) { 
                    return !!value && value.trim() !== "";
                } else { 
                    if (name && name.trim() !== "") { 
                        return !!value && value.trim() !== "";
                    }
                    return true; 
                }
            }),
        year: Yup.string()
            .test('year-format-or-empty', "Рік випуску: РРРР або порожнє", val => !val || /^\d{4}$/.test(val))
            .test('year-range-or-empty', 'Рік (1900-поточний) або порожнє', val => !val || (parseInt(val) >= 1900 && parseInt(val) <= new Date().getFullYear()))
            .test('year-conditionally-required', "Рік випуску обов'язковий (РРРР, 1900-поточний)", function(value) {
                const index = parseInt(this.path.match(/\[(\d+)\]/)[1]);
                const name = this.parent.name;
                if (index === 0) { 
                    return !!value && /^\d{4}$/.test(value) && parseInt(value) >= 1900 && parseInt(value) <= new Date().getFullYear();
                } else { 
                    if (name && name.trim() !== "") { 
                        return !!value && /^\d{4}$/.test(value) && parseInt(value) >= 1900 && parseInt(value) <= new Date().getFullYear();
                    }
                    return true; 
                }
            }),
        quantity: Yup.string()
            .test('quantity-format-or-empty', "Кількість: ціле число > 0 або порожнє", val => !val || /^[1-9]\d*$/.test(val))
            .test('quantity-conditionally-required', "Кількість обов'язкова (ціле число > 0)", function(value) {
                const index = parseInt(this.path.match(/\[(\d+)\]/)[1]);
                const name = this.parent.name;
                if (index === 0) { 
                    return !!value && /^[1-9]\d*$/.test(value);
                } else { 
                    if (name && name.trim() !== "") { 
                        return !!value && /^[1-9]\d*$/.test(value);
                    }
                    return true; 
                }
            }),
        note: Yup.string().max(500, "Примітка: макс. 500 символів").nullable(),
      })
    )
    .length(appDefaultElectricalAppliances.length), 
  dormManagerName_appendix3: fullNameSchema("П.І.Б. зав. гуртожитком (Додаток 3)"),
  residentName_appendix3: fullNameSchema("П.І.Б. мешканця (Додаток 3)"),

  dataProcessingConsent: Yup.boolean().oneOf([true], "Згода на обробку даних обов'язкова").required(),
  contractTermsConsent: Yup.boolean().oneOf([true], "Згода з умовами договору обов'язкова").required(),
  dataAccuracyConsent: Yup.boolean().oneOf([true], "Підтвердження правильності даних обов'язкове").required(),

  dormManagerName_main: Yup.string().nullable(), 
  userProfilePhone: Yup.string().nullable(), 

})
.test("date-logic-validation", "Перевірка логіки дат", function (values) {
    const errors = [];
    const { contractDay, contractMonth, contractYear,
            startDay, startMonth, startYear,
            endDay, endMonth, endYear,
            proxyDay, proxyMonth, proxyYear,
            applicationDateDay, applicationDateMonth, applicationDateYear,
            day_appendix1, month_appendix1, year_appendix1,
            day_appendix2, month_appendix2, year_appendix2,
            day_appendix3, month_appendix3, year_appendix3
    } = values;

    const allDates = [
        {d: contractDay, m: contractMonth, y: contractYear, name: "Дата договору", path: "contractDay"},
        {d: startDay, m: startMonth, y: startYear, name: "Дата початку проживання", path: "startDay"},
        {d: endDay, m: endMonth, y: endYear, name: "Дата кінця проживання", path: "endDay"},
        {d: proxyDay, m: proxyMonth, y: proxyYear, name: "Дата довіреності", path: "proxyDay"},
        {d: applicationDateDay, m: applicationDateMonth, y: applicationDateYear, name: "Дата заяви", path: "applicationDateDay"},
        {d: day_appendix1, m: month_appendix1, y: year_appendix1, name: "Дата (Додаток 1)", path: "day_appendix1"},
        {d: day_appendix2, m: month_appendix2, y: year_appendix2, name: "Дата (Додаток 2)", path: "day_appendix2"},
        {d: day_appendix3, m: month_appendix3, y: year_appendix3, name: "Дата (Додаток 3)", path: "day_appendix3"},
    ];

    allDates.forEach(dateSet => {
        if ((dateSet.d && dateSet.m && dateSet.y) && !isValidDate(dateSet.d, dateSet.m, dateSet.y)) {
            errors.push(this.createError({ path: dateSet.path, message: `${dateSet.name} - некоректна дата`}));
        }
    });

    const startDateObj = (startDay && startMonth && startYear && isValidDate(startDay, startMonth, startYear)) ? new Date(startYear, parseInt(startMonth,10)-1, parseInt(startDay,10)) : null;
    const endDateObj = (endDay && endMonth && endYear && isValidDate(endDay, endMonth, endYear)) ? new Date(endYear, parseInt(endMonth,10)-1, parseInt(endDay,10)) : null;

    if (startDateObj && endDateObj && startDateObj > endDateObj) {
        errors.push(this.createError({ path: 'endDay', message: 'Дата кінця проживання має бути після або в день дати початку' }));
    }

    return errors.length > 0 ? new Yup.ValidationError(errors) : true;
})
.test(
    'atLeastOneParentPhone',
    'Вкажіть телефон хоча б одного з батьків (мами або тата)',
    function (values) {
        const { motherPhone, fatherPhone } = values;
        // Телефон вважається наданим, якщо він не порожній І відповідає формату 9 цифр
        const isMotherPhoneValidAndProvided = motherPhone && /^\d{9}$/.test(motherPhone.trim());
        const isFatherPhoneValidAndProvided = fatherPhone && /^\d{9}$/.test(fatherPhone.trim());

        if (isMotherPhoneValidAndProvided || isFatherPhoneValidAndProvided) {
            return true;
        }
        return this.createError({ path: 'atLeastOneParentPhone', message: 'Вкажіть телефон хоча б одного з батьків (9 цифр без +380)' });
    }
);


export const validateForm = async (data, schema) => {
  try {
    const validationContext = {
        ...data,
    };
    await schema.validate(data, { abortEarly: false, context: validationContext });
    return { isValid: true, errors: {} };
  } catch (err) {
    const errors = {};
    if (err.inner) {
      err.inner.forEach((error) => {
        if (error.path) {
          const pathSegments = error.path.split(/[\.\[\]]+/).filter(Boolean);
          let current = errors;
          pathSegments.forEach((segment, i) => {
            if (i === pathSegments.length - 1) {
              if (!current[segment]) current[segment] = error.message;
            } else {
              if (!current[segment]) {
                current[segment] = /^\d+$/.test(pathSegments[i+1]) ? [] : {};
              }
              current = current[segment];
            }
          });
        }
      });
    } else if (err.path) {
        errors[err.path] = err.message;
    }
    return { isValid: false, errors };
  }
};