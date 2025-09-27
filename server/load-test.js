/**
 * Система нагрузочного тестирования
 * Шаг 10.10 - Нагрузочное и функциональное тестирование
 */
import http from 'http';
import https from 'https';

/**
 * Конфигурация нагрузочных тестов
 */
const LOAD_TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  
  // Сценарии тестирования
  scenarios: {
    light: {
      users: 10,
      duration: 60, // секунд
      rampUp: 10 // секунд для достижения пикового числа пользователей
    },
    medium: {
      users: 50,
      duration: 300,
      rampUp: 30
    },
    heavy: {
      users: 200,
      duration: 600,
      rampUp: 60
    }
  },

  // Эндпоинты для тестирования с весами
  endpoints: [
    { path: '/health', method: 'GET', weight: 5 },
    { path: '/auth/login', method: 'POST', weight: 10, body: { email: 'admin@example.com', password: 'admin123' } },
    { path: '/catalog/materials?limit=20', method: 'GET', weight: 30, requiresAuth: true },
    { path: '/catalog/works?limit=20', method: 'GET', weight: 25, requiresAuth: true },
    { path: '/catalog/materials/m.1/price?date=2025-01-15', method: 'GET', weight: 15, requiresAuth: true },
    { path: '/auth/me', method: 'GET', weight: 10, requiresAuth: true },
    { path: '/auth/tenants', method: 'GET', weight: 5, requiresAuth: true }
  ]
};

/**
 * Виртуальный пользователь для нагрузочного тестирования
 */
class VirtualUser {
  constructor(id, config) {
    this.id = id;
    this.config = config;
    this.accessToken = null;
    this.stats = {
      requests: 0,
      successes: 0,
      errors: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0
    };
  }

  /**
   * Выполняет HTTP запрос
   */
  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const url = new URL(endpoint.path, this.config.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `LoadTester/1.0 User-${this.id}`
        }
      };

      // Добавляем авторизацию если требуется
      if (endpoint.requiresAuth && this.accessToken) {
        options.headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          
          try {
            const result = JSON.parse(data);
            resolve({
              status: res.statusCode,
              data: result,
              responseTime,
              success: res.statusCode < 400
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: data,
              responseTime,
              success: res.statusCode < 400
            });
          }
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        reject({
          error: error.message,
          responseTime,
          success: false
        });
      });

      // Отправляем тело запроса если есть
      if (endpoint.body) {
        req.write(JSON.stringify(endpoint.body));
      }
      
      req.end();
    });
  }

  /**
   * Авторизация пользователя
   */
  async login() {
    try {
      const loginEndpoint = this.config.endpoints.find(e => e.path === '/auth/login');
      if (!loginEndpoint) return false;

      const result = await this.makeRequest(loginEndpoint);
      
      if (result.success && result.data.accessToken) {
        this.accessToken = result.data.accessToken;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`User ${this.id}: Ошибка авторизации:`, error.message);
      return false;
    }
  }

  /**
   * Выбирает случайный эндпоинт на основе весов
   */
  selectRandomEndpoint() {
    const totalWeight = this.config.endpoints.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of this.config.endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return this.config.endpoints[0];
  }

  /**
   * Запускает сессию виртуального пользователя
   */
  async runSession(duration) {
    console.log(`🏃 User ${this.id}: Начало сессии (${duration}s)`);
    
    // Авторизация
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log(`❌ User ${this.id}: Не удалось авторизоваться`);
      return this.stats;
    }

    const endTime = Date.now() + duration * 1000;
    
    while (Date.now() < endTime) {
      try {
        // Выбираем случайный эндпоинт
        const endpoint = this.selectRandomEndpoint();
        
        // Пропускаем логин после авторизации
        if (endpoint.path === '/auth/login') {
          await this.sleep(Math.random() * 2000); // 0-2 сек
          continue;
        }

        const result = await this.makeRequest(endpoint);
        
        // Обновляем статистику
        this.stats.requests++;
        this.stats.totalResponseTime += result.responseTime;
        this.stats.minResponseTime = Math.min(this.stats.minResponseTime, result.responseTime);
        this.stats.maxResponseTime = Math.max(this.stats.maxResponseTime, result.responseTime);
        
        if (result.success) {
          this.stats.successes++;
        } else {
          this.stats.errors++;
        }

        // Пауза между запросами (имитация пользователя)
        await this.sleep(Math.random() * 3000 + 1000); // 1-4 сек
        
      } catch (error) {
        this.stats.requests++;
        this.stats.errors++;
      }
    }
    
    console.log(`✅ User ${this.id}: Сессия завершена`);
    return this.stats;
  }

  /**
   * Пауза
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Координатор нагрузочных тестов
 */
class LoadTestCoordinator {
  constructor(config = LOAD_TEST_CONFIG) {
    this.config = config;
    this.users = [];
    this.results = {
      startTime: null,
      endTime: null,
      totalRequests: 0,
      totalSuccesses: 0,
      totalErrors: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      successRate: 0,
      requestsPerSecond: 0,
      userStats: []
    };
  }

