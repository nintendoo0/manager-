const request = require('supertest');
const app = require('../../server');
const db = require('../../config/db');

describe('Unit Tests - Project Date Validation', () => {
  let adminToken;
  let testProjectId;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Регистрация администратора
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `admin_validation_${timestamp}`,
        email: `admin_validation_${timestamp}@test.com`,
        password: 'password123',
        role: 'admin'
      });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    // Очистка тестовых данных
    if (testProjectId) {
      await db.query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    }
    await db.query('DELETE FROM users WHERE username LIKE $1', ['%_validation_%']);
    await db.end();
  });

  describe('Создание проекта - валидация дат', () => {
    it('Должен запретить создание проекта, если дата окончания раньше даты начала', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Проект с некорректными датами',
          description: 'Тестовый проект',
          status: 'active',
          start_date: '2025-12-10',
          end_date: '2025-12-08' // Окончание раньше начала!
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Дата окончания проекта не может быть раньше даты начала');
    });

    it('Должен разрешить создание проекта с корректными датами', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Проект с корректными датами',
          description: 'Тестовый проект',
          status: 'active',
          start_date: '2025-12-10',
          end_date: '2025-12-20' // Окончание после начала
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      testProjectId = res.body.id;
    });

    it('Должен разрешить создание проекта, если дата окончания равна дате начала', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Проект с одинаковыми датами',
          description: 'Тестовый проект',
          status: 'active',
          start_date: '2025-12-15',
          end_date: '2025-12-15' // Одинаковые даты
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      
      // Удаляем сразу
      await db.query('DELETE FROM projects WHERE id = $1', [res.body.id]);
    });

    it('Должен разрешить создание проекта без даты окончания', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Проект без даты окончания',
          description: 'Тестовый проект',
          status: 'active',
          start_date: '2025-12-10'
          // end_date не указана
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      
      // Удаляем сразу
      await db.query('DELETE FROM projects WHERE id = $1', [res.body.id]);
    });

    it('Должен запретить создание проекта без названия', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          description: 'Тестовый проект',
          status: 'active',
          start_date: '2025-12-10',
          end_date: '2025-12-20'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Название проекта обязательно');
    });
  });

  describe('Обновление проекта - валидация дат', () => {
    it('Должен запретить обновление проекта с некорректными датами', async () => {
      if (!testProjectId) {
        // Создаём проект для теста
        const createRes = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Проект для обновления',
            description: 'Тестовый проект',
            status: 'active',
            start_date: '2025-12-10',
            end_date: '2025-12-20'
          });
        testProjectId = createRes.body.id;
      }

      const res = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Обновлённый проект',
          description: 'Обновлённое описание',
          status: 'active',
          start_date: '2025-12-15',
          end_date: '2025-12-10' // Окончание раньше начала!
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Дата окончания проекта не может быть раньше даты начала');
    });

    it('Должен разрешить обновление проекта с корректными датами', async () => {
      const res = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Обновлённый проект',
          description: 'Обновлённое описание',
          status: 'active',
          start_date: '2025-12-10',
          end_date: '2025-12-25' // Корректные даты
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
    });
  });
});
