const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Существующие маршруты
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/update-profile', authenticateToken, authController.updateProfile);

// Добавляем новый маршрут для получения списка пользователей
router.get('/users', authenticateToken, authController.getAllUsers);

module.exports = router;