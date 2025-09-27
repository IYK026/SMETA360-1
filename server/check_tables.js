import { query } from './database.js';

async function checkTables() {
  try {
    console.log('📋 Проверяем существующие таблицы...');
    
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('phases', 'stages', 'substages', 'works_ref', 'materials', 'work_materials')
      ORDER BY table_name
    `);
    
    console.log('✅ Существующие таблицы:', result.rows.map(r => r.table_name));
    
    if (result.rows.length === 0) {
      console.log('❗ Таблицы не найдены. Нужно сначала создать структуру базы данных.');
    }
    
    process.exit(0);
  } catch(err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  }
}

checkTables();