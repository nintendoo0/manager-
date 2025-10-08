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
    const result = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.status(200).json(result.rows);
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

    const result = await db.query(
      `UPDATE projects
       SET name = $1,
           description = $2,
           status = $3,
           start_date = $4,
           end_date = $5
       WHERE id = $6
       RETURNING *;`,
      [name, description, status, start_date || null, end_date || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка обновления проекта:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получить дефекты проекта
exports.getProjectDefects = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM defects WHERE project_id = $1 ORDER BY created_at DESC;`,
      [id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения дефектов проекта:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Удалить проект
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    // Удаляем проект (CASCADE должен убрать связанные дефекты/комментарии если настроено)
    const result = await db.query(
      `DELETE FROM projects WHERE id = $1 RETURNING *;`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    return res.json({ message: 'Проект удалён', project: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при удалении проекта:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM projects ORDER BY created_at DESC;`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения списка проектов:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};