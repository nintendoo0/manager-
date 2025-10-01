const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Защищенные маршруты - требуют токен аутентификации
router.post('/', authenticateToken, projectController.createProject);
router.get('/', authenticateToken, projectController.getAllProjects);

// Экспорт маршрутов
module.exports = router;