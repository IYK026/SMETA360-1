import { query } from './database.js';
import fs from 'fs';
import path from 'path';

async function importCSV() {
  try {
    console.log('📥 Начинаем импорт данных из CSV...');

    // Читаем CSV файл
    const csvPath = path.join(process.cwd(), 'works_ref_export.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📊 Найдено ${lines.length - 1} записей для импорта`);

    // Пропускаем заголовок и обрабатываем данные
    const dataLines = lines.slice(1);
    
    // Собираем уникальные значения для создания справочников
    const phases = new Map();
    const stages = new Map();
    const substages = new Map();
    const works = [];

    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      const [work_id, work_name, unit, unit_price, phase_id, phase_name, stage_id, stage_name, substage_id, substage_name] = 
        line.split(';');
      
      // Собираем фазы (только если есть и ID и название)
      if (phase_id && phase_id.trim() && phase_name && phase_name.trim()) {
        phases.set(phase_id.trim(), phase_name.trim());
      }
      
      // Собираем стадии (только если есть и ID и название)
      if (stage_id && stage_id.trim() && stage_name && stage_name.trim()) {
        stages.set(stage_id.trim(), { 
          name: stage_name.trim(), 
          phase_id: (phase_id && phase_id.trim()) ? phase_id.trim() : null 
        });
      }
      
      // Собираем подстадии (только если есть и ID и название)
      if (substage_id && substage_id.trim() && substage_name && substage_name.trim()) {
        substages.set(substage_id.trim(), { 
          name: substage_name.trim(), 
          stage_id: (stage_id && stage_id.trim()) ? stage_id.trim() : null 
        });
      }
      
      // Собираем работы (только если есть ID и название)
      if (work_id && work_id.trim() && work_name && work_name.trim()) {
        works.push({
          id: work_id.trim(),
          name: work_name.trim(),
          unit: (unit && unit.trim()) ? unit.trim() : null,
          unit_price: (unit_price && unit_price.trim()) ? parseFloat(unit_price.trim()) : null,
          phase_id: (phase_id && phase_id.trim()) ? phase_id.trim() : null,
          stage_id: (stage_id && stage_id.trim()) ? stage_id.trim() : null,
          substage_id: (substage_id && substage_id.trim()) ? substage_id.trim() : null
        });
      }
    }

    console.log(`🏗️ Фаз: ${phases.size}, Стадий: ${stages.size}, Подстадий: ${substages.size}, Работ: ${works.length}`);

    // Очищаем существующие данные (опционально)
    console.log('🧹 Очищаем существующие данные...');
    await query('DELETE FROM work_materials');
    await query('DELETE FROM works_ref');
    await query('DELETE FROM substages');
    await query('DELETE FROM stages');
    await query('DELETE FROM phases');

    // Вставляем фазы
    console.log('📝 Вставляем фазы...');
    let phasesCount = 0;
    for (const [id, name] of phases) {
      try {
        await query('INSERT INTO phases (id, name, sort_order) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING', 
          [id, name, parseInt(id) || 0]);
        phasesCount++;
        console.log(`   Фаза: ${id} - ${name}`);
      } catch (error) {
        console.error(`❌ Ошибка при вставке фазы ${id}:`, error.message);
      }
    }
    console.log(`✅ Вставлено фаз: ${phasesCount}`);

    // Вставляем стадии
    console.log('📝 Вставляем стадии...');
    let stagesCount = 0;
    for (const [id, data] of stages) {
      try {
        await query('INSERT INTO stages (id, name, phase_id, sort_order) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING', 
          [id, data.name, data.phase_id, 0]);
        stagesCount++;
        console.log(`   Стадия: ${id} - ${data.name} (фаза: ${data.phase_id})`);
      } catch (error) {
        console.error(`❌ Ошибка при вставке стадии ${id}:`, error.message);
      }
    }
    console.log(`✅ Вставлено стадий: ${stagesCount}`);

    // Вставляем подстадии
    console.log('📝 Вставляем подстадии...');
    let substagesCount = 0;
    for (const [id, data] of substages) {
      try {
        await query('INSERT INTO substages (id, name, stage_id, sort_order) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING', 
          [id, data.name, data.stage_id, 0]);
        substagesCount++;
        console.log(`   Подстадия: ${id} - ${data.name} (стадия: ${data.stage_id})`);
      } catch (error) {
        console.error(`❌ Ошибка при вставке подстадии ${id}:`, error.message);
      }
    }
    console.log(`✅ Вставлено подстадий: ${substagesCount}`);

    // Вставляем работы
    console.log('📝 Вставляем работы...');
    let imported = 0;
    for (const work of works) {
      try {
        await query(`
          INSERT INTO works_ref (id, name, unit, unit_price, phase_id, stage_id, substage_id, sort_order) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
          ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            unit_price = EXCLUDED.unit_price,
            phase_id = EXCLUDED.phase_id,
            stage_id = EXCLUDED.stage_id,
            substage_id = EXCLUDED.substage_id
        `, [work.id, work.name, work.unit, work.unit_price, work.phase_id, work.stage_id, work.substage_id, 0]);
        imported++;
      } catch (error) {
        console.error(`❌ Ошибка при импорте работы ${work.id}:`, error.message);
      }
    }

    console.log(`✅ Импорт завершен! Импортировано ${imported} работ из ${works.length}`);
    
    // Показываем статистику
    const stats = await Promise.all([
      query('SELECT COUNT(*) FROM phases'),
      query('SELECT COUNT(*) FROM stages'),
      query('SELECT COUNT(*) FROM substages'),
      query('SELECT COUNT(*) FROM works_ref')
    ]);

    console.log('📊 Итоговая статистика:');
    console.log(`   Фазы: ${stats[0].rows[0].count}`);
    console.log(`   Стадии: ${stats[1].rows[0].count}`);
    console.log(`   Подстадии: ${stats[2].rows[0].count}`);
    console.log(`   Работы: ${stats[3].rows[0].count}`);

  } catch (error) {
    console.error('❌ Ошибка импорта:', error.message);
  } finally {
    process.exit(0);
  }
}

importCSV();