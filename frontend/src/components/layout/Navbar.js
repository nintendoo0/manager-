import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';
=======
import './Navbar.css'; // оставляем существующие стили, добавим новые классы
>>>>>>> 722b129 (Сделал всё за 5 минут, что делал Гафур 5 часов)

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
<<<<<<< HEAD
    <header className="card row" style={{ position: 'relative', zIndex: 3, justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(124,92,255,0.95), rgba(0,212,255,0.9))',
          boxShadow: '0 8px 28px rgba(124,92,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#061226'
        }}>
          M
        </div>
        <Link to="/" className="neon-title" style={{ textDecoration: 'none' }}>Manager+</Link>
      </div>

      <nav style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <Link to="/projects" className="small" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Проекты</Link>
        <Link to="/defects" className="small" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Дефекты</Link>
        <Link to="/profile" className="small" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Профиль</Link>
=======
    <header style={{position:'relative', zIndex:3}} className="card row" >
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{
          width:44, height:44, borderRadius:12,
          background: 'linear-gradient(135deg, rgba(124,92,255,0.95), rgba(0,212,255,0.9))',
          boxShadow:'0 8px 28px rgba(124,92,255,0.12)',
          display:'flex',alignItems:'center',justifyContent:'center', fontWeight:800, color:'#061226'
        }}>
          M
        </div>
        <Link to="/" className="neon-title" style={{textDecoration:'none'}}>Manager+</Link>
      </div>

      <nav style={{display:'flex',gap:12, alignItems:'center'}}>
        <Link to="/projects" className="small" style={{color:'var(--muted)'}}>Проекты</Link>
        <Link to="/defects" className="small" style={{color:'var(--muted)'}}>Дефекты</Link>
        <Link to="/profile" className="small" style={{color:'var(--muted)'}}>Профиль</Link>
>>>>>>> 722b129 (Сделал всё за 5 минут, что делал Гафур 5 часов)
      </nav>
    </header>
  );
};

export default Navbar;