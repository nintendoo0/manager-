const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Настройка хранилища для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    // Создаем папку, если она не существует
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый тип файла. Разрешены только изображения (JPEG, PNG) и документы (PDF, DOC, DOCX)'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB макс размер
}).single('file');

// Получение всех дефектов с возможностью фильтрации
exports.getAllDefects = async (req, res) => {
  try {
    const { project_id, status, priority, assigned_to } = req.query;
    
    let query = `
      SELECT d.*, p.name as project_name, 
        u1.username as created_by_name, 
        u2.username as assigned_to_name 
      FROM defects d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users u1 ON d.created_by = u1.id
      LEFT JOIN users u2 ON d.assigned_to = u2.id
      WHERE 1=1
    `;
    const params = [];
    
    // Фильтрация по project_id
    if (project_id) {
      params.push(project_id);
      query += ` AND d.project_id = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND d.status = $${params.length}`;
    }
    
    if (priority) {
      params.push(priority);
      query += ` AND d.priority = $${params.length}`;
    }
    
    if (assigned_to) {
      params.push(assigned_to);
      query += ` AND d.assigned_to = $${params.length}`;
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    console.log('SQL запрос:', query);
    console.log('Параметры:', params);
    
    const result = await db.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении дефектов:', error);
    res.status(500).json({ message: 'Ошибка при получении дефектов', error: error.message });
  }
};

// Получение дефектов по ID проекта
exports.getDefectsByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await db.query(`
      SELECT d.*, u.username as assigned_to_name
      FROM defects d
      LEFT JOIN users u ON d.assigned_to = u.id
      WHERE d.project_id = $1
      ORDER BY d.created_at DESC
    `, [projectId]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении дефектов проекта:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении дефектов проекта' });
  }
};

// Создание нового дефекта
exports.createDefect = async (req, res) => {
  try {
    const { title, description, status, priority, project_id, assigned_to } = req.body;
    const created_by = req.user?.id; // Получаем ID текущего пользователя
    
    // Проверка обязательных полей
    if (!title || !project_id) {
      return res.status(400).json({ message: 'Заголовок и ID проекта обязательны' });
    }
    
    const result = await db.query(`
      INSERT INTO defects (title, description, status, priority, project_id, assigned_to, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, description, status || 'open', priority || 'medium', project_id, assigned_to, created_by]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании дефекта:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании дефекта' });
  }
};

// Получение дефекта по ID
exports.getDefectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT d.*, p.name as project_name, u.username as assigned_to_name
      FROM defects d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users u ON d.assigned_to = u.id
      WHERE d.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Дефект не найден' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении дефекта:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении дефекта' });
  }
};

// Получение всех дефектов с возможностью фильтрации
exports.getDefects = async (req, res) => {
  try {
    // Поддержка фильтрации
    const { project_id, status, priority, assigned_to } = req.query;
    let query = `
      SELECT d.*, p.name as project_name, 
        u1.username as created_by_name, 
        u2.username as assigned_to_name 
      FROM defects d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users u1 ON d.created_by = u1.id
      LEFT JOIN users u2 ON d.assigned_to = u2.id
      WHERE 1=1
    `;
    const params = [];
    
    if (project_id) {
      params.push(project_id);
      query += ` AND d.project_id = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND d.status = $${params.length}`;
    }
    
    if (priority) {
      params.push(priority);
      query += ` AND d.priority = $${params.length}`;
    }
    
    if (assigned_to) {
      params.push(assigned_to);
      query += ` AND d.assigned_to = $${params.length}`;
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    const result = await db.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении дефектов:', error);
    res.status(500).json({ message: 'Ошибка при получении дефектов', error: error.message });
  }
};

// Получение дефекта по ID
exports.getDefect = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT d.*, p.name as project_name, 
        u1.username as created_by_name, 
        u2.username as assigned_to_name 
      FROM defects d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users u1 ON d.created_by = u1.id
      LEFT JOIN users u2 ON d.assigned_to = u2.id
      WHERE d.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Дефект не найден' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении дефекта:', error);
    res.status(500).json({ message: 'Ошибка при получении дефекта', error: error.message });
  }
};

// Обновление дефекта
exports.updateDefect = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, project_id, assigned_to } = req.body;
    
    // Проверка обязательных полей
    if (!title) {
      return res.status(400).json({ message: 'Заголовок дефекта обязателен' });
    }
    
    const result = await db.query(`
      UPDATE defects
      SET title = $1, description = $2, status = $3, priority = $4, 
          project_id = $5, assigned_to = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [title, description, status, priority, project_id, assigned_to, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Дефект не найден' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении дефекта:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении дефекта' });
  }
};

