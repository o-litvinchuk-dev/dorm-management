import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/CompleteProfilePage.module.css";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import IMask from "imask";
import logoImg from "../../images/logo.svg";

const getSchema = (role) =>
  Yup.object().shape({
    full_name: Yup.string()
      .required("ПІБ є обов'язковим")
      .matches(
        /^[А-ЯІЇЄҐ][а-яіїєґ']+ [А-ЯІЇЄҐ][а-яіїєґ']+ [А-ЯІЇЄҐ][а-яіїєґ']+$/,
        "Формат: Прізвище Ім'я По батькові (лише кирилиця)"
      ),
    phone: Yup.string()
      .required("Телефон є обов'язковим")
      .matches(/^\+380\d{9}$/, "Формат: +380XXXXXXXXX"),
    faculty_id: Yup.number()
      .nullable()
      .when("role", {
        is: (r) => ["student", "faculty_dean_office", "student_council_head", "student_council_member"].includes(r),
        then: (schema) => schema.required("Факультет є обов'язковим").typeError("Факультет має бути обраний"),
        otherwise: (schema) => schema.notRequired().nullable(),
      }),
    course: Yup.number()
      .nullable()
      .when("role", {
        is: "student",
        then: (schema) => schema.required("Курс є обов'язковим").min(1, "Курс має бути від 1 до 6").max(6, "Курс має бути від 1 до 6").typeError("Курс має бути числом"),
        otherwise: (schema) => schema.notRequired().nullable(),
      }),
    group_name: Yup.string()
      .nullable()
      .when("role", {
        is: "student",
        then: (schema) => schema.required("Група є обов'язковою").test("is-valid-group", "Група має бути обрана", (value) => value !== ""),
        otherwise: (schema) => schema.notRequired().nullable(),
      }),
    dormitory_id: Yup.number()
      .nullable()
      .when("role", {
        is: "dorm_manager",
        then: (schema) => schema.required("Гуртожиток є обов'язковим").typeError("Гуртожиток має бути обраний"),
        otherwise: (schema) => schema.notRequired().nullable(),
      }),
    role: Yup.string().required("Роль є обов'язковою"),
  });

const CompleteProfilePage = () => {
  const { user, setUser, refreshUser } = useUser();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [history, setHistory] = useState([1]);
  const phoneInputRef = useRef(null);
  const [faculties, setFaculties] = useState([]);
  const [dormitories, setDormitories] = useState([]);
  const [isDormitoriesError, setIsDormitoriesError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.is_profile_complete) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
    watch,
    resetField,
  } = useForm({
    resolver: yupResolver(getSchema(user?.role || "student")),
    mode: "onChange",
    defaultValues: {
      full_name: user?.name || "",
      phone: user?.phone || "+380",
      faculty_id: user?.faculty_id ? Number(user.faculty_id) : null,
      course: user?.course ? Number(user.course) : null,
      group_name: user?.group_name || null,
      dormitory_id: user?.dormitory_id ? Number(user.dormitory_id) : null,
      role: user?.role || "student",
    },
  });

  const selectedFacultyId = watch("faculty_id");

  useEffect(() => {
    console.log("Form state:", {
      errors,
      isValid,
      formValues: watch(),
      userRole: user?.role,
    });
  }, [errors, isValid, watch, user?.role]);

  const itGroups = [
    "ІУСТ-24001м", "ІУСТ-24002м", "ЕкК-24003м", "ПЗІС-24004м", "ПЗІС-24005м",
    "КСІМ-24006м", "КСЗІ-24007м", "КН-24001б", "КН-24002б", "КН-24003б",
    "КН-24004бск", "ЕкК-24005б", "ЦЕ-24006б", "ІПЗ-24007б", "ІПЗ-24008б",
    "ІПЗ-24009бск", "КІ-24010б", "КІ-24011бск", "КІБ-24012б", "КІБ-24013б",
    "ІСТ-24014б", "ЕкК-23005б", "ЦЕ-22006б", "ЕкК-22005б", "ЦЕ-21006б",
    "ЕкК-21005б", "ІСТ-23012б", "ІСТ-22016б", "ІСТ-21017б", "КІ-23009б",
    "КІБ-23011б", "КІ-22012б", "КІБ-22014б", "КІБ-22015б", "КІ-21012б",
    "КІБ-21015б", "КІБ-21016б", "КІ-23010бск", "ІПЗ-23006б", "ІПЗ-23007б",
    "ІПЗ-23008бск", "ІПЗ-22007б", "ІПЗ-22008б", "ІПЗ-22009б", "ІПЗ-22010бск",
    "ІПЗ-22011бск", "ІПЗ-21007б", "ІПЗ-21008б", "ІПЗ-21009б", "КН-23001б",
    "КН-23002б", "КН-23003б", "КН-22001б", "КН-22002б", "КН-22003б",
    "КН-21001б", "КН-21002б", "КН-21003б", "КН-23004бск",
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [facultiesResponse, dormitoriesResponse] = await Promise.all([
          api.get("/faculties").catch(() => ({ data: [{ id: 1, name: "IT" }, { id: 2, name: "Економічний" }] })),
          api.get("/secure/dormitories").catch((err) => {
            console.error("Помилка завантаження гуртожитків:", err);
            setIsDormitoriesError(true);
            return { data: [] };
          }),
        ]);
        setFaculties(facultiesResponse.data || []);
        setDormitories(dormitoriesResponse.data || []);
      } catch (err) {
        console.error("Помилка завантаження даних:", err);
        ToastService.error("Не вдалося завантажити дані");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (phoneInputRef.current) {
      const mask = IMask(phoneInputRef.current, {
        mask: "+380000000000",
        overwrite: true,
      });
      mask.on("accept", () => {
        setValue("phone", mask.value, { shouldValidate: true });
      });
      return () => mask.destroy();
    }
  }, [setValue]);

  useEffect(() => {
    if (user) {
      setValue("full_name", user.name || "", { shouldValidate: true });
      setValue("phone", user.phone || "+380", { shouldValidate: true });
      setValue("faculty_id", user.faculty_id ? Number(user.faculty_id) : null, { shouldValidate: true });
      setValue("course", user.course ? Number(user.course) : null, { shouldValidate: true });
      setValue("group_name", user.group_name || null, { shouldValidate: true });
      setValue("dormitory_id", user.dormitory_id ? Number(user.dormitory_id) : null, { shouldValidate: true });
      setValue("role", user.role || "student", { shouldValidate: true });
    }
  }, [user, setValue]);

  useEffect(() => {
    const facultyIsIT = faculties.find((f) => f.id === Number(selectedFacultyId))?.name === "IT";
    if (!facultyIsIT) {
      resetField("group_name", { defaultValue: null });
    }
  }, [selectedFacultyId, faculties, resetField]);

  const onSubmitProfile = async (data) => {
    try {
      if (!user?.role) {
        console.error("User role is undefined");
        ToastService.error("Помилка: роль користувача не визначена");
        return;
      }

      const payload = {
        name: data.full_name,
        phone: data.phone,
      };

      if (["student", "faculty_dean_office", "student_council_head", "student_council_member"].includes(user.role)) {
        if (data.faculty_id) payload.faculty_id = Number(data.faculty_id);
      }
      if (user.role === "student") {
        if (data.course) payload.course = Number(data.course);
        if (data.group_name) payload.group_name = data.group_name;
      }
      if (user.role === "dorm_manager") {
        if (data.dormitory_id) payload.dormitory_id = Number(data.dormitory_id);
      }

      console.log("Final payload:", payload);
      const response = await api.patch("/secure/profile", payload);
      await refreshUser();

      if (response.data.user.is_profile_complete) {
        ToastService.success("Профіль успішно заповнено!");
        setUser({ ...user, is_profile_complete: true });
        setHistory((prev) => [...prev, 3]);
        setCurrentStep(3);
      } else {
        ToastService.warning("Профіль оновлено, але ще не завершено. Перевірте дані.");
      }
    } catch (error) {
      console.error("Помилка при збереженні профілю:", error);
      if (error.response?.data?.details) {
        ToastService.error(`Помилка: ${error.response.data.details.map((d) => d.message).join(", ")}`);
      } else {
        ToastService.error("Помилка при збереженні профілю");
      }
    }
  };

  const handleCompleteProfile = () => {
    if (user?.is_profile_complete) {
      navigate("/dashboard", { replace: true });
    } else {
      ToastService.warning("Профіль ще не завершено.");
      navigate("/complete-profile", { replace: true });
    }
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentStep(newHistory[newHistory.length - 1]);
    }
  };

  const goToLogin = () => {
    navigate("/login", { replace: true });
  };

  const totalSteps = 4;
  const progressWidth = `${(currentStep / totalSteps) * 100}%`;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.authCard}>
            <div className={styles.logo}>
              <img src={logoImg} alt="DORMLIFE Logo" className={styles.logoImage} />
              <h1 className={styles.logoText}>DORM LIFE</h1>
            </div>
            <h2 className={styles.title}>Ласкаво просимо до Dorm Life!</h2>
            <p className={styles.subtitle}>
              Декілька простих кроків, і ви готові до нового етапу!
            </p>
            <button
              className={styles.submitButton}
              onClick={() => {
                setHistory((prev) => [...prev, 2]);
                setCurrentStep(2);
              }}
            >
              Розпочати
            </button>
          </div>
        );
      case 2:
        return (
          <div className={styles.authCard}>
            <button className={styles.backButton} onClick={goBack}>
              <svg
                style={{ width: "20px", height: "20px", color: "#006AFF" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Назад
            </button>
            <h2 className={styles.title}>Розкажіть нам про себе</h2>
            <p className={styles.subtitle}>
              Ця інформація допоможе нам персоналізувати ваш досвід.
            </p>
            {isLoading ? (
              <div className={styles.loading}>Завантаження...</div>
            ) : user?.role === "dorm_manager" && isDormitoriesError ? (
              <div className={styles.error}>
                Помилка завантаження списку гуртожитків. Спробуйте пізніше.
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmitProfile)} className={styles.formContainer}>
                <div className={styles.inputGroup}>
                  <label htmlFor="full_name" className={styles.inputLabel}>
                    ПІБ*
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      id="full_name"
                      className={styles.inputField}
                      {...register("full_name")}
                      placeholder="Прізвище Ім'я По батькові"
                      style={{ paddingLeft: "40px" }}
                    />
                    <svg
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "20px",
                        height: "20px",
                        color: "#607D8B",
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  {errors.full_name && <p className={styles.error}>{errors.full_name.message}</p>}
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="phone" className={styles.inputLabel}>
                    Телефон*
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="tel"
                      id="phone"
                      className={styles.inputField}
                      ref={phoneInputRef}
                      value={watch("phone")}
                      onChange={(e) =>
                        setValue("phone", e.target.value, { shouldValidate: true })
                      }
                      placeholder="+380XXXXXXXXX"
                      style={{ paddingLeft: "40px" }}
                    />
                    <svg
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "20px",
                        height: "20px",
                        color: "#607D8B",
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  {errors.phone && <p className={styles.error}>{errors.phone.message}</p>}
                </div>
                {["student", "faculty_dean_office", "student_council_head", "student_council_member"].includes(user?.role) && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="faculty_id" className={styles.inputLabel}>
                      Факультет*
                    </label>
                    <select
                      id="faculty_id"
                      className={styles.selectField}
                      {...register("faculty_id")}
                      defaultValue={user?.faculty_id ? Number(user.faculty_id) : ""}
                    >
                      <option value="" disabled>
                        Виберіть факультет
                      </option>
                      {faculties.map((fac) => (
                        <option key={fac.id} value={fac.id}>
                          {fac.name}
                        </option>
                      ))}
                    </select>
                    {errors.faculty_id && <p className={styles.error}>{errors.faculty_id.message}</p>}
                  </div>
                )}
                {user?.role === "student" && (
                  <>
                    <div className={styles.inputGroup}>
                      <label htmlFor="course" className={styles.inputLabel}>
                        Курс*
                      </label>
                      <input
                        type="number"
                        id="course"
                        className={styles.inputField}
                        {...register("course")}
                        min="1"
                        max="6"
                        placeholder="1-6"
                      />
                      {errors.course && <p className={styles.error}>{errors.course.message}</p>}
                    </div>
                    {faculties.find((f) => f.id === Number(selectedFacultyId))?.name === "IT" && (
                      <div className={styles.inputGroup}>
                        <label htmlFor="group_name" className={styles.inputLabel}>
                          Група*
                        </label>
                        <select
                          id="group_name"
                          className={styles.selectField}
                          {...register("group_name")}
                        >
                          <option value="" disabled>
                            Виберіть групу
                          </option>
                          {itGroups.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                        {errors.group_name && <p className={styles.error}>{errors.group_name.message}</p>}
                      </div>
                    )}
                  </>
                )}
                {user?.role === "dorm_manager" && !isDormitoriesError && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="dormitory_id" className={styles.inputLabel}>
                      Гуртожиток*
                    </label>
                    <select
                      id="dormitory_id"
                      className={styles.selectField}
                      {...register("dormitory_id")}
                      defaultValue={user?.dormitory_id ? Number(user.dormitory_id) : ""}
                    >
                      <option value="" disabled>
                        Виберіть гуртожиток
                      </option>
                      {dormitories.map((dorm) => (
                        <option key={dorm.id} value={dorm.id}>
                          {dorm.name}
                        </option>
                      ))}
                    </select>
                    {errors.dormitory_id && <p className={styles.error}>{errors.dormitory_id.message}</p>}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting || (user?.role === "dorm_manager" && isDormitoriesError)}
                  className={styles.submitButton}
                >
                  {isSubmitting ? "Збереження..." : "Далі"}
                </button>
              </form>
            )}
          </div>
        );
      case 3:
        return (
          <div className={styles.authCard}>
            <button className={styles.backButton} onClick={goBack}>
              <svg
                style={{ width: "20px", height: "20px", color: "#006AFF" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Назад
            </button>
            <div className={styles.illustration}>
              <svg
                style={{ width: "80px", height: "80px", color: "#006AFF" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className={styles.title}>Плануйте своє поселення</h2>
            <p className={styles.subtitle}>
              Легко подавайте заяви, відстежуйте їх статус та дізнавайтеся про дати поселення.
            </p>
            <button
              className={styles.submitButton}
              onClick={() => {
                setHistory((prev) => [...prev, 4]);
                setCurrentStep(4);
              }}
            >
              Зрозуміло
            </button>
          </div>
        );
      case 4:
        return (
          <div className={styles.authCard}>
            <button className={styles.backButton} onClick={goBack}>
              <svg
                style={{ width: "20px", height: "20px", color: "#006AFF" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Назад
            </button>
            <div className={styles.illustration}>
              <svg
                style={{ width: "80px", height: "80px", color: "#006AFF" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className={styles.title}>Все готово!</h2>
            <p className={styles.subtitle}>
              Ваш профіль успішно налаштовано. Тепер ви можете повноцінно користуватися Dorm Life.
            </p>
            <button
              className={styles.submitButton}
              onClick={handleCompleteProfile}
            >
              Перейти на головну
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return <div className={styles.loading}>Завантаження...</div>;
  }

  return (
    <div className={styles.authContainer} style={{ backgroundColor: "#F8FAFC" }}>
      <div className={styles.authWrapper}>
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{
              width: progressWidth,
              height: "4px",
              background: "#006AFF",
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          ></div>
        </div>
        {renderStep()}
        <button className={styles.loginLink} onClick={goToLogin}>
          Повернутися до входу
        </button>
      </div>
    </div>
  );
};

export default CompleteProfilePage;