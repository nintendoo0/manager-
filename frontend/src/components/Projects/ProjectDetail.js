import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Projects.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Получаем информацию о проекте
        const projectResponse = await api.get(`/projects/${id}`);
        setProject(projectResponse.data);
        
        // Получаем связанные дефекты
        const defectsResponse = await api.get(`/defects?project_id=${id}`);
        setDefects(defectsResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Ошибка загрузки данных проекта:', err);
        setError('Не удалось загрузить проект. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот проект?')) {
      return;
    }
    
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      console.error('Ошибка удаления проекта:', err);
      setError(
        err.response?.data?.message || 
        'Не удалось удалить проект. Пожалуйста, попробуйте позже.'
      );
    }
  };

  if (loading) {
    return <div className="loading">Загрузка данных проекта...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!project) {
    return <div className="error-message">Проект не найден</div>;
  }

  return (
    <div className="project-detail-container">
      <div className="project-detail-header">
        <h2>{project.name}</h2>
        <div className="project-detail-actions">
          <Link to={`/projects/${id}/edit`} className="btn btn-secondary">
            Редактировать
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            Удалить
          </button>
        </div>
      </div>
      
      <div className="project-detail-meta">
        <div className={`project-status status-${project.status}`}>
          {project.status === 'active' && 'Активен'}
          {project.status === 'completed' && 'Завершен'}
          {project.status === 'suspended' && 'Приостановлен'}
        </div>
        <div className="project-dates">
          <span>Начало: {new Date(project.start_date).toLocaleDateString()}</span>
          {project.end_date && (
            <span>Окончание: {new Date(project.end_date).toLocaleDateString()}</span>
          )}
        </div>
      </div>
      
      <div className="project-detail-description">
        <h3>Описание</h3>
        <p>{project.description || 'Описание отсутствует'}</p>
      </div>
      
      <div className="project-defects">
        <div className="defects-header">
          <h3>Дефекты ({defects.length})</h3>
          <Link to={`/projects/${id}/defects/new`} className="btn btn-primary">
            Новый дефект
          </Link>
        </div>
        
        {defects.length === 0 ? (
          <div className="no-data">Дефекты не найдены</div>
        ) : (
          <div className="defects-list">
            {defects.map(defect => (
              <div key={defect.id} className="defect-card">
                <h4>
                  <Link to={`/defects/${defect.id}`}>{defect.title}</Link>
                </h4>
                <div className="defect-meta">
                  <span className={`defect-priority priority-${defect.priority}`}>
                    {defect.priority === 'high' && 'Высокий'}
                    {defect.priority === 'medium' && 'Средний'}
                    {defect.priority === 'low' && 'Низкий'}
                  </span>
                  <span className={`defect-status status-${defect.status}`}>
                    {defect.status === 'new' && 'Новый'}
                    {defect.status === 'in_progress' && 'В работе'}
                    {defect.status === 'review' && 'На проверке'}
                    {defect.status === 'closed' && 'Закрыт'}
                    {defect.status === 'cancelled' && 'Отменен'}
                  </span>
                </div>
                {defect.assigned_to_name && (
                  <div className="defect-assigned">
                    Исполнитель: {defect.assigned_to_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
