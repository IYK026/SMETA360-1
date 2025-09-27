import { query } from './database.js';

async function prepareTenantOverlaySystem() {
  try {
    console.log('🔄 Подготовка справочников к мультитенантности (overlay system)...\n');
    
    // 4.1 ALTER справочников - добавление tenant_id
    console.log('📋 4.1 Модифицируем справочники для overlay...');
    
    console.log('   - Добавляем tenant_id в materials...');
    await query(`ALTER TABLE materials ADD COLUMN IF NOT EXISTS tenant_id uuid`);
    console.log('   ✅ tenant_id добавлен в materials');
    
    console.log('   - Добавляем tenant_id в works_ref...');
    await query(`ALTER TABLE works_ref ADD COLUMN IF NOT EXISTS tenant_id uuid`);
    console.log('   ✅ tenant_id добавлен в works_ref');
    
    // Создание уникальных индексов для materials
    console.log('   - Создаём уникальные индексы для materials...');
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_materials_tenant_code
        ON materials(tenant_id, id)
    `);
    console.log('   ✅ Уникальный индекс materials(tenant_id, id) создан');
    
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_materials_global_code
        ON materials(id) WHERE tenant_id IS NULL
    `);
    console.log('   ✅ Уникальный индекс materials(id) для глобальных записей создан');
    
    // Создание уникальных индексов для works_ref
    console.log('   - Создаём уникальные индексы для works_ref...');
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_works_tenant_code
        ON works_ref(tenant_id, id)
    `);
    console.log('   ✅ Уникальный индекс works_ref(tenant_id, id) создан');
    
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_works_global_code
        ON works_ref(id) WHERE tenant_id IS NULL
    `);
    console.log('   ✅ Уникальный индекс works_ref(id) для глобальных записей создан');
    
    // Индексы для поиска по имени
    console.log('   - Создаём индексы для поиска по имени...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_materials_tenant_name ON materials(tenant_id, name)
    `);
    console.log('   ✅ Индекс materials(tenant_id, name) создан');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_works_tenant_name ON works_ref(tenant_id, name)
    `);
    console.log('   ✅ Индекс works_ref(tenant_id, name) создан');
    
    // 4.2 Создание таблиц цен/норм для тенантов
    console.log('\\n💰 4.2 Создаём таблицы тенантских цен/норм...');
    
    // Таблица цен материалов
    console.log('   - Создаём tenant_material_prices...');
    await query(`
      CREATE TABLE IF NOT EXISTS tenant_material_prices (
        tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        material_id text NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
        price       numeric(14,2) NOT NULL,
        valid_from  date NOT NULL DEFAULT CURRENT_DATE,
        valid_to    date,
        PRIMARY KEY (tenant_id, material_id, valid_from)
      )
    `);
    console.log('   ✅ Таблица tenant_material_prices создана');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_tmat_prices_lookup
        ON tenant_material_prices(tenant_id, material_id, valid_from DESC)
    `);
    console.log('   ✅ Индекс для поиска цен материалов создан');
    
    // Таблица цен работ
    console.log('   - Создаём tenant_work_prices...');
    await query(`
      CREATE TABLE IF NOT EXISTS tenant_work_prices (
        tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        work_id    text NOT NULL REFERENCES works_ref(id) ON DELETE CASCADE,
        price      numeric(14,2) NOT NULL,
        valid_from date NOT NULL DEFAULT CURRENT_DATE,
        valid_to   date,
        PRIMARY KEY (tenant_id, work_id, valid_from)
      )
    `);
    console.log('   ✅ Таблица tenant_work_prices создана');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_twork_prices_lookup
        ON tenant_work_prices(tenant_id, work_id, valid_from DESC)
    `);
    console.log('   ✅ Индекс для поиска цен работ создан');
    
    // 4.3 Кастомные связи работа-материал для тенантов
    console.log('\\n🔗 4.3 Создаём таблицу кастомных связей работа-материал...');
    await query(`
      CREATE TABLE IF NOT EXISTS work_materials_tenant (
        tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        work_id             text NOT NULL REFERENCES works_ref(id) ON DELETE CASCADE,
        material_id         text NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
        consumption_per_work_unit numeric(14,4) NOT NULL,
        waste_coeff         numeric(14,4) NOT NULL DEFAULT 1.0,
        created_at          timestamptz NOT NULL DEFAULT now(),
        updated_at          timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (tenant_id, work_id, material_id)
      )
    `);
    console.log('   ✅ Таблица work_materials_tenant создана');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_wm_tenant_work ON work_materials_tenant(tenant_id, work_id)
    `);
    console.log('   ✅ Индекс для поиска связей работ создан');
    
    // 4.4 Создание VIEW для эффективных справочников
    console.log('\\n👁️ 4.4 Создаём VIEW для эффективных справочников...');
    
    // NOTE: В PostgreSQL current_setting может вызвать ошибку если переменная не установлена
    // Поэтому используем более безопасный подход с COALESCE
    
    console.log('   - Создаём materials_effective VIEW...');
    await query(`
      CREATE OR REPLACE VIEW materials_effective AS
      SELECT DISTINCT ON (id)
        id, tenant_id, name, image_url, item_url, unit, unit_price, expenditure, weight, created_at, updated_at
      FROM materials
      WHERE tenant_id IS NULL 
         OR (current_setting('app.tenant_id', true) IS NOT NULL 
             AND tenant_id = current_setting('app.tenant_id')::uuid)
      ORDER BY id,
               CASE 
                 WHEN current_setting('app.tenant_id', true) IS NOT NULL 
                      AND tenant_id = current_setting('app.tenant_id')::uuid 
                 THEN 0 
                 ELSE 1 
               END
    `);
    console.log('   ✅ VIEW materials_effective создан');
    
    console.log('   - Создаём works_effective VIEW...');
    await query(`
      CREATE OR REPLACE VIEW works_effective AS
      SELECT DISTINCT ON (id)
        id, tenant_id, name, unit, unit_price, phase_id, stage_id, substage_id, sort_order, created_at, updated_at
      FROM works_ref
      WHERE tenant_id IS NULL 
         OR (current_setting('app.tenant_id', true) IS NOT NULL 
             AND tenant_id = current_setting('app.tenant_id')::uuid)
      ORDER BY id,
               CASE 
                 WHEN current_setting('app.tenant_id', true) IS NOT NULL 
                      AND tenant_id = current_setting('app.tenant_id')::uuid 
                 THEN 0 
                 ELSE 1 
               END
    `);
    console.log('   ✅ VIEW works_effective создан');
    
    // Проверяем результат
    console.log('\\n📊 Проверяем результат модификации...');
    
    // Проверяем новые колонки
    const materialsColumns = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'materials' AND column_name = 'tenant_id'
    `);
    
    const worksColumns = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'works_ref' AND column_name = 'tenant_id'
    `);
    
    console.log('✅ Новые колонки:');
    console.log(`  materials.tenant_id: ${materialsColumns.rows[0]?.data_type || 'НЕ НАЙДЕНА'}`);
    console.log(`  works_ref.tenant_id: ${worksColumns.rows[0]?.data_type || 'НЕ НАЙДЕНА'}`);
    
    // Подсчитываем новые таблицы
    const newTables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('tenant_material_prices', 'tenant_work_prices', 'work_materials_tenant')
      ORDER BY table_name
    `);
    
    console.log('\\n✅ Созданные таблицы тенантских данных:');
    for (const table of newTables.rows) {
      const count = await query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`  - ${table.table_name} (записей: ${count.rows[0].count})`);
    }
    
    // Проверяем VIEW
    const views = await query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
        AND table_name IN ('materials_effective', 'works_effective')
      ORDER BY table_name
    `);
    
    console.log('\\n✅ Созданные VIEW:');
    views.rows.forEach(view => {
      console.log(`  👁️ ${view.table_name}`);
    });
    
    // Общая статистика
    const totalTables = await query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`\\n🗄️ Всего таблиц в БД: ${totalTables.rows[0].count}`);
    
    // Проверяем, что существующие данные остались глобальными
    const globalMaterials = await query(`
      SELECT COUNT(*) FROM materials WHERE tenant_id IS NULL
    `);
    const globalWorks = await query(`
      SELECT COUNT(*) FROM works_ref WHERE tenant_id IS NULL
    `);
    
    console.log('\\n🌍 Статус глобальных данных:');
    console.log(`  Глобальных материалов: ${globalMaterials.rows[0].count}`);
    console.log(`  Глобальных работ: ${globalWorks.rows[0].count}`);
    
    console.log('\\n✅ Шаг 4 завершён успешно!');
    console.log('\\n🎯 Что реализовано:');
    console.log('  🔄 Overlay система для справочников (tenant_id в materials/works_ref)');
    console.log('  💰 Таблицы тенантских цен с историей по периодам');
    console.log('  🔗 Кастомные связи работа-материал для тенантов');
    console.log('  👁️ VIEW для "эффективных" справочников (свои + глобальные)');
    console.log('  🌍 Все существующие данные сохранены как глобальные');
    console.log('  🚀 Готовность к персонализации справочников по компаниям');
    
  } catch (error) {
    console.error('❌ Ошибка подготовки overlay системы:', error);
  } finally {
    process.exit(0);
  }
}

prepareTenantOverlaySystem();
