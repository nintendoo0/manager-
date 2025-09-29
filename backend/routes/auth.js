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

module.exports = router;