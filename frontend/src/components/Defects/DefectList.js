import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

const DefectList = () => {
  const { projectId } = useParams();
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_to: ''
  });

  useEffect(() => {
    const fetchDefects = async () => {
      try {
        const token = localStorage.getItem('token');
        const params = { ...filters };
        if (projectId) params.project_id = projectId;
        
        const response = await axios.get('/api/defects', {
          headers: { Authorization: `Bearer ${token}` },
          params
        });
        
        setDefects(response.data);
        setLoading(false);
      } catch (err) {
        setError('Ошибка при загрузке дефектов');
        setLoading(false);
      }
    };

    fetchDefects();
  }, [projectId, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div>Загрузка дефектов...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="defect-list">
      <h2>Дефекты {projectId ? 'проекта' : ''}</h2>
      <Link to={projectId ? `/projects/${projectId}/defects/new` : "/defects/new"} className="btn btn-primary">
        Новый дефект
      </Link>
      
      <div className="filters">
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">Все статусы</option>
          <option value="new">Новый</option>
          <option value="in_progress">В работе</option>
          <option value="review">На проверке</option>
          <option value="closed">Закрыт</option>
          <option value="cancelled">Отменен</option>
        </select>
        
        <select name="priority" value={filters.priority} onChange={handleFilterChange}>
          <option value="">Все приоритеты</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>
      </div>
      
      <div className="defects">
        {defects.length === 0 ? (
          <p>Дефекты не найдены</p>
        ) : (
          defects.map(defect => (
            <div key={defect.id} className="defect-card">
              <h3><Link to={`/defects/${defect.id}`}>{defect.title}</Link></h3>
              <div className="defect-meta">
                <span className={`priority priority-${defect.priority}`}>
                  {defect.priority}
                </span>
                <span className={`status status-${defect.status}`}>
                  {defect.status}
                </span>
              </div>
              <p>{defect.description.substring(0, 100)}...</p>
              {defect.deadline && (
                <div className="deadline">
                  Срок: {new Date(defect.deadline).toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DefectList;