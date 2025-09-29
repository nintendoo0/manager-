import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    id: '',
    username: '',
    email: '',
    role: ''
  });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Загрузка данных пользователя
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/auth/me');
        setUserData(res.data);
        setFormData({
          username: res.data.username,
          email: res.data.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setError(null);
      } catch (err) {
        console.error('Ошибка при получении данных пользователя:', err);
        setError('Не удалось загрузить данные профиля. Пожалуйста, попробуйте позже.');
        
        // Если токен недействителен, выходим из аккаунта
        if (err.response && err.response.status === 401) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Обработчик изменения полей формы
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Функция обновления профиля
  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Проверяем, меняется ли пароль
      const updateData = {
        username: formData.username,
        email: formData.email
      };

      if (formData.newPassword) {
        // Проверка совпадения паролей
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Новый пароль и подтверждение не совпадают');
          setLoading(false);
          return;
        }

        // Если меняется пароль, добавляем текущий и новый пароли
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const res = await api.put('/auth/update-profile', updateData);
      
      // Обновляем данные пользователя в localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = {
        ...currentUser,
        username: res.data.username,
        email: res.data.email
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setUserData(res.data);
      setSuccess('Профиль успешно обновлен');
      setEditMode(false);
      
      // Очищаем поля пароля
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error('Ошибка при обновлении профиля:', err);
      setError(
        err.response?.data?.message || 
        'Не удалось обновить профиль. Пожалуйста, проверьте введенные данные и попробуйте снова.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Функция выхода из аккаунта
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading && !editMode) {
    return <div className="loading">Загрузка данных пользователя...</div>;
  }

  return (
    <div className="profile-container">
      <h2>Профиль пользователя</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {!editMode ? (
        <div className="profile-info">
          <div className="profile-avatar">
            {/* Аватар или инициалы пользователя */}
            <div className="avatar-placeholder">
              {userData.username ? userData.username.charAt(0).toUpperCase() : '?'}
            </div>
          </div>
          
          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">Имя пользователя:</span>
              <span className="detail-value">{userData.username}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{userData.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Роль:</span>
              <span className="detail-value">
                {userData.role === 'admin' && 'Администратор'}
                {userData.role === 'manager' && 'Менеджер'}
                {userData.role === 'engineer' && 'Инженер'}
                {userData.role === 'observer' && 'Наблюдатель'}
              </span>
            </div>
          </div>
          
          <div className="profile-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setEditMode(true)}
            >
              Редактировать профиль
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleLogout}
            >
              Выйти
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={onChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              required
            />
          </div>
          
          <div className="password-section">
            <h3>Изменение пароля</h3>
            <p className="helper-text">Заполните поля ниже, только если хотите сменить пароль</p>
            
            <div className="form-group">
              <label htmlFor="currentPassword">Текущий пароль</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={onChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">Новый пароль</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={onChange}
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Подтверждение пароля</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={onChange}
                minLength="6"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditMode(false)}
              disabled={loading}
            >
              Отмена
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;