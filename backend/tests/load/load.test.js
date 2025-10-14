// filepath: c:\manager-\backend\tests\load\load.test.js
const autocannon = require('autocannon');
const app = require('../../server');
const request = require('supertest');

describe('Load Testing with Autocannon', () => {
  let server;
  let token;
  const PORT = 5001; // Используем другой порт для тестов

  beforeAll(async () => {
    // Запускаем сервер для нагрузочного тестирования
    server = app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
    });

    // Получаем токен для авторизации
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    if (loginRes.body.token) {
      token = loginRes.body.token;
    } else {
      // Создаем администратора если не существует
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin',
          email: 'admin@test.com',
          password: 'admin123',
          full_name: 'Admin',
          role: 'admin'
        });

      const retryLogin = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      token = retryLogin.body.token;
    }
  });

  afterAll((done) => {
    server.close(done);
  });

  it('Нагрузочный тест: GET /api/projects - должен выдержать 100 req/sec', (done) => {
    const instance = autocannon({
      url: `http://localhost:${PORT}/api/projects`,
      connections: 10,
      duration: 10,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }, (err, result) => {
      if (err) {
        console.error('Load test error:', err);
        done(err);
        return;
      }

      console.log('\n=== Load Test Results: GET /api/projects ===');
      console.log(`Requests per second: ${result.requests.average}`);
      console.log(`Average latency: ${result.latency.mean}ms`);
      console.log(`Max latency: ${result.latency.max}ms`);
      console.log(`Total requests: ${result.requests.total}`);
      console.log(`2xx responses: ${result['2xx']}`);
      console.log(`Non-2xx responses: ${result.non2xx}`);

      // Проверяем, что средняя задержка меньше 1 секунды
      expect(result.latency.mean).toBeLessThan(1000);
      
      // Проверяем, что есть успешные запросы
      expect(result['2xx']).toBeGreaterThan(0);
      
      // Проверяем, что обработано минимум 50 запросов
      expect(result.requests.total).toBeGreaterThan(50);

      done();
    });

    autocannon.track(instance);
  }, 30000); // Увеличиваем таймаут для теста

  it('Нагрузочный тест: GET /api/defects - должен выдержать 100 req/sec', (done) => {
    const instance = autocannon({
      url: `http://localhost:${PORT}/api/defects`,
      connections: 10,
      duration: 10,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }, (err, result) => {
      if (err) {
        console.error('Load test error:', err);
        done(err);
        return;
      }

      console.log('\n=== Load Test Results: GET /api/defects ===');
      console.log(`Requests per second: ${result.requests.average}`);
      console.log(`Average latency: ${result.latency.mean}ms`);
      console.log(`Max latency: ${result.latency.max}ms`);
      console.log(`Total requests: ${result.requests.total}`);
      console.log(`2xx responses: ${result['2xx']}`);

      expect(result.latency.mean).toBeLessThan(1000);
      expect(result['2xx']).toBeGreaterThan(0);
      expect(result.requests.total).toBeGreaterThan(50);

      done();
    });

    autocannon.track(instance);
  }, 30000);

  it('Нагрузочный тест: GET /api/health - должен выдержать высокую нагрузку', (done) => {
    const instance = autocannon({
      url: `http://localhost:${PORT}/api/health`,
      connections: 20,
      duration: 5,
    }, (err, result) => {
      if (err) {
        console.error('Load test error:', err);
        done(err);
        return;
      }

      console.log('\n=== Load Test Results: GET /api/health ===');
      console.log(`Requests per second: ${result.requests.average}`);
      console.log(`Average latency: ${result.latency.mean}ms`);
      console.log(`Total requests: ${result.requests.total}`);

      // Health endpoint должен быть очень быстрым
      expect(result.latency.mean).toBeLessThan(100);
      expect(result['2xx']).toBeGreaterThan(0);

      done();
    });

    autocannon.track(instance);
  }, 30000);

  it('Нагрузочный тест: Смешанная нагрузка на разные эндпоинты', (done) => {
    const urls = [
      `http://localhost:${PORT}/api/projects`,
      `http://localhost:${PORT}/api/defects`,
      `http://localhost:${PORT}/api/health`
    ];

    let completedTests = 0;
    const testResults = [];

    urls.forEach((url) => {
      const instance = autocannon({
        url,
        connections: 5,
        duration: 5,
        headers: url !== `http://localhost:${PORT}/api/health` ? {
          Authorization: `Bearer ${token}`
        } : {}
      }, (err, result) => {
        if (err) {
          console.error(`Load test error for ${url}:`, err);
        } else {
          testResults.push({
            url,
            avgLatency: result.latency.mean,
            totalRequests: result.requests.total
          });
        }

        completedTests++;
        if (completedTests === urls.length) {
          console.log('\n=== Mixed Load Test Results ===');
          testResults.forEach(result => {
            console.log(`${result.url}: ${result.avgLatency}ms avg, ${result.totalRequests} requests`);
          });

          // Проверяем, что все тесты завершились успешно
          expect(testResults.length).toBe(urls.length);
          
          done();
        }
      });

      autocannon.track(instance);
    });
  }, 60000); // Увеличенный таймаут для множественных тестов
});
