import DormApplication from "../models/DormApplication.js";

export const getServices = (req, res) => {
    const services = [
        {
            id: 1,
            name: "Поселення в гуртожиток",
            description: "Подайте заявку на поселення в гуртожиток.",
            route: "/services/settlement",
        },
        {
            id: 2,
            name: "Створення контракту на поселення",
            description: "Створіть контракт для поселення в гуртожиток.",
            route: "/services/contract",
        },
    ];
    res.json(services);
};

export const createDormApplication = async (req, res) => {
    try {
      const { name, surname, faculty, course } = req.body;
      const user_id = req.user.userId;
  
      if (!name || !surname || !faculty || !course) {
        return res.status(400).json({ error: "Усі поля обов’язкові" });
      }
  
      const applicationId = await DormApplication.create({
        user_id,
        name,
        surname,
        faculty,
        course,
      });
      res.status(201).json({ message: "Заявка успішно подана", applicationId });
    } catch (error) {
      res.status(500).json({ error: "Помилка при поданні заявки" });
    }
  };