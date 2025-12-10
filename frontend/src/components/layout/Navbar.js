import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext) || {};
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = () => {
    if (logout) logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">Manager</Link>        <ul className="navbar-menu" role="menubar">
          <li className="navbar-item" role="none">
            <Link to="/dashboard" className="navbar-link" role="menuitem">Дэшборд</Link>
          </li>
          <li className="navbar-item" role="none">
            <Link to="/projects" className="navbar-link" role="menuitem">Проекты</Link>
          </li>
          <li className="navbar-item" role="none">
            <Link to="/defects" className="navbar-link" role="menuitem">Дефекты</Link>
          </li>
          {user && user.role === 'admin' && (
            <li className="navbar-item" role="none">
              <Link to="/admin/users" className="navbar-link" role="menuitem">Пользователи</Link>
            </li>
          )}
        </ul>

        <div className="navbar-user" ref={containerRef}>
          {user ? (
            <div
              className="user-profile-container"
              onClick={() => setOpen((s) => !s)}
              tabIndex={0}
              aria-haspopup="true"
              aria-expanded={open}
            >
              <div className="user-avatar">{user.username ? user.username.charAt(0).toUpperCase() : 'U'}</div>
              <div className="user-name">{user.username}</div>
              <i className={`fa fa-chevron-down ${open ? 'rotate' : ''}`} />

              {open && (
                <div className="user-dropdown" role="menu">
                  <Link to="/profile" className="dropdown-item" onClick={() => setOpen(false)}>Профиль</Link>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item logout-button" onClick={handleLogout}>Выйти</button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;