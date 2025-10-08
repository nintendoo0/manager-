const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Логирование для всех маршрутов в этом файле
router.use((req, res, next) => { console.log('[projects route]', req.method, req.originalUrl); next(); });

// список проектов
router.get('/', projectController.getProjects);

router.post('/', projectController.createProject);
router.get('/:id', projectController.getProjectById);

// Добавьте этот маршрут для редактирования
router.put('/:id', projectController.updateProject);

// получение дефектов проекта
router.get('/:id/defects', projectController.getProjectDefects);

// удаление проекта
router.delete('/:id', projectController.deleteProject);

// Экспорт маршрутов
module.exports = router;