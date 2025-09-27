const db = require('../../config/db');

async function initDatabase() {
  try {
    console.log('Начало инициализации базы данных...');
    
    // Создаем таблицу пользователей
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('База данных успешно инициализирована');
    
    // Проверка существования таблицы
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('Таблица users существует:', tableCheck.rows[0].exists);
    
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
  }
}

// Выполняем инициализацию
initDatabase();

module.exports = { initDatabase };