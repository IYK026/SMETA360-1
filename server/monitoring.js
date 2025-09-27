/**
 * Система мониторинга и алертов для продакшена
 * Шаг 10.7 - Мониторинг и алерты
 */
import { query } from './database.js';
import fs from 'fs/promises';

/**
 * Сборщик метрик производительности
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimeSum: 0,
      slowQueries: 0,
      activeConnections: 0,
      dbSize: 0,
      lastCheck: new Date()
    };
  }

  /**
   * Записывает метрику запроса
   */
  recordRequest(req, res, responseTime) {
    this.metrics.requests++;
    this.metrics.responseTimeSum += responseTime;
    
    if (res.statusCode >= 400) {
      this.metrics.errors++;
    }
    
    if (responseTime > 5000) { // > 5 секунд
      this.metrics.slowQueries++;
      console.log(`⚠️ Медленный запрос: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    // Логируем с контекстом пользователя
    const user = req.user;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      responseTime: responseTime,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: user?.id?.substring(0, 8) || 'anonymous',
      tenantId: user?.tenantId?.substring(0, 8) || 'none'
    };
    
    console.log(`📡 ${logEntry.method} ${logEntry.path} ${logEntry.status} ${logEntry.responseTime}ms [u:${logEntry.userId}, t:${logEntry.tenantId}]`);
  }

  /**
   * Собирает метрики базы данных
   */
  async collectDatabaseMetrics() {
    try {
      // Активные соединения
      const connectionsResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE state = 'active') as active,
          COUNT(*) FILTER (WHERE state = 'idle') as idle
        FROM pg_stat_activity 
        WHERE datname = current_database();
      `);
      
      const connections = connectionsResult.rows[0];
      this.metrics.activeConnections = parseInt(connections.active);

      // Размер базы данных
      const sizeResult = await query(`
        SELECT pg_database_size(current_database()) as size;
      `);
      this.metrics.dbSize = parseInt(sizeResult.rows[0].size);

      // Медленные запросы (активные > 5 сек)
      const slowResult = await query(`
        SELECT COUNT(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND state = 'active'
          AND (now() - query_start) > interval '5 seconds';
      `);
      this.metrics.slowQueries += parseInt(slowResult.rows[0].count);

      // Блокировки
      const locksResult = await query(`
        SELECT COUNT(*) as locks
        FROM pg_locks l
        JOIN pg_stat_activity a ON a.pid = l.pid
        WHERE a.datname = current_database() AND NOT l.granted;
      `);
      
      const locks = parseInt(locksResult.rows[0].locks);
      if (locks > 0) {
        console.log(`⚠️ Обнаружено блокировок: ${locks}`);
      }

      return {
        connections,
        dbSize: this.metrics.dbSize,
        locks
      };

    } catch (error) {
      console.error('❌ Ошибка сбора метрик БД:', error.message);
      return null;
    }
  }

  /**
   * Проверяет пороги для алертов
   */
  checkAlerts() {
    const alerts = [];
    const avgResponseTime = this.metrics.responseTimeSum / Math.max(this.metrics.requests, 1);
    const errorRate = this.metrics.errors / Math.max(this.metrics.requests, 1);

    // Проверка времени ответа
    if (avgResponseTime > 2000) {
      alerts.push({
        severity: 'warning',
        metric: 'response_time',
        value: avgResponseTime,
        threshold: 2000,
        message: `Высокое время ответа: ${avgResponseTime.toFixed(0)}ms`
      });
    }

    // Проверка ошибок
    if (errorRate > 0.05) { // > 5%
      alerts.push({
        severity: 'critical',
        metric: 'error_rate', 
        value: errorRate,
        threshold: 0.05,
        message: `Высокий уровень ошибок: ${(errorRate * 100).toFixed(1)}%`
      });
    }

    // Проверка соединений
    if (this.metrics.activeConnections > 50) {
      alerts.push({
        severity: 'warning',
        metric: 'active_connections',
        value: this.metrics.activeConnections,
        threshold: 50,
        message: `Много активных соединений: ${this.metrics.activeConnections}`
      });
    }

    // Проверка медленных запросов
    if (this.metrics.slowQueries > 10) {
      alerts.push({
        severity: 'warning',
        metric: 'slow_queries',
        value: this.metrics.slowQueries,
        threshold: 10,
        message: `Много медленных запросов: ${this.metrics.slowQueries}`
      });
    }

    return alerts;
  }

  /**
   * Получает текущие метрики
   */
  getMetrics() {
    const avgResponseTime = this.metrics.responseTimeSum / Math.max(this.metrics.requests, 1);
    const errorRate = this.metrics.errors / Math.max(this.metrics.requests, 1);
    
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 10000) / 100, // в процентах с 2 знаками
      slowQueries: this.metrics.slowQueries,
      activeConnections: this.metrics.activeConnections,
      dbSize: this.metrics.dbSize,
      lastCheck: this.metrics.lastCheck
    };
  }

  /**
   * Сбрасывает метрики (для периодических отчетов)
   */
  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimeSum: 0,
      slowQueries: 0,
      activeConnections: 0,
      dbSize: this.metrics.dbSize, // размер БД не сбрасываем
      lastCheck: new Date()
    };
  }
}

