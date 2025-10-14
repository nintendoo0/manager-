// filepath: c:\manager-\backend\tests\unit\defect.unit.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../config/db');

describe('Unit Tests - Defect Controller', () => {
  let adminToken;
  let managerToken;
  let engineerToken;
  let projectId;
  let defectId;
  beforeAll(async () => {
    // Создаем тестовых пользователей
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `admin_defect_${Date.now()}`,
        email: `admin_defect_${Date.now()}@test.com`,
        password: 'Test123!@#',
        full_name: 'Admin Defect',
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
        username: `manager_defect_${Date.now()}`,
        email: `manager_defect_${Date.now()}@test.com`,
        password: 'Test123!@#',
        full_name: 'Manager Defect',
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
        username: `engineer_defect_${Date.now()}`,
        email: `engineer_defect_${Date.now()}@test.com`,
        password: 'Test123!@#',
        full_name: 'Engineer Defect',
        role: 'engineer'
      });

    const engineerLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        login: engineerRes.body.user.username,
        password: 'Test123!@#'
      });

    engineerToken = engineerLoginRes.body.token;

    // Создаем тестовый проект
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Проект для дефектов ${Date.now()}`,
        description: 'Проект для тестирования дефектов',
        status: 'active',
        start_date: '2024-01-01'
      });

    projectId = projectRes.body.id;
  });

  afterAll(async () => {
    // Очистка тестовых данных
    if (defectId) {
      await db.query('DELETE FROM defects WHERE id = $1', [defectId]);
    }
    if (projectId) {
      await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    }
    await db.end();
  });

  describe('POST /api/defects', () => {
    it('должен создать новый дефект (admin)', async () => {
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Тестовый дефект ${Date.now()}`,
          description: 'Описание тестового дефекта',
          project_id: projectId,
          priority: 'high',
          status: 'new',
          location: 'Комната 101'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toContain('Тестовый дефект');
      expect(res.body.priority).toBe('high');
      expect(res.body.status).toBe('new');

      defectId = res.body.id;
    });

    it('должен создать новый дефект (manager)', async () => {
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: `Дефект от менеджера ${Date.now()}`,
          description: 'Дефект создан менеджером',
          project_id: projectId,
          priority: 'medium',
          status: 'new',
          location: 'Комната 102'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('должен вернуть ошибку при создании дефекта без проекта', async () => {
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Дефект без проекта',
          description: 'Не должен быть создан',
          priority: 'low',
          status: 'new'
        });

      expect(res.statusCode).toBe(400);
    });

    it('должен вернуть ошибку при отсутствии обязательных полей', async () => {
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          project_id: projectId
          // Отсутствуют title, description
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/defects', () => {
    it('должен вернуть список всех дефектов', async () => {
      const res = await request(app)
        .get('/api/defects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('должен вернуть дефекты с фильтром по проекту', async () => {
      const res = await request(app)
        .get(`/api/defects?project_id=${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      res.body.forEach(defect => {
        expect(defect.project_id).toBe(projectId);
      });
    });

    it('должен вернуть дефекты с фильтром по статусу', async () => {
      const res = await request(app)
        .get('/api/defects?status=new')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      res.body.forEach(defect => {
        expect(defect.status).toBe('new');
      });
    });

    it('должен вернуть дефекты с фильтром по приоритету', async () => {
      const res = await request(app)
        .get('/api/defects?priority=high')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      res.body.forEach(defect => {
        expect(defect.priority).toBe('high');
      });
    });
  });

  describe('GET /api/defects/:id', () => {
    it('должен вернуть конкретный дефект по ID', async () => {
      const res = await request(app)
        .get(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', defectId);
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('description');
    });

    it('должен вернуть 404 для несуществующего дефекта', async () => {
      const res = await request(app)
        .get('/api/defects/99999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/defects/:id', () => {
    it('должен обновить дефект (admin)', async () => {
      const res = await request(app)
        .put(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Обновленный дефект',
          priority: 'critical',
          status: 'in_progress'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Обновленный дефект');
      expect(res.body.priority).toBe('critical');
      expect(res.body.status).toBe('in_progress');
    });

    it('должен обновить дефект (manager)', async () => {
      const res = await request(app)
        .put(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          description: 'Обновлено менеджером'
        });

      expect(res.statusCode).toBe(200);
    });

    it('должен вернуть 404 при обновлении несуществующего дефекта', async () => {
      const res = await request(app)
        .put('/api/defects/99999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Не существует'
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/defects/:id/comments', () => {
    it('должен добавить комментарий к дефекту', async () => {
      const res = await request(app)
        .post(`/api/defects/${defectId}/comments`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          comment: 'Тестовый комментарий от инженера'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.comment).toBe('Тестовый комментарий от инженера');
    });

    it('должен вернуть ошибку при добавлении пустого комментария', async () => {
      const res = await request(app)
        .post(`/api/defects/${defectId}/comments`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          comment: ''
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/defects/:id/comments', () => {
    it('должен вернуть список комментариев к дефекту', async () => {
      const res = await request(app)
        .get(`/api/defects/${defectId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/defects/:id', () => {
    let deleteDefectId;

    beforeAll(async () => {
      // Создаем дефект для удаления
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Дефект для удаления ${Date.now()}`,
          description: 'Будет удален',
          project_id: projectId,
          priority: 'low',
          status: 'new'
        });

      deleteDefectId = res.body.id;
    });

    it('должен удалить дефект (admin)', async () => {
      const res = await request(app)
        .delete(`/api/defects/${deleteDefectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('должен вернуть ошибку при удалении дефекта инженером', async () => {
      const res = await request(app)
        .delete(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('должен вернуть 404 при удалении несуществующего дефекта', async () => {
      const res = await request(app)
        .delete('/api/defects/99999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
