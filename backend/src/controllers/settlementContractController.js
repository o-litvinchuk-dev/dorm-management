import Joi from "joi";
import { SettlementContract } from "../models/SettlementContract.js"; // Переконайтеся, що тут саме такий імпорт
import { encrypt } from "../utils/crypto.js";

const shortYearDateValidation = (value, helpers) => {
  if (!value || value.length !== 2 || !/^\d\d$/.test(value)) {
    return helpers.error('any.invalid');
  }
  const yearNum = parseInt(value, 10);
  // Припускаємо, що РР означає роки поточного століття або попереднього до 99
  if (yearNum < 0 || yearNum > 99) { 
    return helpers.error('date.format.yy');
  }
  return value;
};

const settlementContractSchema = Joi.object({
  contractDay: Joi.string().length(2).pattern(/^\d+$/).required().messages({'string.pattern.base': 'День договору: XX'}),
  contractMonth: Joi.string().length(2).pattern(/^\d+$/).required().messages({'string.pattern.base': 'Місяць договору: XX'}),
  contractYear: Joi.string().custom(shortYearDateValidation, 'YY date validation').required().messages({'any.invalid': 'Рік договору: РР (00-99)'}),
  proxyNumber: Joi.string().min(1).required().messages({'any.required': 'Номер довіреності обов\'язковий'}),
  proxyDay: Joi.string().length(2).pattern(/^\d+$/).required().messages({'string.pattern.base': 'День довіреності: XX'}),
  proxyMonth: Joi.string().length(2).pattern(/^\d+$/).required().messages({'string.pattern.base': 'Місяць довіреності: XX'}),
  proxyYear: Joi.string().custom(shortYearDateValidation, 'YY date validation').required().messages({'any.invalid': 'Рік довіреності: РР (00-99)'}),
  course: Joi.number().integer().min(1).max(6).required().messages({'any.required': 'Курс обов\'язковий'}),
  group_name: Joi.string().min(1).required().messages({'any.required': 'Група обов\'язкова'}),
  faculty_name: Joi.string().min(1).required().messages({'any.required': 'Факультет обов\'язковий'}),
  fullName: Joi.string().min(5).required().messages({'any.required': 'ПІБ студента обов\'язкове'}),
  passportSeries: Joi.string().length(2).pattern(/^[А-ЯІЇЄҐ]{2}$/i).required().messages({'string.pattern.base': 'Серія паспорта: 2 кириличні літери'}),
  passportNumber: Joi.string().length(6).pattern(/^\d+$/).required().messages({'string.pattern.base': 'Номер паспорта: 6 цифр'}),
  passportIssued: Joi.string().min(5).required().messages({'any.required': 'Ким виданий паспорт - обов\'язково'}),
  taxId: Joi.array().items(Joi.string().length(1).pattern(/^\d$/)).length(10).required().messages({'array.length': 'ІПН має містити 10 цифр'}),
  dormStreet: Joi.string().min(3).required().messages({'any.required': 'Вулиця гуртожитку обов\'язкова'}),
  dormBuilding: Joi.string().min(1).required().messages({'any.required': 'Будинок гуртожитку обов\'язковий'}),
  dormNumber: Joi.string().pattern(/^\d+$/).required().messages({'any.required': 'Номер гуртожитку обов\'язковий'}),
  roomNumber: Joi.string().pattern(/^\d+[А-ЯІЇЄҐа-яіїєґ]?$/).required().messages({'any.required': 'Номер кімнати обов\'язковий'}),
  startDay: Joi.string().length(2).pattern(/^\d+$/).required(),
  startMonth: Joi.string().length(2).pattern(/^\d+$/).required(),
  startYear: Joi.string().custom(shortYearDateValidation, 'YY date validation').required(),
  endDay: Joi.string().length(2).pattern(/^\d+$/).required(),
  endMonth: Joi.string().length(2).pattern(/^\d+$/).required(),
  endYear: Joi.string().custom(shortYearDateValidation, 'YY date validation').required(),
  residentFullName: Joi.string().min(5).required(),
  residentRegion: Joi.string().min(2).required(),
  residentDistrict: Joi.string().min(2).required(),
  residentCity: Joi.string().min(2).required(),
  residentPostalCode: Joi.string().length(5).pattern(/^\d+$/).required(),
  residentPhone: Joi.string().length(9).pattern(/^\d+$/).required(),
  motherPhone: Joi.string().length(9).pattern(/^\d+$/).allow(null, ''),
  fatherPhone: Joi.string().length(9).pattern(/^\d+$/).allow(null, ''),
  parentFullName: Joi.string().min(5).required(),
  day: Joi.string().length(2).pattern(/^\d+$/).required(), // Appendix date day
  month: Joi.string().length(2).pattern(/^\d+$/).required(), // Appendix date month
  year: Joi.string().custom(shortYearDateValidation, 'YY date validation').required(), // Appendix date year
  address: Joi.string().min(5).required(), // Appendix address
  dormManagerName: Joi.string().min(5).required(), // Appendix signature
  residentName: Joi.string().min(5).required(), // Appendix signature
  inventory: Joi.array().items(Joi.object({
    name: Joi.string().allow(''),
    quantity: Joi.string().pattern(/^\d*$/).allow(''), // Allow empty or digits
    note: Joi.string().max(500).allow('')
  })).length(16).required(),
  premisesConditions: Joi.array().items(Joi.object({
    description: Joi.string().max(255).allow(''),
    condition: Joi.string().valid("Добрий", "Задовільний", "Потребує косметичного ремонту", "Потребує капітального ремонту", "Непридатний", "Відсутній", "").allow('')
  })).length(6).required(),
  electricalAppliances: Joi.array().items(Joi.object({
    name: Joi.string().max(100).allow(''),
    brand: Joi.string().max(100).allow(''),
    year: Joi.string().length(4).pattern(/^\d+$/).allow(''), 
    quantity: Joi.string().pattern(/^\d*$/).allow(''),
    note: Joi.string().max(500).allow('')
  })).length(7).required(),
  premisesNumber: Joi.string().required(),
  premisesArea: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).required(),
  dormManagerNameSignature: Joi.string().allow(''), 
  residentNameSignature: Joi.string().allow(''),
  dataProcessingConsent: Joi.boolean().required().valid(true),
  contractTermsConsent: Joi.boolean().required().valid(true),
  dataAccuracyConsent: Joi.boolean().required().valid(true),
}).or('motherPhone', 'fatherPhone').messages({
  'object.missing': 'Потрібно вказати телефон матері або батька.'
});


