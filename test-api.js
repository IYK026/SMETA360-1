// Простой тест API endpoints
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3002';
  
  const endpoints = [
    '/api/health',
    '/api/health/db', 
    '/api/test',
    '/api/materials',
    '/api/works'
  ];
  
  console.log('🧪 Тестируем API endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 GET ${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Статус: ${response.status}`);
        console.log(`📋 Данные:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
      } else {
        console.log(`❌ Ошибка ${response.status}:`, data);
      }
    } catch (error) {
      console.log(`❌ Сетевая ошибка:`, error.message);
    }
    console.log('---');
  }
};

testEndpoints();