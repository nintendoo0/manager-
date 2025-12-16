const db = require('../config/db');

// Создание нового проекта
exports.createProject = async (req, res) => {
  try {
    // Отладочная информация
    console.log('=== СОЗДАНИЕ ПРОЕКТА ===');
    console.log('Тело запроса:', req.body);
    
    // Извлекаем данные из запроса
    const { name, description, status } = req.body;
    let { start_date, end_date } = req.body;
    
    // Преобразуем форматы даты
    if (start_date && typeof start_date === 'string' && start_date.includes('.')) {
      const [day, month, year] = start_date.split('.');
      start_date = `${year}-${month}-${day}`;
    }
    
    if (end_date && typeof end_date === 'string' && end_date.includes('.')) {
      const [day, month, year] = end_date.split('.');
      end_date = `${year}-${month}-${day}`;
    }
    
    // Валидация дат
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (endDate < startDate) {
        return res.status(400).json({ 
          message: 'Дата окончания проекта не может быть раньше даты начала' 
        });
      }
    }
    
    // Проверка обязательных полей
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Название проекта обязательно' });
    }
    
    console.log('Данные для вставки:', { name, description, status, start_date, end_date });
    
    // Вставка в БД
    const result = await db.query(
      `INSERT INTO projects (name, description, status, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, description || '', status || 'active', start_date, end_date || null]
    );
    
    console.log('Проект создан:', result.rows[0]);
    
    // Возвращаем созданный проект
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании проекта:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании проекта', 
      details: error.message
    });
  }
};

// Получение всех проектов
exports.getAllProjects = async (req, res) => {
  try {
    // Параметры пагинации
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Получаем общее количество проектов
    const countResult = await db.query('SELECT COUNT(*) FROM projects');
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // Получаем проекты с пагинацией
    const result = await db.query(
      'SELECT * FROM projects ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    // Отправляем ответ с метаданными пагинации
    res.status(200).json({
      data: result.rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Ошибка при получении проектов:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении проектов' });
  }
};

// Получение проекта по ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, что ID - число
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Некорректный ID проекта' });
    }
    
    // Получаем проект по ID
    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    
    const project = projectResult.rows[0];
    
    // Получаем связанные дефекты проекта (если есть таблица дефектов)
    const defectsResult = await db.query('SELECT * FROM defects WHERE project_id = $1', [id]);
    
    // Формируем ответ с проектом и его дефектами
    const response = {
      ...project,
      defects: defectsResult.rows || []
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Ошибка при получении проекта по ID:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении проекта' });
  }
};

// Обновление проекта
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, start_date, end_date } = req.body;
    
    // Получаем текущий проект для сохранения существующих значений
    const currentProject = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (currentProject.rows.length === 0) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    
    const current = currentProject.rows[0];
    
    // Используем существующие значения, если новые не предоставлены
    const updatedName = name !== undefined ? name : current.name;
    const updatedDescription = description !== undefined ? description : current.description;
    const updatedStatus = status !== undefined ? status : current.status;
    const updatedStartDate = start_date !== undefined ? start_date : current.start_date;
    const updatedEndDate = end_date !== undefined ? end_date : current.end_date;
    
    // Валидация дат
    if (updatedStartDate && updatedEndDate) {
      const startDate = new Date(updatedStartDate);
      const endDate = new Date(updatedEndDate);
      
      if (endDate < startDate) {
        return res.status(400).json({ 
          message: 'Дата окончания проекта не может быть раньше даты начала' 
        });
      }
    }
    
    // Проверка обязательных полей
    if (!updatedName || !updatedName.trim()) {
      return res.status(400).json({ message: 'Название проекта обязательно' });
    }
    
    const result = await db.query(
      `UPDATE projects 
       SET name = $1, description = $2, status = $3, start_date = $4, end_date = $5 
       WHERE id = $6 
       RETURNING *`,
      [updatedName, updatedDescription, updatedStatus, updatedStartDate, updatedEndDate, id]
    );
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении проекта:', error);
    res.status(500).json({ message: 'Ошибка при обновлении проекта', error: error.message });
  }
};

// Удаление проекта
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params; // <-- добавлено извлечение id

    // Проверка привязанных дефектов
    const defectsCheck = await db.query('SELECT COUNT(*) FROM defects WHERE project_id = $1', [id]);
    const count = Number(defectsCheck.rows[0].count || 0);

    if (count > 0) {
      return res.status(400).json({
        message: 'Невозможно удалить проект, к которому привязаны дефекты'
      });
    }

    const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    res.status(200).json({ message: 'Проект успешно удален', project: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении проекта:', error);
    res.status(500).json({ message: 'Ошибка при удалении проекта', error: error.message });
  }
};