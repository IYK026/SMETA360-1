/**
 * Главный сервер приложения с JWT middleware и защищенными API
 * Шаг 9 — Полная система аутентификации и авторизации
 */
import express from 'express';
import cors from 'cors';
import { tenantContextMiddleware, requireRole } from './middleware/tenantContext.js';

// Контроллеры
import authController from './controllers/authController.js';
import catalogController from './controllers/catalogController.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware для парсинга JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS настройки
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware для логирования запросов
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Применяем JWT middleware для автоматической установки контекста
app.use(tenantContextMiddleware);

// =================================
// ПУБЛИЧНЫЕ МАРШРУТЫ (без аутентификации)
// =================================

// Health check
app.get('/health', catalogController.health);

// Аутентификация
app.post('/auth/login', authController.login);
app.post('/auth/refresh', authController.refreshToken);
app.post('/auth/logout', authController.logout);

// =================================
// ЗАЩИЩЕННЫЕ МАРШРУТЫ (требуют JWT токен)
// =================================

// Информация о пользователе и тенантах
app.get('/auth/me', authController.getCurrentUserInfo);
app.get('/auth/tenants', authController.getUserTenants);
app.post('/auth/switch-tenant', authController.switchTenant);

// Каталог материалов
app.get('/catalog/materials', catalogController.getMaterials);
app.post('/catalog/materials/override', requireRole(['admin', 'manager']), catalogController.overrideMaterial);
app.delete('/catalog/materials/override/:id', requireRole(['admin', 'manager']), catalogController.resetMaterialOverride);
app.get('/catalog/materials/:id/price', catalogController.getMaterialPrice);

// Каталог работ
app.get('/catalog/works', catalogController.getWorks);
app.get('/catalog/works/:id/materials', catalogController.getWorkMaterials);

// =================================
// ОБРАБОТКА ОШИБОК
// =================================

// 404 для несуществующих маршрутов
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
});

// Глобальный обработчик ошибок
app.use((error, req, res, next) => {
  console.error('❌ Глобальная ошибка:', error);
  
  // Ошибки JWT
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Недействительный токен авторизации',
      code: 'INVALID_TOKEN'
    });
  }

  // Ошибки базы данных
  if (error.code && error.code.startsWith('23')) { // PostgreSQL constraint errors
    return res.status(400).json({
      error: 'Нарушение ограничений базы данных',
      code: 'DATABASE_CONSTRAINT_ERROR'
    });
  }

  // Остальные ошибки
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    code: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// =================================
// ЗАПУСК СЕРВЕРА
// =================================

app.listen(PORT, () => {
  console.log('\n🚀 Сервер SN4 запущен!');
  console.log(`   📍 URL: http://localhost:${PORT}`);
  console.log(`   🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   🔐 JWT Secret: ${process.env.JWT_SECRET ? 'установлен' : 'используется default'}`);
  console.log('\n🔗 Доступные эндпоинты:');
  console.log('   POST /auth/login - Вход в систему');
  console.log('   POST /auth/refresh - Обновление токена');
  console.log('   GET  /auth/me - Информация о пользователе');
  console.log('   GET  /auth/tenants - Список тенантов');
  console.log('   POST /auth/switch-tenant - Смена тенанта');
  console.log('   GET  /catalog/materials - Список материалов');
  console.log('   POST /catalog/materials/override - Переопределение материала');
  console.log('   GET  /catalog/works - Список работ');
  console.log('   GET  /catalog/works/:id/materials - Состав работы');
  console.log('   GET  /health - Проверка состояния');
  console.log('\n💡 Для доступа к защищенным эндпоинтам добавьте заголовок:');
  console.log('   Authorization: Bearer <access_token>');
});

export default app;
