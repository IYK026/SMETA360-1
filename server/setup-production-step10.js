/**
 * Шаг 10 — Настройка продакшен-окружения
 * Миграции, устойчивость, индексы, мониторинг, безопасность
 */
import { query } from './database.js';

async function setupProductionEnvironment() {
  try {
    console.log('🚀 Шаг 10 — Настройка продакшен-окружения');
    console.log('=' .repeat(60));

    // 10.2 Чистота данных: цены без дублей
    console.log('\n📊 10.2 Устранение дублей в ценах...');
    
    // Включаем расширение btree_gist для эксклюзионных ограничений
    console.log('   - Устанавливаем расширение btree_gist...');
    await query('CREATE EXTENSION IF NOT EXISTS btree_gist;');
    console.log('   ✅ Расширение btree_gist установлено');

    // Уникальные индексы для периодов материалов
    console.log('   - Создаем уникальный индекс для начальных дат материалов...');
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_tmp_unique_start
        ON tenant_material_prices(tenant_id, material_id, valid_from);
    `);
    console.log('   ✅ Уникальный индекс tenant_material_prices создан');

    // Эксклюзионное ограничение для предотвращения пересечений периодов материалов
    console.log('   - Создаем эксклюзионное ограничение для материалов...');
    try {
      await query(`
        ALTER TABLE tenant_material_prices
          ADD CONSTRAINT ex_tmp_no_overlap
          EXCLUDE USING gist (
            tenant_id WITH =,
            material_id WITH =,
            daterange(valid_from, COALESCE(valid_to, 'infinity'::date), '[]') WITH &&
          );
      `);
      console.log('   ✅ Эксклюзионное ограничение для материалов создано');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️ Ограничение уже существует');
      } else {
        throw error;
      }
    }

    // Аналогично для работ
    console.log('   - Создаем уникальный индекс для начальных дат работ...');
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_twp_unique_start
        ON tenant_work_prices(tenant_id, work_id, valid_from);
    `);
    console.log('   ✅ Уникальный индекс tenant_work_prices создан');

    console.log('   - Создаем эксклюзионное ограничение для работ...');
    try {
      await query(`
        ALTER TABLE tenant_work_prices
          ADD CONSTRAINT ex_twp_no_overlap
          EXCLUDE USING gist (
            tenant_id WITH =,
            work_id WITH =,
            daterange(valid_from, COALESCE(valid_to, 'infinity'::date), '[]') WITH &&
          );
      `);
      console.log('   ✅ Эксклюзионное ограничение для работ создано');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️ Ограничение уже существует');
      } else {
        throw error;
      }
    }

    // 10.3 Создание критически важных индексов
    console.log('\n🗂️ 10.3 Создание продакшен-индексов...');
    
    const indexes = [
      // Проекты
      {
        name: 'idx_projects_tenant_id',
        table: 'projects',
        columns: '(tenant_id, id)',
        description: 'Быстрый поиск проектов по тенанту'
      },
      // Сметы
      {
        name: 'idx_estimates_tenant_project',
        table: 'estimates', 
        columns: '(tenant_id, project_id)',
        description: 'Поиск смет по проекту'
      },
      // Элементы смет
      {
        name: 'idx_estimate_items_tenant_estimate',
        table: 'estimate_items',
        columns: '(tenant_id, estimate_id)',
        description: 'Элементы сметы'
      },
      {
        name: 'idx_estimate_items_sort',
        table: 'estimate_items',
        columns: '(tenant_id, estimate_id, parent_id, sort_order)',
        description: 'Сортировка элементов сметы'
      },
      // Материалы
      {
        name: 'idx_materials_tenant_id',
        table: 'materials',
        columns: '(tenant_id, id)',
        description: 'Поиск материалов по тенанту'
      },
      {
        name: 'idx_materials_tenant_name',
        table: 'materials', 
        columns: '(tenant_id, name)',
        description: 'Поиск материалов по названию'
      },
      // Работы
      {
        name: 'idx_works_tenant_id',
        table: 'works_ref',
        columns: '(tenant_id, id)',
        description: 'Поиск работ по тенанту'
      },
      {
        name: 'idx_works_tenant_name',
        table: 'works_ref',
        columns: '(tenant_id, name)', 
        description: 'Поиск работ по названию'
      },
      // Цены материалов
      {
        name: 'idx_tmp_tenant_material_date',
        table: 'tenant_material_prices',
        columns: '(tenant_id, material_id, valid_from DESC)',
        description: 'Поиск цен материалов по дате'
      },
      // Цены работ
      {
        name: 'idx_twp_tenant_work_date', 
        table: 'tenant_work_prices',
        columns: '(tenant_id, work_id, valid_from DESC)',
        description: 'Поиск цен работ по дате'
      },
      // Пользователи
      {
        name: 'idx_users_email',
        table: 'users',
        columns: '(email)',
        description: 'Быстрый поиск по email'
      },
      // Сессии пользователей
      {
        name: 'idx_user_sessions_token_hash',
        table: 'user_sessions',
        columns: '(token_hash)',
        description: 'Проверка refresh токенов'
      },
      {
        name: 'idx_user_sessions_user_expires',
        table: 'user_sessions', 
        columns: '(user_id, expires_at)',
        description: 'Активные сессии пользователя'
      }
    ];

    for (const index of indexes) {
      try {
        console.log(`   - Создание индекса ${index.name}: ${index.description}`);
        await query(`CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table} ${index.columns};`);
        console.log(`   ✅ Индекс ${index.name} создан`);
      } catch (error) {
        console.log(`   ⚠️ Индекс ${index.name}: ${error.message}`);
      }
    }

    // 10.4 Проверка настроек соединений
    console.log('\n🔌 10.4 Проверка настроек соединений...');
    
    const connectionSettings = await query(`
      SELECT 
        name,
        setting,
        unit,
        short_desc
      FROM pg_settings 
      WHERE name IN (
        'max_connections',
        'shared_buffers', 
        'work_mem',
        'maintenance_work_mem',
        'checkpoint_segments',
        'checkpoint_completion_target',
        'wal_buffers',
        'default_statistics_target'
      )
      ORDER BY name;
    `);

    console.log('   📋 Текущие настройки PostgreSQL:');
    connectionSettings.rows.forEach(setting => {
      const unit = setting.unit ? ` ${setting.unit}` : '';
      console.log(`     ${setting.name}: ${setting.setting}${unit}`);
    });

    // 10.5 Проверка autovacuum
    console.log('\n🧹 10.5 Проверка настроек автоочистки...');
    
    const vacuumSettings = await query(`
      SELECT name, setting, short_desc
      FROM pg_settings 
      WHERE name LIKE 'autovacuum%'
      ORDER BY name;
    `);

    console.log('   📋 Настройки autovacuum:');
    vacuumSettings.rows.forEach(setting => {
      console.log(`     ${setting.name}: ${setting.setting}`);
    });

    // Проверка статистики таблиц
    const tableStats = await query(`
      SELECT 
        schemaname,
        relname as tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables 
      WHERE n_live_tup > 1000
      ORDER BY n_live_tup DESC
      LIMIT 10;
    `);

    if (tableStats.rows.length > 0) {
      console.log('   📊 Статистика крупнейших таблиц:');
      tableStats.rows.forEach(stat => {
        console.log(`     ${stat.tablename}: ${stat.live_rows} живых строк, ${stat.dead_rows} мертвых`);
      });
    }

    // 10.7 Настройка мониторинга
    console.log('\n📈 10.7 Создание функций мониторинга...');

    // Функция мониторинга активных соединений
    await query(`
      CREATE OR REPLACE FUNCTION get_connection_stats()
      RETURNS TABLE (
        state text,
        count bigint,
        max_duration interval
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          COALESCE(state, 'unknown') as state,
          COUNT(*) as count,
          COALESCE(MAX(now() - state_change), '0'::interval) as max_duration
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
        ORDER BY count DESC;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('   ✅ Функция get_connection_stats() создана');

    // Функция мониторинга медленных запросов
    await query(`
      CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms integer DEFAULT 1000)
      RETURNS TABLE (
        query_start timestamp with time zone,
        duration interval,
        state text,
        query text
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          psa.query_start,
          now() - psa.query_start as duration,
          psa.state,
          LEFT(psa.query, 200) as query
        FROM pg_stat_activity psa
        WHERE psa.datname = current_database()
          AND psa.state = 'active'
          AND (now() - psa.query_start) > (min_duration_ms || ' milliseconds')::interval
        ORDER BY (now() - psa.query_start) DESC;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('   ✅ Функция get_slow_queries() создана');

    // 10.8 Проверка безопасности
    console.log('\n🔒 10.8 Проверка настроек безопасности...');

    // Проверка RLS политик
    const rlsPolicies = await query(`
      SELECT 
        n.nspname as schema_name,
        c.relname as table_name,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r' 
        AND n.nspname = 'public'
        AND c.relname IN (
          'projects', 'estimates', 'estimate_items', 
          'materials', 'works_ref', 'work_materials_tenant',
          'tenant_material_prices', 'tenant_work_prices'
        )
      ORDER BY c.relname;
    `);

    console.log('   📋 Статус RLS для критических таблиц:');
    rlsPolicies.rows.forEach(policy => {
      const status = policy.rls_enabled ? '✅ включен' : '❌ выключен';
      console.log(`     ${policy.table_name}: RLS ${status}`);
    });

    // Создание итогового отчета
    console.log('\n📋 10.11 Создание функции диагностики системы...');
    
    await query(`
      CREATE OR REPLACE FUNCTION system_health_check()
      RETURNS TABLE (
        category text,
        metric text,
        value text,
        status text
      ) AS $$
      BEGIN
        -- Соединения
        RETURN QUERY
        SELECT 'Connections'::text, 'Active'::text, 
               COUNT(*)::text, 
               CASE WHEN COUNT(*) < 50 THEN '✅' ELSE '⚠️' END
        FROM pg_stat_activity WHERE state = 'active';
        
        -- RLS
        RETURN QUERY  
        SELECT 'Security'::text, 'RLS Tables'::text,
               COUNT(*)::text,
               CASE WHEN COUNT(*) >= 8 THEN '✅' ELSE '❌' END
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relrowsecurity = true AND n.nspname = 'public';
        
        -- Индексы
        RETURN QUERY
        SELECT 'Performance'::text, 'Indexes'::text,
               COUNT(*)::text, '✅'::text
        FROM pg_indexes WHERE schemaname = 'public';
        
        -- Размер БД
        RETURN QUERY
        SELECT 'Storage'::text, 'Database Size'::text,
               pg_size_pretty(pg_database_size(current_database())),
               '📊'::text;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('   ✅ Функция system_health_check() создана');

    // Запуск диагностики
    console.log('\n🩺 Финальная диагностика системы...');
    const healthCheck = await query('SELECT * FROM system_health_check();');
    
    console.log('   📊 Статус системы:');
    healthCheck.rows.forEach(check => {
      console.log(`     ${check.status} ${check.category} - ${check.metric}: ${check.value}`);
    });

    console.log('\n✅ Шаг 10 завершен успешно!');
    console.log('\n🎯 Что настроено для продакшена:');
    console.log('  📊 Уникальные индексы и эксклюзионные ограничения для цен');
    console.log('  🗂️ Критически важные индексы для быстрого поиска');
    console.log('  🔌 Проверка настроек соединений и пула');
    console.log('  🧹 Мониторинг autovacuum и статистики таблиц'); 
    console.log('  📈 Функции мониторинга соединений и медленных запросов');
    console.log('  🔒 Проверка статуса RLS политик');
    console.log('  🩺 Система диагностики здоровья БД');

    console.log('\n💡 Следующие шаги:');
    console.log('  1. Настройте мониторинг вызовом get_connection_stats()');
    console.log('  2. Регулярно проверяйте get_slow_queries()'); 
    console.log('  3. Запускайте system_health_check() для диагностики');
    console.log('  4. Настройте алерты на метрики подключений и производительности');
    console.log('  5. Проведите нагрузочное тестирование');

    return {
      indexesCreated: indexes.length,
      rlsTablesEnabled: rlsPolicies.rows.filter(p => p.rls_enabled).length,
      monitoringFunctionsCreated: 3
    };

  } catch (error) {
    console.error('❌ Ошибка при настройке продакшен-окружения:', error);
    throw error;
  }
}

// Запускаем настройку продакшен-окружения
setupProductionEnvironment()
  .then((result) => {
    console.log('\n🎉 Продакшен-окружение готово!');
    console.log('DEBUG: Результат:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });
