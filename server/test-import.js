import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testImport() {
  console.log('🧪 Начало тестирования малого CSV...');
  
  try {
    const form = new FormData();
    const fileStream = fs.createReadStream('./test-small.csv');
    form.append('csvFile', fileStream, 'test-small.csv');

    console.log('📤 Отправка тестового файла на сервер...');
    const response = await fetch('http://localhost:3001/api/works/import', {
      method: 'POST',
      body: form
    });

    const result = await response.json();
    console.log('📥 Ответ сервера:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ ТЕСТ УСПЕШЕН!');
      console.log(`📊 Создана иерархия: 
        - Фазы: ${result.hierarchy.phases}
        - Стадии: ${result.hierarchy.stages} 
        - Подстадии: ${result.hierarchy.substages}
        - Работы: ${result.hierarchy.works}`);
    } else {
      console.log('❌ ТЕСТ НЕУДАЧЕН:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

testImport();