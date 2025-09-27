/**
 * Минимальный сервер для диагностики проблем
 */
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

// Базовые middleware
app.use(express.json());
app.use(cors());

// Простой health endpoint
app.get('/health', (req, res) => {
  console.log('📡 GET /health');
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Простой тест endpoint
app.get('/test', (req, res) => {
  console.log('📡 GET /test');
  res.json({
    success: true,
    message: 'Сервер работает!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Диагностический сервер запущен на http://localhost:${PORT}`);
  console.log('Доступные эндпоинты:');
  console.log(`  GET http://localhost:${PORT}/health`);
  console.log(`  GET http://localhost:${PORT}/test`);
});

export default app;
