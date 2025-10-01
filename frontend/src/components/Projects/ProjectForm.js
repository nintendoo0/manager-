import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Projects.css';
import { apiClient } from '../../api/client';

const ProjectForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { name, description, status, start_date, end_date } = formData;

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Отправка данных проекта:', formData);
      
      const result = await apiClient.post('/api/projects', formData);
      
      console.log('Проект успешно создан:', result);
      // Очистка формы или редирект на список проектов
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Перенаправляем пользователя на страницу списка проектов
      navigate('/projects');
      
    } catch (error) {
      console.error('Ошибка создания проекта:', error);
      setError('Не удалось создать проект. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-form-container">
      <h2>Новый проект</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-group">
          <label htmlFor="name">Название проекта</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={handleChange}
            rows="4"
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="status">Статус</label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={handleChange}
          >
            <option value="active">Активен</option>
            <option value="suspended">Приостановлен</option>
            <option value="completed">Завершен</option>
          </select>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start_date">Дата начала</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={start_date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="end_date">Дата окончания</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={end_date}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/projects')}
          >
            Отмена
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Создание...' : 'Создать проект'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;