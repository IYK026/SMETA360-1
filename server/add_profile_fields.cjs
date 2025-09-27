const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('✅ Выполнен запрос:', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      duration: duration + 'ms',
      rows: res.rowCount
    });
    return res;
  } catch (error) {
    console.error('❌ Ошибка выполнения запроса:', error);
    throw error;
  }
}

async function addProfileFields() {
  try {
    console.log('🚀 Добавляем недостающие поля в таблицу auth_users...');
    
    // Добавляем поле для телефона
    try {
      await query(`
        ALTER TABLE auth_users 
        ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      `);
      console.log('✅ Поле phone добавлено');
    } catch (error) {
      console.log('📝 Поле phone уже существует');
    }

    // Добавляем поле для должности
    try {
      await query(`
        ALTER TABLE auth_users 
        ADD COLUMN IF NOT EXISTS position VARCHAR(255);
      `);
      console.log('✅ Поле position добавлено');
    } catch (error) {
      console.log('📝 Поле position уже существует');
    }

    // Добавляем поле для местоположения
    try {
      await query(`
        ALTER TABLE auth_users 
        ADD COLUMN IF NOT EXISTS location VARCHAR(255);
      `);
      console.log('✅ Поле location добавлено');
    } catch (error) {
      console.log('📝 Поле location уже существует');
    }

    // Добавляем поле для биографии
    try {
      await query(`
        ALTER TABLE auth_users 
        ADD COLUMN IF NOT EXISTS bio TEXT;
      `);
      console.log('✅ Поле bio добавлено');
    } catch (error) {
      console.log('📝 Поле bio уже существует');
    }

    // Добавляем поле для аватара
    try {
      await query(`
        ALTER TABLE auth_users 
        ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
      `);
      console.log('✅ Поле avatar_url добавлено');
    } catch (error) {
      console.log('📝 Поле avatar_url уже существует');
    }

    // Добавляем поле для навыков (JSON)
    try {
      await query(`
        ALTER TABLE auth_users 
        ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
      `);
      console.log('✅ Поле skills добавлено');
    } catch (error) {
      console.log('📝 Поле skills уже существует');
    }

    // Проверяем финальную структуру таблицы
    const structureResult = await query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'auth_users' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Обновленная структура таблицы auth_users:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''} ${row.is_nullable === 'NO' ? '[Required]' : '[Optional]'}`);
    });

    // Добавим тестовые данные для существующего пользователя
    const updateTestUser = await query(`
      UPDATE auth_users 
      SET 
        phone = '+1 234 567 8900',
        position = 'Senior UI/UX Designer',
        location = 'New York, USA',
        bio = 'Passionate designer with 5+ years of experience creating user-centered digital experiences.',
        skills = '["UI/UX Design", "React", "Figma", "Adobe XD", "JavaScript", "TypeScript"]'
      WHERE email = 'test@example.com'
      RETURNING id, firstname, lastname, email;
    `);

    if (updateTestUser.rows.length > 0) {
      console.log('\n✅ Обновлен тестовый пользователь:', updateTestUser.rows[0]);
    } else {
      console.log('\n📝 Тестовый пользователь не найден');
    }

    console.log('\n🎉 Все поля успешно добавлены в базу данных!');

  } catch (error) {
    console.error('❌ Ошибка при добавлении полей:', error);
  } finally {
    await pool.end();
  }
}

// Запускаем функцию
addProfileFields();
