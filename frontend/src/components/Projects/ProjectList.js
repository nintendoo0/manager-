import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../UI/Card';
import NeonButton from '../UI/NeonButton';
import api from '../../utils/api';
import './Projects.css';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get('/projects');
        // если api.get возвращает { data: [...] }
        const data = res.data ?? res;
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить проекты');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  function openProject(projectId) {
<<<<<<< HEAD
    // переходит на страницу проекта; убедитесь, что маршрут /projects/:id настро
=======
    // переходит на страницу проекта; убедитесь, что маршрут /projects/:id настроен
>>>>>>> 722b129 (Сделал всё за 5 минут, что делал Гафур 5 часов)
    navigate(`/projects/${projectId}`);
  }

  return (
    <div className="project-list-container">
      <div className="project-header">
        <h2>Проекты</h2>
        <Link to="/projects/new" className="btn btn-primary">
          <i className="fas fa-plus"></i> Новый проект
        </Link>
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
            <Card key={project.id} className="project-card fade-in-up">
              <div className="row" style={{justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div className="neon-title">
                    <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {project.name}
                    </Link>
                  </div>
                  <div className="meta small">{project.description}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="small">{project.start_date ? new Date(project.start_date).toLocaleDateString() : ''}</div>
                  <div className="small">{project.end_date ? new Date(project.end_date).toLocaleDateString() : ''}</div>
                </div>
              </div>
              <div style={{marginTop:12}} className="row">
                <NeonButton onClick={() => openProject(project.id)}>Открыть</NeonButton>
                <div className="spacer" />
                <div className="small">{project.status}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;