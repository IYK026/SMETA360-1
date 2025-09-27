import { query } from './database.js';

async function checkMaterialsStructure() {
  await query('SET app.tenant_id = \'5a1f0a53-9f0b-4137-a82a-6302bc993c54\';');
  
  const result = await query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'materials' 
    ORDER BY ordinal_position;
  `);
  
  console.log('Структура materials:', result.rows);
  
  // Проверим ограничения
  const constraints = await query(`
    SELECT constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_name = 'materials';
  `);
  
  console.log('Ограничения materials:', constraints.rows);
  
  // Проверим несколько материалов
  const sample = await query('SELECT id, name, unit_price FROM materials LIMIT 5;');
  console.log('Существующие материалы:');
  sample.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Название: ${row.name}, Цена: ${row.unit_price}`);
  });
}

checkMaterialsStructure().catch(console.error);
