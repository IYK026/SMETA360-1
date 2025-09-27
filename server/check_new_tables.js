import { query } from './database.js';

async function checkNewTables() {
  try {
    // Подсчитываем общее количество таблиц
    const totalCount = await query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`🗄️ Всего таблиц: ${totalCount.rows[0].count}`);
    
    // Проверяем новые таблицы tenant
    const tenantTables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%tenant%' 
      ORDER BY table_name
    `);
    
    console.log('🏢 Новые таблицы tenant:');
    tenantTables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    // Показываем количество записей
    for (const table of tenantTables.rows) {
      const count = await query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`     📊 Записей: ${count.rows[0].count}`);
    }
    
    console.log('\n✅ Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    process.exit(0);
  }
}

checkNewTables();
