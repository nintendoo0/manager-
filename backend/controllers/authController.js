const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Секретный ключ для JWT из переменных окружения
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

// Регистрация пользователя
exports.register = async (req, res) => {
  try {
    console.log('Запрос на регистрацию:', req.body);
    const { username, email, password, role } = req.body;
    
    // Проверка на пустые поля
    if (!username || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Все поля должны быть заполнены' 
      });
    }
    
    // Проверка существования пользователя
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2', 
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Пользователь с таким email или именем уже существует' 
      });
    }
    
    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Создание пользователя
    const result = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role]
    );
    
    // Создание JWT токена
    const token = jwt.sign(
      { id: result.rows[0].id, role: result.rows[0].role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        role: result.rows[0].role
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

// Авторизация пользователя
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Поиск пользователя
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }
    
    const user = result.rows[0];
    
    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }
    
    // Создание токена
    const token = jwt.sign(
      { id: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Авторизация успешна',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ message: 'Ошибка сервера при авторизации' });
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
