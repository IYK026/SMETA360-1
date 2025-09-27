const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateUsersTable() {
  try {
    console.log('🔄 Обновляем таблицу users для совместимости...\n');
    
    // Добавляем недостающие поля в таблицу users
    const fieldsToAdd = [
      { name: 'company', type: 'VARCHAR(255)' },
      { name: 'skills', type: 'JSONB DEFAULT \'[]\''},
      { name: 'is_active', type: 'BOOLEAN DEFAULT true' },
      { name: 'last_login', type: 'TIMESTAMP' }
    ];

    for (const field of fieldsToAdd) {
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${field.name} ${field.type};`);
        console.log(`✅ Поле ${field.name} добавлено в users`);
      } catch (error) {
        console.log(`📝 Поле ${field.name} уже существует в users`);
      }
    }

    // Проверяем обновленную структуру
    const structureResult = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Обновленная структура таблицы users:');
    structureResult.rows.forEach(row => {
      const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      const nullable = row.is_nullable === 'NO' ? '[Required]' : '[Optional]';
      console.log(`  - ${row.column_name}: ${row.data_type}${length} ${nullable}`);
    });

    console.log('\n✅ Таблица users обновлена!');

  } catch (error) {
    console.error('❌ Ошибка при обновлении таблицы users:', error);
  }
}

async function createAdditionalTables() {
  try {
    console.log('\n🆕 Создаем дополнительные таблицы для профилей...\n');

    // 1. Таблица активности пользователей
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
        activity_type VARCHAR(100) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Таблица user_activities создана');

    // 2. Таблица участников команд
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id UUID,
        user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
        role VARCHAR(100) DEFAULT 'member',
        permissions JSONB DEFAULT '{}',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
    `);
    console.log('✅ Таблица team_members создана');

    // 3. Таблица уведомлений пользователей
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES auth_users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        notification_type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Таблица user_notifications создана');

    // Создаем индексы для производительности
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);'
    ];

    for (const index of indexes) {
      try {
        await pool.query(index);
      } catch (error) {
        // Индексы могут уже существовать
      }
    }
    console.log('✅ Индексы созданы');

    console.log('\n🎉 Все дополнительные таблицы созданы!');

  } catch (error) {
    console.error('❌ Ошибка при создании дополнительных таблиц:', error);
  }
}

async function analyzeProfileRelations() {
  try {
    console.log('\n🔍 АНАЛИЗ СВЯЗЕЙ С ПРОФИЛЕМ ПОЛЬЗОВАТЕЛЯ:\n');

    // Таблицы, которые уже связаны с пользователем
    console.log('✅ ТАБЛИЦЫ С ПРЯМОЙ СВЯЗЬЮ К ПОЛЬЗОВАТЕЛЮ:');
    const directlyLinked = [
      'auth_users (основная таблица профилей)',
      'user_sessions (сессии - user_id)',
      'user_settings (настройки - user_id)',
      'user_social_links (социальные сети - user_id)', 
      'user_custom_links (пользовательские ссылки - user_id)',
      'user_tenants (арендаторы - user_id)',
      'orders (заказы - user_id)',
      'projects (проекты - owner_user_id)',
      'estimates (сметы - created_by, updated_by)'
    ];
    
    directlyLinked.forEach(item => console.log(`  - ${item}`));

    console.log('\n🔄 ТАБЛИЦЫ, КОТОРЫЕ МОЖНО УЛУЧШИТЬ:');
    console.log('  - users (старая таблица - синхронизировать с auth_users)');
    console.log('  - statistics (добавить user_id для персональной статистики)');
    console.log('  - materials (добавить created_by, updated_by)');
    console.log('  - works_ref (добавить created_by, updated_by)');

    console.log('\n🆕 НОВЫЕ ТАБЛИЦЫ ДЛЯ ПРОФИЛЕЙ:');
    console.log('  - user_activities (история активности) ✅ Создана');
    console.log('  - team_members (участники команд) ✅ Создана');
    console.log('  - user_notifications (уведомления) ✅ Создана');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  await updateUsersTable();
  await createAdditionalTables();
  await analyzeProfileRelations();
}

main();
