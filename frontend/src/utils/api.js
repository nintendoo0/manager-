import axios from 'axios';

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Измените на ваш базовый URL
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

// Перехватчик ответов для обработки ошибок авторизации
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Если статус 401 (Unauthorized), выполняем выход из системы
    if (error.response && error.response.status === 401) {
      console.log('Токен недействителен или просрочен. Выход из системы...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Если не находимся на странице входа, перенаправляем на нее
      if (window.location.pathname !== '/login') {
        window.location = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;