import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css'; // оставляем существующие стили, добавим новые классы

const Navbar = () => {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
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
      </nav>
    </header>
  );
};

export default Navbar;