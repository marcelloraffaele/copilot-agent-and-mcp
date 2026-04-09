const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');

const fs = require('fs');
const usersFile = path.join(__dirname, '../data/test-users.json');
const booksFile = path.join(__dirname, '../data/test-books.json');

// Helper to get a valid JWT
const jwt = require('jsonwebtoken');
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

describe('Favorites API', () => {
  it('GET /api/favorites should fail without auth', async () => {
    const res = await request(app).get('/api/favorites');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/favorites should return favorites for valid user', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/favorites should 404 for non-existent user', async () => {
    const token = getToken('nouser');
    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('POST /api/favorites should add a book to favorites', async () => {
    const token = getToken('sandra');
    // Pick a book not already in favorites
    const books = JSON.parse(fs.readFileSync(booksFile, 'utf-8'));
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const sandra = users.find(u => u.username === 'sandra');
    const notFav = books.find(b => !sandra.favorites.some(f => f.bookId === b.id));
    if (!notFav) return; // skip if all are favorites
    const res = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: notFav.id });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/added/);
  });

  it('POST /api/favorites should not duplicate favorites', async () => {
    const token = getToken('sandra');
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const sandra = users.find(u => u.username === 'sandra');
    const alreadyFav = sandra.favorites[0].bookId;
    const res = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: alreadyFav });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/added/);
  });

  it('POST /api/favorites should fail with missing bookId', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/favorites should 404 for non-existent user', async () => {
    const token = getToken('nouser');
    const res = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '1' });
    expect(res.statusCode).toBe(404);
  });

  it('POST /api/favorites should fail without auth', async () => {
    const res = await request(app)
      .post('/api/favorites')
      .send({ bookId: '1' });
    expect(res.statusCode).toBe(401);
  });

  it('DELETE /api/favorites/:bookId should remove a book from favorites', async () => {
    const token = getToken('sandra');
    // First ensure the book is in favorites
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const sandra = users.find(u => u.username === 'sandra');
    const favBookId = sandra.favorites[0] ? sandra.favorites[0].bookId : null;
    if (!favBookId) return; // skip if no favorites
    const res = await request(app)
      .delete(`/api/favorites/${favBookId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/removed/);
    // Verify it's actually removed
    const updatedUsers = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const updatedSandra = updatedUsers.find(u => u.username === 'sandra');
    expect(updatedSandra.favorites.some(f => f.bookId === favBookId)).toBe(false);
  });

  it('DELETE /api/favorites/:bookId should 404 if book not in favorites', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .delete('/api/favorites/nonexistent-book-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('DELETE /api/favorites/:bookId should fail without auth', async () => {
    const res = await request(app)
      .delete('/api/favorites/1');
    expect(res.statusCode).toBe(401);
  });

  it('DELETE /api/favorites/:bookId should 404 for non-existent user', async () => {
    const token = getToken('nouser');
    const res = await request(app)
      .delete('/api/favorites/1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  // generated-by-copilot: tests for comment endpoint
  it('PUT /api/favorites/:bookId/comment should update a comment', async () => {
    const token = getToken('sandra');
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const sandra = users.find(u => u.username === 'sandra');
    const favBookId = sandra.favorites[0].bookId;
    const res = await request(app)
      .put(`/api/favorites/${favBookId}/comment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ comment: 'A wonderful read!' });
    expect(res.statusCode).toBe(200);
    expect(res.body.comment).toBe('A wonderful read!');
    const updatedUsers = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const updatedSandra = updatedUsers.find(u => u.username === 'sandra');
    const fav = updatedSandra.favorites.find(f => f.bookId === favBookId);
    expect(fav.comment).toBe('A wonderful read!');
  });

  it('PUT /api/favorites/:bookId/comment should 400 when comment is missing', async () => {
    const token = getToken('sandra');
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const sandra = users.find(u => u.username === 'sandra');
    const favBookId = sandra.favorites[0].bookId;
    const res = await request(app)
      .put(`/api/favorites/${favBookId}/comment`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('PUT /api/favorites/:bookId/comment should 404 if book not in favorites', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .put('/api/favorites/nonexistent-book-id/comment')
      .set('Authorization', `Bearer ${token}`)
      .send({ comment: 'test' });
    expect(res.statusCode).toBe(404);
  });

  it('PUT /api/favorites/:bookId/comment should fail without auth', async () => {
    const res = await request(app)
      .put('/api/favorites/1/comment')
      .send({ comment: 'test' });
    expect(res.statusCode).toBe(401);
  });
});
