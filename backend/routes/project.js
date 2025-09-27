const express = require('express');
const router = express.Router();

// Временная заглушка для маршрутов проектов
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Список проектов работает' });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'Создание проекта работает' });
});

router.get('/:id', (req, res) => {
  res.status(200).json({ message: `Получение проекта ${req.params.id} работает` });
});

module.exports = router;