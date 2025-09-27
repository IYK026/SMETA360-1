import { query } from './database.js';

async function createDomainTables() {
  try {
    console.log('🏗️ Создание доменных таблиц: projects, estimates, estimate_items...\n');
    
    // 3.1 Создание таблицы projects
    console.log('📋 Создаём таблицу projects...');
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
        owner_user_id   integer REFERENCES auth_users(id) ON DELETE SET NULL,
        name            text NOT NULL,
        description     text,
        status          text DEFAULT 'active',               -- active/archived и т.п.
        created_at      timestamptz NOT NULL DEFAULT now(),
        updated_at      timestamptz NOT NULL DEFAULT now(),
        created_by      integer REFERENCES auth_users(id),
        updated_by      integer REFERENCES auth_users(id)
      )
    `);
    console.log('✅ Таблица projects создана');
    
    // Создание индексов для projects
    console.log('🚀 Создаём индексы для projects...');
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_projects_tenant_name ON projects(tenant_id, name)
    `);
    console.log('✅ Уникальный индекс по tenant_id + name создан');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id)
    `);
    console.log('✅ Индекс по tenant_id создан');
    
    // 3.2 Создание таблицы estimates
    console.log('\n📊 Создаём таблицу estimates...');
    await query(`
      CREATE TABLE IF NOT EXISTS estimates (
        id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
        project_id      uuid REFERENCES projects(id) ON DELETE CASCADE,
        number          text,                                -- внутренний номер сметы
        version         integer NOT NULL DEFAULT 1,
        title           text,
        status          text DEFAULT 'draft',                -- draft/approved/closed
        notes           text,
        created_at      timestamptz NOT NULL DEFAULT now(),
        updated_at      timestamptz NOT NULL DEFAULT now(),
        created_by      integer REFERENCES auth_users(id),
        updated_by      integer REFERENCES auth_users(id)
      )
    `);
    console.log('✅ Таблица estimates создана');
    
    // Создание индексов для estimates
    console.log('🚀 Создаём индексы для estimates...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_estimates_tenant_id ON estimates(tenant_id)
    `);
    console.log('✅ Индекс по tenant_id создан');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_estimates_tenant_project ON estimates(tenant_id, project_id)
    `);
    console.log('✅ Индекс по tenant_id + project_id создан');
    
    // 3.3 Создание таблицы estimate_items
    console.log('\n📝 Создаём таблицу estimate_items...');
    await query(`
      CREATE TABLE IF NOT EXISTS estimate_items (
        id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
        estimate_id       uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,

        -- Тип строки и ссылки на справочники (если применимо)
        item_type         text NOT NULL CHECK (item_type IN ('work','material','custom')),
        work_id           text REFERENCES works_ref(id)   ON DELETE SET NULL,
        material_id       text REFERENCES materials(id)   ON DELETE SET NULL,

        -- Отображаемые поля (фиксируются на момент расчёта)
        name              text NOT NULL,                   -- наименование на момент добавления
        unit              text,                            -- ед. изм.
        quantity          numeric(14,4) NOT NULL DEFAULT 0,
        unit_price        numeric(14,2) NOT NULL DEFAULT 0,

        -- Итог по строке (денормализовано)
        line_total        numeric(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

        -- Иерархия/группировка (опционально)
        parent_id         uuid REFERENCES estimate_items(id) ON DELETE CASCADE, -- для секций/групп
        sort_order        integer NOT NULL DEFAULT 0,

        created_at        timestamptz NOT NULL DEFAULT now(),
        updated_at        timestamptz NOT NULL DEFAULT now(),
        created_by        integer REFERENCES auth_users(id),
        updated_by        integer REFERENCES auth_users(id)
      )
    `);
    console.log('✅ Таблица estimate_items создана');
    
    // Создание индексов для estimate_items
    console.log('🚀 Создаём индексы для estimate_items...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_eitems_tenant_estimate ON estimate_items(tenant_id, estimate_id)
    `);
    console.log('✅ Индекс по tenant_id + estimate_id создан');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_eitems_parent_sort ON estimate_items(tenant_id, estimate_id, parent_id, sort_order)
    `);
    console.log('✅ Индекс по tenant_id + estimate_id + parent_id + sort_order создан');
    
    // Проверяем созданные таблицы
    console.log('\n📊 Проверяем созданные таблицы...');
    const newTables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('projects', 'estimates', 'estimate_items')
      ORDER BY table_name
    `);
    
    console.log('✅ Созданные доменные таблицы:');
    for (const table of newTables.rows) {
      const count = await query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`  - ${table.table_name} (записей: ${count.rows[0].count})`);
    }
    
    // Показываем общее количество таблиц
    const totalTables = await query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`\n🗄️ Всего таблиц в БД: ${totalTables.rows[0].count}`);
    
    // Проверяем структуру ключевой таблицы estimate_items
    console.log('\n🔍 Структура таблицы estimate_items:');
    const itemsStructure = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        is_generated
      FROM information_schema.columns 
      WHERE table_name = 'estimate_items' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    itemsStructure.rows.forEach(col => {
      const nullable = col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL';
      const generated = col.is_generated === 'ALWAYS' ? ' (GENERATED)' : '';
      console.log(`  ${col.column_name.padEnd(18)} ${col.data_type.padEnd(20)} ${nullable.padEnd(8)}${generated}`);
    });
    
    // Проверяем ограничения
    console.log('\n🔐 Проверяем CHECK ограничения:');
    const checkConstraints = await query(`
      SELECT
        tc.constraint_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'estimate_items' 
        AND tc.constraint_type = 'CHECK'
        AND cc.check_clause LIKE '%item_type%'
    `);
    
    checkConstraints.rows.forEach(constraint => {
      console.log(`  ✅ ${constraint.constraint_name}: ${constraint.check_clause}`);
    });
    
    console.log('\n✅ Шаг 3 завершён успешно!');
    console.log('\n🎯 Что создано:');
    console.log('  📋 projects - проекты с привязкой к tenant');
    console.log('  📊 estimates - сметы с версионированием');
    console.log('  📝 estimate_items - позиции смет с "снимками" данных');
    console.log('  🚀 Все необходимые индексы для производительности');
    console.log('  🔐 Ограничения целостности и CHECK constraints');
    console.log('  💰 GENERATED колонка line_total для автоматического расчета');
    
  } catch (error) {
    console.error('❌ Ошибка создания доменных таблиц:', error);
  } finally {
    process.exit(0);
  }
}

createDomainTables();
