const request = require('supertest');
const app = require('../../server');
const db = require('../../config/db');

describe('Unit Tests - Role Permissions for Projects', () => {
  let adminToken, managerToken, engineerToken;
  let testProjectId;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Регистрация администратора
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `admin_${timestamp}`,
        email: `admin_${timestamp}@test.com`,
        password: 'password123',
        role: 'admin'
      });
    adminToken = adminRes.body.token;

    // Регистрация менеджера
    const managerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `manager_${timestamp}`,
        email: `manager_${timestamp}@test.com`,
        password: 'password123',
        role: 'manager'
      });
    managerToken = managerRes.body.token;

    // Регистрация инженера
    const engineerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `engineer_${timestamp}`,
        email: `engineer_${timestamp}@test.com`,
        password: 'password123',
        role: 'engineer'
      });
    engineerToken = engineerRes.body.token;
  });

  afterAll(async () => {
    // Очистка тестовых данных
    if (testProjectId) {
      await db.query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    }
    await db.query('DELETE FROM users WHERE username LIKE $1', ['%_test_%']);
    await db.end();
  });

  describe('Проверка прав для роли Engineer', () => {
    it('Engineer НЕ должен иметь возможность создать проект', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          name: 'Проект от инженера',
          description: 'Этот проект не должен быть создан',
          status: 'active',
          start_date: new Date().toISOString().split('T')[0]
        });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Доступ запрещен');
    });

    it('Engineer должен иметь возможность просматривать проекты', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('Проверка прав для роли Manager', () => {
    it('Manager должен иметь возможность создать проект', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Проект от менеджера',
          description: 'Этот проект должен быть создан',
          status: 'active',
          start_date: new Date().toISOString().split('T')[0]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      testProjectId = res.body.id;
    });

    it('Manager должен иметь возможность редактировать проект', async () => {
      const res = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Обновленный проект от менеджера',
          description: 'Описание обновлено',
          status: 'active'
        });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('Проверка прав для роли Admin', () => {
    it('Admin должен иметь возможность создать проект', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Проект от администратора',
          description: 'Этот проект должен быть создан',
          status: 'active',
          start_date: new Date().toISOString().split('T')[0]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('Admin должен иметь возможность удалить проект', async () => {
      if (testProjectId) {
        const res = await request(app)
          .delete(`/api/projects/${testProjectId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
      }
    });
  });

  describe('Проверка, что Engineer НЕ может редактировать/удалять проекты', () => {
    let projectIdForTest;

    beforeAll(async () => {
      // Создаем тестовый проект от имени admin
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Проект для теста прав инженера',
          description: 'Описание',
          status: 'active',
          start_date: new Date().toISOString().split('T')[0]
        });
      projectIdForTest = res.body.id;
    });

    afterAll(async () => {
      // Удаляем тестовый проект
      if (projectIdForTest) {
        await db.query('DELETE FROM projects WHERE id = $1', [projectIdForTest]);
      }
    });

    it('Engineer НЕ должен иметь возможность редактировать проект', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectIdForTest}`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          name: 'Попытка изменения от инженера',
          description: 'Это не должно сработать',
          status: 'active'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Доступ запрещен');
    });

    it('Engineer НЕ должен иметь возможность удалить проект', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectIdForTest}`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Доступ запрещен');
    });
  });
});