export const createSettlementContract = async (req, res) => {
  try {
    const { error, value: contractDataFromRequest } = settlementContractSchema.validate(req.body);
    if (error) {
      console.error("[SettlementContractCtrl] Validation error:", error.details.map(d => ({path: d.path, message: d.message})));
      return res.status(400).json({ error: "Невірні дані форми", details: error.details.map(d => d.message) });
    }

    const userId = req.user.userId;

    // Дані, які не шифруються і йдуть напряму або з невеликими трансформаціями
    const contractData = {
      ...contractDataFromRequest, // Включаємо всі поля з запиту
      // Форматуємо телефонні номери
      residentPhone: `+380${contractDataFromRequest.residentPhone}`,
      motherPhone: contractDataFromRequest.motherPhone ? `+380${contractDataFromRequest.motherPhone}` : null,
      fatherPhone: contractDataFromRequest.fatherPhone ? `+380${contractDataFromRequest.fatherPhone}` : null,
    };
    
    // Створюємо об'єкт для шифрування, видаляючи поля, які не потребують шифрування або вже оброблені
    const dataToEncrypt = { ...contractDataFromRequest }; 
    delete dataToEncrypt.residentPhone;
    delete dataToEncrypt.motherPhone;
    delete dataToEncrypt.fatherPhone;

    const encryptedFieldsContainer = {};

    const fieldsToEncrypt = ["fullName", "passportSeries", "passportNumber", "passportIssued", "residentFullName", "parentFullName"];
    fieldsToEncrypt.forEach(field => {
      if (dataToEncrypt[field]) {
        encryptedFieldsContainer[`${field}_encrypted`] = encrypt(dataToEncrypt[field]);
      }
    });
    // Шифруємо телефонні номери окремо, оскільки вони вже відформатовані
    if (contractData.residentPhone) encryptedFieldsContainer.residentPhone_encrypted = encrypt(contractData.residentPhone);
    if (contractData.motherPhone) encryptedFieldsContainer.motherPhone_encrypted = encrypt(contractData.motherPhone);
    if (contractData.fatherPhone) encryptedFieldsContainer.fatherPhone_encrypted = encrypt(contractData.fatherPhone);


    if (dataToEncrypt.taxId) {
      encryptedFieldsContainer.taxId_encrypted = JSON.stringify(dataToEncrypt.taxId.map(digit => digit ? encrypt(digit) : ""));
    }
    
    // Збираємо фінальний об'єкт для передачі в модель
    const finalPayloadToModel = {
      ...contractData, // Нешифровані та вже трансформовані дані
      ...encryptedFieldsContainer, // Всі шифровані поля
      // Видаляємо оригінальні поля, які були зашифровані
      fullName: undefined, 
      passportSeries: undefined,
      passportNumber: undefined,
      passportIssued: undefined,
      residentFullName: undefined,
      parentFullName: undefined,
      taxId: undefined, 
    };


    const contractId = await SettlementContract.create(finalPayloadToModel, userId);
    res.status(201).json({ message: "Договір про поселення успішно створено", contractId });
  } catch (error) {
    console.error("[SettlementContractCtrl] Error creating settlement contract:", error);
    res.status(500).json({ error: "Помилка сервера при створенні договору", details: error.message });
  }
};