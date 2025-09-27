import { query } from './database.js';

try {
  console.log('=== СТРУКТУРА ТАБЛИЦ ===');
  const tables = ['phases', 'stages', 'substages', 'works_ref'];
  
  for (const table of tables) {
    console.log(`\n📋 Таблица ${table}:`);
    const result = await query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_name = $1 
       ORDER BY ordinal_position`,
      [table]
    );
    
    result.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
    });
  }
  
  process.exit(0);
} catch(err) {
  console.error('Ошибка:', err.message);
  process.exit(1);
}