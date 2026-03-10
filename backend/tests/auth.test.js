const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');

const app = express();
app.use(express.json());
app.use('/api', createApiRouter({
  usersFile: path.join(__dirname, '../data/test-users.json'),
  booksFile: path.join(__dirname, '../data/test-books.json'),
  readJSON: (file) => require('fs').existsSync(file) ? JSON.parse(require('fs').readFileSync(file, 'utf-8')) : [],
  writeJSON: (file, data) => require('fs').writeFileSync(file, JSON.stringify(data, null, 2)),
  authenticateToken: (req, res, next) => next(),
  SECRET_KEY: 'test_secret',
}));

describe('Auth API', () => {
  const testUser = { username: 'testuser', password: 'testpass' };

  it('POST /api/register should fail with missing fields', async () => {
    const res = await request(app).post('/api/register').send({ username: '' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/register should succeed with valid data', async () => {
    const res = await request(app).post('/api/register').send(testUser);
    // 201 or 409 if already exists
    expect([201, 409]).toContain(res.statusCode);
  });

  // generated-by-copilot: verify that userType is stored and returned correctly
  it('POST /api/register with userType administrator should succeed', async () => {
    const adminUser = { username: `adminuser_${Date.now()}`, password: 'adminpass', userType: 'administrator' };
    await request(app).post('/api/register').send(adminUser);
    const res = await request(app).post('/api/login').send({ username: adminUser.username, password: adminUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.userType).toBe('administrator');
  });

  it('POST /api/register without userType should default to member', async () => {
    const memberUser = { username: `memberuser_${Date.now()}`, password: 'memberpass' };
    await request(app).post('/api/register').send(memberUser);
    const res = await request(app).post('/api/login').send({ username: memberUser.username, password: memberUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.userType).toBe('member');
  });

  it('POST /api/register should fail if user already exists', async () => {
    await request(app).post('/api/register').send(testUser); // ensure exists
    const res = await request(app).post('/api/register').send(testUser);
    expect(res.statusCode).toBe(409);
  });

  it('POST /api/login should succeed with correct credentials', async () => {
    await request(app).post('/api/register').send(testUser); // ensure exists
    const res = await request(app).post('/api/login').send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    // generated-by-copilot: verify userType is returned on login
    expect(res.body.userType).toBeDefined();
    expect(['member', 'administrator']).toContain(res.body.userType);
  });

  it('POST /api/login should fail with wrong password', async () => {
    const res = await request(app).post('/api/login').send({ username: testUser.username, password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/login should fail with missing fields', async () => {
    const res = await request(app).post('/api/login').send({ username: '' });
    expect(res.statusCode).toBe(401);
  });
});
