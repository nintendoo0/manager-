import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetail from './components/Projects/ProjectDetail';
import ProjectForm from './components/Projects/ProjectForm';
import DefectList from './components/Defects/DefectList';
import Navbar from './components/layout/Navbar';
import './App.css';

// Проверка аутентификации
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const isAuthenticated = localStorage.getItem('token') !== null;

  return (
    <Router>
      {isAuthenticated && <Navbar />}
      <div className={`app ${isAuthenticated ? 'with-navbar' : ''}`}>
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
          
          {/* Маршруты проектов */}
          <Route 
            path="/projects" 
            element={
              <PrivateRoute>
                <ProjectList />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/projects/new" 
            element={
              <PrivateRoute>
                <ProjectForm />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/projects/:id" 
            element={
              <PrivateRoute>
                <ProjectDetail />
              </PrivateRoute>
            } 
          />
          
          {/* Маршруты дефектов */}
          <Route 
            path="/defects" 
            element={
              <PrivateRoute>
                <DefectList />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/projects/:projectId/defects" 
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
