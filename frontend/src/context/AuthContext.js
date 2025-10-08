import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../utils/api'; // Изменено с { apiClient } from '../api/client'

// Создаем контекст
export const AuthContext = createContext();

// Создаем провайдер контекста
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка данных пользователя при инициализации
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await apiClient.get('/auth/me');
        setUser(response.data); // Обратите внимание на .data для axios
      } catch (err) {
        console.error('Ошибка при загрузке данных пользователя:', err);
        setError('Не удалось загрузить данные пользователя');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  // Функция для входа в систему
  const login = async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      localStorage.setItem('token', response.data.token); // .data для axios
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Функция для выхода из системы
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Значения, которые будут доступны через контекст
  const value = {
    user,
    loading,
    error,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};