import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/dashboard/stats');
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
      setError('Не удалось загрузить статистику дэшборда');
    } finally {
      setLoading(false);
    }
  };

  const handleExportFullReport = async () => {
    try {
      setExporting(true);
      const response = await apiClient.get('/dashboard/export/full-report', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `full-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка экспорта отчёта:', err);
      alert('Не удалось экспортировать отчёт');
    } finally {
      setExporting(false);
    }
  };

  const handleExportStats = async () => {
    try {
      setExporting(true);
      const response = await apiClient.get('/dashboard/export/stats', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-stats-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка экспорта статистики:', err);
      alert('Не удалось экспортировать статистику');
    } finally {
      setExporting(false);
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      critical: 'Критичный',
      high: 'Высокий',
      medium: 'Средний',
      low: 'Низкий'
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: 'Новый',
      in_progress: 'В работе',
      resolved: 'Решён',
      closed: 'Закрыт',
      active: 'Активен',
      completed: 'Завершён',
      suspended: 'Приостановлен'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="loading">Загрузка дэшборда...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!stats) {
    return <div className="error-message">Нет данных для отображения</div>;
  }

  const canExport = user && (user.role === 'admin' || user.role === 'manager');

  return (
    <div className="page-container">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>📊 Дэшборд</h2>
          {canExport && (
            <div className="export-buttons">
              <button 
                className="btn btn-export" 
                onClick={handleExportFullReport}
                disabled={exporting}
              >
                <i className="fas fa-download"></i>
                {exporting ? 'Экспорт...' : 'Полный отчёт CSV'}
              </button>
              <button 
                className="btn btn-export-stats" 
                onClick={handleExportStats}
                disabled={exporting}
              >
                <i className="fas fa-chart-bar"></i>
                {exporting ? 'Экспорт...' : 'Статистика CSV'}
              </button>
            </div>
          )}
        </div>

        {/* Карточки статистики */}
        <div className="stats-grid">
          <div className="stat-card projects">
            <div className="stat-card-header">
              <div className="stat-icon">
                <i className="fas fa-project-diagram"></i>
              </div>
              <div className="stat-card-content">
                <h3>Проекты</h3>
                <p className="stat-value">{stats.projects.total}</p>
              </div>
            </div>
            <div className="stat-details">
              {stats.projects.byStatus.map(item => (
                <div key={item.status} className="stat-detail-item">
                  <strong>{item.total}</strong> {getStatusLabel(item.status)}
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card defects">
            <div className="stat-card-header">
              <div className="stat-icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <div className="stat-card-content">
                <h3>Дефекты</h3>
                <p className="stat-value">{stats.defects.total}</p>
              </div>
            </div>
            <div className="stat-details">
              {stats.defects.byStatus.map(item => (
                <div key={item.status} className="stat-detail-item">
                  <strong>{item.count}</strong> {getStatusLabel(item.status)}
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card users">
            <div className="stat-card-header">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-card-content">
                <h3>Пользователи</h3>
                <p className="stat-value">{stats.users.total}</p>
              </div>
            </div>
            <div className="stat-details">
              {stats.users.byRole.map(item => (
                <div key={item.role} className="stat-detail-item">
                  <strong>{item.total}</strong> {item.role}
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card overdue">
            <div className="stat-card-header">
              <div className="stat-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-card-content">
                <h3>Просроченные</h3>
                <p className="stat-value">{stats.defects.overdue}</p>
              </div>
            </div>
            <div className="stat-details">
              <div className="stat-detail-item">
                Требуют внимания
              </div>
            </div>
          </div>
        </div>

        {/* Топ проектов */}
        {stats.topProjects && stats.topProjects.length > 0 && (
          <div className="top-projects-table">
            <h3>📈 Проекты по количеству дефектов</h3>
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Проект</th>
                  <th>Всего дефектов</th>
                  <th>Новые</th>
                  <th>В работе</th>
                  <th>Решённые</th>
                  <th>Закрытые</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProjects.map(project => (
                  <tr key={project.id}>
                    <td>
                      <Link to={`/projects/${project.id}`}>
                        {project.name}
                      </Link>
                    </td>
                    <td><strong>{project.defects_count}</strong></td>
                    <td>{project.new_defects}</td>
                    <td>{project.in_progress_defects}</td>
                    <td>{project.resolved_defects}</td>
                    <td>{project.closed_defects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Недавние дефекты */}
        {stats.recentDefects && stats.recentDefects.length > 0 && (
          <div className="recent-defects">
            <h3>🔔 Недавние дефекты</h3>
            {stats.recentDefects.map(defect => (
              <div 
                key={defect.id} 
                className={`defect-item priority-${defect.priority}`}
              >
                <div className="defect-item-header">
                  <Link to={`/defects/${defect.id}`} className="defect-item-title">
                    {defect.title}
                  </Link>
                  <div className="defect-badges">
                    <span className={`badge priority-${defect.priority}`}>
                      {getPriorityLabel(defect.priority)}
                    </span>
                    <span className={`badge status-${defect.status}`}>
                      {getStatusLabel(defect.status)}
                    </span>
                  </div>
                </div>
                <div className="defect-item-meta">
                  📁 {defect.project_name} • 
                  👤 {defect.assigned_to_name || 'Не назначен'} • 
                  📅 {new Date(defect.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Мои дефекты (для инженеров) */}
        {user?.role === 'engineer' && stats.myDefects && stats.myDefects.length > 0 && (
          <div className="recent-defects">
            <h3>👨‍💼 Мои дефекты</h3>
            {stats.myDefects.map(defect => (
              <div 
                key={defect.id} 
                className={`defect-item priority-${defect.priority}`}
              >
                <div className="defect-item-header">
                  <Link to={`/defects/${defect.id}`} className="defect-item-title">
                    {defect.title}
                  </Link>
                  <div className="defect-badges">
                    <span className={`badge priority-${defect.priority}`}>
                      {getPriorityLabel(defect.priority)}
                    </span>
                    <span className={`badge status-${defect.status}`}>
                      {getStatusLabel(defect.status)}
                    </span>
                  </div>
                </div>
                <div className="defect-item-meta">
                  📁 {defect.project_name} • 
                  ⏰ Срок: {defect.deadline ? new Date(defect.deadline).toLocaleDateString() : 'Не указан'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
