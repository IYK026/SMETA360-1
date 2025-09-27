import { query } from './database.js';
import fs from 'fs';
import path from 'path';

async function importMaterialsCSV() {
  try {
    console.log('📥 Начинаем импорт материалов из CSV...');

    // Читаем CSV файл
    const csvPath = path.join(process.cwd(), 'BDM (1).csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    console.log(`📊 Найдено ${lines.length - 1} записей для импорта`);

    // Пропускаем заголовок и обрабатываем данные
    const dataLines = lines.slice(1);
    const materials = [];

    for (const line of dataLines) {
      if (!line.trim()) continue;

      const [material_id, material_name, image_url, item_url, unit, unit_price, expenditure, weight] =
        line.split(';');

      // Собираем материалы
      if (material_id && material_id.trim() && material_name && material_name.trim()) {
        materials.push({
          id: material_id.trim(),
          name: material_name.trim(),
          image_url: (image_url && image_url.trim()) ? image_url.trim() : null,
          item_url: (item_url && item_url.trim()) ? item_url.trim() : null,
          unit: (unit && unit.trim()) ? unit.trim() : null,
          unit_price: (unit_price && unit_price.trim()) ? parseFloat(unit_price.trim().replace(/\s/g, '').replace(',', '.')) : null,
          expenditure: (expenditure && expenditure.trim()) ? parseFloat(expenditure.trim().replace(/\s/g, '').replace(',', '.')) : null,
          weight: (weight && weight.trim()) ? parseFloat(weight.trim().replace(/\s/g, '').replace(',', '.')) : null
        });
      }
    }

    console.log(`🏗️ Материалов для импорта: ${materials.length}`);

    // Очищаем существующие данные (опционально, но поскольку пользователь сказал удалил тестовые, возможно не нужно)
    // console.log('🧹 Очищаем существующие материалы...');
    // await query('DELETE FROM materials');

    // Вставляем материалы
    console.log('📝 Вставляем материалы...');
    let imported = 0;
    for (const material of materials) {
      try {
        await query(`
          INSERT INTO materials (id, name, image_url, item_url, unit, unit_price, expenditure, weight)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            image_url = EXCLUDED.image_url,
            item_url = EXCLUDED.item_url,
            unit = EXCLUDED.unit,
            unit_price = EXCLUDED.unit_price,
            expenditure = EXCLUDED.expenditure,
            weight = EXCLUDED.weight,
            updated_at = now()
        `, [material.id, material.name, material.image_url, material.item_url, material.unit, material.unit_price, material.expenditure, material.weight]);
        imported++;
        if (imported % 10 === 0) {
          console.log(`   Импортировано: ${imported}/${materials.length}`);
        }
      } catch (error) {
        console.error(`❌ Ошибка при импорте материала ${material.id}:`, error.message);
      }
    }

    console.log(`✅ Импорт завершен! Импортировано ${imported} материалов из ${materials.length}`);

    // Показываем статистику
    const stats = await query('SELECT COUNT(*) FROM materials');
    console.log(`📊 Всего материалов в БД: ${stats.rows[0].count}`);

  } catch (error) {
    console.error('❌ Ошибка импорта:', error.message);
  } finally {
    process.exit(0);
  }
}

importMaterialsCSV();
