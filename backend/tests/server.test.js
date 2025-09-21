const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Сервер системы управления дефектами работает');
});

describe('GET /', () => {
  it('should return server running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('Сервер системы управления дефектами работает');
  });
});
