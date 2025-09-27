import { query } from './database.js';

async function analyzeDatabase() {
  try {
    console.log('🔍 Анализ структуры и данных базы данных...\n');
    
    // 1. Основная статистика
    console.log('📊 ОБЩАЯ СТАТИСТИКА:');
    const stats = await Promise.all([
      query('SELECT COUNT(*) as count FROM phases'),
      query('SELECT COUNT(*) as count FROM stages'),
      query('SELECT COUNT(*) as count FROM substages'),
      query('SELECT COUNT(*) as count FROM works_ref'),
      query('SELECT COUNT(*) as count FROM materials'),
      query('SELECT COUNT(*) as count FROM work_materials'),
    ]);
    
    console.log(`   Фазы: ${stats[0].rows[0].count}`);
    console.log(`   Стадии: ${stats[1].rows[0].count}`);
    console.log(`   Подстадии: ${stats[2].rows[0].count}`);
    console.log(`   Работы: ${stats[3].rows[0].count}`);
    console.log(`   Материалы: ${stats[4].rows[0].count}`);
    console.log(`   Связи работа-материал: ${stats[5].rows[0].count}\n`);
    
    // 2. Примеры фаз
    console.log('🏗️ ФАЗЫ (первые 10):');
    const phases = await query('SELECT id, name, sort_order FROM phases ORDER BY sort_order, id LIMIT 10');
    phases.rows.forEach(p => console.log(`   ${p.id}: ${p.name} (порядок: ${p.sort_order})`));
    console.log();
    
    // 3. Примеры стадий
    console.log('📋 СТАДИИ (первые 10):');
    const stages = await query(`
      SELECT s.id, s.name, s.phase_id, p.name as phase_name, s.sort_order 
      FROM stages s 
      LEFT JOIN phases p ON s.phase_id = p.id 
      ORDER BY s.sort_order, s.id 
      LIMIT 10
    `);
    stages.rows.forEach(s => console.log(`   ${s.id}: ${s.name} (фаза: ${s.phase_id})`));
    console.log();
    
    // 4. Примеры работ с иерархией
    console.log('⚙️ РАБОТЫ (первые 10 с полной иерархией):');
    const works = await query(`
      SELECT 
        w.id, w.name, w.unit, w.unit_price,
        p.name as phase_name,
        s.name as stage_name,
        ss.name as substage_name
      FROM works_ref w
      LEFT JOIN phases p ON w.phase_id = p.id
      LEFT JOIN stages s ON w.stage_id = s.id  
      LEFT JOIN substages ss ON w.substage_id = ss.id
      ORDER BY w.sort_order, w.id
      LIMIT 10
    `);
    works.rows.forEach(w => {
      console.log(`   ${w.id}: ${w.name}`);
      console.log(`     Фаза: ${w.phase_name || 'не указана'}`);
      console.log(`     Стадия: ${w.stage_name || 'не указана'}`);
      console.log(`     Подстадия: ${w.substage_name || 'не указана'}`);
      console.log(`     Единица: ${w.unit || 'не указана'}, Цена: ${w.unit_price || 'не указана'} ₽\n`);
    });
    
    // 5. Примеры материалов
    console.log('🧱 МАТЕРИАЛЫ (первые 10):');
    const materials = await query('SELECT id, name, unit, unit_price FROM materials ORDER BY name LIMIT 10');
    materials.rows.forEach(m => console.log(`   ${m.id}: ${m.name} (${m.unit || 'без ед.'}, ${m.unit_price || 0} ₽)`));
    console.log();
    
    // 6. Примеры связей работа-материал
    console.log('🔗 СВЯЗИ РАБОТА-МАТЕРИАЛ (первые 10):');
    const connections = await query(`
      SELECT 
        wm.work_id,
        w.name as work_name,
        m.id as material_id,
        m.name as material_name,
        wm.consumption_per_work_unit,
        wm.waste_coeff,
        (wm.consumption_per_work_unit * wm.waste_coeff) as total_consumption,
        ((wm.consumption_per_work_unit * wm.waste_coeff) * m.unit_price) as material_cost
      FROM work_materials wm
      JOIN works_ref w ON wm.work_id = w.id
      JOIN materials m ON wm.material_id = m.id
      ORDER BY wm.work_id, m.name
      LIMIT 10
    `);
    connections.rows.forEach(c => {
      console.log(`   Работа ${c.work_id} (${c.work_name})`);
      console.log(`   → Материал ${c.material_id} (${c.material_name})`);
      console.log(`   → Расход: ${c.consumption_per_work_unit} × ${c.waste_coeff} = ${parseFloat(c.total_consumption).toFixed(6)}`);
      console.log(`   → Стоимость: ${parseFloat(c.material_cost || 0).toFixed(2)} ₽\n`);
    });
    
    // 7. Анализ качества данных
    console.log('🔍 АНАЛИЗ КАЧЕСТВА ДАННЫХ:');
    const quality = await query(`
      SELECT 
        COUNT(*) as total_works,
        COUNT(w.phase_id) as works_with_phase,
        COUNT(w.stage_id) as works_with_stage,
        COUNT(w.substage_id) as works_with_substage,
        COUNT(w.unit_price) as works_with_price
      FROM works_ref w
    `);
    const q = quality.rows[0];
    console.log(`   Работ с фазой: ${q.works_with_phase}/${q.total_works} (${(q.works_with_phase/q.total_works*100).toFixed(1)}%)`);
    console.log(`   Работ со стадией: ${q.works_with_stage}/${q.total_works} (${(q.works_with_stage/q.total_works*100).toFixed(1)}%)`);
    console.log(`   Работ с подстадией: ${q.works_with_substage}/${q.total_works} (${(q.works_with_substage/q.total_works*100).toFixed(1)}%)`);
    console.log(`   Работ с ценой: ${q.works_with_price}/${q.total_works} (${(q.works_with_price/q.total_works*100).toFixed(1)}%)`);
    
    const materialQuality = await query(`
      SELECT 
        COUNT(*) as total_materials,
        COUNT(unit_price) as materials_with_price
      FROM materials
    `);
    const mq = materialQuality.rows[0];
    console.log(`   Материалов с ценой: ${mq.materials_with_price}/${mq.total_materials} (${(mq.materials_with_price/mq.total_materials*100).toFixed(1)}%)\n`);
    
    // 8. Топ работ по количеству материалов
    console.log('🏆 ТОП-10 РАБОТ ПО КОЛИЧЕСТВУ МАТЕРИАЛОВ:');
    const topWorks = await query(`
      SELECT 
        w.id,
        w.name,
        COUNT(wm.material_id) as material_count
      FROM works_ref w
      JOIN work_materials wm ON w.id = wm.work_id
      GROUP BY w.id, w.name
      ORDER BY material_count DESC
      LIMIT 10
    `);
    topWorks.rows.forEach((work, i) => {
      console.log(`   ${i+1}. ${work.id}: ${work.name} (${work.material_count} материалов)`);
    });
    
    process.exit(0);
  } catch(err) {
    console.error('❌ Ошибка анализа:', err.message);
    process.exit(1);
  }
}

analyzeDatabase();
