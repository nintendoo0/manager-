const db = require('../../config/db');

async function initDatabase() {
  try {
    // Создание последовательности для транзакций
    await db.query(`
      BEGIN;
      
      -- Таблица пользователей
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Таблица проектов
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Таблица дефектов
      CREATE TABLE IF NOT EXISTS defects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        priority VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        project_id INTEGER REFERENCES projects(id),
        created_by INTEGER REFERENCES users(id),
        assigned_to INTEGER REFERENCES users(id),
        deadline DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Таблица комментариев к дефектам
      CREATE TABLE IF NOT EXISTS defect_comments (
        id SERIAL PRIMARY KEY,
        defect_id INTEGER REFERENCES defects(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Таблица вложений к дефектам
      CREATE TABLE IF NOT EXISTS defect_attachments (
        id SERIAL PRIMARY KEY,
        defect_id INTEGER REFERENCES defects(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Индексы для повышения производительности
      CREATE INDEX IF NOT EXISTS idx_defects_project_id ON defects(project_id);
      CREATE INDEX IF NOT EXISTS idx_defects_assigned_to ON defects(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
      CREATE INDEX IF NOT EXISTS idx_comments_defect_id ON defect_comments(defect_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_defect_id ON defect_attachments(defect_id);
      
      COMMIT;
    `);
    
    console.log('База данных успешно инициализирована');
  } catch (err) {
    console.error('Ошибка при инициализации базы данных:', err);
    await db.query('ROLLBACK;');
  }
}

// Запускаем инициализацию базы данных
initDatabase();