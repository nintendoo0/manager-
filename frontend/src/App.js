import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Profile from './components/Auth/Profile';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetail from './components/Projects/ProjectDetail';
import ProjectForm from './components/Projects/ProjectForm';
import DefectList from './components/Defects/DefectList';
import DefectDetail from './components/Defects/DefectDetail';
import DefectForm from './components/Defects/DefectForm';
import UserManagement from './components/Admin/UserManagement'; // Добавляем импорт
import Navbar from './components/layout/Navbar';
import './App.css';
// import 'bootstrap/dist/css/bootstrap-grid.min.css';

// Проверка аутентификации
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Проверка прав администратора
const AdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user && user.role === 'admin';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  const isAuthenticated = localStorage.getItem('token') !== null;

  return (
    <AuthProvider>
      <Router>
        {isAuthenticated && <Navbar />}
        <div className={`app ${isAuthenticated ? 'with-navbar' : ''}`} style={{width: '100%'}}>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Маршрут для администрирования пользователей */}
            <Route 
              path="/admin/users" 
              element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              } 
            />
            
            {/* Защищенные маршруты */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <ProjectList />
                </PrivateRoute>
              } 
            />
            
            {/* Профиль */}
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Profile />
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
            <Route 
              path="/projects/:id/edit" 
              element={
                <PrivateRoute>
                  <ProjectForm />
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
              path="/defects/new" 
              element={
                <PrivateRoute>
                  <DefectForm />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/defects/:id" 
              element={
                <PrivateRoute>
                  <DefectDetail />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/defects/:id/edit" 
              element={
                <PrivateRoute>
                  <DefectForm />
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
            <Route 
              path="/projects/:projectId/defects/new" 
              element={
                <PrivateRoute>
                  <DefectForm />
                </PrivateRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
