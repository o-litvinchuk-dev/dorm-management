import * as Yup from "yup";
import styles from "./styles/AccommodationApplicationPage.module.css"; // Для errorInputStyle

// Helper to check if a date formed from day, month, year (short YY) is valid
const isValidFullDate = (d, m, y_short) => {
  if (!d || !m || !y_short) return false; 
  const dayInt = parseInt(d, 10);
  const monthInt = parseInt(m, 10);
  const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;
  const yearInt = currentCentury + parseInt(y_short, 10);

  if (isNaN(dayInt) || isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12 || dayInt < 1) return false;
  
  const date = new Date(yearInt, monthInt - 1, dayInt); 
  return date.getFullYear() === yearInt && date.getMonth() === monthInt - 1 && date.getDate() === dayInt;
};


const dateDaySchema = Yup.string()
  .matches(/^(0[1-9]|[12]\d|3[01])$/, "День: XX (01-31)")
  .required("День обов'язковий");

const dateMonthSchema = Yup.string()
  .matches(/^(0[1-9]|1[0-2])$/, "Місяць: XX (01-12)")
  .required("Місяць обов'язковий");

const dateYearSchema = Yup.string() 
  .matches(/^\d{2}$/, "Рік: XX (00-99)")
  .required("Рік обов'язковий");

const academicYearPartSchema = Yup.string() 
  .matches(/^\d{4}$/, "Рік: YYYY (наприклад, 2024)")
  .required("Рік навчального року обов'язковий");

const fullNameSchema = Yup.string()
  .matches(
    /^[А-ЯІЇЄҐЁ][а-яіїєґё'-]*(\s[А-ЯІЇЄҐЁ][а-яіїєґё'-]*){1,2}$/,
    "П.І.Б. має складатися з 2-3 слів, кожне з великої літери, кирилиця"
  )
  .required("П.І.Б. обов’язкове");

const phoneSchema = Yup.string()
  .matches(
    /^\d{9}$/,
    "Телефон: XXXXXXXXX (9 цифр)"
  )
  .required("Телефон обов'язковий");

