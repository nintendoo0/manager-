const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// Секретный ключ для JWT из переменных окружения
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

// Регистрация пользователя
exports.register = async (req, res) => {
  try {
    console.log('Запрос на регистрацию:', req.body);
    const { username, email, password, role } = req.body;
    
    // Проверка на существующего пользователя
    const userCheck = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email или именем уже существует' });
    }
    
    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Добавление пользователя в БД
    const result = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role || 'engineer']
    );
    
    const user = result.rows[0];
    
    // Создание JWT токена
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ 
      message: 'Произошла ошибка при регистрации. Пожалуйста, попробуйте снова.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Вход пользователя
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Проверка наличия пользователя
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    }

    const user = result.rows[0];

    // Проверка пароля
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    }

    // Создание JWT токена
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    // Убираем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Авторизация успешна',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Ошибка при входе пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера при входе пользователя' });
  }
};

// Создание нового пользователя (только для администраторов)
exports.registerUser = async (req, res) => {
  try {
    // Проверяем, что запрос делает администратор
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен. Только администраторы могут создавать пользователей.' });
    }

    const { username, password, email, role } = req.body;

    // Проверка обязательных полей
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Имя пользователя, пароль и email обязательны' });
    }

    // Проверка, что пользователь с таким именем не существует
    const userCheck = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким именем или email уже существует' });
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Определение роли (по умолчанию - user, если не указана)
    const userRole = role || 'user';

    // Добавление пользователя в базу данных
    const result = await db.query(
      `INSERT INTO users (username, password, email, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, role, created_at`,
      [username, hashedPassword, email, userRole]
    );

    res.status(201).json({
      message: 'Пользователь успешно создан',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании пользователя' });
  }
};

// Получение данных текущего пользователя
exports.getMe = async (req, res) => {
  try {
    // Пользователь уже аутентифицирован через middleware
    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении данных' });
  }
};

// Получение текущего пользователя
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении данных пользователя' });
  }
};

// Обновление профиля пользователя
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Проверяем, существует ли пользователь
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Проверяем, не занято ли имя пользователя или email другим пользователем
    const checkDuplicate = await db.query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
      [username, email, userId]
    );
    
    if (checkDuplicate.rows.length > 0) {
      return res.status(400).json({ message: 'Имя пользователя или email уже используются' });
    }
    
    // Если меняется пароль, проверяем текущий
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Для смены пароля необходимо указать текущий пароль' });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Неверный текущий пароль' });
      }
      
      // Хешируем новый пароль
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Обновляем профиль с новым паролем
      const updateResult = await db.query(
        'UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4 RETURNING id, username, email, role',
        [username, email, hashedPassword, userId]
      );
      
      return res.json(updateResult.rows[0]);
    }
    
    // Обновляем профиль без изменения пароля
    const updateResult = await db.query(
      'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email, role',
      [username, email, userId]
    );
    
    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении профиля' });
  }
};

// Получение списка пользователей (для назначения дефектов)
exports.getUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, email, role FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получение списка всех пользователей (только для администраторов)
exports.getAllUsers = async (req, res) => {
  try {
    // Проверяем, что запрос делает администратор
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен. Только администраторы могут просматривать список пользователей.' });
    }
    
    const result = await db.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка пользователей' });
  }
};

// Удаление пользователя (только для администраторов)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверка прав администратора
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен. Только администраторы могут удалять пользователей.' });
    }
    
    // Проверка на удаление самого себя
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'Невозможно удалить собственную учетную запись.' });
    }
    
    // Проверка существования пользователя
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }
    
    // Удаление пользователя
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id, username, email, role', [id]);
    
    res.status(200).json({
      message: 'Пользователь успешно удален',
      deletedUser: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении пользователя' });
  }
};
