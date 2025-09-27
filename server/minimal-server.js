import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './database.js';
import { config } from './config.js';

dotenv.config();

const app = express();
const PORT = config.port;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware для логирования всех запросов
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend сервер работает',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/db', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as version');
    res.json({ 
      db: 'up', 
      current_time: result.rows[0].current_time,
      version: result.rows[0].version.split(' ').slice(0, 2).join(' ')
    });
  } catch (e) {
    res.status(503).json({ db: 'down', error: e.message });
  }
});

// Получение всех материалов
app.get('/api/materials', async (req, res) => {
  try {
    const result = await query('SELECT * FROM materials ORDER BY name LIMIT 10');
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Ошибка получения материалов:', error);
    res.status(500).json({ error: 'Ошибка получения материалов' });
  }
});

// Получение всех работ
app.get('/api/works', async (req, res) => {
  try {
    const result = await query('SELECT * FROM works_ref ORDER BY sort_order, id LIMIT 10');
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Ошибка получения работ:', error);
    res.status(500).json({ error: 'Ошибка получения работ' });
  }
});

// Тестовый маршрут
app.get('/api/test', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time');
    res.json({ 
      message: 'API работает!', 
      database_time: result.rows[0].current_time,
      status: 'connected'
    });
  } catch (error) {
    console.error('Ошибка тестового запроса:', error);
    res.status(500).json({ error: 'Ошибка подключения к базе данных' });
  }
});

// Запуск сервера
app.listen(PORT, async () => {
  console.log(`🚀 Минимальный сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 API доступно по адресу: http://localhost:${PORT}/api/test`);
  
  // Простая проверка подключения
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Подключение к базе данных проверено:', result.rows[0].current_time);
    console.log('🎉 Сервер готов к работе!');
  } catch (error) {
    console.log('⚠️  Работаем без базы данных');
    console.log('❌ Ошибка подключения:', error.message);
  }
});

export default app;