const surnameSchema = Yup.string()
  .matches(
    /^[А-ЯІЇЄҐЁ][а-яіїєґё'-]*$/,
    "Прізвище: з великої літери, кирилиця"
  )
  .required("Прізвище обов'язкове");

export const fullSchema = (validGroupIds = []) => Yup.object().shape({
  faculty: Yup.string().required("Факультет обов'язковий"),
  group: Yup.string()
    .when('faculty', {
      is: (val) => !!val, 
      then: (schema) => schema.test(
        'is-valid-group-for-faculty',
        'Оберіть коректну групу для факультету',
        (value) => !value || validGroupIds.includes(String(value)) 
      ).required("Група обов'язкова"),
      otherwise: (schema) => schema.notRequired(), 
    }),
  course: Yup.number()
    .min(1, "Курс: 1-6")
    .max(6, "Курс: 1-6")
    .required("Курс обов'язковий")
    .typeError("Курс має бути числом"),
  fullName: fullNameSchema,
  surname: surnameSchema,
  residentPhone: phoneSchema,
  dormNumber: Yup.string() 
    .matches(/^\d+$/, "ID гуртожитку має бути числом")
    .required("Гуртожиток обов'язковий"),
  academicYearStart: academicYearPartSchema,
  academicYearEnd: academicYearPartSchema
    .test('is-greater-or-equal', 'Кінцевий рік має бути більшим або рівним початковому', function (value) {
      const { academicYearStart } = this.parent;
      if (!academicYearStart || !value) return true; 
      return parseInt(value, 10) >= parseInt(academicYearStart, 10);
    })
    .test('is-sequential', 'Навчальний рік має бути послідовним (напр. 2024-2025)', function(value){
        const { academicYearStart } = this.parent;
        if (!academicYearStart || !value) return true;
        return parseInt(value, 10) === parseInt(academicYearStart, 10) + 1;
    }),
  startDay: dateDaySchema,
  startMonth: dateMonthSchema,
  startYear: dateYearSchema, 
  endDay: dateDaySchema,
  endMonth: dateMonthSchema,
  endYear: dateYearSchema, 
  applicationDateDay: dateDaySchema,
  applicationDateMonth: dateMonthSchema,
  applicationDateYear: dateYearSchema, 
  preferred_room: Yup.string().max(10, "Бажана кімната: макс. 10 символів").nullable().transform(value => value === "" ? null : value),
  comments: Yup.string().max(1000, "Коментарі: макс. 1000 символів").nullable().transform(value => value === "" ? null : value),
}, [["academicYearStart", "academicYearEnd"]]) 
.test(
  'dates-validation', 
  'Помилка в датах', 
  function (values) { 
    const { 
        startDay, startMonth, startYear, 
        endDay, endMonth, endYear, 
        applicationDateDay, applicationDateMonth, applicationDateYear 
    } = values;
    const errorsList = [];

    const today = new Date();
    today.setHours(0,0,0,0); 

    const startDate = isValidFullDate(startDay, startMonth, startYear) 
        ? new Date(`20${startYear}`, parseInt(startMonth,10) - 1, parseInt(startDay,10)) 
        : null;
    const endDate = isValidFullDate(endDay, endMonth, endYear) 
        ? new Date(`20${endYear}`, parseInt(endMonth,10) - 1, parseInt(endDay,10)) 
        : null;
    const appDate = isValidFullDate(applicationDateDay, applicationDateMonth, applicationDateYear) 
        ? new Date(`20${applicationDateYear}`, parseInt(applicationDateMonth,10) - 1, parseInt(applicationDateDay,10)) 
        : null;
    
    if (!startDate && (startDay || startMonth || startYear)) {
        if(startDay || startMonth || startYear) errorsList.push(this.createError({ path: 'startDay', message: 'Некоректна дата початку' }));
    } 
    // else if (startDate && startDate < today) { // <--- ЗАКОМЕНТОВАНА ПЕРЕВІРКА
    //     errorsList.push(this.createError({ path: 'startDay', message: 'Дата початку не може бути в минулому' }));
    // }

    if (!endDate && (endDay || endMonth || endYear)) {
         if(endDay || endMonth || endYear) errorsList.push(this.createError({ path: 'endDay', message: 'Некоректна дата закінчення' }));
    }

    if (!appDate && (applicationDateDay || applicationDateMonth || applicationDateYear)) {
        if(applicationDateDay || applicationDateMonth || applicationDateYear) errorsList.push(this.createError({ path: 'applicationDateDay', message: 'Некоректна дата заяви' }));
    } else if (appDate && appDate > today) {
        errorsList.push(this.createError({ path: 'applicationDateDay', message: 'Дата заяви не може бути в майбутньому' }));
    }

    if (startDate && endDate && startDate > endDate) {
      errorsList.push(this.createError({ path: 'endDay', message: 'Дата закінчення має бути після або рівна даті початку' }));
    }
    
    return errorsList.length > 0 ? new Yup.ValidationError(errorsList) : true;
  }
);


export const validateForm = async (data, schema) => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    const errors = {};
    if (error.inner) { 
      error.inner.forEach((err) => {
        const path = err.path || "general"; 
        if (path === "general" && err.message === "Помилка в датах" && err.errors && err.errors.length > 0) {
          err.errors.forEach(subErr => {
            if(subErr.path && !errors[subErr.path]) { 
              errors[subErr.path] = subErr.message;
            }
          });
        } else if (!errors[path]) { 
          errors[path] = err.message;
        }
      });
    }
    return { isValid: false, errors };
  }
};


export const scrollToErrorFieldFixed = (fieldName, inputRefsCurrent) => {
    const element = inputRefsCurrent[fieldName] || 
                    document.querySelector(`[data-error-field="${fieldName}"]`) || 
                    document.querySelector(`input[name="${fieldName}"]`) ||
                    document.querySelector(`select[name="${fieldName}"]`) ||
                    document.querySelector(`textarea[name="${fieldName}"]`);
    if (element) {
        element.classList.add(styles.errorInputStyle); 
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus({ preventScroll: true }); 
        setTimeout(() => {
            element.classList.remove(styles.errorInputStyle); 
        }, 3000); 
    } else {
        console.warn(`Element for field "${fieldName}" not found to scroll`);
    }
};