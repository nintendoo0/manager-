import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../utils/api'; // Добавляем импорт API-клиента
import './Projects.css';

const ProjectForm = ({ onSuccess }) => {
  const { id } = useParams();
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
  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      fetchProjectData();
    }
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/projects/${id}`); // Убираем лишний префикс /api
      setFormData(response.data); // Добавляем .data для axios
    } catch (err) {
      console.error('Ошибка получения данных проекта:', err);
      setError('Не удалось загрузить данные проекта');
    } finally {
      setLoading(false);
    }
  };

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
      if (isEditMode) {
        await apiClient.put(`/projects/${id}`, formData); // Убираем лишний префикс /api
      } else {
        await apiClient.post('/projects', formData); // Убираем лишний префикс /api
      }
      navigate('/projects');
    } catch (err) {
      console.error('Ошибка создания проекта:', err);
      setError(`Ошибка ${isEditMode ? 'обновления' : 'создания'} проекта`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-form-container">
      <h2>{isEditMode ? 'Редактировать проект' : 'Новый проект'}</h2>
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