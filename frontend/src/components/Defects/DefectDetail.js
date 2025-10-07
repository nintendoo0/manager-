import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import './Defects.css';

const DefectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [defect, setDefect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    assigned_to: '',
    deadline: ''
  });

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchDefectData();
  }, [id]);

  const fetchDefectData = async () => {
    try {
      setLoading(true);
      
      // Получаем информацию о дефекте
      const defectRes = await api.get(`/defects/${id}`);
      setDefect(defectRes.data);
      
      // Устанавливаем значения формы из полученных данных
      setFormData({
        status: defectRes.data.status || 'new',
        priority: defectRes.data.priority || 'medium',
        assigned_to: defectRes.data.assigned_to || '',
        deadline: defectRes.data.deadline ? defectRes.data.deadline.split('T')[0] : ''
      });
      
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.put(`/defects/${id}`, { 
        ...defect,
        ...formData 
      });
      
      alert('Дефект успешно обновлен');
      setIsEditing(false);
      fetchDefectData();
    } catch (err) {
      console.error('Ошибка при обновлении дефекта:', err);
      alert(err.response?.data?.message || 'Ошибка при обновлении дефекта');
    }
  };

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

  const getStatusLabel = (status) => {
    switch(status) {
      case 'new': return 'Новый';
      case 'in_progress': return 'В работе';
      case 'review': return 'На проверке';
      case 'closed': return 'Закрыт';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  // Проверка роли пользователя для редактирования
  const canEditStatus = () => {
    return user && ['admin', 'manager'].includes(user.role);
  };
  
  // Проверка возможности комментирования
  const canComment = () => {
    return user && ['admin', 'manager', 'engineer'].includes(user.role);
  };
  
  // Проверка возможности удаления
  const canDelete = () => {
    return user && ['admin', 'manager'].includes(user.role);
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

  return (
    <div className="defect-detail-container">
      <div className="defect-detail-header">
        <h2>{defect.title}</h2>
        <div className="defect-detail-actions">
          {canEditStatus() && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
              Редактировать
            </button>
          )}
          {canDelete() && (
            <button onClick={handleDelete} className="btn btn-danger">
              Удалить
            </button>
          )}
          <button onClick={() => navigate('/defects')} className="btn btn-secondary">
            Назад
          </button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="edit-section">
          <h3>Редактирование дефекта</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Статус</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="new">Новый</option>
                  <option value="in_progress">В работе</option>
                  <option value="review">На проверке</option>
                  <option value="closed">Закрыт</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="priority">Приоритет</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assigned_to">Исполнитель</label>
                <input
                  type="text"
                  id="assigned_to"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleInputChange}
                  placeholder="ID исполнителя"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deadline">Срок исполнения</label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary">
                Сохранить
              </button>
            </div>
          </form>
        </div>
      ) : (
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
      )}
      
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
        
        {canComment() && (
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
        )}
      </div>
    </div>
  );
};

export default DefectDetail;