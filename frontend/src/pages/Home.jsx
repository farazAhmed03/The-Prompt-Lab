import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [model, setModel] = useState('All');
  const [sort, setSort] = useState('newest');
  const [copiedId, setCopiedId] = useState(null);
  const [categoriesStats, setCategoriesStats] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [promptsPerPage, setPromptsPerPage] = useState(6);

  const categories = [
    'All',
    'DevOps & Cloud',
    'Software Development',
    'System Architecture',
    'AI Art & Midjourney',
    'Writing & Copywriting',
    'Data & Analytics',
    'General Productivity',
  ];

  const models = ['All', 'ChatGPT', 'Claude', 'Gemini', 'Midjourney', 'General / Any LLM'];

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (model !== 'All') params.model = model;
      if (sort !== 'newest') params.sort = sort;

      const [promptsRes, catRes] = await Promise.all([
        API.get('/prompts', { params }),
        API.get('/prompts/categories').catch(() => ({ data: null })),
      ]);

      setPrompts(promptsRes.data || []);
      setCategoriesStats(catRes.data);
      setCurrentPage(1); // Reset page on filter changes
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [category, model, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPrompts();
  };

  const handleCopy = async (promptObj) => {
    try {
      await navigator.clipboard.writeText(promptObj.prompt);
      setCopiedId(promptObj._id);

      // Track copy in backend
      await API.post(`/prompts/${promptObj._id}/copy`).catch(() => {});

      // Update local count
      setPrompts((prev) =>
        prev.map((p) => (p._id === promptObj._id ? { ...p, copies: (p.copies || 0) + 1 } : p))
      );

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleLike = async (promptId) => {
    if (!user) {
      alert('Please sign in to upvote prompts!');
      return;
    }

    try {
      const res = await API.post(`/prompts/${promptId}/like`);
      setPrompts((prev) =>
        prev.map((p) => {
          if (p._id === promptId) {
            const hasLiked = p.likes?.includes(user._id);
            const newLikes = hasLiked
              ? p.likes.filter((id) => id !== user._id)
              : [...(p.likes || []), user._id];
            return { ...p, likes: newLikes };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Failed to like prompt:', err);
    }
  };

  const getModelBadgeClass = (m) => {
    if (m === 'Claude') return 'badge-claude';
    if (m === 'ChatGPT') return 'badge-chatgpt';
    if (m === 'Midjourney') return 'badge-midjourney';
    if (m === 'Gemini') return 'badge-gemini';
    return 'badge-general';
  };

  // Pagination calculations
  const totalPrompts = prompts.length;
  const totalPages = Math.ceil(totalPrompts / promptsPerPage) || 1;
  const startIndex = (currentPage - 1) * promptsPerPage;
  const endIndex = Math.min(startIndex + promptsPerPage, totalPrompts);
  const displayedPrompts = prompts.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    const section = document.querySelector('.prompts-section-header');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-badge">⚡ OPEN-SOURCE PROMPT ENGINEERING PLATFORM</div>
        <h1 className="hero-main-title">
          Master AI with <span className="gradient-text">Battle-Tested</span> Prompts
        </h1>
        <p className="hero-desc">
          Discover, copy, and share high-performance prompts for DevOps, Software Architecture, Full-Stack Coding,
          and Creative Generative AI.
        </p>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hero-search-form">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search prompts by keyword, language, or use-case (e.g. Docker, Kubernetes, Security)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="main-search-input"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => {
                  setSearch('');
                  fetchPrompts();
                }}
              >
                ✕
              </button>
            )}
            <button type="submit" className="btn-search-submit">
              Search
            </button>
          </div>
        </form>
      </section>

      {/* Filter Row: Categories */}
      <div className="filters-container">
        <div className="category-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-chip ${category === cat ? 'active' : ''}`}
              onClick={() => {
                setCategory(cat);
                setCurrentPage(1);
              }}
            >
              {cat}
              {categoriesStats?.categories?.[cat] && (
                <span className="chip-count">{categoriesStats.categories[cat]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Secondary Controls: Target Model & Sort */}
        <div className="secondary-filters">
          <div className="filter-group">
            <label className="filter-label">Target Model:</label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sort By:</label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="newest">🕒 Newest First</option>
              <option value="popular">📋 Most Copied</option>
              <option value="liked">❤️ Most Liked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prompt Cards Grid Header */}
      <div className="prompts-section-header">
        <h2>
          Community Prompts{' '}
          <span className="count-tag">({prompts.length})</span>
        </h2>
        {category !== 'All' && (
          <span className="active-filter-indicator">
            Filtered by: <strong>{category}</strong>
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading curated prompt library...</p>
        </div>
      ) : prompts.length === 0 ? (
        <div className="empty-state">
          <h3>No Prompts Found</h3>
          <p>Try searching for a different keyword or select another category.</p>
          <button
            className="btn-primary"
            onClick={() => {
              setSearch('');
              setCategory('All');
              setModel('All');
              setCurrentPage(1);
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="prompts-grid">
            {displayedPrompts.map((p) => {
              const isCopied = copiedId === p._id;
              const hasLiked = user && p.likes?.includes(user._id);

              return (
                <div key={p._id} className="prompt-card">
                  {/* Card Top: Badges */}
                  <div className="card-top-row">
                    <div className="badges-group">
                      <span className="cat-badge">{p.category}</span>
                      <span className={`model-badge ${getModelBadgeClass(p.targetModel)}`}>
                        {p.targetModel}
                      </span>
                      {p.isFeatured && <span className="featured-star">★ Featured</span>}
                    </div>
                    <div className="card-stat-pill">
                      📋 {p.copies || 0} copies
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="prompt-card-title">{p.title}</h3>
                  <p className="prompt-card-desc">{p.description}</p>

                  {/* Prompt Box */}
                  <div className="prompt-content-box">
                    <pre className="prompt-text-preview">{p.prompt}</pre>
                  </div>

                  {/* Tags */}
                  {p.tags && p.tags.length > 0 && (
                    <div className="tags-row">
                      {p.tags.slice(0, 4).map((tag, idx) => (
                        <span key={idx} className="tag-item">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="card-footer">
                    <div className="author-info">
                      <span className="author-name">By {p.author || 'Community Member'}</span>
                    </div>

                    <div className="card-actions">
                      <button
                        className={`btn-like ${hasLiked ? 'liked' : ''}`}
                        onClick={() => handleLike(p._id)}
                        title="Upvote prompt"
                      >
                        ❤️ {p.likes?.length || 0}
                      </button>

                      <button
                        className={`btn-copy ${isCopied ? 'copied' : ''}`}
                        onClick={() => handleCopy(p)}
                      >
                        {isCopied ? '✅ Copied!' : '📋 Copy Prompt'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPrompts > 0 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{totalPrompts}</strong> prompts
              </div>

              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  « Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`pagination-btn page-num ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next »
                </button>
              </div>

              <div className="pagination-limit">
                <label>Per Page:</label>
                <select
                  value={promptsPerPage}
                  onChange={(e) => {
                    setPromptsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="pagination-select"
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
