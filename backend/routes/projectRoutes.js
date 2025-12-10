const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, canManageProjects } = require('../middleware/authMiddleware');

// Просмотр проектов - доступен всем авторизованным пользователям
router.get('/', authenticateToken, projectController.getAllProjects);
router.get('/:id', authenticateToken, projectController.getProjectById);

// Создание, редактирование и удаление проектов - только для admin и manager
router.post('/', authenticateToken, canManageProjects, projectController.createProject);
router.put('/:id', authenticateToken, canManageProjects, projectController.updateProject);
router.delete('/:id', authenticateToken, canManageProjects, projectController.deleteProject);

module.exports = router;