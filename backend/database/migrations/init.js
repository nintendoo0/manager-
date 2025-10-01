const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    console.log('Начало инициализации базы данных...');
    
    // Чтение SQL-файла
    const sqlFilePath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Выполнение SQL-скрипта
    await db.query(sql);
    
    console.log('База данных успешно инициализирована');
    
    // Проверка наличия таблиц
    const tables = ['users', 'projects', 'defects', 'defect_comments', 'defect_attachments'];
    
    for (const table of tables) {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      console.log(`Таблица ${table} существует:`, tableCheck.rows[0].exists);
    }
    
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    throw error;
  }
}

// Экспортируем функцию
module.exports = { initDatabase };

// Выполняем инициализацию, если скрипт запущен напрямую
if (require.main === module) {
  initDatabase().then(() => {
    console.log('Инициализация базы данных завершена');
    process.exit(0);
  }).catch(err => {
    console.error('Ошибка при инициализации:', err);
    process.exit(1);
  });
}