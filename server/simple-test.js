import express from 'express';

const app = express();
const PORT = 3004;

app.get('/api/health', (req, res) => {
  console.log('📨 GET /api/health запрос получен');
  res.json({
    status: 'OK',
    message: 'Простой тестовый сервер работает',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Простой сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 Попробуйте: http://localhost:${PORT}/api/health`);
});

export default app;