const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Публичные маршруты
router.post('/register', authController.register);
router.post('/login', authController.login);

// Защищенные маршруты - требуют аутентификации
router.get('/me', authenticateToken, authController.getMe);
router.put('/update-profile', authenticateToken, authController.updateProfile);
router.get('/users', authenticateToken, authController.getUsers);
router.delete('/users/:id', authenticateToken, authController.deleteUser);

module.exports = router;

// filepath: c:\manager-\backend\controllers\authController.js
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Проверяем права доступа
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Недостаточно прав для удаления пользователя' });
    }
    
    // Не даем удалить самого себя
    if (req.user.id == id) {
      return res.status(400).json({ message: 'Вы не можете удалить свою учетную запись' });
    }
    
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.status(200).json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    res.status(500).json({ message: 'Ошибка при удалении пользователя' });
  }
};