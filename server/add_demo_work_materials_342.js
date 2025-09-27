import { query } from './database.js';

async function addDemoWorkMaterials342() {
  try {
    const result = await query(`
      INSERT INTO work_materials (work_id, material_id, consumption_per_work_unit, waste_coeff) VALUES
      ('w.342', 'm.1', 3.0, 1.05),
      ('w.342', 'm.2', 4.0, 1.10),
      ('w.342', 'm.3', 2.0, 1.08)
      ON CONFLICT (work_id, material_id) DO NOTHING
    `);

    console.log('✅ Демо-данные для работы w.342 добавлены');
    console.log('Добавлено строк:', result.rowCount);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

addDemoWorkMaterials342();
