import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import './Projects.css';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // Проверка прав на управление проектами (только admin и manager)
  const canManageProjects = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get('/projects');
        
        // Проверяем формат ответа и выбираем правильные данные
        if (Array.isArray(res.data)) {
          setProjects(res.data);
        } else if (res.data && Array.isArray(res.data.projects)) {
          setProjects(res.data.projects);
        } else if (res.data && typeof res.data === 'object') {
          // Если пришёл объект, преобразуем в массив для отображения
          console.log("Получены данные:", res.data);
          setProjects([]);  // Временно установим пустой массив
        } else {
          // Если формат данных совсем не тот, который ожидаем
          console.error("Неожиданный формат данных:", res.data);
          setProjects([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Ошибка загрузки проектов:', err);
        setError('Не удалось загрузить проекты. Пожалуйста, попробуйте позже.');
        setProjects([]);  // Устанавливаем пустой массив при ошибке
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="page-container">      <div className="project-list-container">
        <div className="project-header">
          <h2>Проекты</h2>
          {canManageProjects && (
            <Link to="/projects/new" className="btn btn-primary">
              <i className="fas fa-plus"></i> Новый проект
            </Link>
          )}
        </div>

        {loading ? (
          <div className="loading">Загрузка проектов...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : projects.length === 0 ? (
          <div className="no-data">
            <p>Проекты не найдены. Создайте новый проект.</p>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map(project => (
              <div key={project.id} className="project-card">
                <h3>
                  <Link to={`/projects/${project.id}`}>{project.name}</Link>
                </h3>
                <p className="project-description">{project.description}</p>
                
                <div className="project-meta">
                  <span className={`project-status status-${project.status}`}>
                    {project.status === 'active' && 'Активен'}
                    {project.status === 'completed' && 'Завершен'}
                    {project.status === 'suspended' && 'Приостановлен'}
                  </span>
                  <span className="project-date">
                    Начало: {new Date(project.start_date).toLocaleDateString()}
                  </span>
                  {project.end_date && (
                    <span className="project-date">
                      Окончание: {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="project-actions">
                  <Link to={`/projects/${project.id}`} className="btn btn-info btn-sm">
                    Подробнее
                  </Link>
                  <Link to={`/projects/${project.id}/defects`} className="btn btn-secondary btn-sm">
                    Дефекты
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;