import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../UI/Card';
import NeonButton from '../UI/NeonButton';
import api from '../../utils/api';
import './Projects.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const resP = await api.get(`/projects/${id}`);
        const proj = resP.data ?? resP;
        const resD = await api.get(`/projects/${id}/defects`).catch(async () => {
          // fallback если endpoint другой
          const r2 = await api.get(`/defects?project_id=${id}`).catch(() => ({ data: [] }));
          return r2;
        });
        const def = (resD.data ?? resD) || [];
        if (!mounted) return;
        setProject(proj);
        setDefects(Array.isArray(def) ? def : []);
      } catch (e) {
        console.error(e);
        if (mounted) setErr('Не удалось загрузить проект');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return <div className="app-container"><Card className="card"><div className="small">Загрузка...</div></Card></div>;
  }

  if (err || !project) {
    return <div className="app-container"><Card className="card error-message">{err || 'Проект не найден'}</Card></div>;
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';

  const statusClass = (s) => {
    if (!s) return 'badge';
    const key = s.toString().toLowerCase();
    if (key.includes('pause') || key.includes('приост')) return 'badge medium';
    if (key.includes('active') || key.includes('актив')) return 'badge low';
    if (key.includes('done') || key.includes('заверш')) return 'badge high';
    return 'badge';
  };

  async function handleDelete() {
    if (!confirm('Удалить проект? Это действие необратимо.')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (e) {
      console.error(e);
      alert('Ошибка при удалении проекта');
    }
  }

  return (
    <div className="app-container">
      <Card className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="neon-title" style={{ fontSize: 28, marginBottom: 6 }}>
              {project.name}
            </div>
            <div className="small meta" style={{ color: 'var(--muted)' }}>{project.description}</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/projects/${id}/edit`} style={{ textDecoration: 'none' }}>
              <NeonButton>Редактировать</NeonButton>
            </Link>

            <button
              className="btn"
              onClick={handleDelete}
              style={{ background: 'linear-gradient(135deg,#ff6b6b,#ff4d6d)', color: '#fff', borderRadius: 10 }}
            >
              Удалить
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', height: 1, background: 'rgba(255,255,255,0.04)', margin: '18px 0' }} />

        <div className="row" style={{ gap: 18, alignItems: 'center', marginBottom: 12 }}>
          <div className={statusClass(project.status)} style={{ padding: '8px 12px' }}>{project.status || '—'}</div>
          <div className="small">Начало: {formatDate(project.start_date)}</div>
          <div className="small">Окончание: {formatDate(project.end_date)}</div>
          <div className="spacer" />
        </div>

        <h3 style={{ marginTop: 8 }}>Описание</h3>
        <Card className="card" style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ color: 'var(--muted)' }}>{project.description || '—'}</div>
        </Card>

        <hr style={{ border: 'none', height: 1, background: 'rgba(255,255,255,0.04)', margin: '8px 0 18px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3>Дефекты ({defects.length})</h3>
          <div>
            <NeonButton onClick={() => navigate(`/projects/${id}/defects/new`)} style={{ boxShadow: '0 18px 40px rgba(124,92,255,0.12)' }}>
              Новый дефект
            </NeonButton>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {defects.length === 0 ? (
            <div className="small">Дефекты не найдены.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {defects.map(d => (
                <Card key={d.id} className="defect-card fade-in-up" style={{ padding: 14 }}>
                  <div style={{ flex: 1 }}>
                    <Link to={`/defects/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-1)' }}>{d.title}</div>
                    </Link>
                    <div style={{ marginTop: 8 }}>
                      <span className={`badge ${d.priority?.toLowerCase() || ''}`} style={{ marginRight: 8 }}>{d.priority || '—'}</span>
                      <span className={`status ${d.status?.toLowerCase() || ''}`} style={{ marginLeft: 8 }}>{d.status || '—'}</span>
                    </div>
                    <div style={{ marginTop: 10 }} className="small">Исполнитель: {d.assignee || d.assignee_id || 'Не назначено'}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
