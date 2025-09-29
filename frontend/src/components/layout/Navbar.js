import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

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
            <Link to="/defects" className="navbar-link">Дефекты</Link>
          </li>
          {user && (user.role === 'manager' || user.role === 'admin') && (
            <li className="navbar-item">
              <Link to="/reports" className="navbar-link">Отчеты</Link>
            </li>
          )}
        </ul>
        
        {user && (
          <div className="navbar-user">
            <div 
              className="user-profile-container" 
              onClick={() => setShowDropdown(!showDropdown)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
              tabIndex="0"
            >
              <div className="user-avatar">
                {user.username ? user.username.charAt(0).toUpperCase() : 'У'}
              </div>
              <span className="user-name">{user.username}</span>
              <i className={`fa fa-chevron-down ${showDropdown ? 'rotate' : ''}`}></i>
              
              {showDropdown && (
                <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-item">
                    <i className="fas fa-user"></i> Мой профиль
                  </Link>
                  <hr className="dropdown-divider" />
                  <button onClick={handleLogout} className="dropdown-item logout-button">
                    <i className="fas fa-sign-out-alt"></i> Выйти
                  </button>
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;