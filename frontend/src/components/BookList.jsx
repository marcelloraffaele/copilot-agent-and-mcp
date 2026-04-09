import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBooks } from '../store/booksSlice';
import { addFavorite, removeFavorite, fetchFavorites, clearAllFavorites } from '../store/favoritesSlice';
import { fetchReviews, addReview, deleteReview } from '../store/reviewsSlice';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/BookList.module.css';

const BookList = () => {
  const dispatch = useAppDispatch();
  const books = useAppSelector(state => state.books.items);
  const status = useAppSelector(state => state.books.status);
  const token = useAppSelector(state => state.user.token);
  const username = useAppSelector(state => state.user.username);
  const navigate = useNavigate();
  const favorites = useAppSelector(state => state.favorites.items);
  const reviews = useAppSelector(state => state.reviews.items);
  const [sortOption, setSortOption] = useState('title-asc');
  const [reviewInputs, setReviewInputs] = useState({});
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchBooks());
    dispatch(fetchFavorites(token));
    dispatch(fetchReviews());
  }, [dispatch, token, navigate]);

  const handleAddFavorite = async (bookId) => {
    if (!token) { navigate('/'); return; }
    await dispatch(addFavorite({ token, bookId }));
    dispatch(fetchFavorites(token));
  };

  const handleRemoveFavorite = async (bookId) => {
    if (!token) { navigate('/'); return; }
    await dispatch(removeFavorite({ token, bookId }));
    dispatch(fetchFavorites(token));
  };

  // ← from main
  const handleClearAllFavorites = async () => {
    if (!window.confirm('Are you sure you want to clear all your favorites?')) return;
    await dispatch(clearAllFavorites({ token }));
  };

  const handleReviewInputChange = (bookId, field, value) => {
    setReviewInputs(prev => ({
      ...prev,
      [bookId]: {
        rating: prev[bookId]?.rating || '5',
        comment: prev[bookId]?.comment || '',
        [field]: value,
      },
    }));
  };

  const handleAddReview = async (bookId) => {
    const rating = reviewInputs[bookId]?.rating || '5';
    const comment = (reviewInputs[bookId]?.comment || '').trim();
    if (!comment) {
      setReviewError('Review comment is required.');
      return;
    }
    setReviewError('');
    const resultAction = await dispatch(addReview({ token, bookId, rating: Number(rating), comment }));
    if (addReview.rejected.match(resultAction)) {
      setReviewError(resultAction.error.message || 'Failed to submit review');
      return;
    }
    setReviewInputs(prev => ({
      ...prev,
      [bookId]: { rating: '5', comment: '' },
    }));
  };

  const handleDeleteReview = async (reviewId) => {
    setReviewError('');
    const resultAction = await dispatch(deleteReview({ token, reviewId }));
    if (deleteReview.rejected.match(resultAction)) {
      setReviewError(resultAction.error.message || 'Failed to delete review');
    }
  };

  // ← from feature branch
  const sortedBooks = useMemo(() => {
    const [field, direction] = sortOption.split('-');
    return [...books].sort((a, b) => {
      const valueA = a[field] == null ? '' : String(a[field]);
      const valueB = b[field] == null ? '' : String(b[field]);
      const comparison = valueA.localeCompare(valueB, undefined, { sensitivity: 'base' });
      return direction === 'asc' ? comparison : -comparison;
    });
  }, [books, sortOption]);

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load books.</div>;

  return (
    // ← sidebar layout from main, sort controls + sortedBooks from feature branch
    <div className={styles.pageLayout}>
      <aside className={styles.sidebar}>
        <span className={styles.sidebarTitle}>Actions</span>
        <button
          className={styles.clearBtn}
          onClick={handleClearAllFavorites}
          disabled={favorites.length === 0}
        >
          Clear All Favorites
        </button>
      </aside>
      <div className={styles.pageContent}>
        <h2>Books</h2>
        {books.length === 0 ? (
          <div style={{
            background: '#fff', padding: '2rem', borderRadius: '8px',
            maxWidth: '400px', margin: '2rem auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            textAlign: 'center', color: '#888',
          }}>
            <p>No books available.</p>
            <p>Check back later or add a new book if you have permission.</p>
          </div>
        ) : (
          <>
            <div className={styles.sortControls}>
              <label htmlFor="book-sort">Sort by:</label>
              <select
                id="book-sort"
                className={styles.sortSelect}
                value={sortOption}
                onChange={event => setSortOption(event.target.value)}
              >
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="author-asc">Author (A-Z)</option>
                <option value="author-desc">Author (Z-A)</option>
              </select>
            </div>
            <div className={styles.bookGrid}>
              {sortedBooks.map(book => {
                const isFavorite = favorites.some(fav => fav.id === book.id);
                const bookReviews = reviews.filter(review => review.bookId === book.id);
                const averageRating = bookReviews.length > 0
                  ? (bookReviews.reduce((sum, review) => sum + review.rating, 0) / bookReviews.length).toFixed(1)
                  : null;
                return (
                  <div className={styles.bookCard + ' ' + styles.bookCardWithHeart} key={book.id} data-testid="book-card">
                    {isFavorite && (
                      <span className={styles.favoriteHeart} title="In Favorites">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#e25555" stroke="#e25555" strokeWidth="1.5">
                          <path d="M12 21s-6.2-5.2-8.4-7.4C1.2 11.2 1.2 8.1 3.1 6.2c1.9-1.9 5-1.9 6.9 0l2 2 2-2c1.9-1.9 5-1.9 6.9 0 1.9 1.9 1.9 5 0 6.9C18.2 15.8 12 21 12 21z"/>
                        </svg>
                      </span>
                    )}
                    <div className={styles.bookTitle} data-testid="book-title">{book.title}</div>
                    <div className={styles.bookAuthor} data-testid="book-author">by {book.author}</div>
                    <button
                      className={styles.simpleBtn}
                      onClick={() => isFavorite ? handleRemoveFavorite(book.id) : handleAddFavorite(book.id)}
                    >
                      {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </button>
                    <div className={styles.reviewSection}>
                      <div className={styles.reviewHeader}>
                        <strong>Reviews</strong>
                        {averageRating && (
                          <span className={styles.averageRating}>Avg rating: {averageRating} ({bookReviews.length})</span>
                        )}
                      </div>
                      <div className={styles.reviewForm}>
                        <select
                          data-testid="review-rating"
                          value={reviewInputs[book.id]?.rating || '5'}
                          onChange={event => handleReviewInputChange(book.id, 'rating', event.target.value)}
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                        <input
                          data-testid="review-comment"
                          type="text"
                          placeholder="Write a review"
                          value={reviewInputs[book.id]?.comment || ''}
                          onChange={event => handleReviewInputChange(book.id, 'comment', event.target.value)}
                          maxLength={250}
                        />
                        <button
                          type="button"
                          data-testid="review-submit"
                          className={styles.simpleBtn}
                          onClick={() => handleAddReview(book.id)}
                        >
                          Submit Review
                        </button>
                      </div>
                      {bookReviews.length === 0 ? (
                        <p className={styles.reviewEmpty}>No reviews yet.</p>
                      ) : (
                        <ul className={styles.reviewList}>
                          {bookReviews.map(review => (
                            <li key={review.id} className={styles.reviewItem}>
                              <span><strong>{review.username}</strong> ({review.rating}/5): {review.comment}</span>
                              {review.username === username && (
                                <button
                                  type="button"
                                  data-testid="review-delete"
                                  className={styles.reviewDelete}
                                  onClick={() => handleDeleteReview(review.id)}
                                >
                                  Delete
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {reviewError && <div className={styles.reviewError}>{reviewError}</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default BookList;
