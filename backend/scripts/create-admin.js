const bcrypt = require('bcryptjs'); // Изменено с 'bcrypt' на 'bcryptjs'
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createAdmin() {
  try {
    const username = 'admin';
    const email = 'admin@example.com';
    const password = 'admin123';
    const role = 'admin';

    // Проверяем, существует ли уже администратор
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✓ Администратор уже существует');
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем администратора
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role]
    );

    console.log('✅ Администратор успешно создан:');
    console.log('   Username:', username);
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Role:', role);
    console.log('   ID:', result.rows[0].id);
  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error);
  }
}

// Экспортируем функцию
module.exports = createAdmin;

// Если файл запускается напрямую
if (require.main === module) {
  createAdmin().then(() => {
    pool.end();
    process.exit(0);
  }).catch(err => {
    console.error('Критическая ошибка:', err);
    pool.end();
    process.exit(1);
  });
}