import request from 'supertest';
import app from '../../src/app.js';
import { initDb, sequelize } from '../../src/models/db.js';
import { beforeEach } from '@jest/globals';

describe('Health Route E2E', () => {
  beforeEach(async () => {
    await initDb(); // Initialize the database for testing
  });

  it('should return 200 and confirm the server is running', async () => {
    const res = await request(app).get('/_health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Video Toolbox is running!');
  });

  it('should return 500 if the database is not connected', async () => {
    // Simulate database disconnection by calling sequelize.close()
    await sequelize.close();

    const res = await request(app).get('/_health');
    expect(res.status).toBe(500);
    expect(res.text).toBe('Video Toolbox is down!');
  });
});