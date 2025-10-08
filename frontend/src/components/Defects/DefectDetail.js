import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../utils/api'; // Изменено с { apiClient } from '../../api/client
import './Defects.css';

const DefectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [defect, setDefect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Добавляем состояние для комментариев
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchDefectData();
  }, [id]);

  const fetchDefectData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/defects/${id}`);
      setDefect(response.data); // .data для axios
      
      // Загрузка комментариев
      const commentsResponse = await apiClient.get(`/defects/${id}/comments`);
      setComments(Array.isArray(commentsResponse.data) ? commentsResponse.data : []);
      
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке данных дефекта:', err);
      setError('Не удалось загрузить данные дефекта');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      setSubmittingComment(true);
      await apiClient.post(`/defects/${id}/comments`, { comment: newComment });
      setNewComment('');
      fetchDefectData(); // Перезагружаем данные, включая комментарии
    } catch (error) {
      console.error('Ошибка при отправке комментария:', error);
      alert('Не удалось отправить комментарий');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'new': 'Новый',
      'in_progress': 'В работе',
      'review': 'На проверке',
      'closed': 'Закрыт',
      'cancelled': 'Отменен'
    };
    
    return statusMap[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const priorityMap = {
      'high': 'Высокий',
      'medium': 'Средний',
      'low': 'Низкий'
    };
    
    return priorityMap[priority] || priority;
  };

  // Функция проверки права на редактирование
  const canEditDefect = () => {
    // Проверяем, есть ли пользователь и имеет ли он роль admin или manager
    return user && ['admin', 'manager'].includes(user.role);
  };

  if (loading) {
    return <div className="loading">Загрузка данных...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!defect) {
    return <div className="not-found">Дефект не найден</div>;
  }

  return (
    <div className="defect-detail-container">
      <div className="defect-header">
        <h2>{defect.title}</h2>
        <div className="defect-actions">
          <button 
            onClick={() => navigate('/defects')} 
            className="btn btn-secondary"
          >
            Назад
          </button>
          
          {/* Показываем кнопку редактирования только для admin и manager */}
          {canEditDefect() && (
            <button 
              onClick={() => navigate(`/defects/${id}/edit`)} 
              className="btn btn-primary"
            >
              Редактировать
            </button>
          )}
        </div>
      </div>

      <div className="defect-info">
        <div>
          <span>Статус:</span>
          <span className={`status-badge ${defect.status}`}>{getStatusLabel(defect.status)}</span>
        </div>
        <div>
          <span>Приоритет:</span>
          <span className={`priority-badge ${defect.priority}`}>{defect.priority}</span>
        </div>
        <div>
          <span>Проект:</span>
          <span>{defect.project_name || 'Общага'}</span>
        </div>
        <div>
          <span>Создан:</span>
          <span>{new Date(defect.created_at).toLocaleString()}</span>
        </div>
        <div>
          <span>Создал:</span>
          <span>{defect.created_username || 'Неизвестно'}</span>
        </div>
        <div>
          <span>Назначено:</span>
          <span>{defect.assigned_username || 'Не назначено'}</span>
        </div>

        <div className="description-box">
          <h3>Описание</h3>
          <p>{defect.description || 'Описание отсутствует'}</p>
        </div>
      </div>

      {/* Раздел комментариев */}
      <div className="comments-section">
        <h3>Комментарии</h3>
        
        <div className="comments-list">
          {comments.length === 0 ? (
            <p>Нет комментариев</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <span className="comment-author">{comment.username}</span>
                  <span className="comment-date">{new Date(comment.created_at).toLocaleString()}</span>
                </div>
                <div className="comment-body">{comment.comment}</div>
              </div>
            ))
          )}
        </div>
        
        <div className="add-comment">
          <h4>Добавить комментарий</h4>
          <form onSubmit={handleCommentSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Введите комментарий..."
              rows="3"
              required
            ></textarea>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submittingComment}
            >
              {submittingComment ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DefectDetail;