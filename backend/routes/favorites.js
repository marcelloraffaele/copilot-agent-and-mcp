const express = require('express');

function createFavoritesRouter({ usersFile, booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  router.get('/', authenticateToken, (req, res) => {
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const books = readJSON(booksFile);
    // generated-by-copilot: enrich each favorite book with its comment
    const favorites = user.favorites
      .map(fav => {
        const book = books.find(b => b.id === fav.bookId);
        if (!book) return null;
        return { ...book, comment: fav.comment || '' };
      })
      .filter(Boolean);
    res.json(favorites);
  });

  router.post('/', authenticateToken, (req, res) => {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ message: 'Book ID required' });
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // generated-by-copilot: store favorites as objects with bookId and comment
    if (!user.favorites.some(f => f.bookId === bookId)) {
      user.favorites.push({ bookId, comment: '' });
      writeJSON(usersFile, users);
    }
    res.status(200).json({ message: 'Book added to favorites' });
  });

  router.delete('/:bookId', authenticateToken, (req, res) => {
    const { bookId } = req.params;
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const index = user.favorites.findIndex(f => f.bookId === bookId);
    if (index === -1) return res.status(404).json({ message: 'Book not in favorites' });
    user.favorites.splice(index, 1);
    writeJSON(usersFile, users);
    res.status(200).json({ message: 'Book removed from favorites' });
  });

  // generated-by-copilot: endpoint to add or update a comment on a favorite book
  router.put('/:bookId/comment', authenticateToken, (req, res) => {
    const { bookId } = req.params;
    const { comment } = req.body;
    if (comment === undefined) return res.status(400).json({ message: 'Comment is required' });
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const fav = user.favorites.find(f => f.bookId === bookId);
    if (!fav) return res.status(404).json({ message: 'Book not in favorites' });
    fav.comment = comment;
    writeJSON(usersFile, users);
    res.status(200).json({ message: 'Comment updated', comment });
  });

  return router;
}

module.exports = createFavoritesRouter;
