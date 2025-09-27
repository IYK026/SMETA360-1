import { query } from './database.js';

async function showFinalDatabaseSchema() {
  try {
    console.log('📋 ФИНАЛЬНАЯ СХЕМА БАЗЫ ДАННЫХ\n');
    console.log('=' * 80);
    
    // Общая статистика
    const totalTables = await query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`🗄️ Всего таблиц: ${totalTables.rows[0].count}\n`);
    
    // Группируем таблицы по назначению
    const tableGroups = {
      'Авторизация и пользователи': ['auth_users', 'user_sessions', 'users'],
      'Мультитенантность': ['tenants', 'user_tenants'], 
      'Проекты и сметы': ['projects', 'estimates', 'estimate_items'],
      'Справочники': ['phases', 'stages', 'substages', 'works_ref', 'materials', 'work_materials'],
      'Служебные': ['orders', 'statistics']
    };
    
    for (const [groupName, tableNames] of Object.entries(tableGroups)) {
      console.log(`📊 ${groupName.toUpperCase()}:`);
      
      for (const tableName of tableNames) {
        const count = await query(`
          SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        `, [tableName]);
        
        if (count.rows[0].count > 0) {
          const records = await query(`SELECT COUNT(*) FROM ${tableName}`);
          console.log(`  ✅ ${tableName.padEnd(20)} (${records.rows[0].count} записей)`);
        } else {
          console.log(`  ❌ ${tableName.padEnd(20)} (не найдена)`);
        }
      }
      console.log();
    }
    
    // Показываем ключевые связи
    console.log('🔗 КЛЮЧЕВЫЕ СВЯЗИ:');
    console.log('------------------------------------------------------------');
    
    const keyRelations = [
      'tenants.id ←── user_tenants.tenant_id',
      'auth_users.id ←── user_tenants.user_id',
      '',
      'tenants.id ←── projects.tenant_id',
      'auth_users.id ←── projects.owner_user_id',
      'auth_users.id ←── projects.created_by',
      '',
      'tenants.id ←── estimates.tenant_id',
      'projects.id ←── estimates.project_id',
      'auth_users.id ←── estimates.created_by',
      '',
      'tenants.id ←── estimate_items.tenant_id',
      'estimates.id ←── estimate_items.estimate_id',
      'works_ref.id ←── estimate_items.work_id',
      'materials.id ←── estimate_items.material_id',
      'estimate_items.id ←── estimate_items.parent_id (self)',
      '',
      'phases.id ←── works_ref.phase_id',
      'stages.id ←── works_ref.stage_id',
      'substages.id ←── works_ref.substage_id',
      'works_ref.id ←── work_materials.work_id',
      'materials.id ←── work_materials.material_id'
    ];
    
    keyRelations.forEach(relation => {
      if (relation) {
        console.log(`  ${relation}`);
      } else {
        console.log();
      }
    });
    
    // Показываем типы данных UUID vs INTEGER
    console.log('\n🆔 ТИПЫ ИДЕНТИФИКАТОРОВ:');
    console.log('------------------------------------------------------------');
    
    const uuidTables = await query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
      ORDER BY table_name
    `);
    
    const intTables = await query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND column_name = 'id' 
        AND data_type = 'integer'
      ORDER BY table_name
    `);
    
    console.log('📋 UUID идентификаторы (новые таблицы):');
    uuidTables.rows.forEach(row => {
      console.log(`  🆔 ${row.table_name}.${row.column_name}`);
    });
    
    console.log('\n🔢 INTEGER идентификаторы (legacy таблицы):');
    intTables.rows.forEach(row => {
      console.log(`  🔢 ${row.table_name}.${row.column_name}`);
    });
    
    console.log('\n✅ Схема базы данных готова к работе!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    process.exit(0);
  }
}

showFinalDatabaseSchema();
