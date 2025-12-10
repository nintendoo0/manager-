import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import Pagination from '../UI/Pagination';
import './Projects.css';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // Состояния для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Проверка прав на управление проектами (только admin и manager)
  const canManageProjects = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    fetchProjects();
  }, [currentPage, itemsPerPage]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects?page=${currentPage}&limit=${itemsPerPage}`);
      
      // Обрабатываем новый формат ответа с пагинацией
      if (res.data && res.data.data) {
        setProjects(res.data.data);
        setPagination(res.data.pagination);
      } else if (Array.isArray(res.data)) {
        // Обратная совместимость со старым форматом
        setProjects(res.data);
      } else {
        console.error("Неожиданный формат данных:", res.data);
        setProjects([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки проектов:', err);
      setError('Не удалось загрузить проекты. Пожалуйста, попробуйте позже.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page, newItemsPerPage) => {
    if (newItemsPerPage && newItemsPerPage !== itemsPerPage) {
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1); // Сбрасываем на первую страницу при изменении количества
    } else {
      setCurrentPage(page);
    }
  };

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
        
        {/* Компонент пагинации */}
        {!loading && !error && projects.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectList;