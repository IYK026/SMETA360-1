import { query } from './database.js';

async function getRealData() {
  try {
    console.log('🔍 Получаем реальные данные из справочников...');
    
    // Получаем несколько работ
    const works = await query(`
      SELECT id, name, unit, unit_price 
      FROM works_ref 
      ORDER BY id 
      LIMIT 5
    `);
    
    console.log('\n📋 Работы:');
    works.rows.forEach(work => {
      console.log(`- ${work.id}: ${work.name} (${work.unit}, ${work.unit_price} ₽)`);
    });
    
    // Получаем несколько материалов
    const materials = await query(`
      SELECT id, name, unit, unit_price 
      FROM materials 
      ORDER BY name 
      LIMIT 10
    `);
    
    console.log('\n📦 Материалы:');
    materials.rows.forEach(material => {
      console.log(`- ${material.id}: ${material.name} (${material.unit}, ${material.unit_price} ₽)`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

getRealData();
