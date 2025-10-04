const db = require('../config/db');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  try {
    console.log('Проверка наличия администратора в базе данных...');
    
    // Проверяем существование таблицы users
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Таблица users не существует. Создаем...');
      await db.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Таблица users успешно создана');
    }
    
    // Проверяем, существует ли уже администратор
    const adminCheck = await db.query(
      "SELECT * FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (adminCheck.rows.length > 0) {
      console.log('Администратор уже существует в системе');
      return;
    }

    // Создаем администратора по умолчанию
    const defaultAdmin = {
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      role: 'admin'
    };

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultAdmin.password, salt);

    // Добавляем администратора в базу данных
    await db.query(
      `INSERT INTO users (username, password, email, role) 
       VALUES ($1, $2, $3, $4)`,
      [defaultAdmin.username, hashedPassword, defaultAdmin.email, defaultAdmin.role]
    );

    console.log('Администратор успешно создан:');
    console.log('Логин: admin');
    console.log('Пароль: admin123');
    console.log('ВНИМАНИЕ: Не забудьте изменить пароль администратора после первого входа!');
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
  }
}

// Экспортируем функцию для использования в server.js
module.exports = createAdminUser;