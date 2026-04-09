const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const usersFile = path.join(__dirname, '../data/test-users.json');
const booksFile = path.join(__dirname, '../data/test-books.json');
const SECRET_KEY = 'test_secret';

function getToken(username = 'sandra') {
  return jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
}

const app = express();
app.use(express.json());
app.use('/api', createApiRouter({
  usersFile,
  booksFile,
  readJSON: (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : [],
  writeJSON: (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2)),
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    try {
      req.user = jwt.verify(token, SECRET_KEY);
      next();
    } catch {
      return res.sendStatus(403);
    }
  },
  SECRET_KEY,
}));

describe('Reviews API', () => {
  it('GET /api/reviews should return an array', async () => {
    const res = await request(app).get('/api/reviews');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/reviews should add a review for a valid user', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '1', rating: 5, comment: 'Great book' });

    expect(res.statusCode).toBe(201);
    expect(res.body.bookId).toBe('1');
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe('Great book');
    expect(res.body.username).toBe('sandra');
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/reviews should prevent duplicate reviews by same user and book', async () => {
    const token = getToken('sandra');
    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '2', rating: 4, comment: 'Nice read' });

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '2', rating: 5, comment: 'Second review' });

    expect(res.statusCode).toBe(409);
  });

  it('POST /api/reviews should fail with invalid input', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '1', rating: 0, comment: '' });

    expect(res.statusCode).toBe(400);
  });

  it('POST /api/reviews should fail without auth', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send({ bookId: '1', rating: 5, comment: 'Great book' });
    expect(res.statusCode).toBe(401);
  });

  it('DELETE /api/reviews/:reviewId should delete own review', async () => {
    const token = getToken('sandra');
    const createRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '3', rating: 4, comment: 'Solid' });

    const deleteRes = await request(app)
      .delete(`/api/reviews/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.statusCode).toBe(200);
  });

  it('DELETE /api/reviews/:reviewId should fail when review does not belong to user', async () => {
    const sandraToken = getToken('sandra');
    const newUser = { username: 'review_owner', password: 'pass123' };
    await request(app).post('/api/register').send(newUser);
    const ownerToken = getToken('review_owner');

    const createRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ bookId: '4', rating: 4, comment: 'Owner review' });

    const res = await request(app)
      .delete(`/api/reviews/${createRes.body.id}`)
      .set('Authorization', `Bearer ${sandraToken}`);

    expect(res.statusCode).toBe(404);
  });

  it('GET /api/reviews?bookId=1 should return only matching reviews', async () => {
    const token = getToken('sandra');
    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '1', rating: 5, comment: 'Excellent' });

    const res = await request(app).get('/api/reviews?bookId=1');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every(review => review.bookId === '1')).toBe(true);
  });
});
