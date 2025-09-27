import React, { useState } from 'react';

const TestAuth = () => {
  const [result, setResult] = useState('');

  const testRegister = async () => {
    try {
      console.log('Тестируем регистрацию...');

      const data = {
        firstname: 'Тест',
        lastname: 'Пользователь',
        email: 'test@example.com',
        company: 'Тестовая компания',
        password: 'password123'
      };

      console.log('Отправляем данные:', data);

      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      console.log('Получен ответ:', response.status, response.statusText);

      const json = await response.json();
      console.log('JSON ответ:', json);

      setResult(JSON.stringify(json, null, 2));
    } catch (error) {
      console.error('Ошибка:', error);
      setResult('Ошибка: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Тест API Авторизации</h1>
      <button onClick={testRegister}>Тест Регистрации</button>

      <pre
        style={{
          background: '#f5f5f5',
          padding: '10px',
          marginTop: '20px',
          border: '1px solid #ccc'
        }}
      >
        {result || 'Результат появится здесь...'}
      </pre>
    </div>
  );
};

export default TestAuth;
