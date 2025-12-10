import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import './Defects.css';

const PendingApprovals = () => {
  const { user } = useContext(AuthContext);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);
  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/defects/pending-approvals');
      
      // Обработка разных форматов ответа
      if (response.data && response.data.data) {
        setDefects(Array.isArray(response.data.data) ? response.data.data : []);
      } else if (Array.isArray(response.data)) {
        setDefects(response.data);
      } else {
        setDefects([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке ожидающих подтверждения:', err);
      setError('Не удалось загрузить ожидающие подтверждения');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (defectId, approved) => {
    try {
      await api.post(`/defects/${defectId}/approve-status-change`, { approved });
      alert(approved ? 'Изменение подтверждено' : 'Изменение отклонено');
      fetchPendingApprovals();
    } catch (err) {
      console.error('Ошибка при подтверждении:', err);
      alert('Ошибка при подтверждении');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: 'Новый',
      in_progress: 'В работе',
      review: 'На проверке',
      closed: 'Закрыт',
      cancelled: 'Отменен'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: 'Высокий',
      medium: 'Средний',
      low: 'Низкий'
    };
    return labels[priority] || priority;
  };

  if (!user || !['admin', 'manager'].includes(user.role)) {
    return (
      <div className="error-container">
        <div className="error-message">
          Доступ запрещен. Эта страница доступна только администраторам и менеджерам.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="defect-list-container">
      <div className="defect-list-header">
        <h2>Ожидают подтверждения ({defects.length})</h2>
      </div>

      {defects.length === 0 ? (
        <div className="no-data">
          <p>Нет дефектов, ожидающих подтверждения</p>
        </div>
      ) : (
        <div className="defect-cards">
          {defects.map(defect => (
            <div key={defect.id} className="defect-card approval-card">
              <h3>
                <Link to={`/defects/${defect.id}`}>{defect.title}</Link>
              </h3>
              
              <div className="defect-meta">
                <span className={`defect-priority priority-${defect.priority}`}>
                  {getPriorityLabel(defect.priority)}
                </span>
                <span className={`defect-status status-${defect.status}`}>
                  Текущий: {getStatusLabel(defect.status)}
                </span>
                <span className={`defect-status status-${defect.pending_status}`}>
                  → {getStatusLabel(defect.pending_status)}
                </span>
              </div>
              
              <div className="defect-project">
                <span className="meta-label">Проект:</span>
                <span>{defect.project_name}</span>
              </div>
              
              <div className="defect-assigned">
                <span className="meta-label">Запросил:</span>
                <span>{defect.requested_by_username}</span>
              </div>
              
              <div className="defect-footer">
                <div className="defect-dates">
                  <span className="defect-created">
                    {new Date(defect.requested_at).toLocaleString('ru-RU')}
                  </span>
                </div>
                <div className="approval-buttons">
                  <button 
                    onClick={() => handleApprove(defect.id, true)}
                    className="btn btn-success btn-sm"
                  >
                    ✓ Подтвердить
                  </button>
                  <button 
                    onClick={() => handleApprove(defect.id, false)}
                    className="btn btn-danger btn-sm"
                  >
                    ✗ Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;