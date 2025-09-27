/**
 * Простой HTTP тест для проверки сервера
 */
import http from 'http';

function makeHttpRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testHealthEndpoint() {
  try {
    console.log('🩺 Тестируем health endpoint...');
    
    const result = await makeHttpRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 GET /health -> ${result.status}`);
    console.log('📄 Ответ:', result.data);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Health check прошел успешно!');
      return true;
    } else {
      console.log('❌ Health check неуспешен');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
    return false;
  }
}

async function testLoginEndpoint() {
  try {
    console.log('\n🔐 Тестируем login endpoint...');
    
    const loginData = JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const result = await makeHttpRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      },
      body: loginData
    });
    
    console.log(`📡 POST /auth/login -> ${result.status}`);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Логин успешный!');
      console.log(`👤 Пользователь: ${result.data.user.email}`);
      console.log(`🏢 Тенант: ${result.data.user.tenantName}`);
      console.log(`🔑 Access токен: ${result.data.accessToken.substring(0,20)}...`);
      return result.data.accessToken;
    } else {
      console.log('❌ Ошибка логина:', result.data);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Ошибка логина:', error.message);
    return null;
  }
}

async function testProtectedEndpoint(accessToken) {
  try {
    console.log('\n📚 Тестируем защищенный endpoint /catalog/materials...');
    
    const result = await makeHttpRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/catalog/materials?limit=3',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log(`📡 GET /catalog/materials -> ${result.status}`);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Получение материалов успешно!');
      console.log(`📊 Всего материалов: ${result.data.pagination.total}`);
      console.log(`📋 Показано: ${result.data.data.length}`);
      
      result.data.data.forEach((material, index) => {
        const type = material.isTenantOverride ? '🏢' : '🌍';
        console.log(`   ${index + 1}. ${material.name.substring(0,40)}... = ${material.unitPrice}₽ ${type}`);
      });
      
      return true;
    } else {
      console.log('❌ Ошибка получения материалов:', result.data);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Ошибка запроса:', error.message);
    return false;
  }
}

async function runSimpleTests() {
  console.log('🧪 Простое тестирование JWT + Middleware системы');
  console.log('=' .repeat(50));
  
  // Тест 1: Health Check
  const healthOk = await testHealthEndpoint();
  if (!healthOk) {
    console.log('❌ Сервер недоступен, тесты прерваны');
    process.exit(1);
  }
  
  // Тест 2: Login
  const accessToken = await testLoginEndpoint();
  if (!accessToken) {
    console.log('❌ Не удалось получить токен, тесты прерваны');
    process.exit(1);
  }
  
  // Тест 3: Защищенный endpoint
  const protectedOk = await testProtectedEndpoint(accessToken);
  
  console.log('\n' + '='.repeat(50));
  
  if (healthOk && accessToken && protectedOk) {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!');
    console.log('✨ Шаг 9 завершен: JWT + Middleware работает!');
    process.exit(0);
  } else {
    console.log('⚠️  Не все тесты прошли успешно');
    process.exit(1);
  }
}

runSimpleTests();
