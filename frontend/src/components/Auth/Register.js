import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'engineer' // По умолчанию роль "инженер"
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { username, email, password, confirmPassword, role } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/register', {
        username,
        email,
        password,
        role
      });
      
      // Сохранение токена и данных пользователя
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Перенаправление на главную страницу
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Произошла ошибка при регистрации. Пожалуйста, попробуйте снова.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Регистрация</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="username">Имя пользователя</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
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
            value={email}
            onChange={onChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Подтверждение пароля</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="role">Роль</label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={onChange}
          >
            <option value="engineer">Инженер</option>
            <option value="manager">Менеджер</option>
            <option value="observer">Наблюдатель</option>
          </select>
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
      
      <div className="auth-links">
        <p>
          Уже есть аккаунт? <a href="/login">Войти</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