/**
 * Middleware для мониторинга запросов
 */
function createMonitoringMiddleware(monitor) {
  return (req, res, next) => {
    const startTime = Date.now();

    // Перехватываем завершение ответа
    const originalSend = res.send;
    res.send = function(...args) {
      const responseTime = Date.now() - startTime;
      monitor.recordRequest(req, res, responseTime);
      return originalSend.apply(this, args);
    };

    next();
  };
}

/**
 * Создает периодический отчет о здоровье системы
 */
async function createHealthReport() {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      system: {},
      database: {},
      alerts: []
    };

    // Системные метрики
    const memUsage = process.memoryUsage();
    report.system = {
      nodeVersion: process.version,
      uptime: Math.floor(process.uptime()),
      memoryUsage: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
      }
    };

    // Метрики базы данных
    const dbMetrics = await collectDatabaseHealth();
    report.database = dbMetrics;

    // Проверка доступности критических таблиц
    const tablesCheck = await checkCriticalTables();
    report.database.criticalTables = tablesCheck;

    return report;

  } catch (error) {
    console.error('❌ Ошибка создания отчета:', error.message);
    return {
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Проверяет здоровье базы данных
 */
async function collectDatabaseHealth() {
  try {
    // Статистика соединений
    const connectionsResult = await query(`
      SELECT 
        state,
        COUNT(*) as count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state;
    `);

    const connections = {};
    connectionsResult.rows.forEach(row => {
      connections[row.state || 'unknown'] = parseInt(row.count);
    });

    // Размер базы данных
    const sizeResult = await query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as size,
        pg_database_size(current_database()) as size_bytes
      FROM pg_database WHERE datname = current_database();
    `);

    // Статистика таблиц
    const tablesResult = await query(`
      SELECT 
        COUNT(*) as total_tables,
        SUM(n_live_tup) as total_rows
      FROM pg_stat_user_tables;
    `);

    // Статистика индексов
    const indexesResult = await query(`
      SELECT COUNT(*) as total_indexes
      FROM pg_stat_user_indexes;
    `);

    return {
      connections,
      size: sizeResult.rows[0]?.size || '0 bytes',
      sizeBytes: parseInt(sizeResult.rows[0]?.size_bytes || 0),
      totalTables: parseInt(tablesResult.rows[0]?.total_tables || 0),
      totalRows: parseInt(tablesResult.rows[0]?.total_rows || 0),
      totalIndexes: parseInt(indexesResult.rows[0]?.total_indexes || 0)
    };

  } catch (error) {
    console.error('❌ Ошибка сбора метрик БД:', error.message);
    return { error: error.message };
  }
}

/**
 * Проверяет доступность критических таблиц
 */
async function checkCriticalTables() {
  const criticalTables = [
    'users', 'tenants', 'user_tenants',
    'projects', 'estimates', 'estimate_items',
    'materials', 'works_ref',
    'tenant_material_prices', 'tenant_work_prices'
  ];

  const results = {};

  for (const table of criticalTables) {
    try {
      const result = await query(`SELECT COUNT(*) as count FROM ${table} LIMIT 1;`);
      results[table] = {
        status: 'OK',
        accessible: true
      };
    } catch (error) {
      results[table] = {
        status: 'ERROR',
        accessible: false,
        error: error.message
      };
    }
  }

  return results;
}

/**
 * Сохраняет отчет в файл
 */
async function saveHealthReport(report, filename = null) {
  if (!filename) {
    const date = new Date().toISOString().slice(0, 10);
    filename = `health-report-${date}.json`;
  }

  try {
    await fs.writeFile(`./logs/${filename}`, JSON.stringify(report, null, 2));
    console.log(`📄 Отчет сохранен: ./logs/${filename}`);
  } catch (error) {
    console.error('❌ Ошибка сохранения отчета:', error.message);
  }
}

// Экспорт
export {
  PerformanceMonitor,
  createMonitoringMiddleware,
  createHealthReport,
  collectDatabaseHealth,
  checkCriticalTables,
  saveHealthReport
};

// Если запускается напрямую - создаем отчет
if (process.argv[1].includes('monitoring.js')) {
  console.log('📊 Создание отчета о здоровье системы...');
  
  createHealthReport()
    .then(async (report) => {
      console.log('\n🩺 Отчет о здоровье системы:');
      console.log(JSON.stringify(report, null, 2));
      
      // Создаем папку для логов если не существует
      try {
        await fs.mkdir('./logs', { recursive: true });
      } catch (error) {
        // Игнорируем, если папка уже существует
      }
      
      await saveHealthReport(report);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Ошибка:', error.message);
      process.exit(1);
    });
}
