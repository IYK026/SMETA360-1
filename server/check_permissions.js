import { query } from './database.js';

async function checkPermissionsAndExtensions() {
  try {
    console.log('🔐 Проверка прав пользователя и расширений...\n');
    
    // 1. Проверка текущего пользователя
    const currentUser = await query('SELECT current_user, session_user');
    console.log('👤 Текущий пользователь:', currentUser.rows[0]);
    
    // 2. Проверка прав на создание таблиц
    console.log('\n🏗️ Проверка прав DDL (создание таблиц):');
    try {
      await query(`
        CREATE TABLE temp_permissions_test (
          id SERIAL PRIMARY KEY,
          test_field TEXT
        )
      `);
      console.log('   ✅ Право CREATE TABLE: есть');
      
      await query('DROP TABLE temp_permissions_test');
      console.log('   ✅ Право DROP TABLE: есть');
    } catch (error) {
      console.log('   ❌ Нет прав на создание/удаление таблиц:', error.message);
    }
    
    // 3. Проверка прав на создание расширений
    console.log('\n🔧 Проверка прав на расширения:');
    try {
      const extensions = await query(`
        SELECT extname, extversion 
        FROM pg_extension 
        WHERE extname IN ('pgcrypto', 'uuid-ossp')
      `);
      
      console.log('   Установленные расширения:');
      extensions.rows.forEach(ext => {
        console.log(`   - ${ext.extname} v${ext.extversion}`);
      });
      
      if (extensions.rows.length === 0) {
        console.log('   📝 Нет установленных расширений для UUID');
      }
    } catch (error) {
      console.log('   ❌ Ошибка проверки расширений:', error.message);
    }
    
    // 4. Попытка установить pgcrypto
    console.log('\n🚀 Установка расширения pgcrypto:');
    try {
      await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
      console.log('   ✅ Расширение pgcrypto успешно установлено/проверено');
      
      // Тестируем функцию gen_random_uuid()
      const uuidTest = await query('SELECT gen_random_uuid() as test_uuid');
      console.log('   🧪 Тест UUID:', uuidTest.rows[0].test_uuid);
      
    } catch (error) {
      console.log('   ❌ Не удалось установить pgcrypto:', error.message);
      console.log('   💡 Попробуем альтернативное расширение uuid-ossp...');
      
      try {
        await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log('   ✅ Расширение uuid-ossp успешно установлено');
        
        const uuidTest = await query('SELECT uuid_generate_v4() as test_uuid');
        console.log('   🧪 Тест UUID:', uuidTest.rows[0].test_uuid);
        
      } catch (error2) {
        console.log('   ❌ Не удалось установить uuid-ossp:', error2.message);
      }
    }
    
    // 5. Проверка версии PostgreSQL
    console.log('\n📋 Информация о PostgreSQL:');
    const version = await query('SELECT version()');
    console.log('   Версия:', version.rows[0].version.split(',')[0]);
    
    // 6. Проверка лимитов подключений
    const connections = await query(`
      SELECT 
        setting as max_connections,
        (SELECT count(*) FROM pg_stat_activity) as current_connections
      FROM pg_settings 
      WHERE name = 'max_connections'
    `);
    console.log('   Подключения:', `${connections.rows[0].current_connections}/${connections.rows[0].max_connections}`);
    
    // 7. Проверка размера базы данных
    const dbSize = await query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as db_size
    `);
    console.log('   Размер БД:', dbSize.rows[0].db_size);
    
    console.log('\n✅ Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка проверки:', error);
  } finally {
    process.exit(0);
  }
}

checkPermissionsAndExtensions();
