import { query } from './database.js';
import fs from 'fs';

async function importWorkMaterialsCSV() {
  try {
    console.log('📁 Читаем CSV файл с связями работа-материал...');
    
    // Читаем CSV файл
    const csvContent = fs.readFileSync('../work_materials.strict.cleaned.csv', 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📊 Найдено строк: ${lines.length - 1} (без заголовка)`);
    
    // Очищаем старые данные
    console.log('🧹 Очищаем старые данные...');
    await query('DELETE FROM work_materials');
    console.log('✅ Старые данные удалены');
    
    // Парсим CSV и добавляем данные
    const connections = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 1; i < lines.length; i++) { // Пропускаем заголовок
      const line = lines[i].trim();
      if (!line) continue;
      
      const [work_id, material_id, consumption_per_work_unit, waste_coeff] = line.split(';');
      
      if (work_id && material_id) {
        try {
          await query(`
            INSERT INTO work_materials (work_id, material_id, consumption_per_work_unit, waste_coeff)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (work_id, material_id)
            DO UPDATE SET
              consumption_per_work_unit = EXCLUDED.consumption_per_work_unit,
              waste_coeff = EXCLUDED.waste_coeff,
              updated_at = now()
          `, [
            work_id.trim(),
            material_id.trim(),
            parseFloat(consumption_per_work_unit) || 1.0,
            parseFloat(waste_coeff) || 1.0
          ]);
          
          successCount++;
          
          if (successCount % 100 === 0) {
            console.log(`✅ Обработано: ${successCount} связей...`);
          }
          
        } catch (error) {
          console.error(`❌ Ошибка в строке ${i + 1}: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`\n📊 Результаты импорта:`);
    console.log(`✅ Успешно добавлено: ${successCount} связей`);
    console.log(`❌ Ошибок: ${errorCount}`);
    
    // Проверяем результат
    console.log('\n🔍 Проверяем импортированные данные...');
    const stats = await query(`
      SELECT 
        COUNT(*) as total_connections,
        COUNT(DISTINCT work_id) as unique_works,
        COUNT(DISTINCT material_id) as unique_materials
      FROM work_materials
    `);
    
    const stat = stats.rows[0];
    console.log(`📋 Статистика:`);
    console.log(`- Всего связей: ${stat.total_connections}`);
    console.log(`- Уникальных работ: ${stat.unique_works}`);
    console.log(`- Уникальных материалов: ${stat.unique_materials}`);
    
    // Показываем несколько примеров
    console.log('\n📝 Примеры связей:');
    const examples = await query(`
      SELECT 
        wm.work_id,
        wm.material_id,
        wm.consumption_per_work_unit,
        wm.waste_coeff,
        w.name as work_name,
        m.name as material_name
      FROM work_materials wm
      LEFT JOIN works_ref w ON wm.work_id = w.id
      LEFT JOIN materials m ON wm.material_id = m.id
      ORDER BY wm.work_id, wm.material_id
      LIMIT 10
    `);
    
    examples.rows.forEach(row => {
      console.log(`- ${row.work_id} (${row.work_name || 'не найдена'}) -> ${row.material_id} (${row.material_name || 'не найден'})`);
      console.log(`  Расход: ${row.consumption_per_work_unit} ед., коэф. отхода: ${row.waste_coeff}`);
    });
    
    console.log('\n✅ Импорт связей работа-материал завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка импорта:', error.message);
  }
}

importWorkMaterialsCSV();
