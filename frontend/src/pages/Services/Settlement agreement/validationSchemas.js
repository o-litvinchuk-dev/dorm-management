import * as Yup from "yup";

// Схема для дня (01-31)
const dateSchema = Yup.string()
  .matches(/^\d{2}$/, "Має бути двозначним числом (наприклад, 01)")
  .test("is-valid-day", "Невірний день (введіть число від 01 до 31)", (value) => {
    if (!value) return false;
    const day = parseInt(value, 10);
    return day >= 1 && day <= 31;
  })
  .required("Поле дня обов'язкове");

// Схема для місяця (01-12)
const monthSchema = Yup.string()
  .matches(/^\d{2}$/, "Має бути двозначним числом (наприклад, 01)")
  .test("is-valid-month", "Невірний місяць (введіть число від 01 до 12)", (value) => {
    if (!value) return false;
    const month = parseInt(value, 10);
    return month >= 1 && month <= 12;
  })
  .required("Поле місяця обов'язкове");

// Схема для року (двозначне число від 00 до 99)
const yearSchema = Yup.string()
  .matches(/^\d{2}$/, "Має бути двозначним числом (наприклад, 25)")
  .test("is-valid-year", "Рік має бути між 00 і 99 (введіть дві останні цифри, наприклад, 25)", (value) => {
    if (!value) return false;
    const year = parseInt(value, 10);
    return year >= 0 && year <= 99;
  })
  .required("Поле року обов'язкове");

// Схема для П.І.Б. (Прізвище Ім’я По батькові)
const fullNameSchema = Yup.string()
  .matches(
    /^[А-ЯІЇЄҐ][а-яіїєґ]*\s[А-ЯІЇЄҐ][а-яіїєґ]*\s[А-ЯІЇЄҐ][а-яіїєґ]*$/,
    "П.І.Б. має складатися з трьох слів (Прізвище Ім’я По батькові), кожне починається з великої літери, лише кирилиця"
  )
  .required("П.І.Б. обов’язкове");

// Схема для необов’язкового П.І.Б. (для dormManagerNameSignature та residentNameSignature)
const optionalFullNameSchema = Yup.string()
  .matches(
    /^[А-ЯІЇЄҐ][а-яіїєґ]*\s[А-ЯІЇЄҐ][а-яіїєґ]*\s[А-ЯІЇЄҐ][а-яіїєґ]*$|^$/,
    "П.І.Б. має складатися з трьох слів (Прізвище Ім’я По батькові), кожне починається з великої літери, лише кирилиця, або залиште порожнім"
  )
  .optional();

// Схема для назви предмета (кирилиця, перша літера велика)
const itemNameSchema = Yup.string()
  .matches(
    /^[А-ЯІЇЄҐ][а-яіїєґ]*$/,
    "Назва предмета має містити лише кириличні літери, починатися з великої літери"
  )
  .required("Назва предмета обов'язкова");

// Схема для номера телефону (10 цифр, наприклад, 0681002393)
const phoneSchema = Yup.string()
  .test(
    "phone-format",
    "Номер телефону має бути у форматі 0681002393 (10 цифр)",
    (value) => {
      return !value || /^\d{10}$/.test(value);
    }
  );

// Спрощена схема для базової валідації
const simplifiedSchema = Yup.object({
  fullName: fullNameSchema,
  residentPhone: phoneSchema.required("Номер телефону обов'язковий"),
});

