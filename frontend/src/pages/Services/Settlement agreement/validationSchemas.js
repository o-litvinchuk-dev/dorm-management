import * as Yup from "yup";
import { isValidDate } from "./helpers";

const dateDaySchema = (fieldName = "День") => Yup.string().matches(/^(0[1-9]|[12]\d|3[01])$/, `${fieldName}: невірний формат`).required(`${fieldName}: обов'язково`);
const dateMonthSchema = (fieldName = "Місяць") => Yup.string().matches(/^(0[1-9]|1[0-2])$/, `${fieldName}: невірний формат`).required(`${fieldName}: обов'язково`);
const dateYearYYSchema = (fieldName = "Рік") => Yup.string().required(`${fieldName}: обов'язково`);

const fullNameSchema = (fieldName = "П.І.Б.") => Yup.string()
  .matches(/^[А-ЯІЇЄҐ]['А-ЯІЇЄҐа-яіїєґё\s'-]+$/, `${fieldName}: використовуйте кирилицю.`)
  .test('two-three-words', `${fieldName} має містити 2 або 3 слова.`, value => {
    if (!value) return true;
    const wordCount = value.trim().split(/\s+/).length;
    return wordCount >= 2 && wordCount <= 3;
  })
  .required(`${fieldName}: обов'язкове поле`);

const transformDataForValidation = (data) => {
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const getFullYear = (yy) => {
        if (yy && /^\d{2}$/.test(String(yy).trim())) {
        return String(currentCentury + parseInt(yy, 10));
        }
        return yy;
    };
    return {
        ...data,
        contractYear: getFullYear(data.contractYear),
        proxyYear: getFullYear(data.proxyYear),
        startYear: getFullYear(data.startYear),
        endYear: getFullYear(data.endYear),
        applicationDateYear: getFullYear(data.applicationDateYear),
        year_appendix1: getFullYear(data.year_appendix1),
        year_appendix2: getFullYear(data.year_appendix2),
        year_appendix3: getFullYear(data.year_appendix3)
    };
};

const page0Schema = Yup.object({
  contractDay: dateDaySchema("День договору"),
  contractMonth: dateMonthSchema("Місяць договору"),
  contractYear: dateYearYYSchema("Рік договору"),
  applicationId: Yup.string().required("Оберіть затверджену заявку"),
  proxyNumber: Yup.string().required("Номер довіреності обов'язковий"),
  proxyDay: dateDaySchema("День довіреності"),
  proxyMonth: dateMonthSchema("Місяць довіреності"),
  proxyYear: dateYearYYSchema("Рік довіреності"),
  faculty: Yup.string().required("Факультет обов'язковий"),
  group: Yup.string().required("Група обов'язкова"),
  course: Yup.string().required("Курс обов'язковий"),
  fullName: fullNameSchema("П.І.Б. студента"),
  passportSeries: Yup.string().matches(/^[А-ЯІЇЄҐ]{2}$/i, "Серія: 2 кириличні літери").required("Серія паспорта обов'язкова"),
  passportNumber: Yup.string().matches(/^\d{6}$/, "Номер: 6 цифр").required("Номер паспорта обов'язковий"),
  passportIssued: Yup.string().required("Ким виданий паспорт - обов'язково"),
  taxId: Yup.array()
    .of(Yup.string().matches(/^\d?$/, "Лише цифри"))
    .length(10, "ІПН має містити рівно 10 цифр")
    .test('is-fully-filled', 'ІПН має бути заповнений повністю (10 цифр)',
      (array) => !array || !array.some(item => item && item.trim() !== '') || array.every(item => item && item.trim().length === 1)
    )
    .required(),
  dormStreet: Yup.string().required("Вулиця гуртожитку обов'язкова"),
  dormBuilding: Yup.string().required("Номер будинку обов'язковий"),
  dormNumber: Yup.string().required("Номер гуртожитку обов'язковий"),
  roomNumber: Yup.string().matches(/^\d+[А-ЯІЇЄҐа-яіїєґ]?$/, "Формат: 123 або 123а").required("Номер кімнати обов'язковий"),
  startDay: dateDaySchema("День початку"),
  startMonth: dateMonthSchema("Місяць початку"),
  startYear: dateYearYYSchema("Рік початку"),
  applicationDateDay: dateDaySchema("День заяви"),
  applicationDateMonth: dateMonthSchema("Місяць заяви"),
  applicationDateYear: dateYearYYSchema("Рік заяви"),
});

