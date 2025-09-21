const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Пример базового маршрута
app.get('/', (req, res) => {
  res.send('Сервер системы управления дефектами работает');
});

const authController = require('./controllers/authController');

// TODO: Добавить маршруты API

// Auth routes
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);

const defectRoutes = require('./routes/defect');
app.use('/api/defects', defectRoutes);

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
