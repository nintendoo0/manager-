const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Существующие маршруты
router.get('/', projectController.getAllProjects);
router.post('/', authenticateToken, projectController.createProject); // защита создания

// Добавляем маршрут для получения проекта по ID
router.get('/:id', projectController.getProjectById);

// Добавляем маршруты для обновления и удаления проекта
router.put('/:id', authenticateToken, projectController.updateProject);
router.delete('/:id', authenticateToken, projectController.deleteProject);

module.exports = router;