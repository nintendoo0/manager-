const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Статические файлы для загрузок
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Проверка работоспособности API
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API работает' });
});

// Базовый маршрут для проверки сервера
app.get('/', (req, res) => {
  res.send('API сервера работает');
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Произошла ошибка на сервере',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Порт сервера
const PORT = process.env.PORT || 5000;

// Запуск сервера
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
  });
}

module.exports = app;
