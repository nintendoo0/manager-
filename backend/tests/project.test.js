const request = require('supertest');
const app = require('../server');
const db = require('../config/db');

let token;
let projectId;

beforeAll(async () => {
  // Авторизация для получения токена
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });
  
  token = res.body.token;
});

describe('Project API', () => {
  it('should create a new project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Тестовый проект',
        description: 'Описание тестового проекта',
        status: 'active',
        start_date: '2023-09-01'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual('Тестовый проект');
    
    projectId = res.body.id;
  });
  
  it('should get all projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });
  
  it('should get a project by id', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', projectId);
    expect(res.body.name).toEqual('Тестовый проект');
  });
});