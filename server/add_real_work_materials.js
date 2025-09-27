import { query } from './database.js';

async function addRealWorkMaterials() {
  try {
    console.log('🔗 Добавляем реальные связи работа-материал...');
    
    // Очищаем старые демо-данные
    await query('DELETE FROM work_materials WHERE work_id IN (\'w.1\', \'w.10\', \'w.100\', \'w.101\', \'w.102\')');
    console.log('✅ Старые демо-данные удалены');
    
    // Добавляем реальные связи
    const realConnections = [
      // w.1: Очистка потолка от масляной краски или клея
      { work_id: 'w.1', material_id: 'm.84', consumption: 0.1, waste: 1.05, description: 'Кронштейн для крепления инструмента' },
      { work_id: 'w.1', material_id: 'm.85', consumption: 0.05, waste: 1.10, description: 'Кронштейн для дополнительного крепления' },
      { work_id: 'w.1', material_id: 'm.86', consumption: 0.02, waste: 1.08, description: 'Кронштейн для специальных работ' },
      
      // w.10: Демонтаж потолочного плинтуса
      { work_id: 'w.10', material_id: 'm.87', consumption: 0.5, waste: 1.15, description: 'Монтажная шина для демонтажа' },
      { work_id: 'w.10', material_id: 'm.88', consumption: 0.1, waste: 1.05, description: 'Заглушка для временного закрытия' },
      
      // w.100: Устройство тепло/звукоизоляции потолка
      { work_id: 'w.100', material_id: 'm.89', consumption: 0.3, waste: 1.12, description: 'Заглушка для изоляции' },
      { work_id: 'w.100', material_id: 'm.90', consumption: 0.2, waste: 1.08, description: 'Монтажная гильза 16мм' },
      { work_id: 'w.100', material_id: 'm.91', consumption: 0.15, waste: 1.10, description: 'Монтажная гильза 20мм' },
      
      // w.101: Монтаж звукоизоляционных панелей
      { work_id: 'w.101', material_id: 'm.92', consumption: 0.4, waste: 1.15, description: 'Монтажная гильза 25мм' },
      { work_id: 'w.101', material_id: 'm.93', consumption: 0.25, waste: 1.12, description: 'Монтажная гильза 32мм' },
      
      // w.102: Монтаж металлического каркаса
      { work_id: 'w.102', material_id: 'm.84', consumption: 0.8, waste: 1.05, description: 'Кронштейн тип O для каркаса' },
      { work_id: 'w.102', material_id: 'm.85', consumption: 0.6, waste: 1.10, description: 'Кронштейн тип Z для каркаса' },
      { work_id: 'w.102', material_id: 'm.86', consumption: 0.3, waste: 1.08, description: 'Кронштейн тип Е для каркаса' }
    ];
    
    for (const connection of realConnections) {
      await query(`
        INSERT INTO work_materials (work_id, material_id, consumption_per_work_unit, waste_coeff)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (work_id, material_id)
        DO UPDATE SET
          consumption_per_work_unit = EXCLUDED.consumption_per_work_unit,
          waste_coeff = EXCLUDED.waste_coeff,
          updated_at = now()
      `, [connection.work_id, connection.material_id, connection.consumption, connection.waste]);
      
      console.log(`✅ ${connection.work_id} -> ${connection.material_id}: ${connection.consumption} ед. (${connection.description})`);
    }
    
    console.log('\n📊 Проверяем добавленные связи...');
    const checkResult = await query(`
      SELECT 
        wm.work_id,
        wm.material_id,
        wm.consumption_per_work_unit,
        wm.waste_coeff,
        w.name as work_name,
        m.name as material_name,
        m.unit_price as material_unit_price,
        (wm.consumption_per_work_unit * wm.waste_coeff) as total_consumption,
        ((wm.consumption_per_work_unit * wm.waste_coeff) * m.unit_price) as material_cost_per_work_unit
      FROM work_materials wm
      JOIN works_ref w ON wm.work_id = w.id
      JOIN materials m ON wm.material_id = m.id
      WHERE wm.work_id IN ('w.1', 'w.10', 'w.100', 'w.101', 'w.102')
      ORDER BY wm.work_id, wm.material_id
    `);
    
    console.log(`\n📋 Найдено связей: ${checkResult.rows.length}`);
    checkResult.rows.forEach(row => {
      console.log(`- ${row.work_id} (${row.work_name}) -> ${row.material_id} (${row.material_name})`);
      console.log(`  Расход: ${row.consumption_per_work_unit} × ${row.waste_coeff} = ${row.total_consumption} ед.`);
      console.log(`  Стоимость: ${parseFloat(row.material_cost_per_work_unit).toFixed(2)} ₽ за единицу работы`);
    });
    
    console.log('\n✅ Реальные связи работа-материал успешно добавлены!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

addRealWorkMaterials();