// Удаление дефекта
exports.deleteDefect = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM defects WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Дефект не найден' });
    }
    
    res.status(200).json({ message: 'Дефект успешно удален', deletedDefect: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении дефекта:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении дефекта' });
  }
};

// Добавление комментария к дефекту
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const user_id = req.user.id;
    
    if (!comment) {
      return res.status(400).json({ message: 'Текст комментария обязателен' });
    }
    
    // Проверяем, существует ли дефект
    const defectCheck = await db.query('SELECT * FROM defects WHERE id = $1', [id]);
    if (defectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Дефект не найден' });
    }
    
    const result = await db.query(
      'INSERT INTO defect_comments (defect_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
      [id, user_id, comment]
    );
    
    // Получаем имя пользователя для ответа
    const userResult = await db.query('SELECT username FROM users WHERE id = $1', [user_id]);
    
    const commentWithUser = {
      ...result.rows[0],
      username: userResult.rows[0].username
    };
    
    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Ошибка при добавлении комментария:', error);
    res.status(500).json({ message: 'Ошибка при добавлении комментария' });
  }
};

// Получение комментариев к дефекту
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT c.*, u.username 
      FROM defect_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.defect_id = $1
      ORDER BY c.created_at ASC
    `, [id]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении комментариев:', error);
    res.status(500).json({ message: 'Ошибка при получении комментариев' });
  }
};

// Добавление вложения к дефекту
exports.addAttachment = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не выбран' });
      }
      
      const { id } = req.params;
      const file_name = req.file.originalname;
      const file_path = `uploads/${req.file.filename}`;
      const file_type = req.file.mimetype;
      const uploaded_by = req.user.id;
      
      // Проверяем, существует ли дефект
      const defectCheck = await db.query('SELECT * FROM defects WHERE id = $1', [id]);
      if (defectCheck.rows.length === 0) {
        // Удаляем загруженный файл
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Дефект не найден' });
      }
      
      const result = await db.query(
        'INSERT INTO defect_attachments (defect_id, file_name, file_path, file_type, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, file_name, file_path, file_type, uploaded_by]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка при добавлении вложения:', error);
      res.status(500).json({ message: 'Ошибка при добавлении вложения', error: error.message });
    }
  });
};

// Получение вложений к дефекту
exports.getAttachments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT a.*, u.username as uploaded_by_name
      FROM defect_attachments a
      JOIN users u ON a.uploaded_by = u.id
      WHERE a.defect_id = $1
      ORDER BY a.created_at DESC
    `, [id]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении вложений:', error);
    res.status(500).json({ message: 'Ошибка при получении вложений', error: error.message });
  }
};

// Удаление вложения
exports.deleteAttachment = async (req, res) => {
  try {
    const { defectId, id } = req.params;
    
    // Получаем информацию о вложении для удаления файла
    const attachment = await db.query('SELECT * FROM defect_attachments WHERE id = $1 AND defect_id = $2', [id, defectId]);
    
    if (attachment.rows.length === 0) {
      return res.status(404).json({ message: 'Вложение не найдено' });
    }
    
    // Проверяем права (только загрузивший или менеджер может удалить)
    if (
      req.user.id !== attachment.rows[0].uploaded_by && 
      req.user.role !== 'manager' &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    // Удаляем запись из БД
    await db.query('DELETE FROM defect_attachments WHERE id = $1', [id]);
    
    // Удаляем файл
    const filePath = path.join(__dirname, '..', attachment.rows[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.status(200).json({ message: 'Вложение успешно удалено' });
  } catch (error) {
    console.error('Ошибка при удалении вложения:', error);
    res.status(500).json({ message: 'Ошибка при удалении вложения', error: error.message });
  }
};
