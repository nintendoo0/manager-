const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Вход пользователя
router.post('/login', authController.login);

// Регистрация пользователя (только для админов)
router.post('/register', authenticateToken, authController.registerUser);

// Получение текущего пользователя
router.get('/me', authenticateToken, authController.getCurrentUser);

// Получение списка всех пользователей
router.get('/users', authenticateToken, authController.getAllUsers);

// Новый маршрут для удаления пользователя
router.delete('/users/:id', authenticateToken, authController.deleteUser);

module.exports = router;