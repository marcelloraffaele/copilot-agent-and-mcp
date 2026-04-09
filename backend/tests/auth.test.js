const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');
const fs = require('fs');

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
    expect(res.body.userType).toBeDefined();
  });

  it('POST /api/register should assign default userType Member', async () => {
    const newUser = { username: 'newtypeuser_unique', password: 'pass123' };
    const regRes = await request(app).post('/api/register').send(newUser);
    // Only verify userType on fresh registration (201)
    if (regRes.statusCode === 201) {
      const loginRes = await request(app).post('/api/login').send(newUser);
      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.userType).toBe('Member');
    }
    // If user already exists (409), verify existing user's type is still Member
    if (regRes.statusCode === 409) {
      const loginRes = await request(app).post('/api/login').send(newUser);
      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.userType).toBe('Member');
    }
  });

  it('POST /api/register should initialize favorites and reviews arrays', async () => {
    const newUser = { username: 'newreviewuser_unique', password: 'pass123' };
    const regRes = await request(app).post('/api/register').send(newUser);
    if (regRes.statusCode === 201) {
      const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/test-users.json'), 'utf-8'));
      const createdUser = users.find(user => user.username === newUser.username);
      expect(createdUser.favorites).toEqual([]);
      expect(createdUser.reviews).toEqual([]);
    }
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
