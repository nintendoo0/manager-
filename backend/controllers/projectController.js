const db = require('../config/db');

// Создание нового проекта
exports.createProject = async (req, res) => {
  try {
    // Логируем все входящие данные
    console.log('========= СОЗДАНИЕ ПРОЕКТА =========');
    console.log('Тело запроса:', req.body);
    console.log('Заголовки:', req.headers);
    console.log('====================================');
    
    const { name, description, status } = req.body;
    let { start_date, end_date } = req.body;
    
    // Проверка формата даты и преобразование
    if (start_date && start_date.includes('.')) {
      const [day, month, year] = start_date.split('.');
      start_date = `${year}-${month}-${day}`;
    }
    
    if (end_date && end_date.includes('.')) {
      const [day, month, year] = end_date.split('.');
      end_date = `${year}-${month}-${day}`;
    }
    
    console.log('Обработанные данные:', { name, description, status, start_date, end_date });
    
    // Проверка обязательных полей
    if (!name || !start_date) {
      return res.status(400).json({ message: 'Название проекта и дата начала обязательны' });
    }
    
    const result = await db.query(
      `INSERT INTO projects (name, description, status, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, status || 'active', start_date, end_date || null]
    );
    
    console.log('Результат запроса:', result.rows[0]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании проекта:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании проекта', error: error.message });
  }
};

// Получение всех проектов
exports.getAllProjects = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
    
    // Убедитесь, что возвращается массив
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
    const result = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении проекта:', error);
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
       SET name = $1, description = $2, status = $3, start_date = $4, end_date = $5 
       WHERE id = $6 
       RETURNING *`,
      [name, description, status, start_date, end_date, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении проекта:', error);
    res.status(500).json({ message: 'Ошибка при обновлении проекта', error: error.message });
  }
};

// Удаление проекта
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, есть ли связанные дефекты
    const defectsCheck = await db.query('SELECT COUNT(*) FROM defects WHERE project_id = $1', [id]);
    if (defectsCheck.rows[0].count > 0) {
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