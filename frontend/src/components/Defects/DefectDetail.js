import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../UI/Card';
import NeonButton from '../UI/NeonButton';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../utils/api'; // Изменено с { apiClient } from '../../api/client
import './Defects.css';

const DefectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [defect, setDefect] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Новые состояния для добавления комментария
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);
  
  useEffect(() => {
    fetchDefectData();
  }, [id]);

  const fetchDefectData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/defects/${id}`);
      setDefect(response);
      
      // Загрузка комментариев
      const commentsResponse = await apiClient.get(`/api/defects/${id}/comments`);
      setComments(commentsResponse || []);
      
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке данных дефекта:', err);
      setError('Не удалось загрузить данные дефекта');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить дефект?')) return;
    try {
      setSubmittingComment(true);
      await apiClient.post(`/api/defects/${id}/comments`, { comment: newComment });
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

  // Отправка нового комментария
  const handleAddComment = async (e) => {
    e?.preventDefault();
    setCommentError(null);
    if (!newComment.trim()) {
      setCommentError('Комментарий не может быть пустым.');
      return;
    }
    try {
      setSubmittingComment(true);
      // отправляем в API; поле называется comment (если у вас другое - поправьте)
      const payload = { comment: newComment.trim() };
      const res = await apiClient.post(`/api/defects/${id}/comments`, payload);
      const created = res.data ?? res;
      // Если бек возвращает созданный объект - подставим его, иначе создадим минимальный объект
      const commentObj = (created && (created.id || created.comment || created.text))
        ? (created.data ?? created)
        : {
            id: Date.now(),
            comment: newComment.trim(),
            author: user?.username || user?.email || 'Я',
            created_at: new Date().toISOString()
          };

      setComments(prev => [commentObj, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Ошибка добавления комментария:', err);
      setCommentError('Не удалось добавить комментарий. Попробуйте ещё раз.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <div className="app-container"><Card className="card"><div className="small">Загрузка...</div></Card></div>;
  }

  if (error || !defect) {
    return <div className="app-container"><Card className="card error-message">{error || 'Дефект не найден'}</Card></div>;
  }

  return (
    <div className="app-container">
      <Card className="card" style={{ padding: 22 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div>
            <div className="neon-title" style={{ fontSize: 24 }}>{defect.title}</div>
            <div className="small" style={{ color:'var(--muted)' }}>{defect.project_name || defect.project_id}</div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <Link to="/defects" className="btn btn-ghost" style={{ textDecoration:'none' }}>Назад</Link>
            {canEditDefect() && (
              <Link to={`/defects/${id}/edit`} style={{ textDecoration:'none' }}>
                <NeonButton>Редактировать</NeonButton>
              </Link>
            )}
            <button className="btn" onClick={handleDelete} style={{ background: 'linear-gradient(135deg,#ff6b6b,#ff4d6d)', color:'#fff', borderRadius:10 }}>Удалить</button>
          </div>
        </div>

        <hr style={{ border:'none', height:1, background:'rgba(255,255,255,0.04)', margin:'12px 0' }} />

        <div className="row" style={{ gap:12, marginBottom:12 }}>
          <div className={`status ${defect.status?.toLowerCase() || ''}`} style={{ padding:'8px 12px' }}>{defect.status || '—'}</div>
          <div className="small">Приоритет: <strong>{defect.priority || '—'}</strong></div>
          <div className="spacer" />
          <div className="small">Создан: {formatDate(defect.created_at)}</div>
        </div>

        <h3>Описание</h3>
        <Card className="card" style={{ padding:16, marginBottom:18 }}>
          <div style={{ color:'var(--muted)' }}>{defect.description || '—'}</div>
        </Card>

        <h3>Комментарии</h3>

        {/* Форма добавления комментария */}
        <form onSubmit={handleAddComment} style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <textarea
            className="textarea"
            placeholder="Добавьте комментарий..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            rows={3}
            style={{ flex: 1 }}
            disabled={submittingComment}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <NeonButton type="submit" onClick={handleAddComment} disabled={submittingComment}>
              {submittingComment ? 'Отправка...' : 'Отправить'}
            </NeonButton>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setNewComment('')}
              disabled={submittingComment}
              style={{ minWidth: 96 }}
            >
              Очистить
            </button>
          </div>
        </form>

        {commentError && <div className="error-message" style={{ marginBottom: 8 }}>{commentError}</div>}

        <div style={{ display:'grid', gap:12 }}>
          {comments.length === 0 ? (
            <div className="small">Комментариев нет.</div>
          ) : comments.map(c => (
            <Card key={c.id || `${c.created_at}-${Math.random()}`} className="card" style={{ padding:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700 }}>{c.author || c.user || c.author_name}</div>
                <div className="small" style={{ color:'var(--muted)', marginTop:6 }}>{c.text || c.comment || c.body}</div>
              </div>
              <div className="small" style={{ color:'var(--muted)' }}>{formatDate(c.created_at)}</div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DefectDetail;