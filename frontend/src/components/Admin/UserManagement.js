import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // ID пользователя для подтверждения удаления

  // Загрузка пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiClient.get('/api/auth/users');
        setUsers(data);
        setLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке пользователей:', err);
        setError('Не удалось загрузить пользователей. Проверьте права доступа.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Обработка изменений в форме
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Создание нового пользователя
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const result = await apiClient.post('/api/auth/register', formData);
      setUsers([result.user, ...users]);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      setSuccess('Пользователь успешно добавлен');
    } catch (err) {
      setError(err.message || 'Ошибка при создании пользователя');
    } finally {
      setLoading(false);
    }
  };

  // Удаление пользователя
  const handleDeleteUser = async (userId) => {
    // Сначала устанавливаем id для подтверждения
    if (deleteConfirm !== userId) {
      setDeleteConfirm(userId);
      return;
    }
    
    // Если подтверждено, удаляем
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      await apiClient.delete(`/api/auth/users/${userId}`);
      
      // Обновляем список пользователей
      setUsers(users.filter(user => user.id !== userId));
      setSuccess('Пользователь успешно удален');
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || 'Ошибка при удалении пользователя');
    } finally {
      setLoading(false);
    }
  };

  // Отмена удаления
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Функция для отображения бейджа с ролью
  const getRoleBadge = (role) => {
    const roleClass = `role-badge role-${role.toLowerCase()}`;
    return <span className={roleClass}>{role}</span>;
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="container-fluid" style={{ paddingTop: '70px' }}>
      <h2>Управление пользователями</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="card mb-4">
        <div className="card-header">Создать нового пользователя</div>
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Имя пользователя</label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Пароль</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">Роль</label>
                  <select
                    className="form-control"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="user">Пользователь</option>
                    <option value="engineer">Инженер</option>
                    <option value="manager">Менеджер</option>
                    <option value="observer">Наблюдатель</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Создание...' : 'Создать пользователя'}
            </button>
          </form>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">Список пользователей</div>
        <div className="card-body">
          {loading && !users.length && <div className="loading">Загрузка...</div>}
          
          {!loading && users.length === 0 ? (
            <p>Пользователей не найдено</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Имя пользователя</th>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Дата создания</th>
                    <th>Действия</th> {/* Новая колонка для кнопок */}
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        {/* Кнопка удаления */}
                        <button 
                          className={deleteConfirm === user.id ? "btn btn-danger" : "btn btn-outline-danger"}
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={loading}
                        >
                          {deleteConfirm === user.id ? 'Подтвердить' : 'Удалить'}
                        </button>
                        
                        {/* Кнопка отмены удаления */}
                        {deleteConfirm === user.id && (
                          <button 
                            className="btn btn-outline-secondary ml-2"
                            onClick={cancelDelete}
                            style={{ marginLeft: '8px' }}
                          >
                            Отмена
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;