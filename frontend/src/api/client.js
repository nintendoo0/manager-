const API_URL = 'http://localhost:5000'; // URL бэкенд-сервера

export const apiClient = {
  async get(endpoint) {
    const token = localStorage.getItem('token');
    
    console.log('Запрос GET:', `${API_URL}${endpoint}`);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API ошибка:', errorText);
      throw new Error(`Ошибка API: ${response.status}`);
    }
    
    return await response.json();
  },
  
  async post(endpoint, data) {
    const token = localStorage.getItem('token');
    
    console.log('Запрос POST:', `${API_URL}${endpoint}`, data);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API ошибка:', errorText);
      throw new Error(`Ошибка API: ${response.status}`);
    }
    
    return await response.json();
  },
  
  // Добавляем метод delete
  async delete(endpoint) {
    const token = localStorage.getItem('token');
    
    console.log('Запрос DELETE:', `${API_URL}${endpoint}`);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API ошибка:', errorText);
      throw new Error(`Ошибка API: ${response.status}`);
    }
    
    return await response.json();
  }
};