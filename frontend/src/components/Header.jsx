import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/userSlice';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const username = useAppSelector(state => state.user.username);
  // generated-by-copilot: read userType from Redux store to display in header
  const userType = useAppSelector(state => state.user.userType);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <header style={{
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
      background: '#20b2aa',
      color: '#fff',
      minHeight: '3.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      boxSizing: 'border-box',
    }}>
      <span style={{ fontWeight: 700, fontSize: '1.3rem', letterSpacing: '1px' }}>Book Favorites</span>
      {username && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <a
              id="books-link"
              href="/books"
              onClick={e => { e.preventDefault(); navigate('/books'); }}
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 500,
                padding: '0.3rem 0.8rem',
                borderRadius: '4px',
                transition: 'background 0.2s',
                background: window.location.pathname === '/books' ? 'rgba(255,255,255,0.18)' : 'none',
              }}
            >
              Books
            </a>
            <a
              id="favorites-link"
              href="/favorites"
              onClick={e => { e.preventDefault(); navigate('/favorites'); }}
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 500,
                padding: '0.3rem 0.8rem',
                borderRadius: '4px',
                transition: 'background 0.2s',
                background: window.location.pathname === '/favorites' ? 'rgba(255,255,255,0.18)' : 'none',
              }}
            >
              Favorites
            </a>
          </nav>
          <span style={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>
            Hi, {username}
            {/* generated-by-copilot: display user type badge next to the username */}
            <span
              id="user-type-badge"
              style={{
                marginLeft: '0.5rem',
                padding: '0.1rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: userType === 'administrator' ? '#ff6b35' : 'rgba(255,255,255,0.25)',
                color: '#fff',
                textTransform: 'capitalize',
                verticalAlign: 'middle',
              }}
            >
              {userType || 'member'}
            </span>
          </span>
          <button id="logout" onClick={handleLogout} style={{ padding: '0.3rem 1rem', fontSize: '1rem', background: '#fff', color: '#20b2aa', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      )}
    </header>
  );
};

export default Header;
