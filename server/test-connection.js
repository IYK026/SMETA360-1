import dotenv from 'dotenv';
import { query } from './database.js';

// Загружаем переменные окружения
dotenv.config();

console.log('🔍 Проверяем переменные окружения...');
console.log('DATABASE_URL найден:', !!process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('🌐 Хост:', url.hostname);
    console.log('🔌 Порт:', url.port);
    console.log('🗄️ База данных:', url.pathname.slice(1));
    console.log('👤 Пользователь:', url.username);
    console.log('🔐 SSL режим:', url.searchParams.get('sslmode') || 'не указан');
  } catch (e) {
    console.error('❌ Ошибка парсинга URL:', e.message);
  }
}

async function testConnection() {
  try {
    console.log('\n🔄 Подключаемся к базе данных...');
    
    // Базовый тест подключения
    const result = await query('SELECT NOW() as current_time, version() as version');
    
    console.log('✅ Подключение успешно!');
    console.log('⏰ Время сервера БД:', result.rows[0].current_time);
    console.log('🐘 Версия PostgreSQL:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    
    // Проверим существующие таблицы
    console.log('\n📋 Проверяем существующие таблицы...');
    const tables = await query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('Найденные таблицы:');
      tables.rows.forEach(row => {
        console.log(`  📄 ${row.table_name} (${row.table_type})`);
      });
    } else {
      console.log('  (база данных пустая - таблиц не найдено)');
    }
    
    // Проверим права доступа
    console.log('\n🔐 Проверяем права доступа...');
    const privileges = await query(`
      SELECT 
        table_name,
        privilege_type
      FROM information_schema.role_table_grants 
      WHERE grantee = current_user
      AND table_schema = 'public'
      LIMIT 5
    `);
    
    if (privileges.rows.length > 0) {
      console.log('Найденные права:');
      privileges.rows.forEach(row => {
        console.log(`  🔑 ${row.table_name}: ${row.privilege_type}`);
      });
    } else {
      console.log('  Проверим базовые права...');
      const basicTest = await query('SELECT current_user as user, current_database() as database');
      console.log(`  👤 Пользователь: ${basicTest.rows[0].user}`);
      console.log(`  🗄️ База данных: ${basicTest.rows[0].database}`);
    }
    
    console.log('\n🎉 Тест подключения завершен успешно!');
    
  } catch (error) {
    console.error('\n❌ Ошибка подключения к базе данных:');
    console.error('Сообщение:', error.message);
    console.error('Код ошибки:', error.code);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Проблема с DNS или сетевым подключением');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Проблема с аутентификацией - проверьте логин/пароль');
    } else if (error.message.includes('ssl')) {
      console.error('\n💡 Проблема с SSL - проверьте настройки SSL');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Превышено время ожидания - возможно, проблемы с сетью');
    }
    
    process.exit(1);
  }
}

testConnection();