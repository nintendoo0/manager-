// filepath: c:\manager-\backend\tests\unit\project.unit.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../config/db');

describe('Unit Tests - Project Controller', () => {
  let adminToken;
  let managerToken;
  let engineerToken;
  let projectId;
  beforeAll(async () => {
    // Создаем тестовых пользователей с разными ролями
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `admin_${Date.now()}`,
        email: `admin_${Date.now()}@test.com`,
        password: 'Test123!@#',
        full_name: 'Admin User',
        role: 'admin'
      });

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        login: adminRes.body.user.username,
        password: 'Test123!@#'
      });

    adminToken = adminLoginRes.body.token;

    const managerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `manager_${Date.now()}`,
        email: `manager_${Date.now()}@test.com`,
        password: 'Test123!@#',
        full_name: 'Manager User',
        role: 'manager'
      });

    const managerLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        login: managerRes.body.user.username,
        password: 'Test123!@#'
      });

    managerToken = managerLoginRes.body.token;

    const engineerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `engineer_${Date.now()}`,
        email: `engineer_${Date.now()}@test.com`,
        password: 'Test123!@#',
        full_name: 'Engineer User',
        role: 'engineer'
      });

    const engineerLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        login: engineerRes.body.user.username,
        password: 'Test123!@#'
      });

    engineerToken = engineerLoginRes.body.token;
  });

  afterAll(async () => {
    // Очистка тестовых данных
    if (projectId) {
      await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    }
    await db.end();
  });

  describe('POST /api/projects', () => {
    it('должен создать новый проект (admin)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Тестовый проект ${Date.now()}`,
          description: 'Описание тестового проекта',
          status: 'active',
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
      expect(res.body.status).toBe('active');

      projectId = res.body.id;
    });

    it('должен создать новый проект (manager)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Проект менеджера ${Date.now()}`,
          description: 'Проект создан менеджером',
          status: 'active',
          start_date: '2024-01-01'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('должен вернуть ошибку при создании проекта инженером (нет прав)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          name: 'Проект от инженера',
          description: 'Не должен быть создан',
          status: 'active',
          start_date: '2024-01-01'
        });

      expect(res.statusCode).toBe(403);
    });

    it('должен вернуть ошибку при отсутствии обязательных полей', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Проект без имени'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/projects', () => {
    it('должен вернуть список всех проектов', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('должен вернуть проекты для менеджера', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('должен вернуть проекты для инженера', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  describe('GET /api/projects/:id', () => {
    it('должен вернуть конкретный проект по ID', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', projectId);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('description');
    });

    it('должен вернуть 404 для несуществующего проекта', async () => {
      const res = await request(app)
        .get('/api/projects/99999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('должен обновить проект (admin)', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Обновленное название',
          description: 'Обновленное описание',
          status: 'completed'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Обновленное название');
      expect(res.body.status).toBe('completed');
    });

    it('должен обновить проект (manager)', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          description: 'Описание от менеджера'
        });

      expect(res.statusCode).toBe(200);
    });

    it('должен вернуть ошибку при обновлении проекта инженером', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          name: 'Попытка обновить'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let deleteProjectId;

    beforeAll(async () => {
      // Создаем проект для удаления
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Проект для удаления ${Date.now()}`,
          description: 'Будет удален',
          status: 'active',
          start_date: '2024-01-01'
        });

      deleteProjectId = res.body.id;
    });

    it('должен удалить проект (admin)', async () => {
      const res = await request(app)
        .delete(`/api/projects/${deleteProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('должен вернуть ошибку при удалении проекта инженером', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('должен вернуть 404 при удалении несуществующего проекта', async () => {
      const res = await request(app)
        .delete('/api/projects/99999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