const page7Schema = Yup.object({
  endDay: dateDaySchema("День кінця"),
  endMonth: dateMonthSchema("Місяць кінця"),
  endYear: dateYearYYSchema("Рік кінця"),
});

const page9Schema = Yup.object({
  residentFullName: fullNameSchema("П.І.Б. мешканця"),
  residentRegion: Yup.string().required("Область проживання є обов'язковою"),
  residentDistrict: Yup.string().required("Район проживання є обов'язковим"),
  residentCity: Yup.string().required("Населений пункт є обов'язковим"),
  residentPostalCode: Yup.string().matches(/^\d{5}$/, "Поштовий індекс має складатися з 5 цифр").required("Поштовий індекс є обов'язковим"),
  residentPhone: Yup.string()
    .matches(/^[1-9]\d{8}$/, "Телефон має містити 9 цифр (код оператора і номер)")
    .required("Телефон мешканця є обов'язковим"),
  motherPhone: Yup.string()
    .matches(/^[1-9]\d{8}$/, {
      message: "Телефон має містити 9 цифр (код оператора і номер)",
      excludeEmptyString: true
    })
    .nullable(),
  fatherPhone: Yup.string()
    .matches(/^[1-9]\d{8}$/, {
      message: "Телефон має містити 9 цифр (код оператора і номер)",
      excludeEmptyString: true
    })
    .test(
      "unique-father-phone",
      "Телефон батька не може збігатися з телефоном матері",
      function (value) {
        if (!value || !this.parent.motherPhone) return true;
        return value !== this.parent.motherPhone;
      }
    )
    .nullable(),
  parentFullName: fullNameSchema("П.І.Б. одного з батьків").when(['motherPhone', 'fatherPhone'], {
    is: (motherPhone, fatherPhone) => (motherPhone && motherPhone.length === 9) || (fatherPhone && fatherPhone.length === 9),
    then: (schema) => schema.required("Вкажіть П.І.Б. батьків, оскільки вказано їхній телефон"),
    otherwise: (schema) => schema.notRequired(),
  }),
}).test(
  'atLeastOneParentPhone',
  'Вкажіть телефон хоча б одного з батьків',
  function (values) {
    const { motherPhone, fatherPhone } = values;
    if (!motherPhone && !fatherPhone) {
      return this.createError({
        path: 'atLeastOneParentPhone',
        message: 'Вкажіть телефон хоча б одного з батьків'
      });
    }
    return true;
  }
);

const page10Schema = Yup.object({
  inventory: Yup.array().of(Yup.object().shape({
    name: Yup.string().max(100, "Макс. 100 символів"),
    quantity: Yup.string().when('name', { is: (name) => !!name && name.trim().length > 0, then: (schema) => schema.matches(/^[1-9]\d*$/, "К-ть > 0").required("К-ть"), otherwise: (schema) => schema.nullable() }),
    note: Yup.string().max(500, "Макс. 500 символів").nullable(),
  })),
});

const page11Schema = Yup.object({
    premisesArea_appendix2: Yup.string()
      .matches(/^(\d+(\.\d{1,2})?)?$/, "Формат: 12.34 або залиште порожнім")
      .optional()
      .nullable(),
    premisesConditions: Yup.array().of(
      Yup.object().shape({
        description: Yup.string().max(255).nullable(),
        condition: Yup.string().nullable(),
      })
    ).test('required-conditions', 'Помилка валідації стану приміщень', function(value) {
        if (!value) return true;
        const errors = [];
        value.forEach((item, index) => {
            const hasDefaultDescription = index < 4;
            const hasUserDescription = item.description && item.description.trim().length > 0;
            const hasCondition = item.condition && item.condition.trim().length > 0;

            if (hasDefaultDescription && !hasCondition) {
                errors.push(this.createError({
                    path: `premisesConditions[${index}].condition`,
                    message: `Стан є обов'язковим для пункту ${index + 1}`
                }));
            }
            
            if (!hasDefaultDescription && hasUserDescription && !hasCondition) {
                errors.push(this.createError({
                    path: `premisesConditions[${index}].condition`,
                    message: "Оберіть стан, оскільки введено опис"
                }));
            }
        });

        if (errors.length > 0) {
            return new Yup.ValidationError(errors);
        }
        return true;
    }),
});

