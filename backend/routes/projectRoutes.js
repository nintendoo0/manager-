const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Существующие маршруты
router.get('/', projectController.getAllProjects);
router.post('/', projectController.createProject);

// Добавляем маршрут для получения проекта по ID
router.get('/:id', projectController.getProjectById);

module.exports = router;