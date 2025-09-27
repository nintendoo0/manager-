import axios from 'axios';

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Убедитесь, что порт соответствует вашему серверу
  headers: {
    'Content-Type': 'application/json'
  }
});

// Перехватчик запросов для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;