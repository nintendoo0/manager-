import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import './Defects.css';

const DefectList = () => {
  const { projectId } = useParams(); // Получаем projectId из URL

  // moved hook to top-level
  const { user } = useContext(AuthContext) || {};

  const [defects, setDefects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Фильтры
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    project_id: projectId || '', // Используем projectId из URL
    search: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Если показываем дефекты конкретного проекта
        if (projectId) {
          // Получаем информацию о проекте
          const projectRes = await api.get(`/projects/${projectId}`);
          setCurrentProject(projectRes.data);
          
          // Получаем дефекты только этого проекта
          const defectsRes = await api.get(`/defects?project_id=${projectId}`);
          setDefects(Array.isArray(defectsRes.data) ? defectsRes.data : []);
        } else {
          // Загружаем список всех проектов для фильтрации
          const projectsRes = await api.get('/projects');
          setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
          
          // Формируем параметры запроса с учетом фильтров
          const queryParams = new URLSearchParams();
          if (filters.status) queryParams.append('status', filters.status);
          if (filters.priority) queryParams.append('priority', filters.priority);
          if (filters.project_id) queryParams.append('project_id', filters.project_id);
          
          // Получаем все дефекты с фильтрами
          const defectsRes = await api.get(`/defects?${queryParams.toString()}`);
          setDefects(Array.isArray(defectsRes.data) ? defectsRes.data : []);
        }
        
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить дефекты. Пожалуйста, попробуйте позже.');
        setDefects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, filters.status, filters.priority, filters.project_id]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      priority: '',
      project_id: projectId || '',
      search: '',
    });
  };

  const handleExport = async () => {
    const response = await fetch('/api/defects/export');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'defects_report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Фильтрация дефектов по тексту поиска
  const filteredDefects = defects.filter(defect => {
    if (!filters.search) return true;
    
    const searchLower = filters.search.toLowerCase();
    return defect.title.toLowerCase().includes(searchLower) || 
           (defect.description && defect.description.toLowerCase().includes(searchLower));
  });

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return 'Неизвестно';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'new': return 'Новый';
      case 'in_progress': return 'В работе';
      case 'review': return 'На проверке';
      case 'closed': return 'Закрыт';
      case 'cancelled': return 'Отменен';
      default: return 'Неизвестно';
    }
  };

  // право на создание: только admin или manager
  const canCreate = user && (user.role === 'admin' || user.role === 'manager');

  return (
    <div className="defect-list-container">
      <div className="defect-list-header">
        <h2>
          {projectId ? 
            `Дефекты проекта "${currentProject?.name || ''}"` : 
            'Все дефекты'
          }
        </h2>

        {/* Кнопка Новый дефект видна только admin/manager */}
        {canCreate && (
          <Link 
            to={projectId ? `/projects/${projectId}/defects/new` : '/defects/new'}
            className="btn btn-primary"
          >
            Новый дефект
          </Link>
        )}
      </div>
      
      <div className="defect-filters">
        <div className="filters-row">
          <div className="filter-item">
            <label htmlFor="status">Статус:</label>
            <select 
              id="status" 
              name="status" 
              value={filters.status} 
              onChange={handleFilterChange}
            >
              <option value="">Все</option>
              <option value="new">Новые</option>
              <option value="in_progress">В работе</option>
              <option value="review">На проверке</option>
              <option value="closed">Закрытые</option>
              <option value="cancelled">Отмененные</option>
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="priority">Приоритет:</label>
            <select 
              id="priority" 
              name="priority" 
              value={filters.priority} 
              onChange={handleFilterChange}
            >
              <option value="">Все</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
          
          {!projectId && (
            <div className="filter-item">
              <label htmlFor="project_id">Проект:</label>
              <select 
                id="project_id" 
                name="project_id" 
                value={filters.project_id} 
                onChange={handleFilterChange}
              >
                <option value="">Все проекты</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="filter-item search-item">
            <label htmlFor="search">Поиск:</label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Поиск по названию и описанию"
            />
          </div>
          
          <button onClick={resetFilters} className="btn btn-secondary">
            Сбросить
          </button>
        </div>
      </div>
      
      <button onClick={handleExport} className="btn btn-secondary">
        Экспорт в CSV
      </button>

      {loading ? (
        <div className="loading">Загрузка дефектов...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredDefects.length === 0 ? (
        <div className="no-data">
          <p>Дефекты не найдены. {!projectId && 'Выберите другие параметры фильтрации или'} создайте новый дефект.</p>
        </div>
      ) : (
        <div className="defect-cards">
          {filteredDefects.map(defect => (
            <div key={defect.id} className="defect-card">
              <h3>
                <Link to={`/defects/${defect.id}`}>{defect.title}</Link>
              </h3>
              
              <div className="defect-meta">
                <span className={`defect-priority priority-${defect.priority}`}>
                  {getPriorityLabel(defect.priority)}
                </span>
                <span className={`defect-status status-${defect.status}`}>
                  {getStatusLabel(defect.status)}
                </span>
              </div>
              
              {defect.project_name && !projectId && (
                <div className="defect-project">
                  <span className="meta-label">Проект:</span>
                  <Link to={`/projects/${defect.project_id}`}>{defect.project_name}</Link>
                </div>
              )}
              
              {defect.assigned_to_name && (
                <div className="defect-assigned">
                  <span className="meta-label">Исполнитель:</span>
                  <span>{defect.assigned_to_name}</span>
                </div>
              )}
              
              {defect.description && (
                <div className="defect-description-preview">
                  {defect.description.length > 150
                    ? `${defect.description.substring(0, 150)}...`
                    : defect.description}
                </div>
              )}
              
              <div className="defect-footer">
                <div className="defect-dates">
                  <span className="defect-created">
                    {new Date(defect.created_at).toLocaleDateString()}
                  </span>
                  {defect.deadline && (
                    <span className="defect-deadline">
                      До: {new Date(defect.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <Link to={`/defects/${defect.id}`} className="btn btn-info btn-sm">
                  Подробнее
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DefectList;