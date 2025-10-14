// filepath: c:\manager-\backend\tests\user-stories\user-stories.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../config/db');

describe('User Stories Validation', () => {
  let adminToken, managerToken, engineerToken, observerToken;
  let projectId, defectId;

  beforeAll(async () => {
    // Создаем пользователей для каждой роли
    const roles = ['admin', 'manager', 'engineer', 'observer'];
    const tokens = {};

    for (const role of roles) {
      const username = `${role}_us_${Date.now()}`;
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username,
          email: `${username}@test.com`,
          password: 'Test123!@#',
          full_name: `${role} User Stories`,
          role
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username,
          password: 'Test123!@#'
        });

      tokens[role] = loginRes.body.token;
    }

    adminToken = tokens.admin;
    managerToken = tokens.manager;
    engineerToken = tokens.engineer;
    observerToken = tokens.observer;

    // Создаем тестовый проект
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `US Project ${Date.now()}`,
        description: 'Project for User Stories',
        status: 'active',
        start_date: '2024-01-01'
      });

    projectId = projectRes.body.id;

    // Создаем тестовый дефект
    const defectRes = await request(app)
      .post('/api/defects')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'US Test Defect',
        description: 'Defect for User Stories',
        project_id: projectId,
        priority: 'high',
        status: 'new'
      });

    defectId = defectRes.body.id;
  });

  afterAll(async () => {
    if (defectId) {
      await db.query('DELETE FROM defects WHERE id = $1', [defectId]);
    }
    if (projectId) {
      await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    }
    await db.end();
  });

  describe('US-1: Как администратор, я хочу управлять пользователями системы', () => {
    it('должен позволить администратору создать нового пользователя', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: `newuser_${Date.now()}`,
          email: `newuser_${Date.now()}@test.com`,
          password: 'NewUser123!',
          full_name: 'New User',
          role: 'engineer'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.role).toBe('engineer');
    });

    it('должен позволить администратору просмотреть список пользователей', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('НЕ должен позволить инженеру просматривать всех пользователей', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect([403, 401]).toContain(res.statusCode);
    });
  });

  describe('US-2: Как менеджер, я хочу создавать и управлять проектами', () => {
    it('должен позволить менеджеру создать новый проект', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: `Manager Project ${Date.now()}`,
          description: 'Project created by manager',
          status: 'active',
          start_date: '2024-01-01'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toContain('Manager Project');
    });

    it('должен позволить менеджеру обновить проект', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          description: 'Updated by manager'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.description).toBe('Updated by manager');
    });

    it('должен позволить менеджеру просматривать все проекты', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('НЕ должен позволить наблюдателю создавать проекты', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${observerToken}`)
        .send({
          name: 'Observer Project',
          description: 'Should not be created',
          status: 'active',
          start_date: '2024-01-01'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('US-3: Как менеджер, я хочу регистрировать дефекты', () => {
    it('должен позволить менеджеру создать новый дефект', async () => {
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: `Manager Defect ${Date.now()}`,
          description: 'Defect created by manager',
          project_id: projectId,
          priority: 'medium',
          status: 'new',
          location: 'Building A'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toContain('Manager Defect');
    });

    it('должен позволить менеджеру создать дефект с приоритетом', async () => {
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Critical Issue',
          description: 'Very important defect',
          project_id: projectId,
          priority: 'critical',
          status: 'new'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.priority).toBe('critical');
    });

    it('должен позволить администратору создать дефект', async () => {
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Defect',
          description: 'Defect created by admin',
          project_id: projectId,
          priority: 'high',
          status: 'new'
        });

      expect(res.statusCode).toBe(201);
    });
  });

  describe('US-4: Как инженер, я хочу просматривать назначенные мне дефекты', () => {
    it('должен позволить инженеру просматривать все дефекты', async () => {
      const res = await request(app)
        .get('/api/defects')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('должен позволить инженеру просматривать дефекты конкретного проекта', async () => {
      const res = await request(app)
        .get(`/api/defects?project_id=${projectId}`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('должен позволить инженеру просмотреть детали дефекта', async () => {
      const res = await request(app)
        .get(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', defectId);
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('description');
    });
  });

  describe('US-5: Как инженер, я хочу добавлять комментарии к дефектам', () => {
    it('должен позволить инженеру добавить комментарий', async () => {
      const res = await request(app)
        .post(`/api/defects/${defectId}/comments`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          comment: 'Engineer comment: Issue inspected'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.comment).toBe('Engineer comment: Issue inspected');
    });

    it('должен позволить менеджеру добавить комментарий', async () => {
      const res = await request(app)
        .post(`/api/defects/${defectId}/comments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          comment: 'Manager comment: Assigned to team'
        });

      expect(res.statusCode).toBe(201);
    });

    it('должен позволить просматривать все комментарии к дефекту', async () => {
      const res = await request(app)
        .get(`/api/defects/${defectId}/comments`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('US-6: Как менеджер, я хочу обновлять статус дефектов', () => {
    it('должен позволить менеджеру изменить статус на "В работе"', async () => {
      const res = await request(app)
        .put(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'in_progress'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('in_progress');
    });

    it('должен позволить администратору изменить статус', async () => {
      const res = await request(app)
        .put(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('resolved');
    });

    it('НЕ должен позволить наблюдателю изменять статус', async () => {
      const res = await request(app)
        .put(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${observerToken}`)
        .send({
          status: 'closed'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('US-7: Как менеджер, я хочу фильтровать дефекты', () => {
    beforeAll(async () => {
      // Создаем несколько дефектов с разными статусами и приоритетами
      await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Low Priority Defect',
          description: 'Low priority',
          project_id: projectId,
          priority: 'low',
          status: 'new'
        });

      await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Closed Defect',
          description: 'Already closed',
          project_id: projectId,
          priority: 'medium',
          status: 'closed'
        });
    });

    it('должен позволить фильтровать дефекты по статусу', async () => {
      const res = await request(app)
        .get('/api/defects?status=resolved')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      res.body.forEach(defect => {
        expect(defect.status).toBe('resolved');
      });
    });

    it('должен позволить фильтровать дефекты по приоритету', async () => {
      const res = await request(app)
        .get('/api/defects?priority=low')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      res.body.forEach(defect => {
        expect(defect.priority).toBe('low');
      });
    });

    it('должен позволить фильтровать дефекты по проекту', async () => {
      const res = await request(app)
        .get(`/api/defects?project_id=${projectId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      res.body.forEach(defect => {
        expect(defect.project_id).toBe(projectId);
      });
    });
  });

  describe('US-8: Как администратор, я хочу экспортировать отчеты', () => {
    it('должен позволить администратору экспортировать отчет в CSV', async () => {
      const res = await request(app)
        .get('/api/reports/defects?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Название');
    });

    it('должен позволить менеджеру экспортировать отчет', async () => {
      const res = await request(app)
        .get(`/api/reports/defects?project_id=${projectId}&format=csv`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });

    it('НЕ должен позволить инженеру экспортировать отчеты', async () => {
      const res = await request(app)
        .get('/api/reports/defects?format=csv')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('US-9: Как наблюдатель, я хочу просматривать информацию в режиме "только чтение"', () => {
    it('должен позволить наблюдателю просматривать проекты', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${observerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('должен позволить наблюдателю просматривать дефекты', async () => {
      const res = await request(app)
        .get('/api/defects')
        .set('Authorization', `Bearer ${observerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('должен позволить наблюдателю просматривать детали дефекта', async () => {
      const res = await request(app)
        .get(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${observerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', defectId);
    });

    it('НЕ должен позволить наблюдателю создавать дефекты', async () => {
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${observerToken}`)
        .send({
          title: 'Observer Defect',
          description: 'Should not be created',
          project_id: projectId,
          priority: 'low',
          status: 'new'
        });

      expect(res.statusCode).toBe(403);
    });

    it('НЕ должен позволить наблюдателю обновлять дефекты', async () => {
      const res = await request(app)
        .put(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${observerToken}`)
        .send({
          status: 'in_progress'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('US-10: Как пользователь, я хочу, чтобы система отвечала быстро', () => {
    it('GET /api/projects должен отвечать менее чем за 1 секунду', async () => {
      const start = Date.now();
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`);
      const duration = Date.now() - start;

      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(1000);
    });

    it('GET /api/defects должен отвечать менее чем за 1 секунду', async () => {
      const start = Date.now();
      const res = await request(app)
        .get('/api/defects')
        .set('Authorization', `Bearer ${adminToken}`);
      const duration = Date.now() - start;

      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(1000);
    });

    it('POST /api/defects должен отвечать менее чем за 1 секунду', async () => {
      const start = Date.now();
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Performance Test Defect',
          description: 'Testing response time',
          project_id: projectId,
          priority: 'medium',
          status: 'new'
        });
      const duration = Date.now() - start;

      expect(res.statusCode).toBe(201);
      expect(duration).toBeLessThan(1000);
    });
  });
});
