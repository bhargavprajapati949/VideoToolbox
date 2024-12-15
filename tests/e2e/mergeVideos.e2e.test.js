import request from 'supertest';
import path from 'path';
import fs from 'fs';

import app from '../../src/app.js';
import { sequelize } from '../../src/models/db.js';

let token;
let videoId1;
let videoId2;

const uploadDir = 'uploadTemp_merge';

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

describe('Merge Videos E2E', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await request(app)
      .post('/api/v1.0/user/register')
      .send({ email: 'mergeuser@example.com', password: 'secret' });

    const loginRes = await request(app)
      .post('/api/v1.0/user/login')
      .send({ email: 'mergeuser@example.com', password: 'secret' });

    token = loginRes.body.token;

    const videoPath = path.join(__dirname, '..', 'fixtures', 'sample.mp4');
    const upload1 = await request(app)
      .post('/api/v1.0/video/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('video', videoPath);
    videoId1 = upload1.body.video.id;

    const upload2 = await request(app)
      .post('/api/v1.0/video/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('video', videoPath);
    videoId2 = upload2.body.video.id;
  });

  afterAll(async () => {
    await sequelize.close();

    const uploadPath = path.resolve(uploadDir);
    if (fs.existsSync(uploadPath)) {
      fs.rmSync(uploadPath, { recursive: true, force: true });
    }
  });

  it('should fail if video_ids is empty array', async () => {
    const res = await request(app)
      .post('/api/v1.0/video/merge')
      .set('Authorization', `Bearer ${token}`)
      .send({ video_ids: [] });
    expect(res.status).toBe(400);
  });

  it('should merge videos successfully', async () => {
    const res = await request(app)
      .post('/api/v1.0/video/merge')
      .set('Authorization', `Bearer ${token}`)
      .send({ video_ids: [videoId1, videoId2] });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Video merged successfully.');
  });
});