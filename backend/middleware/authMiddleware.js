const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware для проверки токена
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Недействительный или просроченный токен' });
    }
    
    req.user = user; // Сохраняем данные пользователя в запросе
    next();
  });
}

// Middleware для проверки роли admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещен. Требуется роль администратора.' });
  }
  next();
}

// Middleware для проверки прав на создание дефектов (разрешено admin и engineer)
function canCreateDefects(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
    return res.status(403).json({ message: 'Доступ запрещен. Недостаточно прав для создания дефектов.' });
  }
  next();
}

// Middleware для проверки прав на управление проектами (только admin и manager)
function canManageProjects(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
    return res.status(403).json({ message: 'Доступ запрещен. Только администраторы и менеджеры могут управлять проектами.' });
  }
  next();
}

module.exports = { 
  authenticateToken, 
  requireAdmin,
  canCreateDefects,
  canManageProjects
};
