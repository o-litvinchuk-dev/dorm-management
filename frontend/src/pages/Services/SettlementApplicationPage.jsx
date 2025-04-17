import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import styles from "./styles/SettlementApplicationPage.module.css";

const SettlementApplicationPage = () => {
    // Масив із попередньо визначеними назвами для перших 14 пунктів інвентарю
    const predefinedNames = [
        "Шафа з антресоллю",
        "Шафа для білизни",
        "Шафа комбінована",
        "Шафа для одягу",
        "Тумбочка",
        "Стіл кухонний",
        "Стіл письмовий",
        "Стілець",
        "Стілець ІЅО",
        "Табуретка",
        "Антресоль",
        "Ліжко одноярусне",
        "Ліжко двоярусне",
        "Полиця книжкова",
    ];

    // Ініціалізація стану formData з усіма необхідними полями
    const [formData, setFormData] = useState({
        contractDate: new Date().toLocaleDateString("uk-UA", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }),
        proxyNumber: "",
        proxyDate: "",
        course: "",
        group: "",
        faculty: "",
        fullName: "",
        passportSeries: "",
        passportNumber: "",
        passportIssued: "",
        taxId: Array(10).fill(""),
        dormStreet: "",
        dormBuilding: "",
        dormNumber: "",
        roomNumber: "",
        roomType: "ліжко-місце",
        bedCount: "",
        startDay: "",
        startMonth: "",
        startYear: "",
        endDay: "",
        endMonth: "",
        endYear: "",
        residentFullName: "",
        residentRegion: "",
        residentDistrict: "",
        residentCity: "",
        residentPostalCode: "",
        residentPhone: "",
        motherPhone: "",
        fatherPhone: "",
        parentFullName: "",
        contractNumber: "",
        universityRepresentativeName: "",
        inventory: Array.from({ length: 17 }, (_, index) => ({
            name: index < 14 ? predefinedNames[index] : "",
            quantity: "",
            condition: "",
        })),
    });

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [currentSpread, setCurrentSpread] = useState(0);
    const navigate = useNavigate();
    const taxIdRefs = useRef([]);
    const startDayRef = useRef(null);
    const startMonthRef = useRef(null);
    const startYearRef = useRef(null);
    const endDayRef = useRef(null);
    const endMonthRef = useRef(null);
    const endYearRef = useRef(null);

    // Обробник змін для всіх полів, включаючи вкладені поля inventory
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("inventory")) {
            const match = name.match(/inventory\[(\d+)\]\.(\w+)/);
            if (match) {
                const index = parseInt(match[1], 10);
                const field = match[2];
                setFormData((prev) => {
                    const newInventory = [...prev.inventory];
                    newInventory[index] = { ...newInventory[index], [field]: value };
                    return { ...prev, inventory: newInventory };
                });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Обробник для поля taxId
    const handleTaxIdChange = (index, value) => {
        if (value.length > 1) return;
        const newTaxId = [...formData.taxId];
        newTaxId[index] = value;
        setFormData({ ...formData, taxId: newTaxId });
        if (value && index < 9) {
            taxIdRefs.current[index + 1].focus();
        }
    };

    const handleTaxIdKeyDown = (index, e) => {
        if (e.key === "Backspace" && !formData.taxId[index] && index > 0) {
            taxIdRefs.current[index - 1].focus();
        }
    };

    // Обробники для полів дати
    const handleDateInput = (e, nextRef) => {
        const { name, value } = e.target;
        if (value.length === 2 && nextRef) {
            nextRef.current.focus();
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleDateKeyDown = (e, prevRef) => {
        if (e.key === "Backspace" && e.target.value === "" && prevRef) {
            prevRef.current.focus();
        }
    };

    // Обробник відправки форми
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/services/settlement", formData);
            alert("Заявка успішно подана!");
            navigate("/services");
        } catch (error) {
            console.error("Помилка подання заявки:", error);
            alert("Сталася помилка. Спробуйте ще раз.");
        }
    };

    // Список обов'язкових полів для прогрес-бару
    const requiredFields = useMemo(() => {
        const fields = [
            "contractDate",
            "proxyNumber",
            "proxyDate",
            "course",
            "group",
            "faculty",
            "fullName",
            "passportSeries",
            "passportNumber",
            "passportIssued",
            "taxId",
            "dormStreet",
            "dormBuilding",
            "dormNumber",
            "roomNumber",
            "roomType",
            "startDay",
            "startMonth",
            "startYear",
            "endDay",
            "endMonth",
            "endYear",
            "residentFullName",
            "residentRegion",
            "residentDistrict",
            "residentCity",
            "residentPostalCode",
            "residentPhone",
            "motherPhone",
            "fatherPhone",
            "parentFullName",
            "contractNumber",
            "universityRepresentativeName",
        ];
        if (formData.roomType === "кімната") {
            fields.push("bedCount");
        }
        return fields;
    }, [formData.roomType]);

    const filledFields = requiredFields.filter((field) => {
        if (field === "taxId") {
            return formData.taxId.every((char) => char !== "");
        }
        return formData[field];
    }).length;
    const totalFields = requiredFields.length;
    const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;

    // Контент сторінок
    const page1Content = () => {
        return (
            <div className={styles.contractText}>
                <h2 className={styles.centeredTitle}>Договір</h2>
                <p className={styles.dateRight}>
                    м. Київ <span className={styles.fixedDate}>{formData.contractDate}</span>
                </p>
                <p className={styles.justifiedText}>
                    між Національним університетом біоресурсів і природокористування України, в особі директора студентського містечка Стецюка Сергія Васильовича, що діє на підставі довіреності №{" "}
                    <input
                        type="text"
                        name="proxyNumber"
                        value={formData.proxyNumber}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />{" "}
                    від{" "}
                    <input
                        type="text"
                        name="proxyDate"
                        value={formData.proxyDate}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />{" "}
                    {new Date().getFullYear()} з одного боку і студент (аспірант, докторант)
                </p>
                <p className={styles.justifiedText}>
                    <input
                        type="number"
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />{" "}
                    курсу{" "}
                    <input
                        type="text"
                        name="group"
                        value={formData.group}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />{" "}
                    групи,{" "}
                    <input
                        type="text"
                        name="faculty"
                        value={formData.faculty}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />{" "}
                    ННІ/факультету
                </p>
                <div className={styles.fullNameWrapper}>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={styles.fullWidthInput}
                        required
                    />
                    <span className={styles.inputLabel}>(П.І.Б.)</span>
                </div>
                <p className={styles.justifiedText}>
                    Паспорт серії{" "}
                    <input
                        type="text"
                        name="passportSeries"
                        value={formData.passportSeries}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />{" "}
                    №{" "}
                    <input
                        type="text"
                        name="passportNumber"
                        value={formData.passportNumber}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />{" "}
                    виданий{" "}
                    <input
                        type="text"
                        name="passportIssued"
                        value={formData.passportIssued}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />
                </p>
                <div className={styles.taxIdWrapper}>
                    <table className={styles.taxIdTable}>
                        <tbody>
                            <tr>
                                <td className={styles.taxIdLabel}>Ідентифікаційний номер</td>
                                <td className={styles.taxIdInputs}>
                                    {formData.taxId.map((char, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            value={char}
                                            onChange={(e) => handleTaxIdChange(index, e.target.value)}
                                            onKeyDown={(e) => handleTaxIdKeyDown(index, e)}
                                            maxLength="1"
                                            className={styles.taxIdInput}
                                            ref={(el) => (taxIdRefs.current[index] = el)}
                                        />
                                    ))}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className={styles.justifiedText}>Договір Укладено згідно з вимогами чинного законодавства України</p>
                <p className={styles.justifiedText}>
                    (далі - Мешканець), з іншого боку (далі разом Сторони, а кожна окремо Сторона), уклали цей
                    Договір (далі - Договір) про наступне:
                </p>
                <h3 className={styles.centeredTitle}>1. ПРЕДМЕТ ДОГОВОРУ</h3>
                <p className={styles.justifiedText}>
                    1.1. Університет надає, а Мешканець приймає в тимчасове платне користування житлове
                    приміщення (ліжко місце, кімната) для проживання та місця загального користування, укомплектовані меблями та інвентарем
                    (додаток 1), електротехнічним обладнанням згідно акту приймання - передачі (додаток 2) та
                    одночасно забезпечує надання житлово-комунальних послуг.
                </p>
                <p className={styles.justifiedText}>
                    Житлове приміщення знаходиться за адресою м. Київ вул.{" "}
                    <input
                        type="text"
                        name="dormStreet"
                        value={formData.dormStreet}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />{" "}
                    буд.{" "}
                    <input
                        type="text"
                        name="dormBuilding"
                        value={formData.dormBuilding}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />{" "}
                    гуртожиток №{" "}
                    <input
                        type="text"
                        name="dormNumber"
                        value={formData.dormNumber}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />{" "}
                    кімната №{" "}
                    <input
                        type="text"
                        name="roomNumber"
                        value={formData.roomNumber}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />
                </p>
                <p className={styles.justifiedText}>
                    Строк користування житловим приміщенням за цим договором становить з{" "}
                    <input
                        type="text"
                        name="startDay"
                        value={formData.startDay}
                        onChange={(e) => handleDateInput(e, startMonthRef)}
                        onKeyDown={(e) => handleDateKeyDown(e, null)}
                        maxLength="2"
                        placeholder="__"
                        className={styles.inlineInputDate}
                        ref={startDayRef}
                        required
                    />{" "}
                    <input
                        type="text"
                        name="startMonth"
                        value={formData.startMonth}
                        onChange={(e) => handleDateInput(e, startYearRef)}
                        onKeyDown={(e) => handleDateKeyDown(e, startDayRef)}
                        maxLength="2"
                        placeholder="__"
                        className={styles.inlineInputDate}
                        ref={startMonthRef}
                        required
                    />{" "}
                    <input
                        type="text"
                        name="startYear"
                        value={formData.startYear}
                        onChange={handleChange}
                        onKeyDown={(e) => handleDateKeyDown(e, startMonthRef)}
                        maxLength="4"
                        placeholder="20__"
                        className={styles.inlineInputYear}
                        ref={startYearRef}
                        required
                    />{" "}
                    р. по{" "}
                    <input
                        type="text"
                        name="endDay"
                        value={formData.endDay}
                        onChange={(e) => handleDateInput(e, endMonthRef)}
                        onKeyDown={(e) => handleDateKeyDown(e, null)}
                        maxLength="2"
                        placeholder="__"
                        className={styles.inlineInputDate}
                        ref={endDayRef}
                        required
                    />{" "}
                    <input
                        type="text"
                        name="endMonth"
                        value={formData.endMonth}
                        onChange={(e) => handleDateInput(e, endYearRef)}
                        onKeyDown={(e) => handleDateKeyDown(e, endDayRef)}
                        maxLength="2"
                        placeholder="__"
                        className={styles.inlineInputDate}
                        ref={endMonthRef}
                        required
                    />{" "}
                    <input
                        type="text"
                        name="endYear"
                        value={formData.endYear}
                        onChange={handleChange}
                        onKeyDown={(e) => handleDateKeyDown(e, endMonthRef)}
                        maxLength="4"
                        placeholder="20__"
                        className={styles.inlineInputYear}
                        ref={endYearRef}
                        required
                    />{" "}
                    р.
                </p>
            </div>
        );
    };

    const page2Content = () => {
        return (
            <div className={styles.contractText}>
                <h3>2. ПРАВА СТОРІН</h3>
                <p className={styles.justifiedText}>2.1 Університет має право:</p>
                <p className={styles.justifiedText}>
                    2.1.1. Вимагати від Мешканця дотримання умов цього Договору. Правил внутрішнього розпорядку
                    в гуртожитках Університету, Положення про порядок поселення (переселення, виселення)
                    студентів та аспірантів (докторантів) університету в гуртожитки студентського містечка
                    Університету та інших нормативно-правових актів України, що регулюють зазначені договірні
                    відносини (далі нормативно-правові акти, що регулюють відносини, які складають предмет
                    цього Договору).
                </p>
                <p className={styles.justifiedText}>
                    2.1.2. Достроково припинити дію Договору в односторонньому порядку у випадку порушення
                    Мешканцем нормативно-правових актів, що регулюють відносини, які складають предмет цього
                    Договору.
                </p>
                <p className={styles.justifiedText}>
                    2.1.3. Перевіряти, спільно з представниками органу студентського самоврядування
                    Університету, санітарний та технічний стан наданого Мешканцю житлового приміщення.
                </p>
                <p className={styles.justifiedText}>
                    2.1.4. Здійснювати фото відео зйомку доказів порушення Мешканцем норм чинного законодавства
                    України і локальних актів Університету.
                </p>
                <p className={styles.justifiedText}>
                    2.1.5. Вимагати від Мешканця своєчасного внесення плати за користування житловим
                    приміщенням.
                </p>
                <p className={styles.justifiedText}>
                    2.1.6. У випадку проведення Університетом капітальних ремонтних робіт та вразі необхідності
                    при проведенні поточних ремонтних робіт переселити Мешканця в інше житлове приміщення на
                    час проведення ремонту.
                </p>
                <p className={styles.justifiedText}>
                    2.1.7. Скласти акт про завдання Мешканцем матеріальних збитків майну чи інвентарю та
                    отримати відшкодування збитків згідно чинного законодавства України.
                </p>
                <p className={styles.justifiedText}>
                    2.1.8. Вимагати від Мешканця дублікат ключа від кімнати в якій він проживає
                </p>
                <p className={styles.justifiedText}>
                    2.1.9. Вимагати від Мешканця звільнення житлового приміщення після закінчення строку
                    користування, обумовленого цим Договором.
                </p>
                <p className={styles.justifiedText}>
                    2.1.10. Перевіряти дотримання виконання умов Договору. Перевірку можуть здійснювати: ректор, проректори, директор студентського містечка, директор ННЦ виховної роботи та соціального розвитку, начальник відділу виховної роботи та студентських справ, начальник відділу соціальної роботи, завідувач гуртожитку, працівники відділу комплексної безпеки та ЄТЗ об'єктів охорони, представники органів студентського самоврядування Університету та інші особи за дорученням ректора, проректорів.
                </p>
            </div>
        );
    };

    const page3Content = () => {
        return (
            <div className={styles.contractText}>
                <p className={styles.justifiedText}>
                    2.1.11. Відвідувати кімнату в присутності адміністрації гуртожитку та/або представників органів студентського самоврядування Університету і перевіряти загальний стан житлової кімнати (в т.ч. при відсутності мешканців).
                </p>
                <p className={styles.justifiedText}>
                    2.1.12. При не виконані Мешканцем зобов'язань взятих ним у п. 3.2.17 адміністрація Університету має право відкрити кімнату в присутності представників органів студентського самоврядування Університету, залишені речі самостійно перемістити у будь-яке інше приміщення без зобов'язань Університету за їх збереження перед Мешканцем.
                </p>
                <p className={styles.justifiedText}>
                    2.1.13. Переселяти тимчасово Мешканця в інше житлове приміщення за рішенням адміністрації Університету у разі відсутності бюджетного фінансування або фінансування в неповному обсязі видатків на теплопостачання, водопостачання та водовідведення, електроенергію, природній газ та інші енергоносії, проведення дератизації чи дезінсекції в гуртожитку або за інших форс-мажорних обставин, викликаних воєнним станом в країні, або у зв'язку з необхідністю тимчасового припинення функціонування гуртожитку на час зимового періоду, які в цей період не опалюються.
                </p>
                <p className={styles.justifiedText}>2.2. Мешканець має право:</p>
                <p className={styles.justifiedText}>
                    2.2.1. Вимагати від Університету виконання обов'язків передбачених нормативно-правовими актами, що регулюють відносини, які складають предмет цього Договору.
                </p>
                <p className={styles.justifiedText}>
                    2.2.2. Користуватися житловими приміщеннями, місцями загального користування, приміщеннями навчального, культурно-побутового та спортивного призначення та житлово-комунальними послугами відповідно до умов Договору.
                </p>
                <p className={styles.justifiedText}>
                    2.2.3. Обирати органи студентського самоврядування гуртожитку і бути обраним до їх складу. Через них брати участь у вирішені питань пов'язаних з поліпшенням житлово-побутових умов, організації культурно-виховної роботи, дозвілля тощо.
                </p>
                <p className={styles.justifiedText}>
                    2.2.4. Звертатись до адміністрації Університету, інших державних установ та відомств відповідно до Закону України «Про звернення громадян» з скаргами щодо незадовільної роботи працівників гуртожитку та невідповідності житлово-побутових умов проживання вимогам чинного законодавства України.
                </p>
                <p className={styles.justifiedText}>
                    2.2.5. Достроково припинити дію договору шляхом подачі відповідної письмової заяви.
                </p>
            </div>
        );
    };

    const page4Content = () => {
        return (
            <div className={styles.contractText}>
                <h3 className={styles.centeredTitle}>3. ОБОВ'ЯЗКИ СТОРІН</h3>
                <p className={styles.justifiedText}>3.1. Університет зобов'язаний:</p>
                <p className={styles.justifiedText}>
                    3.1.1. Утримувати гуртожиток відповідно до встановлених санітарних правил, норм експлуатації та ремонту житлового фонду.
                </p>
                <p className={styles.justifiedText}>
                    3.1.2. Забезпечувати надання Мешканцю житлово-комунальних послуг (в тому числі гаряче водопостачання згідно графіка) відповідно до санітарних норм і виділити для цих цілей необхідні приміщення згідно п. 1.1. Договору.
                </p>
                <p className={styles.justifiedText}>
                    3.1.3. Організовувати проведення поточного та капітального ремонту гуртожитку, інвентарю, обладнання, згідно з планом ремонтних робіт на календарний рік. Своєчасно проводити підготовку гуртожитку і його технічного обладнання до експлуатації в осінньо-зимовий період.
                </p>
                <p className={styles.justifiedText}>
                    3.1.4. У разі виникнення надзвичайних ситуацій та аварій негайно вживати заходів по ліквідації їх наслідків.
                </p>
                <p className={styles.justifiedText}>
                    3.1.5. Ознайомити Мешканця при підписанні Договору з нормативно-правовими актами, що регулюють відносини, які складають предмет цього Договору.
                </p>
                <p className={styles.justifiedText}>
                    3.1.6. Надати Мешканцю перепустку для його входу в гуртожиток.
                </p>
                <p className={styles.justifiedText}>
                    3.1.7. Проводити обмін постільної білизни відповідно до санітарних норм.
                </p>
                <p className={styles.justifiedText}>
                    3.1.8. Після припинення дії цього Договору прийняти приміщення від Мешканця за актом приймання-передачі у стані, в якому приміщення було передано Університетом.
                </p>
                <p className={styles.justifiedText}>3.2. Мешканець зобов'язаний:</p>
                <p className={styles.justifiedText}>
                    3.2.1. Користуватися наданими житловим приміщенням, майном, місцями загального користування виключно за прямим призначенням і на рівних правах з іншими мешканцями.
                </p>
                <p className={styles.justifiedText}>
                    3.2.2. Знати і дотримуватися положень нормативно-правових актів, які передбачені п. 2.1.1 цього Договору.
                </p>
                <p className={styles.justifiedText}>
                    3.2.3. Перед поселенням у гуртожиток пройти медичний огляд, подати необхідні документи для оформлення поселення та при необхідності реєстрації місця проживання.
                </p>
                <p className={styles.justifiedText}>
                    3.2.4. Житлове приміщення використовувати виключно для особистого проживання.
                </p>
            </div>
        );
    };

    const page5Content = () => {
        return (
            <div className={styles.contractText}>
                <p className={styles.justifiedText}>
                    3.2.5. Своєчасно сплачувати за тимчасове користування житловим приміщенням згідно Положення про порядок поселення (переселення, виселення) студентів та аспірантів (докторантів) університету в гуртожитки студентського містечка Університету та додаткові послуги (додаток 3) відповідно до цього Договору та наказу Ректора. При цьому оплата за використану електроенергію власними приладами зазначених у додатку 3 проводиться Мешканцем додатково відповідно до затверджених кошторисів на відшкодування витрат.
                </p>
                <p className={styles.justifiedText}>
                    3.2.6. Здійснювати вхід до гуртожитку за пред'явленням перепустки встановленого Університетом зразка.
                </p>
                <p className={styles.justifiedText}>
                    3.2.7. При запрошені відвідувача до гуртожитку зустріти його біля входу, залишити свою перепустку та документ, що засвідчує особу відвідувача черговому по гуртожитку, особисто забезпечити залишення гостем гуртожитку до 22:00 години. Відвідування дозволено з 10:00 до 22:00 год.
                </p>
                <p className={styles.justifiedText}>
                    3.2.8. Постійно підтримувати чистоту і порядок у своїй кімнаті та у місцях загального користування, брати участь у всіх видах робіт, пов'язаних із самообслуговуванням гуртожитку та його благоустроєм, брати участь в проведенні ремонтних робіт, в т.ч. за власний рахунок.
                </p>
                <p className={styles.justifiedText}>
                    3.2.9. Забезпечити наявність дублікатів ключів від кімнати в завідувача гуртожитку.
                </p>
                <p className={styles.justifiedText}>
                    3.2.10. Надавати доступ до житлових кімнат особам зазначеним в п. 2.1.10.
                </p>
                <p className={styles.justifiedText}>
                    3.2.11. Дбайливо ставитись до майна гуртожитку, економно витрачати тепло-електроенергію, газ і воду.
                </p>
                <p className={styles.justifiedText}>
                    3.2.12. Своєчасно подавати заявки на ремонт або заміну електричного обладнання, меблів тощо.
                </p>
                <p className={styles.justifiedText}>
                    3.2.13. Суворо дотримуватись правил пожежної безпеки при користуванні електричними, газовими та іншими приладами та обладнанням.
                </p>
                <p className={styles.justifiedText}>
                    3.2.14. Негайно повідомляти Університет (адміністрацію гуртожитку або чергових по гуртожитку) про будь-які пошкодження, аварії або інші неполадки в результаті яких завдано (або можуть привести) матеріальні збитки житловому приміщенню (гуртожитку), а також своєчасно прийняти заходи для запобігання можливості подальшого руйнування або пошкодження житлового приміщення (гуртожитку).
                </p>
                <p className={styles.justifiedText}>
                    3.2.15. Відшкодовувати у встановленому чинним законодавством України порядку заподіяні матеріальні збитки майну гуртожитку, пошкодження житлового приміщення тощо.
                </p>
                <p className={styles.justifiedText}>
                    3.2.16. Тимчасово переселятись в інше житлове приміщення відповідно до пункту 2.1.13.
                </p>
            </div>
        );
    };

    const page6Content = () => {
        return (
            <div className={styles.contractText}>
                <p className={styles.justifiedText}>
                    3.2.17. Після закінчення навчання або при достроковому припинення дії Договору згідно п. 7.4. Договору, здати в належному та придатному для проживання стані житлове приміщення (вільне від особистих речей) та майно гуртожитку, що перебувало в користуванні, відповідно до Акту приймання - передачі (додаток 2) та виселитись з гуртожитку в трьохденний термін від дня видачі відповідного наказу.
                </p>
                <p className={styles.justifiedText}>
                    3.2.18. У зв'язку з введенням воєнного стану в Україні Указом Президента України від 24 лютого 2022 року No64/2022 «Про введення воєнного стану в Україні» дотримуватись загальних правил поведінки мешканців гуртожитків студентського містечка НУБіП України в умовах воєнного стану та комендантської години.
                </p>
                <h3 className={styles.centeredTitle}>4. МЕШКАНЦЮ ЗАБОРОНЯЄТЬСЯ:</h3>
                <p className={styles.justifiedText}>
                    4.1. Без дозволу завідувача гуртожитку:
                </p>
                <p className={styles.justifiedText}>
                    - переселятися з однієї кімнати в іншу;
                </p>
                <p className={styles.justifiedText}>
                    - переробляти чи переносити інвентар і меблі гуртожитку з одного приміщення до іншого або виносити їх з гуртожитку.
                </p>
                <p className={styles.justifiedText}>
                    4.2. Проводити електромонтажні роботи в кімнатах та в гуртожитку, переробляти і ремонтувати електроустаткування.
                </p>
                <p className={styles.justifiedText}>
                    4.3. Проводити переобладнання та реконструкцію житлового приміщення.
                </p>
                <p className={styles.justifiedText}>
                    4.4. Користуватися та зберігати в житлових кімнатах електрообігрівачі, мікрохвильові печі, електрочайники, мультиварки та інші потужні енергоємні електроприлади.
                </p>
                <p className={styles.justifiedText}>
                    4.5. Використовувати холодильники рік випуску яких передує 2007 року.
                </p>
                <p className={styles.justifiedText}>
                    4.6. Порушувати тишу з 22:00 год. до 07:00 год.
                </p>
                <p className={styles.justifiedText}>
                    4.7. Залишати сторонніх осіб у гуртожитку та мешканців інших кімнат цього ж гуртожитку після 22:00 год. без письмового дозволу завідувача гуртожитку.
                </p>
                <p className={styles.justifiedText}>
                    4.8. Утримувати в гуртожитку тварин.
                </p>
            </div>
        );
    };

    const page7Content = () => {
        return (
            <div className={styles.contractText}>
                <p className={styles.justifiedText}>
                    4.9. Допускати антисанітарний стан в житловій кімнаті та місцях загального користування.
                </p>
                <p className={styles.justifiedText}>
                    4.10. Викидати відходи від приготування їжі в туалети та раковини.
                </p>
                <p className={styles.justifiedText}>
                    4.11. Прати білизну у раковинах для миття посуду та умивання.
                </p>
                <p className={styles.justifiedText}>
                    4.12. Псувати майно гуртожитку.
                </p>
                <p className={styles.justifiedText}>
                    4.13. Палити в гуртожитку та на його території сигарети, в тому числі електронні сигарети і кальян, крім спеціально відведених для цього місць.
                </p>
                <p className={styles.justifiedText}>
                    4.14. Проносити, вживати та зберігати в гуртожитку спиртні та слабоалкогольні напої, наркотичні або токсичні речовини, включаючи електронні сигарети та кальян.
                </p>
                <p className={styles.justifiedText}>
                    4.15. Перебувати в гуртожитку в стані алкогольного, токсичного або наркотичного сп'яніння.
                </p>
                <p className={styles.justifiedText}>
                    4.16. Зберігати вогнепальну, пневматичну і холодну зброю, пристрої для відстрілу гумових куль.
                </p>
                <p className={styles.justifiedText}>
                    4.17. Зберігати та користуватися вогненебезпечними та хімічно-агресивними речовинами у гуртожитку.
                </p>
                <h3 className={styles.centeredTitle}>5. ПЛАТА ЗА КОРИСТУВАННЯ ЖИТЛОВИМ ПРИМІЩЕННЯМ</h3>
                <p className={styles.justifiedText}>
                    5.1. Розмір оплати за користування житловим приміщенням, визначається розрахунками вартості 1-го ліжко-місця за місяць та затверджуються наказом ректора Університету.
                </p>
                <p className={styles.justifiedText}>
                    5.2. Мешканець здійснює оплату за користування житловим приміщенням згідно Положення про порядок поселення (переселення, виселення) студентів та аспірантів (докторантів) університету в гуртожитки студентського містечка, в якому зазначаються строки та порядок платежів.
                </p>
                <p className={styles.justifiedText}>
                    5.3. Моментом виконання зобов'язання по оплаті за житло є дата зарахування коштів на розрахунковий рахунок Університету.
                </p>
                <p className={styles.justifiedText}>
                    5.4. Університет має право збільшити вартість проживання у гуртожитку, про що видається відповідний наказ Ректора. При незгоді Мешканця з вартістю проживання він має право розірвати цей Договір в односторонньому порядку шляхом надання Університету письмового повідомлення та погашення заборгованості за проживання.
                </p>
                <p className={styles.justifiedText}>
                    5.5. Якщо Мешканець належить до пільгових категорій громадян йому надаються пільги по оплаті за наказами ректора Університету згідно норм чинного законодавства України.
                </p>
            </div>
        );
    };

    const page8Content = () => {
        return (
            <div className={styles.contractText}>
                <h3 className={styles.centeredTitle}>6. ВІДПОВІДАЛЬНІСТЬ СТОРІН</h3>
                <p className={styles.justifiedText}>
                    6.1. За порушення умов Договору, його невиконання або неналежне виконання Сторони несуть відповідальність згідно чинного законодавства України.
                </p>
                <p className={styles.justifiedText}>
                    6.2. У разі заподіяння збитків майну Університету, житловому приміщенню, місцям загального користування, м'якому чи твердому інвентарю, обладнанню, іншому майну Університету, чи третім особам, Мешканець гуртожитку зобов'язаний відшкодувати їх у повному обсязі згідно з законодавством України.
                </p>
                <p className={styles.justifiedText}>
                    6.3. У випадку порушення Мешканцем Правил внутрішнього розпорядку в студентських гуртожитках Університету, систематичного невиконання зобов'язань згідно п. 3.2 Р. 3 Договору, вчинення заборонених дій, передбачених у Р. 4 Договору, адміністрацією та студентською радою гуртожитку може бути ініційоване питання про дострокове припинення дії Договору.
                </p>
                <h3 className={styles.centeredTitle}>7. СТРОК ДІЇ ДОГОВОРУ</h3>
                <p className={styles.justifiedText}>
                    7.1. Цей Договір вважається укладеним і набирає чинності з моменту його підписання Сторонами, а закінчується «
                    <input
                        type="text"
                        name="endDay"
                        value={formData.endDay}
                        onChange={(e) => handleDateInput(e, endMonthRef)}
                        onKeyDown={(e) => handleDateKeyDown(e, null)}
                        maxLength="2"
                        placeholder="__"
                        className={styles.inlineInputDate}
                        ref={endDayRef}
                        required
                    />{" "}
                    <input
                        type="text"
                        name="endMonth"
                        value={formData.endMonth}
                        onChange={(e) => handleDateInput(e, endYearRef)}
                        onKeyDown={(e) => handleDateKeyDown(e, endDayRef)}
                        maxLength="2"
                        placeholder="__"
                        className={styles.inlineInputDate}
                        ref={endMonthRef}
                        required
                    />{" "}
                    <input
                        type="text"
                        name="endYear"
                        value={formData.endYear}
                        onChange={handleChange}
                        onKeyDown={(e) => handleDateKeyDown(e, endMonthRef)}
                        maxLength="4"
                        placeholder="20__"
                        className={styles.inlineInputYear}
                        ref={endYearRef}
                        required
                    />{" "}
                    р.
                </p>
                <p className={styles.justifiedText}>
                    7.2. Закінчення строку цього Договору не звільняє Сторони від відповідальності за його порушення, яке мало місце під час дії цього Договору.
                </p>
                <p className={styles.justifiedText}>
                    7.3. Закінчення строку дії цього Договору не звільняє Сторони від виконання тих зобов'язань, що лишилися невиконаними.
                </p>
                <p className={styles.justifiedText}>
                    7.4. Цей Договір може бути достроково розірваний: Університетом в односторонньому порядку з письмовим попередженням за 3 доби Мешканця у будь-яку пору року без надання іншого житлового приміщення. Підставами для дострокового припинення дії Договору є:
                </p>
                <p className={styles.justifiedText}>
                    - відрахування Мешканця з Університету або переведення на заочну форму навчання;
                </p>
                <p className={styles.justifiedText}>
                    - надання Мешканцю академічної відпустки;
                </p>
                <p className={styles.justifiedText}>
                    - рішення Постійно діючої комісії з контролю за дотриманням правил внутрішнього розпорядку;
                </p>
                <p className={styles.justifiedText}>
                    - несплата коштів або несвоєчасна сплата (борг більше 2-х місяців) за проживання у гуртожитку.
                </p>
            </div>
        );
    };

    // Нова сторінка 9 (ліва сторінка п’ятого розвороту)
    const page9Content = () => {
        return (
            <div className={styles.contractText}>
                <h3 className={styles.centeredTitle}>8. ПРИКІНЦЕВІ ПОЛОЖЕННЯ</h3>
                <p className={styles.justifiedText}>
                    8.1. Спірні питання, які можуть виникнути між Сторонами у зв'язку з виконанням цього Договору, вирішуються шляхом проведення переговорів. Якщо таке врегулювання стає неможливим і Сторонам не вдалося досягти згоди, всі спори між Сторонами вирішуються у судовому порядку за місцем знаходження Університету.
                </p>
                <p className={styles.justifiedText}>
                    8.2. Взаємовідносини Сторін, що не врегульовані цим Договором, регулюються чинним законодавством України та локальними актами Університету.
                </p>
                <p className={styles.justifiedText}>
                    8.3. Недійсність окремих положень цього Договору не тягне за собою недійсність Договору в цілому.
                </p>
                <p className={styles.justifiedText}>
                    8.4. Цей Договір складений при повному розумінні Сторонами його умов та термінології українською мовою у двох автентичних примірниках, які мають однакову юридичну силу, по одному для кожної із Сторін.
                </p>
                <p className={styles.justifiedText}>
                    8.5. Додаткові угоди та додатки до цього Договору є його невід'ємною частиною і мають юридичну силу у разі, якщо вони викладені у письмовій формі, підписані Сторонами.
                </p>
                <p className={styles.justifiedText}>
                    8.6. Мешканець, підписуючи цей Договір, підтверджує, що він ознайомлений з Правилами внутрішнього розпорядку в гуртожитках Університету, Положенням про студентський гуртожиток та іншими нормативно-правовими актами, що регулюють предмет цього Договору.
                </p>
                <h4>Додатки:</h4>
                <p className={styles.justifiedText}>
                    1. Перелік меблів і м'якого інвентарю.
                </p>
                <p className={styles.justifiedText}>
                    2. Акт приймання передачі житлового приміщення.
                </p>
                <p className={styles.justifiedText}>
                    3. Перелік власних приладів, що споживають електроенергію, оплата за яку здійснюється Мешканцем додатково.
                </p>
            </div>
        );
    };

    // Нова сторінка 10 (права сторінка п’ятого розвороту)
    const page10Content = () => {
        return (
            <div className={styles.contractText}>
                <h3 className={styles.centeredTitle}>АДРЕСИ ТА РЕКВІЗИТИ СТОРІН</h3>
                <div className={styles.twoColumnLayout}>
                    <div className={styles.leftColumn}>
                        <h4>Університет</h4>
                        <p className={styles.justifiedText}>
                            Національний університет біоресурсів і природокористування України
                        </p>
                        <p className={styles.justifiedText}>
                            вул. Героїв Оборони, 15, м. Київ, 03041
                        </p>
                        <p className={styles.justifiedText}>
                            IBAN: UA338201720313281002202016289
                        </p>
                        <p className={styles.justifiedText}>
                            Державна казначейська служба України м. Київ
                        </p>
                        <p className={styles.justifiedText}>
                            код банку 820172
                        </p>
                        <p className={styles.justifiedText}>
                            код ЄДРПОУ 00493706
                        </p>
                        <div className={styles.signatureBlock}>
                            <p className={styles.justifiedText}>Сергій СТЕЦЮК</p>
                            <p className={styles.justifiedText}>Підпис</p>
                        </div>
                    </div>
                    <div className={styles.rightColumn}>
                        <h4>Мешканець</h4>
                        {/* Поле П.І.Б. як на сторінці 1 */}
                        <div className={styles.fullNameWrapper}>
                            <input
                                type="text"
                                name="residentFullName"
                                value={formData.residentFullName}
                                onChange={handleChange}
                                className={styles.fullWidthInput}
                                required
                            />
                            <span className={styles.inputLabel}>(П.І.Б.)</span>
                        </div>
    
                        <p className={styles.justifiedText}>Поштова адреса:</p>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>Область:</label>
                            <input
                                type="text"
                                name="residentRegion"
                                value={formData.residentRegion}
                                onChange={handleChange}
                                className={styles.stretchedInput}
                                required
                            />
                        </div>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>Район:</label>
                            <input
                                type="text"
                                name="residentDistrict"
                                value={formData.residentDistrict}
                                onChange={handleChange}
                                className={styles.stretchedInput}
                                required
                            />
                        </div>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>Населений пункт:</label>
                            <input
                                type="text"
                                name="residentCity"
                                value={formData.residentCity}
                                onChange={handleChange}
                                className={styles.stretchedInput}
                                required
                            />
                        </div>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>Поштовий індекс:</label>
                            <input
                                type="text"
                                name="residentPostalCode"
                                value={formData.residentPostalCode}
                                onChange={handleChange}
                                className={styles.stretchedInput}
                                required
                            />
                        </div>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>Контактний тел.:</label>
                            <input
                                type="text"
                                name="residentPhone"
                                value={formData.residentPhone}
                                onChange={handleChange}
                                className={styles.stretchedInput}
                                required
                            />
                        </div>
    
                        <p className={styles.justifiedText}>Телефон батьків:</p>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>Мама:</label>
                            <input
                                type="text"
                                name="motherPhone"
                                value={formData.motherPhone}
                                onChange={handleChange}
                                className={styles.stretchedInput}
                                required
                            />
                        </div>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>Тато:</label>
                            <input
                                type="text"
                                name="fatherPhone"
                                value={formData.fatherPhone}
                                onChange={handleChange}
                                className={styles.stretchedInput}
                                required
                            />
                        </div>
    
                        {/* Поле П.І.Б. одного з батьків як на сторінці 1 */}
                        <div className={styles.fullNameWrapper}>
                            <input
                                type="text"
                                name="parentFullName"
                                value={formData.parentFullName}
                                onChange={handleChange}
                                className={styles.fullWidthInput}
                                required
                            />
                            <span className={styles.inputLabel}>(П.І.Б. одного з батьків)</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    // Нова сторінка 10 (права сторінка п’ятого розвороту)
    const page11Content = () => {
        return (
            <div className={styles.contractText}>
                {/* 1. Текст "Додаток №1" зверху справа */}
                <p className={styles.rightText}>Додаток №1</p>
    
                {/* 2. Заголовок "ПЕРЕЛІК" та підзаголовок */}
                <h3 className={styles.centeredTitle}>ПЕРЕЛІК</h3>
                <p className={styles.centeredText}>меблів і м'якого інвентарю</p>
    
                {/* 3. Інпути для дати з правого краю */}
                <div className={styles.rightText}>
                    <input
                        type="text"
                        name="endDay"
                        value={formData.endDay}
                        onChange={(e) => handleDateInput(e, endMonthRef)}
                        onKeyDown={(e) => handleDateKeyDown(e, null)}
                        maxLength="2"
                        placeholder="__"
                        className={styles.inlineInputDate}
                        ref={endDayRef}
                        required
                    />{" "}
                    <input
                        type="text"
                        name="endMonth"
                        value={formData.endMonth}
                        onChange={(e) => handleDateInput(e, endYearRef)}
                        onKeyDown={(e) => handleDateKeyDown(e, endDayRef)}
                        maxLength="2"
                        placeholder="__"
                        className={styles.inlineInputDate}
                        ref={endMonthRef}
                        required
                    />{" "}
                    <input
                        type="text"
                        name="endYear"
                        value={formData.endYear}
                        onChange={handleChange}
                        onKeyDown={(e) => handleDateKeyDown(e, endMonthRef)}
                        maxLength="4"
                        placeholder="20__"
                        className={styles.inlineInputYear}
                        ref={endYearRef}
                        required
                    />{" "}
                    р.
                </div>
    
                {/* 4. Текст та інпути для "Кімната №" та "Гуртожиток №" */}
                <p className={styles.justifiedText}>
                    Кімната №{" "}
                    <input
                        type="text"
                        name="roomNumber"
                        value={formData.roomNumber}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />{" "}
                    гуртожиток №{" "}
                    <input
                        type="text"
                        name="dormNumber"
                        value={formData.dormNumber}
                        onChange={handleChange}
                        className={styles.inlineInput}
                        required
                    />
                </p>
    
                {/* 5. Великий інпут для адреси */}
                <p className={styles.justifiedText}>
                    за адресою:{" "}
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={styles.fullWidthInput}
                        required
                    />
                </p>
    
                {/* 6. Таблиця інвентарю */}
                <table className={styles.inventoryTable}>
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Назва інвентарю</th>
                            <th>Кількість</th>
                            <th>Придатність</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.inventory.map((item, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                    <input
                                        type="text"
                                        name={`inventory[${index}].name`}
                                        value={item.name}
                                        onChange={handleChange}
                                        className={styles.tableInput}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        name={`inventory[${index}].quantity`}
                                        value={item.quantity}
                                        onChange={handleChange}
                                        className={styles.tableInput}
                                        min="0"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        name={`inventory[${index}].condition`}
                                        value={item.condition}
                                        onChange={handleChange}
                                        className={styles.tableInput}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
    
                {/* Поля для підписів */}
                <div className={styles.signatureSection}>
                    <div className={styles.signatureBlock}>
                        <p className={styles.justifiedText}>Університет</p>
                        <div className={styles.fullNameWrapper}>
                            <input
                                type="text"
                                name="universityRepresentativeName"
                                value={formData.universityRepresentativeName}
                                onChange={handleChange}
                                className={styles.fullWidthInput}
                                required
                            />
                            <span className={styles.inputLabel}>(П.І.Б.)</span>
                        </div>
                        <p className={styles.justifiedText}>Підпис _______________</p>
                    </div>
                    <div className={styles.signatureBlock}>
                        <p className={styles.justifiedText}>Мешканець</p>
                        <div className={styles.fullNameWrapper}>
                            <input
                                type="text"
                                name="residentFullName"
                                value={formData.residentFullName}
                                onChange={handleChange}
                                className={styles.fullWidthInput}
                                required
                            />
                            <span className={styles.inputLabel}>(П.І.Б.)</span>
                        </div>
                        <p className={styles.justifiedText}>Підпис _______________</p>
                    </div>
                </div>
            </div>
        );
    };

    // Масив усіх сторінок
    const allPages = [
        page1Content,
        page2Content,
        page3Content,
        page4Content,
        page5Content,
        page6Content,
        page7Content,
        page8Content,
        page9Content,
        page10Content,
        page11Content,
    ];

    // Розрахунок кількості розворотів
    const totalSpreads = Math.ceil(allPages.length / 2);

    // Функція для відображення поточного розвороту
    const spreadContent = () => {
        const leftPageIndex = currentSpread * 2;
        const rightPageIndex = leftPageIndex + 1;

        const leftPage = allPages[leftPageIndex] ? allPages[leftPageIndex]() : null;
        const rightPage = allPages[rightPageIndex] ? allPages[rightPageIndex]() : null;

        return (
            <>
                <div className={styles.pageLeft}>{leftPage || <p>Порожня сторінка</p>}</div>
                <div className={styles.pageRight}>{rightPage || <p>Порожня сторінка</p>}</div>
            </>
        );
    };

    // Компонент для кнопок навігації
    const NavigationButtons = () => {
        return (
            <div className={styles.navigation}>
                {currentSpread > 0 && (
                    <button onClick={() => setCurrentSpread((prev) => prev - 1)}>
                        Попередня
                    </button>
                )}
                {currentSpread < totalSpreads - 1 && (
                    <button onClick={() => setCurrentSpread((prev) => prev + 1)}>
                        Наступна
                    </button>
                )}
                {currentSpread === totalSpreads - 1 && (
                    <button onClick={handleSubmit}>Подати заявку</button>
                )}
            </div>
        );
    };

    // Рендер компонента
    return (
        <div className={styles.layout}>
            <Sidebar
                isExpanded={isSidebarExpanded}
                onToggle={setIsSidebarExpanded}
            />
            <div
                className={`${styles.mainContent} ${
                    !isSidebarExpanded ? styles.sidebarCollapsed : ""
                }`}
            >
                <Navbar
                    isSidebarExpanded={isSidebarExpanded}
                    onMenuToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
                />
                <div className={styles.container}>
                    <div className={styles.book}>
                        {spreadContent()}
                    </div>
                </div>
                <div className={styles.controlsWrapper}>
                    <div className={styles.controlBlock}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className={styles.pageIndicator}>
                        Розворот {currentSpread + 1} з {totalSpreads}
                    </div>
                    <NavigationButtons />
                </div>
            </div>
        </div>
    );
};

export default SettlementApplicationPage;