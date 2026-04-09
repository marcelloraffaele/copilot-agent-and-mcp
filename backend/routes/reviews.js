const express = require('express');
const crypto = require('crypto');

function createRateLimitMiddleware({ maxRequests, windowMs }) {
  const requestsByKey = new Map();
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const key = `${req.ip}:${authHeader}`;
    const now = Date.now();
    const recentRequests = (requestsByKey.get(key) || []).filter(timestamp => now - timestamp < windowMs);
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }
    recentRequests.push(now);
    requestsByKey.set(key, recentRequests);
    next();
  };
}

function createReviewsRouter({ usersFile, booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();
  const writeRateLimit = createRateLimitMiddleware({ maxRequests: 30, windowMs: 60 * 1000 });

  router.get('/', (req, res) => {
    const { bookId } = req.query;
    const users = readJSON(usersFile);
    const reviews = users.flatMap(user => {
      const userReviews = Array.isArray(user.reviews) ? user.reviews : [];
      return userReviews.map(review => ({ ...review, username: user.username }));
    });
    const filteredReviews = bookId ? reviews.filter(review => review.bookId === bookId) : reviews;
    res.json(filteredReviews);
  });

  router.post('/', writeRateLimit, authenticateToken, (req, res) => {
    const { bookId, rating, comment } = req.body;
    const numericRating = Number(rating);
    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';

    if (!bookId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5 || !trimmedComment) {
      return res.status(400).json({ message: 'bookId, rating (1-5), and comment are required' });
    }

    const books = readJSON(booksFile);
    const bookExists = books.some(book => book.id === bookId);
    if (!bookExists) return res.status(404).json({ message: 'Book not found' });

    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!Array.isArray(user.reviews)) user.reviews = [];
    if (user.reviews.some(review => review.bookId === bookId)) {
      return res.status(409).json({ message: 'You already reviewed this book' });
    }

    const review = {
      id: crypto.randomUUID(),
      bookId,
      rating: numericRating,
      comment: trimmedComment,
      createdAt: new Date().toISOString(),
    };
    user.reviews.push(review);
    writeJSON(usersFile, users);
    res.status(201).json({ ...review, username: user.username });
  });

  router.delete('/:reviewId', writeRateLimit, authenticateToken, (req, res) => {
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!Array.isArray(user.reviews)) user.reviews = [];

    const reviewIndex = user.reviews.findIndex(review => review.id === req.params.reviewId);
    if (reviewIndex === -1) return res.status(404).json({ message: 'Review not found' });

    user.reviews.splice(reviewIndex, 1);
    writeJSON(usersFile, users);
    res.status(200).json({ message: 'Review deleted' });
  });

  return router;
}

module.exports = createReviewsRouter;
