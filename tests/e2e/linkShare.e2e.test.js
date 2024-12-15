import request from 'supertest';
import path from 'path';
import fs from 'fs';

import app from '../../src/app.js';
import { sequelize } from '../../src/models/db.js';

let token;
let videoId;
let sharedLinkUrl;

const uploadDir = 'uploadTemp_linkShare';

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


describe('Link Sharing E2E', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await request(app)
      .post('/api/v1.0/user/register')
      .send({ email: 'shareuser@example.com', password: 'secret' });

    const loginRes = await request(app)
      .post('/api/v1.0/user/login')
      .send({ email: 'shareuser@example.com', password: 'secret' });

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

  it('should fail if video_id is missing', async () => {
    const res = await request(app)
      .post('/api/v1.0/video/share')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('should create a shared link', async () => {
    const res = await request(app)
      .post('/api/v1.0/video/share')
      .set('Authorization', `Bearer ${token}`)
      .send({ video_id: videoId });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Shared link created successfully.');
    expect(res.body.link).toContain('/api/v1.0/video/shared/');
    sharedLinkUrl = res.body.link;
  });

  it('should access the shared link and stream the video', async () => {
    const url = new URL(sharedLinkUrl);
    const linkId = url.pathname.split('/').pop();

    const res = await request(app)
      .get(`/api/v1.0/video/shared/${linkId}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('video/mp4');
  });
});