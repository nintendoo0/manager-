const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// В начало файла добавьте:
require('./database/migrations/init');
require('./scripts/create-admin')()
  .then(() => console.log('Проверка администратора выполнена'))
  .catch(err => console.error('Ошибка при проверке администратора:', err));
// Конфигурация CORS для разрешения запросов с фронтенда
app.use(cors({
  origin: 'http://localhost:3000', // URL фронтенда
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware для обработки JSON и URL-encoded данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
const projectRoutes = require('./routes/project');
const defectRoutes = require('./routes/defects'); // Изменено с defectRoutes на defects

// Убедитесь, что эти строки присутствуют перед объявлением маршрутов
// и не дублируются

// Логирование запросов для отладки
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Отладочный middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Тело запроса:', JSON.stringify(req.body));
  }
  next();
});

// Маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', projectRoutes);
app.use('/api/defects', defectRoutes); // Теперь это будет работать
