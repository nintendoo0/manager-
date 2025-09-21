const express = require('express');
const router = express.Router();

// Пример маршрута API
router.get('/example', (req, res) => {
  res.json({ message: 'Пример маршрута API' });
});

module.exports = router;
