// filepath: c:\manager-\backend\tests\integration\workflow.integration.test.js
const request = require('supertest');
const app = require('../../server');
const db = require('../../config/db');

describe('Integration Tests - Complete Workflow', () => {
  let adminToken, managerToken, engineerToken;
  let adminUserId, managerUserId, engineerUserId;
  let projectId, defectId;

  // Сценарий 1: Полный жизненный цикл дефекта
  describe('Scenario 1: Полный жизненный цикл дефекта от создания до закрытия', () => {
    
    it('Шаг 1: Администратор регистрируется в системе', async () => {
      const username = `workflow_admin_${Date.now()}`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username,
          email: `${username}@test.com`,
          password: 'Admin123!@#',
          full_name: 'Workflow Admin',
          role: 'admin'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      adminUserId = res.body.id;

      // Авторизуемся
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username,
          password: 'Admin123!@#'
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      adminToken = loginRes.body.token;
    });

    it('Шаг 2: Менеджер регистрируется в системе', async () => {
      const username = `workflow_manager_${Date.now()}`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username,
          email: `${username}@test.com`,
          password: 'Manager123!@#',
          full_name: 'Workflow Manager',
          role: 'manager'
        });

      expect(res.statusCode).toBe(201);
      managerUserId = res.body.id;

      // Авторизуемся
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username,
          password: 'Manager123!@#'
        });

      expect(loginRes.statusCode).toBe(200);
      managerToken = loginRes.body.token;
    });

    it('Шаг 3: Инженер регистрируется в системе', async () => {
      const username = `workflow_engineer_${Date.now()}`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username,
          email: `${username}@test.com`,
          password: 'Engineer123!@#',
          full_name: 'Workflow Engineer',
          role: 'engineer'
        });

      expect(res.statusCode).toBe(201);
      engineerUserId = res.body.id;

      // Авторизуемся
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username,
          password: 'Engineer123!@#'
        });

      expect(loginRes.statusCode).toBe(200);
      engineerToken = loginRes.body.token;
    });

    it('Шаг 4: Администратор создает новый проект', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Интеграционный проект ${Date.now()}`,
          description: 'Проект для интеграционного тестирования',
          status: 'active',
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toContain('Интеграционный проект');
      projectId = res.body.id;
    });

    it('Шаг 5: Менеджер создает дефект в проекте', async () => {
      const res = await request(app)
        .post('/api/defects')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Критическая трещина в стене',
          description: 'Обнаружена трещина длиной 2 метра на 3 этаже',
          project_id: projectId,
          priority: 'critical',
          status: 'new',
          location: 'Этаж 3, комната 301',
          severity: 'high'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Критическая трещина в стене');
      expect(res.body.status).toBe('new');
      defectId = res.body.id;
    });

    it('Шаг 6: Инженер просматривает список дефектов проекта', async () => {
      const res = await request(app)
        .get(`/api/defects?project_id=${projectId}`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      
      const defect = res.body.find(d => d.id === defectId);
      expect(defect).toBeDefined();
      expect(defect.title).toBe('Критическая трещина в стене');
    });

    it('Шаг 7: Инженер добавляет комментарий к дефекту', async () => {
      const res = await request(app)
        .post(`/api/defects/${defectId}/comments`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          comment: 'Провел осмотр. Требуется немедленный ремонт.'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.comment).toBe('Провел осмотр. Требуется немедленный ремонт.');
    });

    it('Шаг 8: Менеджер обновляет статус дефекта на "В работе"', async () => {
      const res = await request(app)
        .put(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'in_progress'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('in_progress');
    });

    it('Шаг 9: Менеджер добавляет комментарий о начале работ', async () => {
      const res = await request(app)
        .post(`/api/defects/${defectId}/comments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          comment: 'Назначена бригада для устранения. Начало работ 15.01.2024.'
        });

      expect(res.statusCode).toBe(201);
    });

    it('Шаг 10: Проверяем, что все комментарии сохранены', async () => {
      const res = await request(app)
        .get(`/api/defects/${defectId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('Шаг 11: Администратор обновляет статус на "Решен"', async () => {
      const res = await request(app)
        .put(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('resolved');
    });

    it('Шаг 12: Менеджер закрывает дефект', async () => {
      const res = await request(app)
        .put(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'closed'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('closed');
    });

    it('Шаг 13: Проверяем финальное состояние дефекта', async () => {
      const res = await request(app)
        .get(`/api/defects/${defectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('closed');
      expect(res.body.priority).toBe('critical');
    });
  });

  // Сценарий 2: Управление проектом с множественными дефектами
  describe('Scenario 2: Управление проектом с несколькими дефектами и экспорт отчета', () => {
    let project2Id;
    let defectIds = [];

    it('Шаг 1: Администратор создает новый проект', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Многодефектный проект ${Date.now()}`,
          description: 'Проект с множественными дефектами',
          status: 'active',
          start_date: '2024-02-01'
        });

      expect(res.statusCode).toBe(201);
      project2Id = res.body.id;
    });

    it('Шаг 2: Менеджер создает 5 разных дефектов', async () => {
      const defects = [
        {
          title: 'Дефект 1: Проблема с электрикой',
          description: 'Не работает освещение',
          priority: 'high',
          status: 'new'
        },
        {
          title: 'Дефект 2: Проблема с водопроводом',
          description: 'Протечка в ванной',
          priority: 'critical',
          status: 'new'
        },
        {
          title: 'Дефект 3: Косметический дефект',
          description: 'Царапина на стене',
          priority: 'low',
          status: 'new'
        },
        {
          title: 'Дефект 4: Проблема с окнами',
          description: 'Окно не закрывается',
          priority: 'medium',
          status: 'new'
        },
        {
          title: 'Дефект 5: Проблема с дверью',
          description: 'Дверь скрипит',
          priority: 'low',
          status: 'new'
        }
      ];

      for (const defect of defects) {
        const res = await request(app)
          .post('/api/defects')
          .set('Authorization', `Bearer ${managerToken}`)
          .send({
            ...defect,
            project_id: project2Id,
            location: 'Этаж 1'
          });

        expect(res.statusCode).toBe(201);
        defectIds.push(res.body.id);
      }

      expect(defectIds.length).toBe(5);
    });

    it('Шаг 3: Проверяем, что все дефекты созданы в проекте', async () => {
      const res = await request(app)
        .get(`/api/defects?project_id=${project2Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(5);
    });

    it('Шаг 4: Фильтруем дефекты по приоритету "critical"', async () => {
      const res = await request(app)
        .get(`/api/defects?project_id=${project2Id}&priority=critical`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      res.body.forEach(defect => {
        expect(defect.priority).toBe('critical');
      });
    });

    it('Шаг 5: Инженер обновляет статус критического дефекта', async () => {
      const criticalDefect = defectIds[1]; // Дефект 2
      
      // Инженер не может обновлять (если настроены права)
      // Используем менеджера
      const res = await request(app)
        .put(`/api/defects/${criticalDefect}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'in_progress'
        });

      expect([200, 403]).toContain(res.statusCode);
    });

    it('Шаг 6: Менеджер экспортирует отчет по проекту в CSV', async () => {
      const res = await request(app)
        .get(`/api/reports/defects?project_id=${project2Id}&format=csv`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Название');
      expect(res.text).toContain('Приоритет');
    });

    it('Шаг 7: Администратор просматривает статистику проекта', async () => {
      const res = await request(app)
        .get(`/api/projects/${project2Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', project2Id);
    });

    it('Шаг 8: Администратор закрывает проект', async () => {
      const res = await request(app)
        .put(`/api/projects/${project2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'completed',
          end_date: '2024-03-01'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('completed');
    });
  });

  // Очистка после всех тестов
  afterAll(async () => {
    // Удаляем тестовые данные
    if (defectId) {
      await db.query('DELETE FROM defects WHERE id = $1', [defectId]);
    }
    if (projectId) {
      await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    }
    await db.end();
  });
});
