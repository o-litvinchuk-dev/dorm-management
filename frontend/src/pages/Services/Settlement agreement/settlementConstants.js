// src/pages/Services/Settlement agreement/settlementConstants.js
export const defaultInventory = [
    { name: "Ліжко", quantity: "", note: "" }, { name: "Матрац", quantity: "", note: "" },
    { name: "Подушка", quantity: "", note: "" }, { name: "Ковдра", quantity: "", note: "" },
    { name: "Стільці", quantity: "", note: "" }, { name: "Стіл", quantity: "", note: "" },
    { name: "Шафа", quantity: "", note: "" }, { name: "Тумбочка", quantity: "", note: "" },
    { name: "Лампа", quantity: "", note: "" }, { name: "Вішалка", quantity: "", note: "" },
    { name: "Дзеркало", quantity: "", note: "" }, { name: "Поличка", quantity: "", note: "" },
    { name: "Килимок", quantity: "", note: "" }, { name: "Штори", quantity: "", note: "" },
    { name: "", quantity: "", note: "" }, { name: "", quantity: "", note: "" },
];

export const defaultElectricalAppliances = Array(7).fill(null).map(() => ({ name: "", brand: "", year: "", quantity: "", note: "" }));
if (defaultElectricalAppliances.length > 0) {
    defaultElectricalAppliances[0].name = "Холодильник";
}

export const defaultPremisesConditions = [
    { description: "Стіни, підлога, стеля (штукатурка, побілка, фарбування, тощо)", condition: "" },
    { description: "Двері і вікна (фарбування, замки)", condition: "" },
    { description: "Електромережа (стан проводки, розеток, вимикачів)", condition: "" },
    { description: "Сантехнічне обладнання", condition: "" },
    { description: "", condition: "" },
    { description: "", condition: "" },
];