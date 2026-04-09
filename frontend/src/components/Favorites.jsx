import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, removeFavorite } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(state => state.favorites.items);
  const status = useAppSelector(state => state.favorites.status);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate]);

  const handleRemoveFavorite = async (bookId) => {
    await dispatch(removeFavorite({ token, bookId }));
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load favorites.</div>;

  return (
    <div>
      <h2>My Favorite Books</h2>
      {favorites.length === 0 ? (
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '400px',
          margin: '2rem auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          textAlign: 'center',
          color: '#888',
        }}>
          <p>No favorite books yet.</p>
          <p>
            Go to the <a href="/books" onClick={e => { e.preventDefault(); navigate('/books'); }}>book list</a> to add some!
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {favorites.map(book => (
            <li key={book.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <span><strong>{book.title}</strong> by {book.author}</span>
              <button
                onClick={() => handleRemoveFavorite(book.id)}
                style={{
                  background: '#e25555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.3rem 0.8rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                aria-label={`Remove ${book.title} from favorites`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Favorites;

