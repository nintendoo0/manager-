const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

// Регистрация пользователя
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Проверка существования пользователя
    const userExists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Добавление пользователя
    const result = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role || 'engineer']
    );

    // Генерация токена
    const token = jwt.sign(
      { id: result.rows[0].id, role: result.rows[0].role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при регистрации', error: error.message });
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
    res.status(500).json({ message: 'Ошибка сервера' });
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