// Повна схема для всіх полів форми
const fullSchema = Yup.object({
  contractDay: dateSchema,
  contractMonth: monthSchema,
  contractYear: yearSchema,
  proxyNumber: Yup.string().required("Номер довіреності обов'язковий"),
  proxyDay: dateSchema,
  proxyMonth: monthSchema,
  proxyYear: yearSchema,
  course: Yup.number()
    .min(1, "Курс має бути від 1 до 6")
    .max(6, "Курс має бути від 1 до 6")
    .required("Курс обов'язковий"),
  group: Yup.string().required("Група обов'язкова"),
  faculty: Yup.string().required("Факультет обов'язковий"),
  fullName: fullNameSchema,
  passportSeries: Yup.string()
    .matches(/^[А-Яа-я]{2}$/, "Серія паспорта має складатися з двох літер")
    .required("Серія паспорта обов'язкова"),
  passportNumber: Yup.string()
    .matches(/^\d{6}$/, "Номер паспорта має складатися з 6 цифр")
    .required("Номер паспорта обов'язковий"),
  passportIssued: Yup.string().required("Ким виданий паспорт обов'язковий"),
  taxId: Yup.array()
    .of(Yup.string().matches(/^\d$/, "Має бути цифра").required("Поле обов'язкове"))
    .length(10, "Ідентифікаційний номер має містити 10 цифр")
    .required("Ідентифікаційний номер обов'язковий"),
  dormStreet: Yup.string().required("Вулиця гуртожитку обов'язкова"),
  dormBuilding: Yup.string().required("Будинок гуртожитку обов'язковий"),
  dormNumber: Yup.string()
    .matches(/^\d+$/, "Номер гуртожитку має бути числом")
    .required("Номер гуртожитку обов'язковий"),
  roomNumber: Yup.string()
    .matches(/^\d+$/, "Номер кімнати має бути числом")
    .required("Номер кімнати обов'язковий"),
  address: Yup.string().required("Адреса обов'язкова"),
  startDay: dateSchema,
  startMonth: monthSchema,
  startYear: yearSchema,
  endDay: dateSchema,
  endMonth: monthSchema,
  endYear: yearSchema,
  residentFullName: fullNameSchema,
  residentRegion: Yup.string().required("Область обов'язкова"),
  residentDistrict: Yup.string().required("Район обов'язковий"),
  residentCity: Yup.string().required("Населений пункт обов'язковий"),
  residentPostalCode: Yup.string()
    .matches(/^\d{5}$/, "Поштовий індекс має містити 5 цифр")
    .required("Поштовий індекс обов'язковий"),
  residentPhone: phoneSchema.required("Номер телефону обов'язковий"),
  motherPhone: phoneSchema,
  fatherPhone: phoneSchema,
  parentFullName: fullNameSchema,
  day: dateSchema,
  month: monthSchema,
  year: yearSchema,
  dormManagerName: fullNameSchema,
  residentName: fullNameSchema,
  inventory: Yup.array()
    .of(
      Yup.object().shape(
        {
          name: Yup.string().when(["quantity", "$index"], {
            is: (quantity, index) => {
              if (index < 14) {
                return quantity && Number(quantity) > 0;
              }
              return quantity && quantity !== "";
            },
            then: (schema) => (schema.type === "string" ? itemNameSchema : schema),
            otherwise: (schema) => schema.optional(),
          }),
          quantity: Yup.string().when("$index", {
            is: (index) => index < 14,
            then: (schema) =>
              schema
                .matches(/^\d+$/, "Кількість має бути числом")
                .required("Кількість обов'язкова")
                .test("non-negative", "Кількість не може бути від’ємною", (value) => Number(value) >= 0),
            otherwise: (schema) =>
              schema
                .matches(/^\d*$/, "Кількість має бути числом")
                .test("non-negative", "Кількість не може бути від’ємною", (value) => !value || Number(value) >= 0)
                .when("name", {
                  is: (name) => name && name !== "",
                  then: (schema) => schema.required("Кількість обов'язкова, якщо вказана назва").matches(/^\d+$/, "Кількість має бути числом"),
                  otherwise: (schema) => schema.optional(),
                }),
          }),
          note: Yup.string().optional(),
        },
        [["name", "quantity"]]
      )
    )
    .length(16, "Інвентар має містити 16 записів"),
  premisesConditions: Yup.array()
    .of(
      Yup.object().shape({
        description: Yup.string().when("$index", {
          is: (index) => index >= 4,
          then: (schema) => schema.optional(),
          otherwise: (schema) => schema.optional(),
        }),
        condition: Yup.string()
          .when(["$index", "description"], {
            is: (index, description) => index >= 4 && description && description.trim() !== "",
            then: (schema) =>
              schema
                .oneOf(
                  [
                    "Добрий",
                    "Задовільний",
                    "Потребує косметичного ремонту",
                    "Потребує капітального ремонту",
                    "Непридатний",
                    "Відсутній",
                  ],
                  ({ path }) => `Стан приміщення (елемент ${parseInt(path.match(/\d+/)[0]) + 1}): Виберіть коректний стан`
                )
                .required(({ path }) => `Стан приміщення (елемент ${parseInt(path.match(/\d+/)[0]) + 1}): Стан обов'язковий, якщо вказаний опис`),
            otherwise: (schema) =>
              schema
                .oneOf(
                  [
                    "Добрий",
                    "Задовільний",
                    "Потребує косметичного ремонту",
                    "Потребує капітального ремонту",
                    "Непридатний",
                    "Відсутній",
                    "",
                  ],
                  ({ path }) => `Стан приміщення (елемент ${parseInt(path.match(/\d+/)[0]) + 1}): Виберіть коректний стан`
                )
                .optional(),
          })
          .typeError(({ path }) => `Стан приміщення (елемент ${parseInt(path.match(/\d+/)[0]) + 1}): Вкажіть коректний стан`),
      })
    )
    .length(6, "Умови приміщення мають містити 6 записів"),
  electricalAppliances: Yup.array()
    .of(
      Yup.object({
        name: Yup.string().optional(),
        brand: Yup.string().optional(),
        year: Yup.string()
          .test(
            "is-valid-year",
            ({ path }) => `Електроприлади (елемент ${parseInt(path.match(/\d+/)[0]) + 1}): Рік має бути чотиризначним числом`,
            (value) => !value || /^\d{4}$/.test(value)
          )
          .optional(),
        quantity: Yup.string()
          .matches(/^\d*$/, "Кількість має бути числом")
          .test("non-negative", "Кількість не може бути від’ємною", (value) => !value || Number(value) >= 0)
          .when("name", {
            is: (name) => name && name.trim() !== "",
            then: (schema) => schema.required("Кількість обов'язкова, якщо вказана назва").matches(/^\d+$/, "Кількість має бути числом"),
            otherwise: (schema) => schema.optional(),
          }),
        note: Yup.string().optional(),
      })
    )
    .length(7, "Електроприлади мають містити 7 записів"),
  premisesNumber: Yup.string()
    .matches(/^\d+$/, "Номер приміщення має бути числом")
    .required("Номер приміщення обов'язковий"),
  premisesArea: Yup.string()
    .matches(/^\d+(\.\d{1,2})?$/, "Площа має бути числом (наприклад, 12.34)")
    .required("Площа приміщення обов'язкова"),
  dormManagerNameSignature: optionalFullNameSchema,
  residentNameSignature: optionalFullNameSchema,
})
  .test(
    "at-least-one-parent-phone",
    "Потрібно вказати хоча б один номер телефону батьків (мами або тата)",
    (value) => {
      return !!(value.motherPhone || value.fatherPhone);
    }
  );

// Функція для валідації форми
const validateForm = async (data, schema) => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    const errors = {};
    if (error.inner) {
      error.inner.forEach((err) => {
        const path = err.path || "atLeastOneParentPhone";
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
        } else {
          errors[path] = err.message;
        }
      });
    }
    return { isValid: false, errors };
  }
};

export { simplifiedSchema, fullSchema, validateForm };