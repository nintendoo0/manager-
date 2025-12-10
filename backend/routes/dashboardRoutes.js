const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Получение статистики дэшборда - доступно всем авторизованным
router.get('/stats', authenticateToken, dashboardController.getDashboardStats);

// Экспорт полного отчёта - только для admin и manager
router.get('/export/full-report', authenticateToken, dashboardController.exportFullReport);

// Экспорт статистики - только для admin и manager
router.get('/export/stats', authenticateToken, dashboardController.exportDashboardStats);

module.exports = router;
