import { query } from './database.js';

async function getTableStructure() {
  try {
    console.log('📋 СТРУКТУРА БАЗЫ ДАННЫХ\n');
    console.log('=' * 80);
    
    // Получаем список всех таблиц
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`🗄️ ВСЕГО ТАБЛИЦ: ${tables.rows.length}\n`);
    
    for (const table of tables.rows) {
      const tableName = table.table_name;
      console.log(`📊 ТАБЛИЦА: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(60));
      
      // Получаем структуру колонок
      const columns = await query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);
      
      // Получаем primary keys
      const primaryKeys = await query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
          AND tc.table_schema = 'public'
      `, [tableName]);
      
      const pkColumns = primaryKeys.rows.map(row => row.column_name);
      
      // Получаем foreign keys
      const foreignKeys = await query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1
          AND tc.table_schema = 'public'
      `, [tableName]);
      
      const fkMap = {};
      foreignKeys.rows.forEach(fk => {
        fkMap[fk.column_name] = `${fk.foreign_table_name}.${fk.foreign_column_name}`;
      });
      
      // Выводим колонки
      columns.rows.forEach(col => {
        let line = `  ${col.column_name.padEnd(25)}`;
        
        // Тип данных
        let dataType = col.data_type;
        if (col.character_maximum_length) {
          dataType += `(${col.character_maximum_length})`;
        }
        line += dataType.padEnd(20);
        
        // NULL/NOT NULL
        line += (col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL').padEnd(10);
        
        // Дополнительные атрибуты
        const attributes = [];
        if (pkColumns.includes(col.column_name)) {
          attributes.push('PK');
        }
        if (fkMap[col.column_name]) {
          attributes.push(`FK → ${fkMap[col.column_name]}`);
        }
        if (col.column_default) {
          attributes.push(`DEFAULT ${col.column_default}`);
        }
        
        if (attributes.length > 0) {
          line += attributes.join(', ');
        }
        
        console.log(line);
      });
      
      // Получаем количество записей
      const count = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`\n📈 Записей в таблице: ${count.rows[0].count}`);
      console.log('');
    }
    
    // Дополнительно выводим связи между таблицами
    console.log('\n🔗 СВЯЗИ МЕЖДУ ТАБЛИЦАМИ:');
    console.log('-'.repeat(60));
    
    const allForeignKeys = await query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    allForeignKeys.rows.forEach(fk => {
      console.log(`${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    console.log('\n✅ Структура базы данных получена!');
    
  } catch (error) {
    console.error('❌ Ошибка получения структуры:', error);
  } finally {
    process.exit(0);
  }
}

getTableStructure();
