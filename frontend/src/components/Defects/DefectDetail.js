import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import './Defects.css';

const DefectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [defect, setDefect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchDefectData = async () => {
      try {
        setLoading(true);
        
        // Получаем информацию о дефекте
        const defectRes = await api.get(`/defects/${id}`);
        setDefect(defectRes.data);
        
        // Получаем комментарии к дефекту
        const commentsRes = await api.get(`/defects/${id}/comments`);
        setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
        
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке данных дефекта:', err);
        setError('Не удалось загрузить информацию о дефекте. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchDefectData();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      setSubmittingComment(true);
      const res = await api.post(`/defects/${id}/comments`, { comment: newComment });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      console.error('Ошибка при добавлении комментария:', err);
      alert('Не удалось добавить комментарий');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот дефект?')) {
      return;
    }
    
    try {
      await api.delete(`/defects/${id}`);
      navigate('/defects');
    } catch (err) {
      console.error('Ошибка при удалении дефекта:', err);
      alert('Не удалось удалить дефект');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка данных дефекта...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!defect) {
    return <div className="error-message">Дефект не найден</div>;
  }

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
    <div className="defect-detail-container">
      <div className="defect-detail-header">
        <h2>{defect.title}</h2>
        <div className="defect-detail-actions">
          <Link to={`/defects/${id}/edit`} className="btn btn-secondary">
            Редактировать
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            Удалить
          </button>
        </div>
      </div>
      
      <div className="defect-meta-info">
        <div className="meta-item">
          <span className="meta-label">Статус:</span>
          <span className={`defect-status status-${defect.status}`}>
            {getStatusLabel(defect.status)}
          </span>
        </div>
        
        <div className="meta-item">
          <span className="meta-label">Приоритет:</span>
          <span className={`defect-priority priority-${defect.priority}`}>
            {getPriorityLabel(defect.priority)}
          </span>
        </div>
        
        {defect.project_name && (
          <div className="meta-item">
            <span className="meta-label">Проект:</span>
            <Link to={`/projects/${defect.project_id}`}>{defect.project_name}</Link>
          </div>
        )}
        
        {defect.assigned_to_name && (
          <div className="meta-item">
            <span className="meta-label">Исполнитель:</span>
            <span>{defect.assigned_to_name}</span>
          </div>
        )}
        
        {defect.created_by_name && (
          <div className="meta-item">
            <span className="meta-label">Создал:</span>
            <span>{defect.created_by_name}</span>
          </div>
        )}
        
        {defect.created_at && (
          <div className="meta-item">
            <span className="meta-label">Создан:</span>
            <span>{new Date(defect.created_at).toLocaleString()}</span>
          </div>
        )}
        
        {defect.deadline && (
          <div className="meta-item">
            <span className="meta-label">Срок:</span>
            <span>{new Date(defect.deadline).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      <div className="defect-description">
        <h3>Описание</h3>
        <div className="description-content">
          {defect.description ? (
            <pre>{defect.description}</pre>
          ) : (
            <p className="no-data">Описание отсутствует</p>
          )}
        </div>
      </div>
      
      <div className="defect-comments">
        <h3>Комментарии</h3>
        {comments.length === 0 ? (
          <div className="no-data">Нет комментариев</div>
        ) : (
          <div className="comments-list">
            {comments.map(comment => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <span className="comment-author">{comment.username}</span>
                  <span className="comment-date">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="comment-content">
                  {comment.comment}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="add-comment">
          <form onSubmit={handleCommentSubmit}>
            <div className="form-group">
              <label htmlFor="newComment">Добавить комментарий</label>
              <textarea
                id="newComment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
                rows="3"
                placeholder="Введите комментарий..."
              ></textarea>
            </div>
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