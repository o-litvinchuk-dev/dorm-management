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
    /^[А-ЯІЇЄҐ][а-яіїєґ'-]*(\s[А-ЯІЇЄҐ][а-яіїєґ'-]*){2}$/,
    "П.І.Б. має складатися з трьох слів (Прізвище Ім’я По батькові), кожне починається з великої літери, лише кирилиця, можливі апостроф або дефіс"
  )
  .required("П.І.Б. обов’язкове");

// Схема для номера телефону (10 цифр, наприклад, 0681002393)
const phoneSchema = Yup.string()
  .test(
    "phone-format",
    "Номер телефону має бути у форматі 0681234567 (10 цифр)",
    (value) => {
      return !value || /^\d{10}$/.test(value);
    }
  )
  .required("Номер телефону обов'язковий");

// Схема для прізвища (кирилиця, перша літера велика)
const surnameSchema = Yup.string()
  .matches(
    /^[А-ЯІЇЄҐ][а-яіїєґ'-]*$/,
    "Прізвище має містити лише кириличні літери, починатися з великої літери, можливі апостроф або дефіс"
  )
  .required("Прізвище обов'язкове");

// Повна схема для всіх полів форми
const fullSchema = Yup.object({
  course: Yup.number()
    .min(1, "Курс має бути від 1 до 6")
    .max(6, "Курс має бути від 1 до 6")
    .required("Курс обов'язковий"),
  group: Yup.string().required("Група обов'язкова"),
  faculty: Yup.string().required("Факультет обов'язковий"),
  fullName: fullNameSchema,
  residentPhone: phoneSchema,
  dormNumber: Yup.string()
    .matches(/^\d+$/, "Номер гуртожитку має бути числом")
    .required("Номер гуртожитку обов'язковий"),
  startDay: dateSchema,
  startMonth: monthSchema,
  startYear: yearSchema,
  endDay: dateSchema,
  endMonth: monthSchema,
  endYear: yearSchema,
  applicationDateDay: dateSchema,
  applicationDateMonth: monthSchema,
  applicationDateYear: yearSchema,
  surname: surnameSchema,
});

// Функція для валідації форми
const validateForm = async (data, schema) => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    const errors = {};
    if (error.inner) {
      error.inner.forEach((err) => {
        const path = err.path || "unknownField";
        errors[path] = err.message;
      });
    }
    return { isValid: false, errors };
  }
};

// Функція для прокручування до поля з помилкою
const scrollToErrorFieldFixed = (fieldName) => {
  let element = document.querySelector(`[data-error-field="${fieldName}"]`) ||
                document.querySelector(`input[name="${fieldName}"]`);

  if (element) {
    element.classList.add("errorInput");
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus();
    setTimeout(() => {
      element.classList.remove("errorInput");
    }, 3000);
  }
};

export { fullSchema, validateForm, scrollToErrorFieldFixed };