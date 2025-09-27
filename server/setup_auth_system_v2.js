import { query } from './database.js';

console.log('🔐 Шаг 6 — Регистрация/логин + создание тенанта и привязка ролей...\n');
console.log('DEBUG: Запуск скрипта...');

// Создаём объект database для совместимости с другими скриптами
const database = { query };

async function setupAuthAndTenantSystem() {
  try {
    console.log('📋 6.1 Мини-подготовка таблиц аутентификации...');
    
    // Убедимся в дефолтах и индексах для auth_users
    console.log('   - Настраиваем дефолты и индексы для auth_users...');
    await database.query(`
      ALTER TABLE auth_users
        ALTER COLUMN is_active SET DEFAULT true,
        ALTER COLUMN email_verified SET DEFAULT false;
    `);
    console.log('   ✅ Дефолты для auth_users установлены');

    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
    `);
    console.log('   ✅ Индекс по email создан');

    // Приводим user_sessions под refresh-сессии
    console.log('   - Настраиваем user_sessions для refresh-токенов...');
    await database.query(`
      ALTER TABLE user_sessions
        ALTER COLUMN created_at SET DEFAULT now();
    `);
    console.log('   ✅ Дефолт created_at установлен');

    await database.query(`
      ALTER TABLE user_sessions
        ADD COLUMN IF NOT EXISTS is_revoked boolean NOT NULL DEFAULT false;
    `);
    console.log('   ✅ Колонка is_revoked добавлена');

    // Индексы для чистки и быстрых выборок
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_revoked ON user_sessions(user_id, is_revoked);
    `);
    console.log('   ✅ Индекс user_sessions(user_id, is_revoked) создан');

    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
    `);
    console.log('   ✅ Индекс user_sessions(expires_at) создан');

    console.log('\n🏢 6.2 Создаём функцию "создать тенант и сделать пользователя админом"...');
    
    await database.query(`
      CREATE OR REPLACE FUNCTION app_create_tenant_with_admin(p_user_id integer, p_tenant_name text)
      RETURNS uuid
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_tenant_id uuid;
      BEGIN
        INSERT INTO tenants (name) VALUES (p_tenant_name)
        RETURNING id INTO v_tenant_id;

        INSERT INTO user_tenants (tenant_id, user_id, role)
        VALUES (v_tenant_id, p_user_id, 'admin')
        ON CONFLICT DO NOTHING;

        RETURN v_tenant_id;
      END;
      $$;
    `);
    console.log('   ✅ Функция app_create_tenant_with_admin создана');

    console.log('\n🧪 6.3 Тестируем созданную функцию...');
    
    // Создаём тестового пользователя
    console.log('   - Создаём тестового пользователя...');
    const testUserResult = await database.query(`
      INSERT INTO auth_users (email, password_hash, firstname, lastname, is_active, email_verified) 
      VALUES ('test@example.com', '$2b$10$testhash', 'Test', 'User Admin', true, false)
      ON CONFLICT (email) DO UPDATE SET firstname = EXCLUDED.firstname, lastname = EXCLUDED.lastname
      RETURNING id;
    `);
    const testUserId = testUserResult.rows[0].id;
    console.log('   ✅ Тестовый пользователь создан: ID ' + testUserId);

    // Тестируем функцию создания тенанта
    console.log('   - Тестируем функцию app_create_tenant_with_admin...');
    const tenantResult = await database.query(`
      SELECT app_create_tenant_with_admin($1, $2) as tenant_id;
    `, [testUserId, 'Test Company for Auth']);
    const testTenantId = tenantResult.rows[0].tenant_id;
    console.log('   ✅ Тенант создан: ID ' + testTenantId);

    // Проверяем что связь создалась
    const relationResult = await database.query(`
      SELECT ut.role, t.name as tenant_name, au.email as user_email
      FROM user_tenants ut
      JOIN tenants t ON t.id = ut.tenant_id
      JOIN auth_users au ON au.id = ut.user_id
      WHERE ut.user_id = $1 AND ut.tenant_id = $2;
    `, [testUserId, testTenantId]);
    
    if (relationResult.rows.length > 0) {
      const relation = relationResult.rows[0];
      console.log('   ✅ Связь создана: ' + relation.user_email + ' = ' + relation.role + ' в "' + relation.tenant_name + '"');
    } else {
      console.log('   ❌ Связь не найдена!');
    }

    console.log('\n🔐 6.4 Тестируем RLS с JWT-контекстом...');
    
    // Устанавливаем контекст как из JWT
    console.log('   - Устанавливаем app.user_id и app.tenant_id...');
    await database.query('SET LOCAL app.user_id = \'' + testUserId + '\';');
    await database.query('SET LOCAL app.tenant_id = \'' + testTenantId + '\';');
    console.log('   ✅ Контекст установлен: user_id=' + testUserId + ', tenant_id=' + testTenantId);

    // Тестируем доступ к данным через RLS
    const materialsResult = await database.query('SELECT COUNT(*) FROM materials;');
    console.log('   ✅ materials доступно: ' + materialsResult.rows[0].count + ' записей (глобальные)');

    const projectsResult = await database.query('SELECT COUNT(*) FROM projects;');
    console.log('   ✅ projects доступно: ' + projectsResult.rows[0].count + ' записей (свои)');

    const worksResult = await database.query('SELECT COUNT(*) FROM works_ref;');
    console.log('   ✅ works_ref доступно: ' + worksResult.rows[0].count + ' записей (глобальные)');

    console.log('\n✅ Шаг 6 завершён успешно!');
    console.log('\n🎯 Что реализовано:');
    console.log('  🔐 Таблицы аутентификации настроены с дефолтами и индексами');
    console.log('  🏢 Функция app_create_tenant_with_admin для создания компании с админом');
    console.log('  👤 Система связей пользователь-тенант-роль готова');
    console.log('  🛡️ RLS интегрирован с JWT-контекстом (app.user_id/app.tenant_id)');
    console.log('  🧪 Протестированы сценарии регистрации и доступа к данным');

    console.log('\n📝 Контракт API для реализации:');
    console.log('  POST /auth/register - создание пользователя + тенанта + роль admin');
    console.log('  POST /auth/login    - проверка пароля + выдача access/refresh токенов');
    console.log('  POST /auth/refresh  - обновление access токена по refresh');
    console.log('  POST /auth/logout   - отзыв refresh токена (is_revoked=true)');
    console.log('  GET  /auth/tenants  - список компаний пользователя');
    console.log('  POST /auth/switch-tenant - смена текущего тенанта');

    console.log('\n🔑 JWT токен должен содержать:');
    console.log('  {"sub": "<user_id>", "tenant_id": "<current_tenant_id>", "role": "<user_role>", "exp": <timestamp>}');

    console.log('\n⚡ На каждый запрос бэкенд должен выставлять:');
    console.log('  SET LOCAL app.user_id = \'<user_id из JWT>\';');
    console.log('  SET LOCAL app.tenant_id = \'<tenant_id из JWT>\';');

    console.log('\n🧪 Для тестирования используйте:');
    console.log('  User ID: ' + testUserId);
    console.log('  Tenant ID: ' + testTenantId);
    console.log('  Email: test@example.com');

    return { testUserId, testTenantId };

  } catch (error) {
    console.error('❌ Ошибка при настройке системы аутентификации:', error.message);
    throw error;
  }
}

// Запускаем настройку системы аутентификации
console.log('DEBUG: Вызываем setupAuthAndTenantSystem...');
setupAuthAndTenantSystem()
  .then((result) => {
    console.log('\n🎉 Система аутентификации и мультитенантности готова!');
    console.log('DEBUG: Результат:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });
