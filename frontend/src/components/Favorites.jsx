import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, removeFavorite, updateFavoriteComment } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(state => state.favorites.items);
  const status = useAppSelector(state => state.favorites.status);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();
  // generated-by-copilot: track draft comment text per book id
  const [draftComments, setDraftComments] = useState({});

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate]);

  // generated-by-copilot: seed draft comments when favorites are loaded
  useEffect(() => {
    const initial = {};
    favorites.forEach(book => { initial[book.id] = book.comment || ''; });
    setDraftComments(initial);
  }, [favorites]);

  const handleRemoveFavorite = async (bookId) => {
    await dispatch(removeFavorite({ token, bookId }));
  };

  // generated-by-copilot: save comment to backend and update state
  const handleSaveComment = async (bookId) => {
    const comment = draftComments[bookId] ?? '';
    await dispatch(updateFavoriteComment({ token, bookId, comment }));
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
            <li key={book.id} style={{ marginBottom: '1rem', background: '#fff', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
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
              </div>
              {/* generated-by-copilot: comment section for each favorite */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <textarea
                  placeholder="Add a comment..."
                  value={draftComments[book.id] ?? ''}
                  onChange={e => setDraftComments(prev => ({ ...prev, [book.id]: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    minHeight: '4.5rem',
                  }}
                  aria-label={`Comment for ${book.title}`}
                />
                <button
                  onClick={() => handleSaveComment(book.id)}
                  style={{
                    alignSelf: 'flex-end',
                    background: '#4a90d9',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.3rem 1.2rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                  aria-label={`Save comment for ${book.title}`}
                >
                  Save
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Favorites;

