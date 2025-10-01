const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// В начало файла добавьте:
require('./database/migrations/init');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000', // URL вашего фронтенда
  credentials: true
}));
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

// Проверьте, что маршруты правильно импортированы
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const defectRoutes = require('./routes/defects');
const defectsRouter = require('./routes/defects');

// И правильно подключены к приложению
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/defects', defectRoutes);
app.use('/api/defects', defectsRouter);

// Добавьте это в начало файла после импортов
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});
