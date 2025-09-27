import { query } from './database.js';

async function createTenantsAndUserTenants() {
  try {
    console.log('🏢 Создание таблиц tenants и user_tenants...\n');
    
    // 1. Создание таблицы tenants
    console.log('📋 Создаём таблицу tenants...');
    await query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name       text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    console.log('✅ Таблица tenants создана');
    
    // 2. Создание таблицы user_tenants
    console.log('👥 Создаём таблицу user_tenants...');
    await query(`
      CREATE TABLE IF NOT EXISTS user_tenants (
        tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id    integer NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
        role       text NOT NULL CHECK (role IN ('admin','estimator','foreman','client','viewer')),
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (tenant_id, user_id)
      )
    `);
    console.log('✅ Таблица user_tenants создана');
    
    // 3. Создание индексов для быстрых выборок
    console.log('🚀 Создаём индексы...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_role ON user_tenants(tenant_id, role)
    `);
    console.log('✅ Индекс idx_user_tenants_tenant_role создан');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id)
    `);
    console.log('✅ Индекс idx_user_tenants_user создан');
    
    // 4. Проверяем что таблицы созданы
    console.log('\n📊 Проверяем созданные таблицы...');
    const checkTenants = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('tenants', 'user_tenants')
      ORDER BY table_name
    `);
    
    console.log('Созданные таблицы:');
    checkTenants.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // 5. Показываем структуру созданных таблиц
    console.log('\n🔍 Структура таблицы tenants:');
    const tenantsStructure = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'tenants' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    tenantsStructure.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(15)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'.padEnd(8)} ${col.column_default || ''}`);
    });
    
    console.log('\n🔍 Структура таблицы user_tenants:');
    const userTenantsStructure = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_tenants' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    userTenantsStructure.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(15)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'.padEnd(8)} ${col.column_default || ''}`);
    });
    
    // 6. Проверяем ограничения
    console.log('\n🔐 Проверяем ограничения user_tenants:');
    const constraints = await query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'user_tenants' AND tc.table_schema = 'public'
      ORDER BY tc.constraint_type, tc.constraint_name
    `);
    
    constraints.rows.forEach(constraint => {
      if (constraint.constraint_type === 'PRIMARY KEY') {
        console.log(`  PK: ${constraint.column_name}`);
      } else if (constraint.constraint_type === 'FOREIGN KEY') {
        console.log(`  FK: ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      } else if (constraint.constraint_type === 'CHECK') {
        console.log(`  CHECK: ${constraint.constraint_name} на ${constraint.column_name}`);
      }
    });
    
    console.log('\n✅ Шаг 2 завершён успешно!');
    console.log('\n🎯 Что создано:');
    console.log('  📋 tenants - таблица компаний/аккаунтов с UUID id');
    console.log('  👥 user_tenants - связь пользователей с компаниями и ролями');
    console.log('  🚀 Индексы для быстрых выборок по ролям и пользователям');
    console.log('  🔐 Ограничения целостности (FK, CHECK на роли)');
    
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
  } finally {
    process.exit(0);
  }
}

createTenantsAndUserTenants();
