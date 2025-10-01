const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Существующие маршруты
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);

// Добавляем маршрут для обновления профиля
router.put('/update-profile', authenticateToken, authController.updateProfile);

module.exports = router;