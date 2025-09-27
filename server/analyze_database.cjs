const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function analyzeDatabase() {
  try {
    // Получаем список всех таблиц
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log('📋 Все таблицы в базе данных:\n');
    
    for (const table of tablesResult.rows) {
      console.log(`🔍 Таблица: ${table.table_name}`);
      
      // Получаем структуру каждой таблицы
      const columnsQuery = `
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await pool.query(columnsQuery, [table.table_name]);
      columnsResult.rows.forEach(row => {
        const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
        const nullable = row.is_nullable === 'NO' ? '[Required]' : '[Optional]';
        console.log(`  - ${row.column_name}: ${row.data_type}${length} ${nullable}`);
      });
      
      // Проверяем количество записей
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        console.log(`  📊 Записей: ${countResult.rows[0].count}`);
      } catch (e) {
        console.log(`  ⚠️ Не удалось подсчитать записи`);
      }
      
      console.log(''); // Пустая строка для разделения
    }
    
    console.log('\n🔗 АНАЛИЗ СВЯЗЕЙ С ПРОФИЛЕМ ПОЛЬЗОВАТЕЛЯ:\n');
    
    // Анализируем, где нужны связи с профилем
    console.log('✅ ТАБЛИЦЫ, КОТОРЫЕ УЖЕ СВЯЗАНЫ С ПОЛЬЗОВАТЕЛЕМ:');
    console.log('  - auth_users (основная таблица профилей)');
    console.log('  - user_sessions (связана с auth_users через user_id)');
    console.log('  - users (старая таблица, возможно нужна миграция)');
    
    console.log('\n❓ ТАБЛИЦЫ, КОТОРЫЕ МОГУТ НУЖДАТЬСЯ В СВЯЗИ:');
    console.log('  - orders (заказы пользователей - нужен user_id?)');
    console.log('  - statistics (статистика пользователей - нужен user_id?)');
    console.log('  - work_materials (рабочие материалы пользователей - нужен user_id?)');
    
    console.log('\n🆕 ТАБЛИЦЫ, КОТОРЫЕ СТОИТ ДОБАВИТЬ:');
    console.log('  - user_profiles (расширенные настройки профиля)');
    console.log('  - user_preferences (настройки интерфейса)');
    console.log('  - user_activities (история активности)');
    console.log('  - team_members (участники команд)');
    console.log('  - projects (проекты пользователей)');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeDatabase();
