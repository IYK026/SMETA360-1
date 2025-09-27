import { query } from './database.js';
import fs from 'fs';

async function createBackup() {
  try {
    const backupFile = `backup_${new Date().toISOString().split('T')[0]}.sql`;
    console.log(`🗄️ Создание бэкапа базы данных: ${backupFile}`);
    
    let sqlContent = `-- Database backup created on ${new Date().toISOString()}\n`;
    sqlContent += `-- Aiven Cloud PostgreSQL Database\n\n`;
    
    // Получаем список всех таблиц
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📊 Найдено таблиц для бэкапа: ${tables.rows.length}`);
    
    for (const table of tables.rows) {
      const tableName = table.table_name;
      console.log(`   Экспортируем таблицу: ${tableName}`);
      
      // Получаем структуру таблицы
      const structure = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);
      
      sqlContent += `-- Table: ${tableName}\n`;
      sqlContent += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
      
      // Создаем CREATE TABLE statement (упрощенная версия)
      const columns = structure.rows.map(col => {
        let colDef = `${col.column_name} ${col.data_type}`;
        if (col.is_nullable === 'NO') colDef += ' NOT NULL';
        if (col.column_default) colDef += ` DEFAULT ${col.column_default}`;
        return colDef;
      }).join(',\n    ');
      
      sqlContent += `CREATE TABLE ${tableName} (\n    ${columns}\n);\n\n`;
      
      // Получаем данные таблицы
      const data = await query(`SELECT * FROM ${tableName}`);
      console.log(`     Записей: ${data.rows.length}`);
      
      if (data.rows.length > 0) {
        const columnNames = structure.rows.map(col => col.column_name);
        sqlContent += `-- Data for ${tableName}\n`;
        sqlContent += `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES\n`;
        
        const values = data.rows.map(row => {
          const rowValues = columnNames.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'boolean') return val ? 'true' : 'false';
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val.toString();
          });
          return `    (${rowValues.join(', ')})`;
        });
        
        sqlContent += values.join(',\n') + ';\n\n';
      }
    }
    
    // Сохраняем файл
    fs.writeFileSync(backupFile, sqlContent, 'utf8');
    console.log(`✅ Бэкап успешно создан: ${backupFile}`);
    console.log(`📁 Размер файла: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Ошибка создания бэкапа:', error);
  } finally {
    process.exit(0);
  }
}

createBackup();
