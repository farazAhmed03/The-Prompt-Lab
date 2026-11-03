import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => (location.pathname === path ? 'nav-link active' : 'nav-link');

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo" onClick={() => setIsMobileOpen(false)}>
          <div className="brand-icon">⚡</div>
          <div className="brand-text">
            <span className="brand-title">PromptVerse</span>
            <span className="brand-sub">AI PROMPT HUB</span>
          </div>
        </Link>

        {/* Center Nav Links (Desktop) */}
        <div className="nav-menu desktop-only">
          <Link to="/" className={isActive('/')}>
            🔍 Explore Prompts
          </Link>

          {user && (
            <Link to="/my-prompts" className={isActive('/my-prompts')}>
              📝 My Prompts
            </Link>
          )}

          <Link to="/guide" className={isActive('/guide')}>
            📖 User Guide (EN)
          </Link>

          {user && user.role === 'admin' && (
            <Link to="/admin" className={isActive('/admin')}>
              🛡️ Admin Console
            </Link>
          )}
        </div>

        {/* Right Nav Action (Desktop) */}
        <div className="nav-auth desktop-only">
          {/* Buy Me a Coffee button */}
          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-coffee"
            title="Support this open-source project"
          >
            <span className="coffee-icon">☕</span>
            <span className="coffee-text">Buy Me a Coffee</span>
          </a>

          {user ? (
            <div className="user-profile-menu">
              <Link to="/my-prompts" className="btn-create-prompt">
                + Create Prompt
              </Link>
              <div className="user-badge">
                <span className="user-avatar">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                <span className="user-name">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn-signin">
                Sign In
              </Link>
              <Link to="/register" className="btn-signup">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Controls: Coffee + Hamburger */}
        <div className="mobile-header-actions">
          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-coffee-mobile"
            title="Support"
          >
            ☕
          </a>
          <button
            className="mobile-hamburger-btn"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {isMobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Sliding Dropdown Menu */}
      {isMobileOpen && (
        <div className="mobile-dropdown-menu">
          <div className="mobile-nav-links">
            <Link to="/" className={isActive('/')} onClick={() => setIsMobileOpen(false)}>
              🔍 Explore Prompts
            </Link>

            {user && (
              <Link to="/my-prompts" className={isActive('/my-prompts')} onClick={() => setIsMobileOpen(false)}>
                📝 My Prompts
              </Link>
            )}

            <Link to="/guide" className={isActive('/guide')} onClick={() => setIsMobileOpen(false)}>
              📖 User Guide (EN)
            </Link>

            {user && user.role === 'admin' && (
              <Link to="/admin" className={isActive('/admin')} onClick={() => setIsMobileOpen(false)}>
                🛡️ Admin Console
              </Link>
            )}
          </div>

          <div className="mobile-auth-section">
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-coffee-full"
            >
              <span>☕</span> Buy Me a Coffee
            </a>

            {user ? (
              <div className="mobile-user-box">
                <div className="user-badge">
                  <span className="user-avatar">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                  <span className="user-name">{user.name}</span>
                </div>
                <Link
                  to="/my-prompts"
                  className="btn-create-prompt"
                  onClick={() => setIsMobileOpen(false)}
                >
                  + Create Prompt
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileOpen(false);
                  }}
                  className="btn-logout"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mobile-auth-btns">
                <Link
                  to="/login"
                  className="btn-signin"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-signup"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
