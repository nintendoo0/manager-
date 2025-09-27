import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Projects.css';

const ProjectForm = () => {
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

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/projects', formData);
      navigate('/projects');
    } catch (err) {
      console.error('Ошибка создания проекта:', err);
      setError(
        err.response?.data?.message || 
        'Не удалось создать проект. Пожалуйста, попробуйте позже.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-form-container">
      <h2>Новый проект</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={onSubmit} className="project-form">
        <div className="form-group">
          <label htmlFor="name">Название проекта</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={onChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={onChange}
            rows="4"
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="status">Статус</label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={onChange}
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
              onChange={onChange}
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
              onChange={onChange}
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