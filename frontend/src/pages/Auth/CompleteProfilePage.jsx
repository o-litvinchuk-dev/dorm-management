import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import { useUser } from "../../contexts/UserContext";
import styles from "./styles/CompleteProfilePage.module.css";
import logoImg from "../../images/logo.svg";

const CompleteProfilePage = () => {
  const { user, refreshUser, isLoading: userIsLoading } = useUser();
  const navigate = useNavigate();

  const [faculties, setFaculties] = useState([]);
  const [groups, setGroups] = useState([]);
  const [dormitories, setDormitories] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const getInitialValues = useCallback(() => {
    if (!user) {
      return {
        name: "", phone: "", faculty_id: "", group_id: "", course: "", dormitory_id: "", userRole: ""
      };
    }
    // Початкове значення faculty_id беремо з user.faculty_id, якщо є, інакше порожній рядок.
    // Це важливо, бо faculty_id для деканату може бути встановлено при створенні адміном
    // або очікується вибір на цій сторінці.
    let initialFacultyId = user.faculty_id || ""; 
    // Аналогічно для гуртожитку
    let initialDormitoryId = user.dormitory_id || "";


    // Якщо роль "student", але user.faculty_id з user_profiles (змінене поле в getProfile)
    if (user.role === "student" && user.profile_faculty_id) {
      initialFacultyId = user.profile_faculty_id;
    }


    return {
      name: user.name || "",
      phone: user.phone || "",
      faculty_id: initialFacultyId,
      group_id: user.group_id || "", 
      course: user.course || "",
      dormitory_id: initialDormitoryId,
      userRole: user.role,
    };
  }, [user]);
  
  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required("ПІБ обов'язкове")
      .matches(/^[А-ЯІЄЇҐа-яієїґA-Za-zЁё'\s-]+$/, "ПІБ може містити літери, пробіли, дефіс, апостроф")
      .min(5, "ПІБ занадто коротке (мін. 5 символів)"),
    phone: Yup.string()
      .matches(/^\+380\d{9}$/, "Формат телефону: +380XXXXXXXXX (наприклад, +380991234567)")
      .required("Телефон обов'язковий"),
    faculty_id: Yup.number().when('userRole', { 
      is: (userRole) => ["student", "faculty_dean_office", "student_council_head", "student_council_member"].includes(userRole),
      then: (schema) => schema.required("Факультет обов'язковий для вашої ролі").typeError("Виберіть факультет"),
      otherwise: (schema) => schema.nullable(),
    }),
    group_id: Yup.number().when('userRole', {
      is: "student",
      then: (schema) => schema.required("Група обов'язкова для студента").typeError("Виберіть групу"),
      otherwise: (schema) => schema.nullable(),
    }),
    course: Yup.number().when('userRole', {
      is: "student",
      then: (schema) =>
        schema
          .min(1, "Курс має бути від 1 до 6")
          .max(6, "Курс має бути від 1 до 6")
          .required("Курс обов'язковий для студента").typeError("Вкажіть курс"),
      otherwise: (schema) => schema.nullable(),
    }),
    dormitory_id: Yup.number().when('userRole', {
      is: "dorm_manager",
      then: (schema) => schema.required("Гуртожиток обов'язковий для коменданта").typeError("Виберіть гуртожиток"),
      otherwise: (schema) => schema.nullable(),
    }),
  });

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        const payload = {
          name: values.name,
          phone: values.phone,
        };

        // Включаємо role-specific поля в payload
        if (user?.role === "student") {
          payload.faculty_id = values.faculty_id || null;
          payload.group_id = values.group_id || null;
          payload.course = values.course || null;
        } else if (["faculty_dean_office", "student_council_head", "student_council_member"].includes(user?.role)) {
          payload.faculty_id = values.faculty_id || null; // Це має оновлювати users.faculty_id
        } else if (user?.role === "dorm_manager") {
          payload.dormitory_id = values.dormitory_id || null; // Це має оновлювати users.dormitory_id
        }
        
        // Очищення порожніх рядків до null, щоб уникнути помилок з зовнішніми ключами
        Object.keys(payload).forEach(key => {
          if (payload[key] === "") { 
             payload[key] = null;
          }
        });
        
        await api.patch("/secure/profile", payload);
        ToastService.success("Профіль успішно оновлено!");
        await refreshUser(); // Дуже важливо для оновлення is_profile_complete та інших даних в UserContext
        // Перенаправлення на /dashboard має відбутися автоматично через AuthRequiredRoute
      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setSubmitting(false);
      }
    },
  });
  
  useEffect(() => {
    if (user && formik.values.userRole !== user.role) {
      formik.setFieldValue('userRole', user.role);
    }
  }, [user, formik]);

  useEffect(() => {
    if (!userIsLoading && user && user.is_profile_complete) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, userIsLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setDataLoading(false);
        return;
      }
      setDataLoading(true);
      try {
        const requests = [];
        // Завантажуємо факультети, якщо роль потребує вибору факультету
        if (["student", "faculty_dean_office", "student_council_head", "student_council_member"].includes(user.role)) {
          requests.push(api.get("/faculties"));
        } else {
          requests.push(Promise.resolve({ data: [] })); 
        }
        // Завантажуємо гуртожитки, якщо роль потребує вибору гуртожитку
        if (user.role === "dorm_manager") {
          requests.push(api.get("/dormitories"));
        } else {
          requests.push(Promise.resolve({ data: [] }));
        }
        
        const [facultiesRes, dormitoriesRes] = await Promise.all(requests);
        
        setFaculties(facultiesRes.data || []);
        setDormitories(dormitoriesRes.data || []);

      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [user]); // Перезавантажувати, якщо змінився об'єкт user

  useEffect(() => {
    const facultyIdValue = formik.values.faculty_id;
    if (user?.role === "student" && facultyIdValue) {
      setDataLoading(true);
      api.get(`/faculties/${facultyIdValue}/groups`)
        .then(response => {
          const fetchedGroups = response.data || [];
          setGroups(fetchedGroups);
          
          const currentGroupId = parseInt(formik.values.group_id, 10);
          const groupInNewList = fetchedGroups.find(g => g.id === currentGroupId);

          if (currentGroupId && groupInNewList) {
            if (formik.values.course !== groupInNewList.course) {
              formik.setFieldValue('course', groupInNewList.course, false); // false - не запускати валідацію зараз
            }
          } else { 
             // Якщо користувач змінив факультет, скидаємо групу та курс
            if(formik.dirty || formik.values.group_id){ // Якщо форма була змінена або group_id ще має старе значення
              formik.setFieldValue('group_id', '', false);
              formik.setFieldValue('course', '', false);
            }
          }
        })
        .catch(error => {
          ToastService.handleApiError(error);
          setGroups([]);
          formik.setFieldValue('group_id', '', false);
          formik.setFieldValue('course', '', false);
        })
        .finally(() => setDataLoading(false));
    } else if (user?.role === "student") {
      setGroups([]);
      if (formik.values.group_id || formik.values.course) { // Очистити, тільки якщо були значення
        formik.setFieldValue('group_id', '', false);
        formik.setFieldValue('course', '', false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.faculty_id, user?.role]); 

  const handleGroupChange = (event) => {
    const newGroupId = event.target.value;
    formik.setFieldValue('group_id', newGroupId);
    if (newGroupId) {
      const selectedGroupObject = groups.find(g => g.id === parseInt(newGroupId, 10));
      if (selectedGroupObject && typeof selectedGroupObject.course !== 'undefined') {
        formik.setFieldValue('course', selectedGroupObject.course);
      } else {
        formik.setFieldValue('course', ''); 
      }
    } else {
      formik.setFieldValue('course', ''); 
    }
  };

  if (userIsLoading || (dataLoading && user)) { 
    return <div className={styles.loadingScreen}>Завантаження даних...</div>;
  }
  
  if (!user) { 
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formWrapper}>
      <div className={styles.logoContainer}>
          <img src={logoImg} alt="Dorm Life Logo" className={styles.logoImage} />
          <h1 className={styles.logoText}>DORM LIFE</h1>
        </div>
        <h2 className={styles.title}>Завершення реєстрації профілю</h2>
        <p className={styles.subtitle}>
          Будь ласка, заповніть або перевірте ваші дані для подальшої роботи з системою.
        </p>
        <form onSubmit={formik.handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Повне ім'я (ПІБ)</label>
            <input
              id="name"
              name="name"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.name}
              className={formik.touched.name && formik.errors.name ? styles.inputError : ""}
              placeholder="Прізвище Ім'я По-батькові"
            />
            {formik.touched.name && formik.errors.name && (
              <div className={styles.errorMessage}>{formik.errors.name}</div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phone">Номер телефону</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.phone}
              className={formik.touched.phone && formik.errors.phone ? styles.inputError : ""}
              placeholder="+380XXXXXXXXX"
            />
            {formik.touched.phone && formik.errors.phone && (
              <div className={styles.errorMessage}>{formik.errors.phone}</div>
            )}
          </div>

          {["student", "faculty_dean_office", "student_council_head", "student_council_member"].includes(user.role) && (
            <div className={styles.inputGroup}>
              <label htmlFor="faculty_id">Факультет 
                {user.role === "faculty_dean_office" && " (Обов'язково для Деканату)"}
                {(user.role === "student_council_head" || user.role === "student_council_member") && " (Обов'язково для Студ. ради)"}
                {user.role === "student" && " (Обов'язково для Студента)"}
              </label>
              <select
                id="faculty_id"
                name="faculty_id"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.faculty_id}
                className={formik.touched.faculty_id && formik.errors.faculty_id ? styles.inputError : ""}
              >
                <option value="">Виберіть факультет</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {formik.touched.faculty_id && formik.errors.faculty_id && (
                <div className={styles.errorMessage}>{formik.errors.faculty_id}</div>
              )}
            </div>
          )}

          {user.role === "student" && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="group_id">Група (Обов'язково для Студента)</label>
                <select
                  id="group_id"
                  name="group_id"
                  onChange={handleGroupChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.group_id}
                  disabled={!formik.values.faculty_id || groups.length === 0 || dataLoading}
                  className={formik.touched.group_id && formik.errors.group_id ? styles.inputError : ""}
                >
                  <option value="">{dataLoading && formik.values.faculty_id ? "Завантаження груп..." : (groups.length === 0 && formik.values.faculty_id ? "Немає груп для факультету" : "Виберіть групу")}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Курс: {g.course})
                    </option>
                  ))}
                </select>
                {formik.touched.group_id && formik.errors.group_id && (
                  <div className={styles.errorMessage}>{formik.errors.group_id}</div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="course">Курс (Автоматично)</label>
                <input
                  id="course"
                  name="course"
                  type="number"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.course}
                  className={formik.touched.course && formik.errors.course ? styles.inputError : ""}
                  min="1"
                  max="6"
                  readOnly 
                />
                {formik.touched.course && formik.errors.course && (
                  <div className={styles.errorMessage}>{formik.errors.course}</div>
                )}
              </div>
            </>
          )}
           {user.role === "dorm_manager" && (
             <div className={styles.inputGroup}>
              <label htmlFor="dormitory_id">Гуртожиток (Обов'язково для Коменданта)</label>
              <select
                id="dormitory_id"
                name="dormitory_id"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.dormitory_id}
                className={formik.touched.dormitory_id && formik.errors.dormitory_id ? styles.inputError : ""}
              >
                <option value="">Виберіть гуртожиток</option>
                {dormitories.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {formik.touched.dormitory_id && formik.errors.dormitory_id && (
                <div className={styles.errorMessage}>{formik.errors.dormitory_id}</div>
              )}
            </div>
          )}

          <button type="submit" disabled={formik.isSubmitting || dataLoading} className={styles.submitButton}>
            {formik.isSubmitting ? "Збереження..." : "Зберегти та продовжити"}
          </button>
        </form>
        <p className={styles.termsText}>
          Заповнюючи профіль, ви погоджуєтеся з нашою{" "}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className={styles.termsLink}>
            Політикою конфіденційності
          </a>{" "}
          та <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className={styles.termsLink}>
            Умовами надання послуг
            </a>.
        </p>
      </div>
    </div>
  );
};

export default CompleteProfilePage;