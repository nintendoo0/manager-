import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(response.data);
        setLoading(false);
      } catch (err) {
        setError('Ошибка при загрузке проектов');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <div>Загрузка проектов...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="project-list">
      <h2>Проекты</h2>
      <Link to="/projects/new" className="btn btn-primary">Новый проект</Link>
      
      <div className="projects">
        {projects.length === 0 ? (
          <p>Проекты не найдены</p>
        ) : (
          projects.map(project => (
            <div key={project.id} className="project-card">
              <h3><Link to={`/projects/${project.id}`}>{project.name}</Link></h3>
              <p>{project.description}</p>
              <div className="project-status">Статус: {project.status}</div>
              <div className="project-dates">
                <span>Начало: {new Date(project.start_date).toLocaleDateString()}</span>
                {project.end_date && (
                  <span> | Окончание: {new Date(project.end_date).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectList;