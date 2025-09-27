import { query } from './database.js';

async function testContextFunctions() {
  const testUserId = 4;
  const testTenantId = '5a1f0a53-9f0b-4137-a82a-6302bc993c54';
  
  console.log('Устанавливаем контекст...');
  await query('SET app.user_id = \'' + testUserId + '\';');
  await query('SET app.tenant_id = \'' + testTenantId + '\';');
  
  console.log('Тестируем созданные функции...');
  const r1 = await query('SELECT app_current_user() as user_id, app_current_tenant() as tenant_id;');
  console.log('Результат функций:', r1.rows[0]);
  
  console.log('Тестируем прямой вызов current_setting...');
  const r2 = await query('SELECT current_setting(\'app.user_id\') as user_id, current_setting(\'app.tenant_id\') as tenant_id;');
  console.log('Прямой вызов current_setting:', r2.rows[0]);
}

testContextFunctions().catch(console.error);
