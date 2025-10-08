import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Card from '../UI/Card';
import NeonButton from '../UI/NeonButton';
import api from '../../utils/api';
import './Projects.css';

export default function ProjectForm() {
  const { id } = useParams(); // если есть id — режим редактирования
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'active',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/projects/${id}`);
        const project = res.data ?? res;
        if (!mounted) return;
        setForm({
          name: project.name || '',
          description: project.description || '',
          status: project.status || 'active',
          start_date: project.start_date ? formatForInput(project.start_date) : '',
          end_date: project.end_date ? formatForInput(project.end_date) : ''
        });
      } catch (err) {
        console.error('Ошибка загрузки проекта:', err);
        setError('Не удалось загрузить проект для редактирования');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, isEdit]);

  function formatForInput(value) {
    const d = new Date(value);
    if (isNaN(d)) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Название проекта обязательно.');
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        // ожидается, что бэкенд поддерживает PUT /projects/:id
        const res = await api.put(`/projects/${id}`, form);
        const updated = res.data ?? res;
        navigate(`/projects/${id}`);
      } else {
        const res = await api.post('/projects', form);
        const created = res.data ?? res;
        const newId = created.id ?? created._id ?? created.project_id;
        navigate(newId ? `/projects/${newId}` : '/projects');
      }
    } catch (err) {
      console.error('Ошибка сохранения проекта:', err);
      setError('Не удалось сохранить проект. Проверьте данные и попробуйте снова.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="app-container">
        <Card className="card"><div className="small">Загрузка данных проекта...</div></Card>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Card className="card" style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <div className="neon-title" style={{ fontSize: 22 }}>{isEdit ? 'Редактирование проекта' : 'Новый проект'}</div>
            <div className="small" style={{ color: 'var(--muted)' }}>{isEdit ? `ID: ${id}` : 'Создать новый проект'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/projects" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Назад</Link>
            <NeonButton onClick={handleSubmit} disabled={saving}>
              {saving ? 'Сохраняю...' : (isEdit ? 'Сохранить' : 'Создать')}
            </NeonButton>
          </div>
        </div>

        <hr style={{ border: 'none', height: 1, background: 'rgba(255,255,255,0.04)', margin: '12px 0' }} />

        {error && <div className="error-message" style={{ marginBottom: 12 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label className="field-label">Название</label>
              <input name="name" value={form.name} onChange={onChange} className="input" placeholder="Название проекта" />
            </div>

            <div>
              <label className="field-label">Описание</label>
              <textarea name="description" value={form.description} onChange={onChange} className="textarea" rows={4} placeholder="Краткое описание проекта" />
            </div>

            <div className="form-grid">
              <div>
                <label className="field-label">Статус</label>
                <select name="status" value={form.status} onChange={onChange} className="select">
                  <option value="active">Активен</option>
                  <option value="paused">Приостановлен</option>
                  <option value="done">Завершён</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label className="field-label">Начало</label>
                  <input name="start_date" type="date" value={form.start_date} onChange={onChange} className="input" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="field-label">Окончание</label>
                  <input name="end_date" type="date" value={form.end_date} onChange={onChange} className="input" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <NeonButton type="submit" disabled={saving}>{saving ? 'Сохраняю...' : (isEdit ? 'Сохранить изменения' : 'Создать проект')}</NeonButton>
              <Link to={isEdit ? `/projects/${id}` : '/projects'} className="btn btn-ghost" style={{ alignSelf: 'center' }}>Отмена</Link>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}