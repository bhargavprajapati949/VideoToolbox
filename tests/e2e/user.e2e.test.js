import request from 'supertest';
import app from '../../src/app.js';
import { sequelize } from '../../src/models/db.js';

describe('User E2E', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1.0/user/register')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User registered successfully');
  });

  it('should fail to register an existing user', async () => {
    const res = await request(app)
      .post('/api/v1.0/user/register')
      .send({ email: 'test@example.com', password: 'anotherpass' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email is already registered.');
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1.0/user/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should fail login with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/v1.0/user/login')
      .send({ email: 'test@example.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });
});