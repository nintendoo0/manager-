const express = require('express');
const router = express.Router();

// Временная заглушка для маршрутов дефектов
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Список дефектов работает' });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Создание дефекта работает' });
});

router.get('/:id', (req, res) => {
  res.status(200).json({ message: `Получение дефекта ${req.params.id} работает` });
});

module.exports = router;