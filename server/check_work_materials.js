import { query } from './database.js';

async function checkWorkMaterials() {
  try {
    console.log('📋 Структура таблицы work_materials:');
    const structure = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'work_materials'
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('\n📊 Содержимое таблицы work_materials:');
    const data = await query(`
      SELECT 
        wm.*,
        w.name as work_name,
        m.name as material_name,
        m.unit_price as material_unit_price
      FROM work_materials wm
      LEFT JOIN works_ref w ON wm.work_id = w.id
      LEFT JOIN materials m ON wm.material_id = m.id
      ORDER BY wm.work_id, wm.material_id
      LIMIT 10
    `);
    
    console.log(`Найдено записей: ${data.rows.length}`);
    data.rows.forEach(row => {
      console.log(`- ${row.work_id} -> ${row.material_id}: ${row.consumption_per_work_unit} ед. (коэф. отхода: ${row.waste_coeff})`);
      if (row.work_name) console.log(`  Работа: ${row.work_name}`);
      if (row.material_name) console.log(`  Материал: ${row.material_name} (${row.material_unit_price} ₽)`);
    });
    
    console.log('\n🔍 Статистика по связям:');
    const stats = await query(`
      SELECT 
        COUNT(*) as total_connections,
        COUNT(DISTINCT work_id) as unique_works,
        COUNT(DISTINCT material_id) as unique_materials
      FROM work_materials
    `);
    
    const stat = stats.rows[0];
    console.log(`- Всего связей: ${stat.total_connections}`);
    console.log(`- Уникальных работ: ${stat.unique_works}`);
    console.log(`- Уникальных материалов: ${stat.unique_materials}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

checkWorkMaterials();
