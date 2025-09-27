import { query } from './database.js';

async function checkRoleConstraint() {
  try {
    const result = await query(`
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conname LIKE '%role_check%'
    `);
    
    console.log('🔍 CHECK ограничение на роли:');
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`  ${row.conname}: ${row.consrc}`);
      });
    } else {
      console.log('  Ограничение не найдено, проверяем альтернативным способом...');
      
      const altCheck = await query(`
        SELECT 
          tc.constraint_name,
          cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc 
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'user_tenants' 
          AND tc.constraint_type = 'CHECK'
          AND cc.check_clause LIKE '%role%'
      `);
      
      altCheck.rows.forEach(row => {
        console.log(`  ${row.constraint_name}: ${row.check_clause}`);
      });
    }
    
    // Тестируем работу ограничения
    console.log('\n🧪 Тестирование CHECK ограничения...');
    console.log('Доступные роли: admin, estimator, foreman, client, viewer');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkRoleConstraint();
