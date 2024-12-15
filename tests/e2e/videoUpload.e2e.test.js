import request from 'supertest';
import path from 'path';
import fs from 'fs';

import app from '../../src/app.js';
import { sequelize } from '../../src/models/db.js';

let token;

const uploadDir = 'uploadTemp_upload';

jest.mock('../../config.js', () => {
  const originalConfig = jest.requireActual('../../config.js').default;
  return {
    ...originalConfig,
    get: jest.fn((key) => {
      if (key === 'video.uploadDirectory') return uploadDir;
      return originalConfig.get.call(originalConfig, key);
    }),
  };
});

describe('Video Upload E2E', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Register and login a user
    await request(app)
      .post('/api/v1.0/user/register')
      .send({ email: 'uploaduser@example.com', password: 'secret' });

    const loginRes = await request(app)
      .post('/api/v1.0/user/login')
      .send({ email: 'uploaduser@example.com', password: 'secret' });

    token = loginRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();

    const uploadPath = path.resolve(uploadDir);
    if (fs.existsSync(uploadPath)) {
      fs.rmSync(uploadPath, { recursive: true, force: true });
    }
  });

  it('should upload a valid video', async () => {
    const videoPath = path.join(__dirname, '..', 'fixtures', 'sample.mp4');
    const res = await request(app)
      .post('/api/v1.0/video/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('video', videoPath);

    expect(res.status).toBe(201);
    expect(res.body.video).toHaveProperty('id');
  });

  it('should fail if no file is uploaded', async () => {
    const res = await request(app)
      .post('/api/v1.0/video/upload')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No file uploaded.');
  });
});