import { query } from './database.js';
import fs from 'fs';

async function createSchemaOnlyDump() {
  try {
    console.log('📋 Создание схемы базы данных (schema-only)...');
    
    let schemaSql = `-- PostgreSQL Schema-Only Dump\n`;
    schemaSql += `-- Generated on ${new Date().toISOString()}\n`;
    schemaSql += `-- Database: Aiven Cloud PostgreSQL\n\n`;
    
    // Получаем все таблицы в правильном порядке (учитывая зависимости)
    const tablesOrder = [
      'auth_users',
      'users', 
      'statistics',
      'phases',
      'stages', 
      'substages',
      'materials',
      'works_ref',
      'work_materials',
      'orders',
      'user_sessions'
    ];
    
    for (const tableName of tablesOrder) {
      console.log(`   Экспортируем схему таблицы: ${tableName}`);
      
      // Получаем DDL для создания таблицы
      const tableInfo = await query(`
        SELECT 
          'CREATE TABLE ' || schemaname||'.'||tablename || ' (' ||
          string_agg(column_name||' '||type||' '||not_null||default_value, ', ')||
          ');' AS ddl
        FROM (
          SELECT 
            schemaname,
            tablename,
            column_name,
            data_type ||
            case 
              when character_maximum_length is not null 
              then '('||character_maximum_length||')'
              else ''
            end as type,
            case 
              when is_nullable='NO' then 'NOT NULL ' 
              else 'NULL '
            end as not_null,
            case 
              when column_default is not null 
              then 'DEFAULT '||column_default||' '
              else ''
            end as default_value,
            ordinal_position
          FROM information_schema.columns c
          LEFT JOIN information_schema.tables t ON c.table_name = t.table_name
          WHERE c.table_name = $1 AND c.table_schema = 'public'
          ORDER BY ordinal_position
        ) AS columns
        GROUP BY schemaname, tablename
      `, [tableName]);
      
      if (tableInfo.rows.length > 0) {
        schemaSql += `-- Table: ${tableName}\n`;
        schemaSql += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
        schemaSql += tableInfo.rows[0].ddl.replace('public.', '') + '\n\n';
      }
      
      // Добавляем constraints (primary keys, foreign keys)
      const constraints = await query(`
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = $1 AND tc.table_schema = 'public'
        ORDER BY tc.constraint_type, tc.constraint_name
      `, [tableName]);
      
      constraints.rows.forEach(constraint => {
        if (constraint.constraint_type === 'PRIMARY KEY') {
          schemaSql += `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraint.constraint_name} PRIMARY KEY (${constraint.column_name});\n`;
        } else if (constraint.constraint_type === 'FOREIGN KEY') {
          schemaSql += `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraint.constraint_name} FOREIGN KEY (${constraint.column_name}) REFERENCES ${constraint.foreign_table_name}(${constraint.foreign_column_name});\n`;
        }
      });
      
      schemaSql += '\n';
    }
    
    // Добавляем индексы
    schemaSql += `-- Indexes\n`;
    const indexes = await query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    `);
    
    indexes.rows.forEach(idx => {
      schemaSql += `${idx.indexdef};\n`;
    });
    
    // Сохраняем схему
    const schemaFile = 'schema_only.sql';
    fs.writeFileSync(schemaFile, schemaSql, 'utf8');
    
    console.log(`✅ Схема сохранена в: ${schemaFile}`);
    console.log(`📁 Размер: ${(fs.statSync(schemaFile).size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Ошибка создания схемы:', error);
  } finally {
    process.exit(0);
  }
}

createSchemaOnlyDump();
