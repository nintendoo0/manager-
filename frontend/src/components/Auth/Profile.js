import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../UI/Card';
import NeonButton from '../UI/NeonButton';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import './Auth.css';

export default function Profile() {
  const { user: ctxUser, setUser: setCtxUser } = useContext(AuthContext || {});
  const [user, setUser] = useState(ctxUser || null);
  const [loading, setLoading] = useState(!ctxUser);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (ctxUser) {
      setUser(ctxUser);
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/auth/me'); // если у тебя другой endpoint — поправь здесь
        if (mounted) setUser(res.data || res);
      } catch (err) {
        console.error('Ошибка получения профиля:', err);
        if (mounted) setError('Не удалось загрузить профиль');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [ctxUser]);

  if (loading) {
    return <div className="app-container"><Card className="card"><div className="small">Загрузка профиля...</div></Card></div>;
  }

  if (!user) {
    return <div className="app-container"><Card className="card error-message">Профиль не найден.</Card></div>;
  }

  const initial = (user.username || user.email || 'U')[0].toUpperCase();

  const [form, setForm] = useState({
    username: user.username || '',
    email: user.email || '',
    role: user.role || 'user',
    bio: user.bio || ''
  });

  useEffect(() => {
    setForm({
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'user',
      bio: user.bio || ''
    });
  }, [user]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function onSave() {
    setError(null);
    if (!form.username || !form.email) {
      setError('Имя пользователя и email обязательны.');
      return;
    }
    try {
      setSaving(true);
      // Попробуй endpoint /auth/me или /users/:id — при необходимости замени
      const res = await api.post('/auth/update', form); // если у тебя PUT /auth/me — замени
      const updated = res.data || res;
      setUser(updated);
      if (setCtxUser) setCtxUser(updated);
      setEditing(false);
    } catch (err) {
      console.error('Ошибка сохранения профиля:', err);
      setError('Не удалось сохранить профиль. Попробуйте позже.');
    } finally {
      setSaving(false);
    }
  }

  // === Новый код: обработчик выхода ===
  async function handleLogout() {
    try {
      // Попытка уведомить бэкенд о выходе — не критично
      await api.post('/auth/logout').catch(() => {});
    } catch (e) {
      // игнорируем ошибки
    }
    localStorage.removeItem('token');
    if (setCtxUser) setCtxUser(null);
    navigate('/login');
  }
  // === /Новый код ===

  return (
    <div className="app-container">
      <Card className="card" style={{ maxWidth: 940, margin: '0 auto', padding: 28 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 96, height: 96, borderRadius: 999, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:40, fontWeight:700, color:'#061226',
              background: 'linear-gradient(135deg, rgba(124,92,255,1), rgba(0,212,255,0.95))',
              boxShadow: '0 10px 30px rgba(2,6,23,0.45)'
            }}>{initial}</div>
            <div>
              <div className="neon-title" style={{ fontSize: 26 }}>{user.username || user.email}</div>
              <div className="small" style={{ marginTop: 6 }}>{user.email}</div>
              <div className="small" style={{ marginTop: 4 }}>Роль: <strong>{user.role}</strong></div>
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            <NeonButton onClick={() => setEditing(v => !v)}>
              {editing ? 'Отменить' : 'Редактировать профиль'}
            </NeonButton>
            <button className="btn btn-ghost" onClick={async () => {
              // Быстрый экспорт/копия профиля
              const txt = `Пользователь: ${user.username}\nEmail: ${user.email}\nРоль: ${user.role}`;
              navigator.clipboard?.writeText(txt);
            }}>Копировать</button>

            {/* Кнопка выхода */}
            <button
              className="btn"
              onClick={handleLogout}
              style={{ background: 'linear-gradient(135deg,#ff6b6b,#ff4d6d)', color: '#fff', borderRadius: 10 }}
            >
              Выйти
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', height: 1, background: 'rgba(255,255,255,0.04)', margin: '12px 0 18px' }} />

        {error && <div className="error-message" style={{ marginBottom: 12 }}>{error}</div>}

        {!editing ? (
          <div className="row" style={{ gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div className="small field-label">Имя пользователя</div>
              <div className="card" style={{ padding: 12 }}>{user.username}</div>

              <div style={{ height: 12 }} />

              <div className="small field-label">Email</div>
              <div className="card" style={{ padding: 12 }}>{user.email}</div>

              <div style={{ height: 12 }} />

              <div className="small field-label">Bio</div>
              <div className="card" style={{ padding: 12 }}>{user.bio || '—'}</div>
            </div>

            <div style={{ width: 260 }}>
              <div className="small field-label">Активность</div>
              <div className="card" style={{ padding: 12 }}>
                <div className="small">Создано проектов: <strong>{user.projects_count ?? '—'}</strong></div>
                <div style={{ height: 8 }} />
                <div className="small">Создано дефектов: <strong>{user.defects_count ?? '—'}</strong></div>
              </div>

              <div style={{ height: 12 }} />

              <div className="small field-label">Быстрые действия</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => { /* перейти к проектам */ }}>Мои проекты</button>
                <button className="btn btn-ghost" onClick={() => { /* перейти к дефектам */ }}>Мои дефекты</button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="form-grid" style={{ marginBottom: 12 }}>
              <div>
                <label className="field-label">Имя пользователя</label>
                <input name="username" value={form.username} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input name="email" value={form.email} onChange={onChange} className="input" />
              </div>
              <div>
                <label className="field-label">Роль</label>
                <select name="role" value={form.role} onChange={onChange} className="select">
                  <option value="user">Пользователь</option>
                  <option value="engineer">Инженер</option>
                  <option value="admin">Админ</option>
                </select>
              </div>
              <div>
                <label className="field-label">Bio</label>
                <input name="bio" value={form.bio} onChange={onChange} className="input" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <NeonButton onClick={onSave} disabled={saving}>
                {saving ? 'Сохраняю...' : 'Сохранить профиль'}
              </NeonButton>
              <button className="btn btn-ghost" onClick={() => { setEditing(false); setForm({ username: user.username, email: user.email, role: user.role, bio: user.bio }); }}>Отмена</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}