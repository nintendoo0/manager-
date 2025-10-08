import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../UI/Card';
import NeonButton from '../UI/NeonButton';
import api from '../../utils/api';
import './Defects.css';

function DefectList(props) {
  const { projectId } = useParams(); // Получаем projectId из URL
  const defaultFilters = { status: 'all', priority: 'all', project: 'all', q: '' };
  const [filters, setFilters] = useState(defaultFilters);
  const [defects, setDefects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Сброс фильтров при первой загрузке страницы
  useEffect(() => {
    // Сбрасываем локальный стейт
    setFilters(defaultFilters);

    // Очищаем параметры в URL (если фильтры были в query)
    if (window && window.history && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Удаляем сохранённые фильтры из localStorage (если используется)
    try {
      localStorage.removeItem('defectFilters'); // замените ключ, если у вас другой
    } catch (e) {
      // noop
    }
  }, []); // выполняется только один раз при монтировании

  useEffect(() => {
    let mounted = true;
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
    return () => { mounted = false; };
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

  return (
    <div className="defect-list-container">
      <div className="defect-list-header">
        <h2>
          {projectId ? 
            `Дефекты проекта "${currentProject?.name || ''}"` : 
            'Все дефекты'
          }
        </h2>
        <Link 
          to={projectId ? `/projects/${projectId}/defects/new` : '/defects/new'}
          className="btn btn-primary"
        >
          Новый дефект
        </Link>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filteredDefects.map(defect => (
            <Card key={defect.id} className="defect-card fade-in-up" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Link to={`/defects/${defect.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-1)' }}>{defect.title}</div>
                  </Link>
                  <div style={{ marginTop: 8 }}>
                    <span className={`badge ${defect.priority?.toLowerCase() || ''}`} style={{ marginRight: 8 }}>{defect.priority || '—'}</span>
                    <span className={`status ${defect.status?.toLowerCase() || ''}`} style={{ marginLeft: 8 }}>{defect.status || '—'}</span>
                  </div>
                  <div style={{ marginTop: 10 }} className="small">Проект: {defect.project_name || defect.project_id || '—'}</div>
                  <div className="small" style={{ marginTop: 6 }}>Исполнитель: {defect.assigned_to_name || 'Не назначено'}</div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                  <NeonButton onClick={() => navigate(`/defects/${defect.id}`)}>Открыть</NeonButton>
                  <Link to={`/defects/${defect.id}/edit`} style={{ textDecoration:'none' }}>
                    <button className="btn btn-ghost" style={{ minWidth: 96 }}>Ред.</button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DefectList;