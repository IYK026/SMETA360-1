import { query } from './database.js';

async function addDemoWorkMaterials() {
  try {
    const result = await query(`
      INSERT INTO work_materials (work_id, material_id, consumption_per_work_unit, waste_coeff) VALUES
      ('w.341', 'm.1', 5.0, 1.05),
      ('w.341', 'm.2', 2.0, 1.10),
      ('w.341', 'm.3', 1.0, 1.08),
      ('w.341', 'm.4', 0.5, 1.15)
      ON CONFLICT (work_id, material_id) DO NOTHING
    `);

    console.log('✅ Демо-данные связей работа-материал добавлены');
    console.log('Добавлено строк:', result.rowCount);

    // Проверим что добавилось
    const checkResult = await query(`
      SELECT
        wm.*,
        w.name as work_name,
        m.name as material_name,
        m.unit_price as material_unit_price
      FROM work_materials wm
      JOIN works_ref w ON wm.work_id = w.id
      JOIN materials m ON wm.material_id = m.id
      WHERE wm.work_id = 'w.341'
    `);

    console.log('📋 Текущие связи для работы w.341:');
    checkResult.rows.forEach(row => {
      console.log(`- ${row.material_name}: ${row.consumption_per_work_unit} ед. (коэф. отхода: ${row.waste_coeff})`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

addDemoWorkMaterials();
