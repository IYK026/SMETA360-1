/**
 * Система миграций для продакшен-окружения
 * Шаг 10.1 - Миграции и сиды
 */
import fs from 'fs/promises';
import path from 'path';
import { query } from './database.js';

// Создаем таблицу для отслеживания миграций
async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      description TEXT,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER,
      checksum TEXT
    );
  `);
}

/**
 * Применяет миграцию
 */
async function applyMigration(migrationFile) {
  const migrationPath = path.join('./migrations', migrationFile);
  const content = await fs.readFile(migrationPath, 'utf8');
  
  // Парсим миграцию
  const parts = content.split('-- ROLLBACK --');
  const upScript = parts[0].trim();
  const downScript = parts[1] ? parts[1].trim() : '';
  
  // Извлекаем метаданные из комментариев
  const versionMatch = content.match(/-- Version: (.+)/);
  const descriptionMatch = content.match(/-- Description: (.+)/);
  
  const version = versionMatch ? versionMatch[1] : path.basename(migrationFile, '.sql');
  const description = descriptionMatch ? descriptionMatch[1] : 'No description';
  
  console.log(`🔄 Применяем миграцию ${version}: ${description}`);
  
  const startTime = Date.now();
  
  try {
    // Выполняем миграцию в транзакции
    await query('BEGIN');
    
    // Применяем SQL
    await query(upScript);
    
    // Записываем в журнал миграций
    const executionTime = Date.now() - startTime;
    await query(`
      INSERT INTO schema_migrations (version, description, execution_time_ms)
      VALUES ($1, $2, $3)
      ON CONFLICT (version) DO UPDATE SET
        applied_at = CURRENT_TIMESTAMP,
        execution_time_ms = EXCLUDED.execution_time_ms;
    `, [version, description, executionTime]);
    
    await query('COMMIT');
    
    console.log(`✅ Миграция ${version} применена (${executionTime}ms)`);
    return { version, description, executionTime };
    
  } catch (error) {
    await query('ROLLBACK');
    console.error(`❌ Ошибка миграции ${version}:`, error.message);
    throw error;
  }
}

/**
 * Откатывает миграцию
 */
async function rollbackMigration(version) {
  const migrationFile = `${version}.sql`;
  const migrationPath = path.join('./migrations', migrationFile);
  
  try {
    const content = await fs.readFile(migrationPath, 'utf8');
    const parts = content.split('-- ROLLBACK --');
    
    if (!parts[1]) {
      throw new Error(`Миграция ${version} не содержит скрипт отката`);
    }
    
    const downScript = parts[1].trim();
    
    console.log(`🔙 Откатываем миграцию ${version}`);
    
    await query('BEGIN');
    
    // Применяем откат
    await query(downScript);
    
    // Удаляем из журнала
    await query('DELETE FROM schema_migrations WHERE version = $1', [version]);
    
    await query('COMMIT');
    
    console.log(`✅ Миграция ${version} откачена`);
    
  } catch (error) {
    await query('ROLLBACK');
    console.error(`❌ Ошибка отката миграции ${version}:`, error.message);
    throw error;
  }
}

/**
 * Получает статус миграций
 */
async function getMigrationStatus() {
  try {
    // Получаем примененные миграции
    const appliedResult = await query(`
      SELECT version, description, applied_at, execution_time_ms
      FROM schema_migrations
      ORDER BY version;
    `);
    
    // Получаем доступные файлы миграций
    let availableFiles = [];
    try {
      const files = await fs.readdir('./migrations');
      availableFiles = files.filter(f => f.endsWith('.sql')).sort();
    } catch (error) {
      console.log('📁 Папка migrations не найдена');
    }
    
    const applied = appliedResult.rows.map(r => r.version);
    const pending = availableFiles
      .map(f => path.basename(f, '.sql'))
      .filter(v => !applied.includes(v));
    
    return {
      applied: appliedResult.rows,
      pending: pending,
      total: availableFiles.length
    };
    
  } catch (error) {
    console.error('❌ Ошибка получения статуса миграций:', error.message);
    return { applied: [], pending: [], total: 0 };
  }
}

/**
 * Создает сиды (эталонные данные)
 */
async function createSeeds() {
  console.log('🌱 Создание сидов (эталонных данных)...');
  
  // Сид 1: Роли пользователей  
  console.log('   - Создаем роли пользователей...');
  await query(`
    INSERT INTO user_roles (name, description) VALUES
    ('admin', 'Системный администратор'),
    ('manager', 'Менеджер проектов'),
    ('user', 'Обычный пользователь'),
    ('viewer', 'Только просмотр')
    ON CONFLICT (name) DO NOTHING;
  `);
  
  // Сид 2: Единицы измерения
  console.log('   - Создаем единицы измерения...');
  await query(`
    INSERT INTO units (code, name, type) VALUES
    ('шт', 'Штуки', 'piece'),
    ('м', 'Метры', 'length'), 
    ('м2', 'Квадратные метры', 'area'),
    ('м3', 'Кубические метры', 'volume'),
    ('кг', 'Килограммы', 'weight'),
    ('л', 'Литры', 'volume'),
    ('м.пог', 'Метры погонные', 'length'),
    ('компл', 'Комплект', 'set'),
    ('упак', 'Упаковка', 'package')
    ON CONFLICT (code) DO NOTHING;
  `);
  
  // Сид 3: Типы работ
  console.log('   - Создаем типы работ...');
  await query(`
    INSERT INTO work_types (code, name, category) VALUES
    ('DEMO', 'Демонтажные работы', 'demolition'),
    ('MASON', 'Каменные работы', 'construction'),
    ('PLUMB', 'Сантехнические работы', 'plumbing'),
    ('ELECT', 'Электромонтажные работы', 'electrical'),
    ('PAINT', 'Малярные работы', 'finishing'),
    ('FLOOR', 'Напольные покрытия', 'finishing'),
    ('CEIL', 'Потолочные работы', 'finishing'),
    ('INSTAL', 'Монтажные работы', 'installation')
    ON CONFLICT (code) DO NOTHING;
  `);
  
  console.log('   ✅ Сиды созданы');
}

/**
 * Проверяет целостность данных
 */
async function validateDataIntegrity() {
  console.log('🔍 Проверка целостности данных...');
  
  const checks = [
    {
      name: 'Orphaned estimate_items',
      query: `
        SELECT COUNT(*) as count
        FROM estimate_items ei
        LEFT JOIN estimates e ON e.id = ei.estimate_id AND e.tenant_id = ei.tenant_id
        WHERE e.id IS NULL;
      `,
      expected: 0
    },
    {
      name: 'Orphaned estimates', 
      query: `
        SELECT COUNT(*) as count
        FROM estimates e
        LEFT JOIN projects p ON p.id = e.project_id AND p.tenant_id = e.tenant_id
        WHERE p.id IS NULL;
      `,
      expected: 0
    },
    {
      name: 'Invalid price ranges',
      query: `
        SELECT COUNT(*) as count
        FROM tenant_material_prices
        WHERE valid_to IS NOT NULL AND valid_to <= valid_from;
      `,
      expected: 0
    },
    {
      name: 'Users without tenants',
      query: `
        SELECT COUNT(*) as count
        FROM users u
        LEFT JOIN user_tenants ut ON ut.user_id = u.id
        WHERE ut.user_id IS NULL;
      `,
      expected: 0
    }
  ];
  
  let allValid = true;
  
  for (const check of checks) {
    try {
      const result = await query(check.query);
      const actual = parseInt(result.rows[0].count);
      
      if (actual === check.expected) {
        console.log(`   ✅ ${check.name}: ${actual} (OK)`);
      } else {
        console.log(`   ❌ ${check.name}: ${actual} (ожидалось ${check.expected})`);
        allValid = false;
      }
    } catch (error) {
      console.log(`   ⚠️ ${check.name}: ошибка проверки`);
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * Основная функция управления миграциями
 */
async function runMigrations(command = 'status', version = null) {
  try {
    await ensureMigrationsTable();
    
    switch (command) {
      case 'status':
        const status = await getMigrationStatus();
        console.log('\n📊 Статус миграций:');
        console.log(`   ✅ Применено: ${status.applied.length}`);
        console.log(`   ⏳ Ожидает: ${status.pending.length}`);
        console.log(`   📁 Всего файлов: ${status.total}`);
        
        if (status.applied.length > 0) {
          console.log('\n   📋 Примененные миграции:');
          status.applied.forEach(m => {
            console.log(`     ${m.version}: ${m.description} (${m.applied_at})`);
          });
        }
        
        if (status.pending.length > 0) {
          console.log('\n   ⏳ Ожидающие миграции:');
          status.pending.forEach(v => {
            console.log(`     ${v}`);
          });
        }
        break;
        
      case 'up':
        if (version) {
          await applyMigration(`${version}.sql`);
        } else {
          const status = await getMigrationStatus();
          for (const pendingVersion of status.pending) {
            await applyMigration(`${pendingVersion}.sql`);
          }
        }
        break;
        
      case 'down':
        if (!version) {
          throw new Error('Для отката необходимо указать версию');
        }
        await rollbackMigration(version);
        break;
        
      case 'seed':
        await createSeeds();
        break;
        
      case 'validate':
        const isValid = await validateDataIntegrity();
        if (isValid) {
          console.log('✅ Все проверки целостности прошли успешно');
        } else {
          console.log('❌ Обнаружены проблемы целостности данных');
          process.exit(1);
        }
        break;
        
      default:
        console.log('❌ Неизвестная команда');
        console.log('Доступные команды: status, up, down, seed, validate');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Ошибка выполнения миграций:', error.message);
    process.exit(1);
  }
}

// Экспорт функций
export {
  runMigrations,
  getMigrationStatus,
  validateDataIntegrity,
  createSeeds
};

// Запуск из командной строки
if (process.argv[1].includes('migrations.js')) {
  const command = process.argv[2] || 'status';
  const version = process.argv[3];
  
  console.log('🗂️ Система миграций SN4');
  console.log('=' .repeat(40));
  
  runMigrations(command, version)
    .then(() => {
      console.log('\n✅ Команда выполнена успешно');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Ошибка:', error.message);
      process.exit(1);
    });
}
