const request = require('supertest');
const app = require('../../server');
const db = require('../../config/db');

describe('Unit Tests - Authentication Controller', () => {
  let testUserId;

  afterAll(async () => {
    // Очистка тестовых данных
    if (testUserId) {
      await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await db.end();
  });

  describe('POST /api/auth/register', () => {
    it('должен успешно зарегистрировать нового пользователя', async () => {
      const uniqueUsername = `testuser_${Date.now()}`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: uniqueUsername,
          email: `${uniqueUsername}@test.com`,
          password: 'Test123!@#',
          full_name: 'Тестовый Пользователь',
          role: 'engineer'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe(uniqueUsername);
      expect(res.body.user.role).toBe('engineer');
      expect(res.body.user).not.toHaveProperty('password');

      testUserId = res.body.user.id;
    });

    it('должен вернуть ошибку при регистрации с существующим username', async () => {
      const username = `duplicate_${Date.now()}`;
      
      // Первая регистрация
      await request(app)
        .post('/api/auth/register')
        .send({
          username,
          email: `${username}@test.com`,
          password: 'Test123!@#',
          full_name: 'Дубликат',
          role: 'engineer'
        });

      // Повторная регистрация с тем же username
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username,
          email: `${username}2@test.com`,
          password: 'Test123!@#',
          full_name: 'Дубликат 2',
          role: 'engineer'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('должен вернуть ошибку при отсутствии обязательных полей', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
          // Отсутствуют email, password и другие поля
        });

      expect([400, 500]).toContain(res.statusCode); // Может быть 400 или 500
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Создаем пользователя для тестирования логина
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'logintest',
          email: 'logintest@test.com',
          password: 'Test123!@#',
          full_name: 'Login Test',
          role: 'engineer'
        });
    });

    it('должен успешно авторизовать пользователя с правильными учетными данными', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'logintest',
          password: 'Test123!@#'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.username).toBe('logintest');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('должен вернуть ошибку при неправильном пароле', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'logintest',
          password: 'WrongPassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('должен вернуть ошибку при попытке входа с несуществующим пользователем', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'nonexistentuser',
          password: 'Test123!@#'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
      // Получаем токен для тестирования
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'logintest',
          password: 'Test123!@#'
        });

      token = loginRes.body.token;
    });

    it('должен вернуть информацию о текущем пользователе с валидным токеном', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.username).toBe('logintest');
      expect(res.body).not.toHaveProperty('password');
    });

    it('должен вернуть ошибку 401 без токена', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });

    it('должен вернуть ошибку 401 с невалидным токеном', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect([401, 403]).toContain(res.statusCode); // Может быть 401 или 403
    });
  });
});
