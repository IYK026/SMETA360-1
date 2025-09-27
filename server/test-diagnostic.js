/**
 * Тест диагностического сервера
 */
import http from 'http';

function makeHttpRequest(hostname, port, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
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
    
    req.end();
  });
}

async function testDiagnosticServer() {
  try {
    console.log('🧪 Тестируем диагностический сервер...');
    
    const result = await makeHttpRequest('localhost', 3002, '/health');
    
    console.log(`📡 GET /health -> ${result.status}`);
    console.log('📄 Ответ:', result.data);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Диагностический сервер работает!');
      
      // Теперь тестируем проблемный сервер на порту 3001
      console.log('\n🔍 Проверяем основной сервер на 3001...');
      
      try {
        const result2 = await makeHttpRequest('localhost', 3001, '/health');
        console.log(`📡 GET /health (3001) -> ${result2.status}`);
        console.log('📄 Ответ:', result2.data);
      } catch (error) {
        console.log('❌ Основной сервер (3001) недоступен:', error.message);
        
        console.log('\n💡 Проблема в основном сервере. Возможные причины:');
        console.log('  1. Проблема в middleware/tenantContext.js');
        console.log('  2. Проблема с подключением к БД');
        console.log('  3. Проблема с импортами или зависимостями');
      }
      
    } else {
      console.log('❌ Диагностический сервер не работает');
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

testDiagnosticServer();
