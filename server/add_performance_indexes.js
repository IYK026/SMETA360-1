import { query } from './database.js';

async function addPerformanceIndexes() {
  try {
    console.log('🚀 Добавление индексов для оптимизации производительности...\n');

    // Индексы для таблицы work_materials
    console.log('📊 Создание индексов для work_materials...');
    
    // Составной индекс для work_id + material_id (уже есть PRIMARY KEY, но добавим для сортировки)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_work_materials_work_material 
      ON work_materials (work_id, material_id)
    `);
    console.log('✅ Индекс idx_work_materials_work_material создан');

    // Индекс для work_id (для быстрого поиска материалов по работе)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_work_materials_work_id 
      ON work_materials (work_id)
    `);
    console.log('✅ Индекс idx_work_materials_work_id создан');

    // Индекс для material_id (для быстрого поиска работ по материалу)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_work_materials_material_id 
      ON work_materials (material_id)
    `);
    console.log('✅ Индекс idx_work_materials_material_id создан');

    // Индексы для таблицы works_ref
    console.log('\n📊 Создание индексов для works_ref...');
    
    // Индекс для сортировки по sort_order
    await query(`
      CREATE INDEX IF NOT EXISTS idx_works_ref_sort_order 
      ON works_ref (sort_order)
    `);
    console.log('✅ Индекс idx_works_ref_sort_order создан');

    // Индекс для id (если еще нет)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_works_ref_id 
      ON works_ref (id)
    `);
    console.log('✅ Индекс idx_works_ref_id создан');

    // Индекс для name (для поиска по названию)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_works_ref_name 
      ON works_ref (name)
    `);
    console.log('✅ Индекс idx_works_ref_name создан');

    // Индексы для таблицы materials
    console.log('\n📊 Создание индексов для materials...');
    
    // Индекс для id (если еще нет)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_materials_id 
      ON materials (id)
    `);
    console.log('✅ Индекс idx_materials_id создан');

    // Индекс для name (для сортировки и поиска)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_materials_name 
      ON materials (name)
    `);
    console.log('✅ Индекс idx_materials_name создан');

    // Индекс для unit_price (для сортировки по цене)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_materials_unit_price 
      ON materials (unit_price)
    `);
    console.log('✅ Индекс idx_materials_unit_price создан');

    // Составной индекс для оптимизации JOIN запросов
    console.log('\n📊 Создание составных индексов для JOIN оптимизации...');
    
    // Индекс для works_ref с полями, используемыми в JOIN
    await query(`
      CREATE INDEX IF NOT EXISTS idx_works_ref_join 
      ON works_ref (id, sort_order, name, unit, unit_price)
    `);
    console.log('✅ Составной индекс idx_works_ref_join создан');

    // Индекс для materials с полями, используемыми в JOIN
    await query(`
      CREATE INDEX IF NOT EXISTS idx_materials_join 
      ON materials (id, name, unit, unit_price, image_url, item_url)
    `);
    console.log('✅ Составной индекс idx_materials_join создан');

    // Проверяем созданные индексы
    console.log('\n🔍 Проверка созданных индексов...');
    const indexes = await query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('work_materials', 'works_ref', 'materials')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);

    console.log(`\n📋 Создано индексов: ${indexes.rows.length}`);
    indexes.rows.forEach(idx => {
      console.log(`- ${idx.tablename}.${idx.indexname}`);
    });

    // Тестируем производительность
    console.log('\n⚡ Тестирование производительности запросов...');
    
    const startTime = Date.now();
    const testResult = await query(`
      SELECT
        wm.*,
        w.name as work_name,
        w.unit as work_unit,
        w.unit_price as work_unit_price,
        m.name as material_name,
        m.unit as material_unit,
        m.unit_price as material_unit_price,
        m.image_url as material_image_url,
        m.item_url as material_item_url,
        (wm.consumption_per_work_unit * wm.waste_coeff) as total_consumption,
        ((wm.consumption_per_work_unit * wm.waste_coeff) * m.unit_price) as material_cost_per_work_unit
      FROM work_materials wm
      JOIN works_ref w ON wm.work_id = w.id
      JOIN materials m ON wm.material_id = m.id
      ORDER BY w.sort_order, w.id, m.id
      LIMIT 100
    `);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Тестовый запрос выполнен за ${duration}ms`);
    console.log(`📊 Получено записей: ${testResult.rows.length}`);

    console.log('\n🎉 Все индексы успешно созданы! Производительность должна значительно улучшиться.');

  } catch (error) {
    console.error('❌ Ошибка при создании индексов:', error.message);
  }
}

addPerformanceIndexes();
