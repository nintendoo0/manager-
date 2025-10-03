const express = require('express');
const router = express.Router();
const defectController = require('../controllers/defectController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { Pool } = require('pg');
const { Parser } = require('json2csv');

const pool = new Pool(); // настройки подключения к БД

// Получение всех дефектов
router.get('/', authenticateToken, defectController.getAllDefects);

// Получение дефектов по ID проекта
router.get('/project/:projectId', authenticateToken, defectController.getDefectsByProjectId);

// Создание нового дефекта
router.post('/', authenticateToken, defectController.createDefect);

// Получение дефекта по ID
router.get('/:id', authenticateToken, defectController.getDefectById);

// Обновление дефекта
router.put('/:id', authenticateToken, defectController.updateDefect);

// Удаление дефекта
router.delete('/:id', authenticateToken, defectController.deleteDefect);

// Экспорт дефектов в CSV
router.get('/export', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, description, status, priority, assignee, created_at FROM defects');
    const fields = ['id', 'title', 'description', 'status', 'priority', 'assignee', 'created_at'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(result.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('defects_report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка экспорта отчёта' });
  }
});

module.exports = router;