  /**
   * Запускает нагрузочный тест
   */
  async runTest(scenarioName = 'light') {
    const scenario = this.config.scenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Неизвестный сценарий: ${scenarioName}`);
    }

    console.log(`🚀 Запуск нагрузочного теста: ${scenarioName}`);
    console.log(`   👥 Пользователей: ${scenario.users}`);
    console.log(`   ⏱️ Длительность: ${scenario.duration}s`);
    console.log(`   📈 Время выхода на пик: ${scenario.rampUp}s`);
    console.log(`   🎯 Эндпоинтов: ${this.config.endpoints.length}`);

    this.results.startTime = new Date();

    // Создаем виртуальных пользователей
    this.users = [];
    for (let i = 1; i <= scenario.users; i++) {
      this.users.push(new VirtualUser(i, this.config));
    }

    // Запускаем пользователей с задержкой (ramp-up)
    const rampUpDelay = scenario.rampUp * 1000 / scenario.users;
    const userPromises = [];

    for (let i = 0; i < this.users.length; i++) {
      const user = this.users[i];
      
      // Задержка для плавного запуска
      const delay = i * rampUpDelay;
      
      const userPromise = this.sleep(delay).then(() => 
        user.runSession(scenario.duration)
      );
      
      userPromises.push(userPromise);
    }

    // Ждем завершения всех пользователей
    console.log('⏳ Выполнение теста...');
    const userStats = await Promise.all(userPromises);

    this.results.endTime = new Date();
    
    // Агрегируем результаты
    this.aggregateResults(userStats);
    
    return this.results;
  }

  /**
   * Агрегирует результаты от всех пользователей
   */
  aggregateResults(userStats) {
    let totalResponseTime = 0;

    for (const stats of userStats) {
      this.results.totalRequests += stats.requests;
      this.results.totalSuccesses += stats.successes;
      this.results.totalErrors += stats.errors;
      totalResponseTime += stats.totalResponseTime;
      
      if (stats.minResponseTime !== Infinity) {
        this.results.minResponseTime = Math.min(this.results.minResponseTime, stats.minResponseTime);
      }
      this.results.maxResponseTime = Math.max(this.results.maxResponseTime, stats.maxResponseTime);
    }

    const duration = (this.results.endTime - this.results.startTime) / 1000;
    
    this.results.avgResponseTime = Math.round(totalResponseTime / Math.max(this.results.totalRequests, 1));
    this.results.successRate = Math.round((this.results.totalSuccesses / Math.max(this.results.totalRequests, 1)) * 100);
    this.results.requestsPerSecond = Math.round(this.results.totalRequests / duration);
    this.results.userStats = userStats;
    
    if (this.results.minResponseTime === Infinity) {
      this.results.minResponseTime = 0;
    }
  }

  /**
   * Выводит отчет о результатах
   */
  printReport() {
    console.log('\n📊 ОТЧЕТ О НАГРУЗОЧНОМ ТЕСТИРОВАНИИ');
    console.log('=' .repeat(50));
    console.log(`⏱️  Время выполнения: ${Math.round((this.results.endTime - this.results.startTime) / 1000)}s`);
    console.log(`📤 Всего запросов: ${this.results.totalRequests}`);
    console.log(`✅ Успешных: ${this.results.totalSuccesses}`);
    console.log(`❌ Ошибок: ${this.results.totalErrors}`);
    console.log(`📈 Процент успеха: ${this.results.successRate}%`);
    console.log(`⚡ Запросов/сек: ${this.results.requestsPerSecond}`);
    console.log(`⏱️  Среднее время ответа: ${this.results.avgResponseTime}ms`);
    console.log(`🏎️  Минимальное время: ${this.results.minResponseTime}ms`);
    console.log(`🐌 Максимальное время: ${this.results.maxResponseTime}ms`);

    // Оценка производительности
    console.log('\n🎯 ОЦЕНКА ПРОИЗВОДИТЕЛЬНОСТИ:');
    
    if (this.results.successRate >= 99) {
      console.log('🟢 Отличная надежность (>= 99%)');
    } else if (this.results.successRate >= 95) {
      console.log('🟡 Хорошая надежность (>= 95%)');
    } else {
      console.log('🔴 Низкая надежность (< 95%)');
    }

    if (this.results.avgResponseTime <= 500) {
      console.log('🟢 Отличная скорость ответа (<= 500ms)');
    } else if (this.results.avgResponseTime <= 2000) {
      console.log('🟡 Приемлемая скорость ответа (<= 2s)');
    } else {
      console.log('🔴 Медленная скорость ответа (> 2s)');
    }

    if (this.results.requestsPerSecond >= 50) {
      console.log('🟢 Высокая пропускная способность (>= 50 rps)');
    } else if (this.results.requestsPerSecond >= 20) {
      console.log('🟡 Средняя пропускная способность (>= 20 rps)');
    } else {
      console.log('🔴 Низкая пропускная способность (< 20 rps)');
    }
  }

  /**
   * Пауза
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Экспорт
export {
  LoadTestCoordinator,
  VirtualUser,
  LOAD_TEST_CONFIG
};

// Запуск из командной строки
if (process.argv[1].includes('load-test.js')) {
  const scenario = process.argv[2] || 'light';
  
  console.log('🏋️ Система нагрузочного тестирования SN4');
  console.log('=' .repeat(50));
  
  const coordinator = new LoadTestCoordinator();
  
  coordinator.runTest(scenario)
    .then(() => {
      coordinator.printReport();
      
      const success = coordinator.results.successRate >= 95 && 
                     coordinator.results.avgResponseTime <= 2000;
      
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Ошибка нагрузочного тестирования:', error.message);
      process.exit(1);
    });
}
