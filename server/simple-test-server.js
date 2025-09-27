import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Простая проверка
app.get('/health', (req, res) => {
  console.log('🔍 Health check запрос получен');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/test', (req, res) => {
  console.log('🔍 API test запрос получен');
  res.json({ 
    message: 'Test server работает!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Запуск сервера
const server = app.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Ошибка запуска сервера:', err);
    return;
  }
  console.log(`🚀 Простой тестовый сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Test: http://localhost:${PORT}/api/test`);
});

// Обработка ошибок
server.on('error', (err) => {
  console.error('❌ Ошибка сервера:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('✅ Сервер инициализирован, ожидание запуска...');
