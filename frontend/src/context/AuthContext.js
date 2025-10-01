import React, { createContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

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
        const userData = await apiClient.get('/api/auth/me');
        setUser(userData);
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
      const response = await apiClient.post('/api/auth/login', credentials);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return response;
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