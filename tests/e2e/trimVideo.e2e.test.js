import request from 'supertest';
import path from 'path';
import fs from 'fs';

import app from '../../src/app.js';
import { sequelize } from '../../src/models/db.js';

let token;
let videoId;

const uploadDir = 'uploadTemp_trim';

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


describe('Trim Video E2E', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await request(app)
      .post('/api/v1.0/user/register')
      .send({ email: 'trimuser@example.com', password: 'secret' });

    const loginRes = await request(app)
      .post('/api/v1.0/user/login')
      .send({ email: 'trimuser@example.com', password: 'secret' });

    token = loginRes.body.token;

    const videoPath = path.join(__dirname, '..', 'fixtures', 'sample.mp4');
    const uploadRes = await request(app)
      .post('/api/v1.0/video/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('video', videoPath);

    videoId = uploadRes.body.video.id;
  });

  afterAll(async () => {
    await sequelize.close();

    const uploadPath = path.resolve(uploadDir);
    if (fs.existsSync(uploadPath)) {
      fs.rmSync(uploadPath, { recursive: true, force: true });
    }
  });

  it('should fail if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1.0/video/trim')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('should fail if video does not exist', async () => {
    const res = await request(app)
      .post('/api/v1.0/video/trim')
      .set('Authorization', `Bearer ${token}`)
      .send({ video_id: 9999, start_time: 0, end_time: 5 });
    expect(res.status).toBe(404);
  });

  it('should trim the video successfully', async () => {
    const res = await request(app)
      .post('/api/v1.0/video/trim')
      .set('Authorization', `Bearer ${token}`)
      .send({ video_id: videoId, start_time: 0, end_time: 5 });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Video trimmed successfully.');
  });
});