import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Проверяем наличие пользователя при загрузке
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          СистемаКонтроля
        </Link>
        
        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/projects" className="navbar-link">Проекты</Link>
          </li>
          <li className="navbar-item">
            <Link to="/defects" className="navbar-link">Все дефекты</Link>
          </li>
          {user && (user.role === 'manager' || user.role === 'admin') && (
            <li className="navbar-item">
              <Link to="/reports" className="navbar-link">Отчеты</Link>
            </li>
          )}
        </ul>
        
        <div className="navbar-user">
          {user && (
            <>
              <span className="user-greeting">
                Привет, {user.username}!
              </span>
              <div className="user-dropdown">
                <button className="user-dropdown-btn">
                  <i className="fas fa-user-circle"></i>
                </button>
                <div className="dropdown-content">
                  <Link to="/profile">Мой профиль</Link>
                  <button onClick={logout}>Выйти</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;