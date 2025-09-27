import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProjectList from './components/Projects/ProjectList';
import DefectList from './components/Defects/DefectList';
import './App.css';

// Проверка аутентификации
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Защищенные маршруты */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <ProjectList />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/projects" 
            element={
              <PrivateRoute>
                <ProjectList />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/defects" 
            element={
              <PrivateRoute>
                <DefectList />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
