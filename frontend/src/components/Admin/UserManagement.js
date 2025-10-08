import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/api'; // Изменено с { apiClient } from '../../api/client'
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/users');
      setUsers(response.data); // .data для axios
    } catch (error) {
      console.error('Ошибка при получении списка пользователей:', error);
      setMessage('Ошибка при загрузке пользователей');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await apiClient.post('/auth/register', formData);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      fetchUsers();
      setMessage('Пользователь успешно создан');
      setMessageType('success');
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
      setMessage('Ошибка при создании пользователя');
      setMessageType('error');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }
    
    try {
      await apiClient.delete(`/auth/users/${userId}`);
      fetchUsers();
      setMessage('Пользователь успешно удален');
      setMessageType('success');
    } catch (error) {
      console.error('Ошибка при удалении пользователя:', error);
      setMessage('Ошибка при удалении пользователя');
      setMessageType('error');
    }
  };

  const confirmUser = async (userId) => {
    try {
      await apiClient.post(`/auth/users/${userId}/confirm`);
      fetchUsers();
      setMessage('Пользователь подтвержден');
      setMessageType('success');
    } catch (error) {
      console.error('Ошибка при подтверждении пользователя:', error);
      setMessage('Ошибка при подтверждении пользователя');
      setMessageType('error');
    }
  };

  return (
    <div className="user-management-container">
      <h2>Управление пользователями</h2>
      
      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message}
          <button className="close-btn" onClick={() => setMessage('')}>×</button>
        </div>
      )}

      <div className="user-form">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="role">Роль</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="user">Пользователь</option>
                <option value="engineer">Инженер</option>
                <option value="manager">Менеджер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Создать пользователя</button>
        </form>
      </div>

      <div className="users-table-container">
        {loading ? (
          <p>Загрузка пользователей...</p>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя пользователя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => deleteUser(user.id)}
                    >
                      Удалить
                    </button>
                    {user.confirmed === false && (
                      <button 
                        className="btn btn-success btn-sm" 
                        onClick={() => confirmUser(user.id)}
                      >
                        Подтвердить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;