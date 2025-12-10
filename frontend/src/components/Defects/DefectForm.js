import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import './Defects.css';

const DefectForm = () => {
  const navigate = useNavigate();
  const { id, projectId } = useParams();
  const isEditMode = !!id;
  
  // Добавляем доступ к контексту аутентификации
  const { user } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'new',
    project_id: projectId || '',
    assigned_to: '',
    deadline: ''
  });
  
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Загрузка проектов
        const projectsResponse = await apiClient.get('/projects');
        setProjects(projectsResponse.data || []);
        
        // Загрузка пользователей только для admin и manager
        if (user && (user.role === 'admin' || user.role === 'manager')) {
          try {
            const usersResponse = await apiClient.get('/auth/users');
            setUsers(usersResponse.data || []);
          } catch (err) {
            console.error('Ошибка при загрузке пользователей:', err);
            // Не блокируем всю форму из-за ошибки загрузки пользователей
          }
        }
        
        // Если режим редактирования, загружаем данные дефекта
        if (isEditMode) {
          const defectResponse = await apiClient.get(`/defects/${id}`);
          setFormData(defectResponse.data);
        } else if (projectId) {
          // Если создаем новый дефект для конкретного проекта
          setFormData(prev => ({
            ...prev,
            project_id: projectId
          }));
        }
        
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить необходимые данные. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditMode, projectId, user]);
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateDeadline = () => {
    if (formData.deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Сбрасываем время для корректного сравнения
      const deadlineDate = new Date(formData.deadline);
      
      if (deadlineDate < today) {
        setError('Срок исполнения не может быть раньше текущей даты');
        return false;
      }
    }
    return true;
  };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Валидация срока исполнения
    if (!validateDeadline()) {
      setLoading(false);
      return;
    }

    try {
      if (isEditMode) {
        await apiClient.put(`/defects/${id}`, formData);
      } else {
        await apiClient.post('/defects', formData);
      }
      
      // Возвращаемся к списку дефектов проекта или к общему списку
      if (projectId) {
        navigate(`/projects/${projectId}/defects`);
      } else if (isEditMode) {
        navigate(`/defects/${id}`);
      } else {
        navigate('/defects');
      }
    } catch (err) {
      console.error('Ошибка при сохранении дефекта:', err);
      setError(
        err.response?.data?.message || 
        'Не удалось сохранить дефект. Пожалуйста, попробуйте позже.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <div className="loading">Загрузка данных...</div>;
  }

  return (
    <div className="defect-form-container">
      <h2>{isEditMode ? 'Редактирование дефекта' : 'Новый дефект'}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={onSubmit} className="defect-form">
        <div className="form-group">
          <label htmlFor="title">Заголовок</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={onChange}
            required
            placeholder="Краткое описание дефекта"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Подробное описание</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onChange}
            rows="5"
            placeholder="Детальное описание дефекта, шаги воспроизведения, ожидаемый результат"
          ></textarea>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">Приоритет</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={onChange}
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Статус</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={onChange}
            >
              <option value="new">Новый</option>
              <option value="in_progress">В работе</option>
              <option value="review">На проверке</option>
              <option value="closed">Закрыт</option>
              <option value="cancelled">Отменен</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="project_id">Проект</label>
            <select
              id="project_id"
              name="project_id"
              value={formData.project_id}
              onChange={onChange}
              required
              disabled={!!projectId}
            >
              <option value="">Выберите проект</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="assigned_to">Исполнитель</label>
            <select
              id="assigned_to"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={onChange}
            >
              <option value="">Не назначен</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </div>
          <div className="form-group">
          <label htmlFor="deadline">Срок исполнения</label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={onChange}
            min={new Date().toISOString().split('T')[0]} // Минимальная дата - сегодня
          />
          {formData.deadline && new Date(formData.deadline) < new Date(new Date().setHours(0, 0, 0, 0)) && (
            <small style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              ⚠️ Срок исполнения не может быть раньше текущей даты
            </small>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => {
              if (projectId) {
                navigate(`/projects/${projectId}/defects`);
              } else if (isEditMode) {
                navigate(`/defects/${id}`);
              } else {
                navigate('/defects');
              }
            }}
          >
            Отмена
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Сохранение...' : (isEditMode ? 'Сохранить' : 'Создать')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DefectForm;