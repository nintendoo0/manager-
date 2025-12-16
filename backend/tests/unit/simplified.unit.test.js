// filepath: c:\manager-\backend\tests\unit\simplified.unit.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../config/db');

describe('Упрощенные юнит-тесты', () => {
  let adminToken;
  let testProjectId;
  let testDefectId;

  // Инициализация: создаем администратора и получаем токен
  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Регистрация администратора
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `test_admin_${timestamp}`,
        email: `test_admin_${timestamp}@test.com`,
        password: 'Admin123!@#',
        full_name: 'Test Admin',
        role: 'admin'
      });

    // Авторизация
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        login: registerRes.body.user.username,
        password: 'Admin123!@#'
      });

    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Очистка
    if (testDefectId) {
      await db.query('DELETE FROM defects WHERE id = $1', [testDefectId]);
    }
    if (testProjectId) {
      await db.query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    }
    await db.end();
  });

  // ===== ТЕСТЫ АУТЕНТИФИКАЦИИ =====
  describe('Аутентификация', () => {
    it('✅ Регистрация пользователя должна вернуть токен', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: `user_${Date.now()}`,
          email: `user_${Date.now()}@test.com`,
          password: 'Pass123!@#',
          full_name: 'Test User',
          role: 'engineer'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('✅ Авторизация с правильными данными должна быть успешной', async () => {
      const username = `login_user_${Date.now()}`;
      
      await request(app)
        .post('/api/auth/register')
        .send({
          username,
          email: `${username}@test.com`,
          password: 'Pass123!@#',
          full_name: 'Login User',
          role: 'engineer'
        });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          login: username,
          password: 'Pass123!@#'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('✅ Получение профиля с токеном должно быть успешным', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).not.toHaveProperty('password');
    });

    it('✅ Запрос без токена должен вернуть 401', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });

    it('✅ Дублирование username должно вернуть ошибку', async () => {
      const username = `duplicate_${Date.now()}`;
      
      await request(app)
        .post('/api/auth/register')
        .send({
          username,
          email: `${username}@test.com`,
          password: 'Pass123!@#',
          full_name: 'Duplicate',
          role: 'engineer'
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username,
          email: `${username}2@test.com`,
          password: 'Pass123!@#',
          full_name: 'Duplicate 2',
          role: 'engineer'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  // ===== ТЕСТЫ ПРОЕКТОВ =====
  describe('Управление проектами', () => {
    it('✅ Создание проекта администратором должно быть успешным', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Тестовый проект ${Date.now()}`,
          description: 'Описание проекта',
          status: 'active',
          start_date: '2024-01-01'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
      
      testProjectId = res.body.id;
    });    it('✅ Получение списка проектов должно быть успешным', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    it('✅ Получение проекта по ID должно быть успешным', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', testProjectId);
    });

    it('✅ Обновление проекта должно быть успешным', async () => {
      const res = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Обновленное название'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Обновленное название');
    });

    it('✅ Запрос проекта без токена должен вернуть 401', async () => {
      const res = await request(app)
        .get('/api/projects');

      expect(res.statusCode).toBe(401);
    });
  });

  // ===== ТЕСТЫ ДЕФЕКТОВ =====
  describe('Управление дефектами', () => {
    it('✅ Создание дефекта должно быть успешным', async () => {
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Тестовый дефект ${Date.now()}`,
          description: 'Описание дефекта',
          project_id: testProjectId,
          priority: 'high',
          status: 'new',
          location: 'Тестовая локация'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title');
      
      testDefectId = res.body.id;
    });    it('✅ Получение списка дефектов должно быть успешным', async () => {
      const res = await request(app)
        .get('/api/defects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    it('✅ Получение дефекта по ID должно быть успешным', async () => {
      const res = await request(app)
        .get(`/api/defects/${testDefectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', testDefectId);
    });    it('✅ Фильтрация дефектов по проекту должна работать', async () => {
      const res = await request(app)
        .get(`/api/defects?project_id=${testProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    it('✅ Обновление дефекта должно быть успешным', async () => {
      const res = await request(app)
        .put(`/api/defects/${testDefectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'in_progress'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('in_progress');
    });

    it('✅ Добавление комментария к дефекту должно быть успешным', async () => {
      const res = await request(app)
        .post(`/api/defects/${testDefectId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          comment: 'Тестовый комментарий'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('comment');
    });

    it('✅ Получение комментариев должно быть успешным', async () => {
      const res = await request(app)
        .get(`/api/defects/${testDefectId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  // ===== ТЕСТЫ ПРАВ ДОСТУПА =====
  describe('Проверка прав доступа', () => {
    let engineerToken;

    beforeAll(async () => {
      const timestamp = Date.now();
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: `engineer_${timestamp}`,
          email: `engineer_${timestamp}@test.com`,
          password: 'Eng123!@#',
          full_name: 'Engineer',
          role: 'engineer'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          login: registerRes.body.user.username,
          password: 'Eng123!@#'
        });

      engineerToken = loginRes.body.token;
    });

    it('✅ Инженер может просматривать проекты', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('✅ Инженер может просматривать дефекты', async () => {
      const res = await request(app)
        .get('/api/defects')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('✅ Инженер НЕ может создавать проекты', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          name: 'Проект от инженера',
          status: 'active',
          start_date: '2024-01-01'
        });

      expect(res.statusCode).toBe(403);
    });

    it('✅ Инженер может создавать дефекты', async () => {
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          title: 'Дефект от инженера',
          description: 'Описание',
          project_id: testProjectId,
          priority: 'medium',
          status: 'new'
        });

      expect(res.statusCode).toBe(201);
    });
  });

  // ===== ТЕСТЫ ПРОИЗВОДИТЕЛЬНОСТИ =====
  describe('Производительность', () => {
    it('✅ GET /api/projects должен отвечать быстро (< 1 сек)', async () => {
      const start = Date.now();
      
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const duration = Date.now() - start;

      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(1000);
    });

    it('✅ GET /api/defects должен отвечать быстро (< 1 сек)', async () => {
      const start = Date.now();
      
      const res = await request(app)
        .get('/api/defects')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const duration = Date.now() - start;

      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(1000);
    });
  });
});