// ================== ОСНОВНЕ ВИПРАВЛЕННЯ ТУТ ==================
const page12Schema = Yup.object({
  electricalAppliances: Yup.array().of(Yup.object().shape({
    name: Yup.string().max(100).nullable(),
    brand: Yup.string().max(100).nullable(),
    year: Yup.string()
      .when('name', {
          is: (name) => !!(name && name.trim()),
          then: (schema) => schema.matches(/^\d{4}$/, "Рік: РРРР").test('year-range', 'Рік 1900-поточний', v => !v || (parseInt(v) >= 1900 && parseInt(v) <= new Date().getFullYear())).required("Рік є обов'язковим"),
          otherwise: (schema) => schema.nullable(),
      }),
    quantity: Yup.string()
        .when('name', {
            is: (name) => !!(name && name.trim()),
            then: (schema) => schema.matches(/^[1-9]\d*$/, "К-ть > 0").required("Кількість є обов'язковою"),
            otherwise: (schema) => schema.nullable(),
        }),
    note: Yup.string().max(500).nullable(),
  })),
});
// ================== КІНЕЦЬ ВИПРАВЛЕННЯ ==================


const page13Schema = Yup.object({
  dataProcessingConsent: Yup.boolean().oneOf([true], "Згода на обробку даних обов'язкова").required(),
  contractTermsConsent: Yup.boolean().oneOf([true], "Згода з умовами договору обов'язкова").required(),
  dataAccuracyConsent: Yup.boolean().oneOf([true], "Підтвердження правильності даних обов'язкове").required(),
});

export const pageSchemas = [
  page0Schema, Yup.object(), Yup.object(), Yup.object(), Yup.object(),
  Yup.object(), Yup.object(), page7Schema, Yup.object(), page9Schema,
  page10Schema, page11Schema, page12Schema, page13Schema,
];

const fullValidationSchema = pageSchemas.reduce((acc, schema) => acc.concat(schema), Yup.object())
  .test("date-logic-validation", function (values) {
    const errors = [];
    const transformed = transformDataForValidation(values);
    
    const startDateObj = isValidDate(transformed.startDay, transformed.startMonth, transformed.startYear)
      ? new Date(transformed.startYear, parseInt(transformed.startMonth,10)-1, parseInt(transformed.startDay,10)) : null;
    
    const endDateObj = isValidDate(transformed.endDay, transformed.endMonth, transformed.endYear)
      ? new Date(transformed.endYear, parseInt(transformed.endMonth,10)-1, parseInt(transformed.endDay,10)) : null;
      
    const appDateObj = isValidDate(transformed.applicationDateDay, transformed.applicationDateMonth, transformed.applicationDateYear)
      ? new Date(transformed.applicationDateYear, parseInt(transformed.applicationDateMonth,10)-1, parseInt(transformed.applicationDateDay,10)) : null;

    if (startDateObj && endDateObj && startDateObj >= endDateObj) {
      errors.push(this.createError({ path: 'endDay', message: 'Дата кінця має бути після дати початку' }));
    }
    
    if (appDateObj && appDateObj > new Date()) {
        errors.push(this.createError({ path: 'applicationDateDay', message: 'Дата заяви не може бути у майбутньому' }));
    }
    
    if (errors.length > 0) return new Yup.ValidationError(errors);
    
    return true;
  });

const formatYupErrors = (yupError) => {
    const errors = {};
    if (!yupError.inner || yupError.inner.length === 0) {
        if (yupError.path && yupError.message) errors[yupError.path] = yupError.message;
        return errors;
    }
    yupError.inner.forEach((error) => {
        if (error.path) {
        const pathParts = error.path.replace(/\[(\d+)\]/g, '.$1').split('.');
        let current = errors;
        for(let i = 0; i < pathParts.length - 1; i++){
            const part = pathParts[i];
            if(!current[part]) current[part] = (pathParts[i+1].match(/^\d+$/) ? [] : {});
            current = current[part];
        }
        current[pathParts[pathParts.length - 1]] = error.message;
        }
    });
    return errors;
};

export const validateField = async (fieldName, allData) => {
  const validationData = transformDataForValidation(allData);
  try {
    await fullValidationSchema.validateAt(fieldName, validationData, { abortEarly: false, context: validationData });
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
};

export const validatePages = async (pageIndexes, allData, isFinal = false) => {
  const validationData = transformDataForValidation(allData);
  const schemaToUse = isFinal
    ? fullValidationSchema
    : pageIndexes.reduce((acc, index) => (pageSchemas[index] ? acc.concat(pageSchemas[index]) : acc), Yup.object());

  try {
    await schemaToUse.validate(validationData, { abortEarly: false, context: validationData });
    return { isValid: true, errors: {} };
  } catch (err) {
    return { isValid: false, errors: formatYupErrors(err) };
  }
};