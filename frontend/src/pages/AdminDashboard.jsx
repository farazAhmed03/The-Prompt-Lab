import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prompts');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [promptsRes, usersRes] = await Promise.all([
        API.get('/prompts'),
        API.get('/auth/users').catch(() => ({ data: [] })),
      ]);
      setPrompts(promptsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeletePrompt = async (id) => {
    if (!window.confirm('Admin Action: Permanently delete this prompt?')) return;
    try {
      await API.delete(`/prompts/${encodeURIComponent(id)}`);
      setPrompts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleToggleFeatured = async (p) => {
    try {
      const res = await API.put(`/prompts/${encodeURIComponent(p._id)}`, { isFeatured: !p.isFeatured });
      setPrompts((prev) => prev.map((item) => (item._id === p._id ? res.data : item)));
    } catch (err) {
      alert('Failed to toggle featured status: ' + err.message);
    }
  };

  const totalCopies = prompts.reduce((acc, p) => acc + (p.copies || 0), 0);

  return (
    <div className="container">
      <div className="admin-header">
        <div>
          <span className="admin-badge">CLUSTER IAM & MODERATION</span>
          <h1>Admin Management Console</h1>
          <p className="admin-sub">Platform-wide prompt curation, community metrics, and user management.</p>
        </div>
      </div>

      {/* Admin KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="kpi-label">Total Prompts</span>
          <span className="kpi-number">{prompts.length}</span>
          <span className="kpi-foot">Published across all categories</span>
        </div>
        <div className="admin-kpi-card">
          <span className="kpi-label">Total Community Copies</span>
          <span className="kpi-number">{totalCopies}</span>
          <span className="kpi-foot">Platform utility metric</span>
        </div>
        <div className="admin-kpi-card">
          <span className="kpi-label">Registered Users</span>
          <span className="kpi-number">{users.length}</span>
          <span className="kpi-foot">Engineers & Creators</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          📝 Prompt Moderation ({prompts.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Directory ({users.length})
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading admin console...</p>
        </div>
      ) : activeTab === 'prompts' ? (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title & Category</th>
                <th>Target Model</th>
                <th>Author</th>
                <th>Copies</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>{p.title}</strong>
                    <div className="table-subtext">{p.category}</div>
                  </td>
                  <td>
                    <span className="model-badge">{p.targetModel}</span>
                  </td>
                  <td>{p.author || 'Anonymous'}</td>
                  <td>📋 {p.copies || 0}</td>
                  <td>
                    <button
                      className={`btn-featured-toggle ${p.isFeatured ? 'featured' : ''}`}
                      onClick={() => handleToggleFeatured(p)}
                    >
                      {p.isFeatured ? '★ Featured' : '☆ Standard'}
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn-delete-sm"
                      onClick={() => handleDeletePrompt(p._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-pill ${u.role === 'admin' ? 'admin' : 'user'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
