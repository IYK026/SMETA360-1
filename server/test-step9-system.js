/**
 * Тестирование полной системы JWT + Middleware
 * Шаг 9.5 — Мини-тест системы аутентификации и каталога API
 */

const API_BASE = 'http://localhost:3001';

// Глобальные переменные для тестов
let accessToken = null;
let refreshToken = null;
let testUser = null;

/**
 * Выполнение HTTP запроса
 */
async function makeRequest(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    // Используем встроенный fetch в Node.js 18+
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`📡 ${method} ${endpoint} -> ${response.status}`);
    if (!response.ok) {
      console.log('❌ Error:', result.error);
    }
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    return { status: 0, data: { error: error.message } };
  }
}

/**
 * Тест 1: Health Check
 */
async function testHealthCheck() {
  console.log('\n🩺 Тест 1: Health Check');
  const result = await makeRequest('GET', '/health');
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Health check прошел успешно');
    return true;
  } else {
    console.log('❌ Health check неуспешен');
    return false;
  }
}

/**
 * Тест 2: Логин пользователя
 */
async function testLogin() {
  console.log('\n🔐 Тест 2: Логин пользователя');
  
  const result = await makeRequest('POST', '/auth/login', {
    email: 'admin@example.com',
    password: 'admin123'
  });
  
  if (result.status === 200 && result.data.success) {
    accessToken = result.data.accessToken;
    refreshToken = result.data.refreshToken;
    testUser = result.data.user;
    
    console.log('✅ Логин успешный');
    console.log(`   👤 Пользователь: ${testUser.email}`);
    console.log(`   🏢 Тенант: ${testUser.tenantName} (${testUser.tenantId.substring(0,8)})`);
    console.log(`   🎭 Роль: ${testUser.role}`);
    console.log(`   🔑 Access токен получен: ${accessToken.substring(0,20)}...`);
    return true;
  } else {
    console.log('❌ Ошибка логина:', result.data.error);
    return false;
  }
}

/**
 * Тест 3: Получение информации о пользователе
 */
async function testGetUserInfo() {
  console.log('\n👤 Тест 3: Информация о пользователе');
  
  const result = await makeRequest('GET', '/auth/me', null, accessToken);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Информация получена успешно');
    console.log(`   📧 Email: ${result.data.user.email}`);
    console.log(`   🏢 Тенант: ${result.data.user.tenantName}`);
    console.log(`   📅 Последний вход: ${result.data.user.lastLogin}`);
    return true;
  } else {
    console.log('❌ Ошибка получения информации:', result.data.error);
    return false;
  }
}

/**
 * Тест 4: Получение списка материалов (проверка RLS)
 */
async function testGetMaterials() {
  console.log('\n📚 Тест 4: Получение материалов с RLS');
  
  const result = await makeRequest('GET', '/catalog/materials?limit=5', null, accessToken);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Материалы получены успешно');
    console.log(`   📊 Всего материалов: ${result.data.pagination.total}`);
    console.log(`   📋 В ответе: ${result.data.data.length}`);
    
    result.data.data.forEach((material, index) => {
      const type = material.isTenantOverride ? '🏢 своя' : '🌍 глобальная';
      console.log(`   ${index + 1}. ${material.name.substring(0,50)}... = ${material.unitPrice}₽ [${type}]`);
    });
    
    return true;
  } else {
    console.log('❌ Ошибка получения материалов:', result.data.error);
    return false;
  }
}

/**
 * Тест 5: Получение списка работ
 */
async function testGetWorks() {
  console.log('\n🔨 Тест 5: Получение работ с RLS');
  
  const result = await makeRequest('GET', '/catalog/works?limit=5', null, accessToken);
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Работы получены успешно');
    console.log(`   📊 Всего работ: ${result.data.pagination.total}`);
    console.log(`   📋 В ответе: ${result.data.data.length}`);
    
    result.data.data.forEach((work, index) => {
      const type = work.isTenantOverride ? '🏢 своя' : '🌍 глобальная';
      console.log(`   ${index + 1}. ${work.name.substring(0,50)}... = ${work.unitPrice}₽ [${type}]`);
    });
    
    return true;
  } else {
    console.log('❌ Ошибка получения работ:', result.data.error);
    return false;
  }
}

/**
 * Тест 6: Refresh токен
 */
async function testRefreshToken() {
  console.log('\n🔄 Тест 6: Обновление токена');
  
  const result = await makeRequest('POST', '/auth/refresh', {
    refreshToken: refreshToken
  });
  
  if (result.status === 200 && result.data.success) {
    // Обновляем токены
    accessToken = result.data.accessToken;
    refreshToken = result.data.refreshToken;
    
    console.log('✅ Токен обновлен успешно');
    console.log(`   🔑 Новый access токен: ${accessToken.substring(0,20)}...`);
    return true;
  } else {
    console.log('❌ Ошибка обновления токена:', result.data.error);
    return false;
  }
}

/**
 * Тест 7: Тест без токена (должен вернуть 401)
 */
async function testUnauthorized() {
  console.log('\n🚫 Тест 7: Запрос без токена');
  
  const result = await makeRequest('GET', '/catalog/materials');
  
  if (result.status === 401) {
    console.log('✅ Правильно заблокирован неавторизованный запрос');
    return true;
  } else {
    console.log('❌ Неавторизованный запрос не был заблокирован');
    return false;
  }
}

/**
 * Тест 8: Логаут
 */
async function testLogout() {
  console.log('\n👋 Тест 8: Логаут');
  
  const result = await makeRequest('POST', '/auth/logout', {
    refreshToken: refreshToken
  });
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Логаут успешный');
    return true;
  } else {
    console.log('❌ Ошибка логаута:', result.data.error);
    return false;
  }
}

/**
 * Запуск всех тестов
 */
async function runAllTests() {
  console.log('🧪 Запуск тестирования полной системы JWT + Middleware + RLS');
  console.log('=' .repeat(70));
  
  const tests = [
    testHealthCheck,
    testLogin,
    testGetUserInfo,
    testGetMaterials,
    testGetWorks,
    testRefreshToken,
    testUnauthorized,
    testLogout
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
      
      // Задержка между тестами
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log('❌ Тест упал с ошибкой:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:`);
  console.log(`   ✅ Пройдено: ${passed}/${total}`);
  console.log(`   ❌ Провалено: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!');
    console.log('\n✨ Шаг 9 завершен: JWT + Middleware система работает полностью!');
  } else {
    console.log('\n⚠️  Не все тесты прошли успешно');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Проверяем, что сервер запущен, и запускаем тесты
console.log('🔍 Проверка доступности сервера...');
makeRequest('GET', '/health')
  .then(result => {
    if (result.status === 200) {
      console.log('✅ Сервер доступен, запускаем тесты...\n');
      runAllTests();
    } else {
      console.log('❌ Сервер недоступен. Запустите protected-server.js');
      console.log('💡 Команда: node protected-server.js');
      process.exit(1);
    }
  })
  .catch(error => {
    console.log('❌ Не удается подключиться к серверу:', error.message);
    console.log('💡 Убедитесь, что сервер запущен: node protected-server.js');
    process.exit(1);
  });
