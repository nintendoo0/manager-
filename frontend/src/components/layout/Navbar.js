import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Вместо прямого доступа к localStorage используем контекст
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          СистемаКонтроля
        </Link>
        
        <ul className="navbar-menu">
          {user && (
            <>
              <li className="navbar-item">
                <Link to="/projects" className="navbar-link">Проекты</Link>
              </li>
              <li className="navbar-item">
                <Link to="/defects" className="navbar-link">Дефекты</Link>
              </li>
              {user.role === 'admin' && (
                <li className="navbar-item">
                  <Link to="/admin/users" className="navbar-link">Пользователи</Link>
                </li>
              )}
            </>
          )}
        </ul>
        
        {user && (
          <div className="navbar-user">
            <div className="navbar-actions">
              <Link to="/profile" className="profile-link">{user.username}</Link>
              <button onClick={handleLogout} className="logout-btn">Выйти</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;