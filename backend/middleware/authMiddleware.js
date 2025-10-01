const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

function authenticateToken(req, res, next) {
  // Получаем токен из заголовка
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }
  
  // Проверяем токен
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error('Ошибка проверки токена:', err);
      return res.status(403).json({ message: 'Недействительный или просроченный токен' });
    }
    
    // Добавляем данные пользователя в объект запроса
    req.user = user;
    next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.sendStatus(401);
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };

// Middleware для проверки ролей
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'У вас нет прав для выполнения этого действия'
      });
    }
    next();
  };
};

// Защита от XSS
exports.sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }
    });
  }
  next();
};
