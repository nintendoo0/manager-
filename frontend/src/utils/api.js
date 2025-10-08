import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем перехватчик запросов для добавления токена авторизации
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик ответов для обработки ошибок авторизации
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 403) {
      console.log('Доступ запрещен. Проверьте права доступа.');
      // При необходимости можно редиректить на страницу логина
      // или вызывать другие действия
    }
    return Promise.reject(error);
  }
);

export default apiClient;