const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Экспорт дефектов (CSV) — доступ только авторизованным (role проверяется в контроллере)
router.get('/defects', authenticateToken, reportController.exportDefectsCsv);

module.exports = router;