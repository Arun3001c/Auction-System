import React, { useEffect, useState } from 'react';
import { Crown, TrendingUp, Users, Award, Plus, Minus, Edit3, Star } from 'lucide-react';
import axios from 'axios';

const PAGE_SIZE = 10;

const AdminHandleCrownScore = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    averageScore: 0,
    topScorer: null,
    totalCrowns: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/admin/users`, {
        params: { page, pageSize: PAGE_SIZE }
      });
      setUsers(res.data.users);
      setTotal(res.data.total);
      
      // Calculate stats
      const totalCrowns = res.data.users.reduce((sum, u) => sum + (u.crownScore || 0), 0);
      const averageScore = totalCrowns / res.data.users.length || 0;
      const topScorer = res.data.users.reduce((max, u) => 
        (u.crownScore || 0) > (max?.crownScore || 0) ? u : max, null);
      
      setStats({
        totalUsers: res.data.total,
        averageScore: averageScore.toFixed(1),
        topScorer,
        totalCrowns
      });
    } catch (err) {
      console.error('Error fetching users:', err);
    }
    setLoading(false);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({ crownScore: user.crownScore || 0 });
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: parseInt(e.target.value) || 0 });
  };

  const handleQuickUpdate = (user, change) => {
    const newScore = Math.max(0, (user.crownScore || 0) + change);
    updateUserScore(user._id, newScore);
  };

  const updateUserScore = async (userId, newScore) => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/admin/users/${userId}`, { 
        crownScore: newScore 
      });
      fetchUsers();
    } catch (err) {
      alert('Failed to update crown score');
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/admin/users/${editUser._id}`, { 
        crownScore: form.crownScore 
      });
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      alert('Failed to update crown score');
    }
    setLoading(false);
  };

  const getCrownLevel = (score) => {
    if (score >= 1000) return { level: 'Royal Crown', color: '#ffd700', icon: '👑' };
    if (score >= 500) return { level: 'Golden Crown', color: '#ff8c00', icon: '👑' };
    if (score >= 100) return { level: 'Silver Crown', color: '#c0c0c0', icon: '👑' };
    if (score >= 50) return { level: 'Bronze Crown', color: '#cd7f32', icon: '🥉' };
    return { level: 'Novice', color: '#6b7280', icon: '⭐' };
  };

  if (loading && users.length === 0) {
    return (
      <div className="admin-users-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading crown scores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page crown-score-page">
      {/* Header */}
      <div className="crown-header">
        <h2>👑 Crown Score Management</h2>
        <p>Manage user crown scores and achievements</p>
      </div>

      {/* Stats Cards */}
      <div className="crown-stats">
        <div className="stat-card total-users">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
            <span className="trend">Registered users</span>
          </div>
        </div>

        <div className="stat-card total-crowns">
          <div className="stat-icon">
            <Crown size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalCrowns}</h3>
            <p>Total Crowns</p>
            <span className="trend positive">
              <TrendingUp size={16} />
              Distributed
            </span>
          </div>
        </div>

        <div className="stat-card average-score">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.averageScore}</h3>
            <p>Average Score</p>
            <span className="trend neutral">Per user</span>
          </div>
        </div>

        <div className="stat-card top-scorer">
          <div className="stat-icon">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.topScorer?.crownScore || 0}</h3>
            <p>Top Score</p>
            <span className="trend champion">
              {stats.topScorer?.fullName || 'No data'}
            </span>
          </div>
        </div>
      </div>

      {/* Crown Score Table */}
      <div className="crown-section">
        <h3>User Crown Scores</h3>
        <div className="table-container">
          <table className="user-table crown-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Current Score</th>
                <th>Crown Level</th>
                <th>Quick Actions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const crownInfo = getCrownLevel(user.crownScore || 0);
                return (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="user-name">{user.fullName}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="crown-score">
                        <Crown size={20} color={crownInfo.color} />
                        <span className="score-value">{user.crownScore || 0}</span>
                      </div>
                    </td>
                    <td>
                      <div className="crown-level" style={{ color: crownInfo.color }}>
                        <span className="level-icon">{crownInfo.icon}</span>
                        {crownInfo.level}
                      </div>
                    </td>
                    <td>
                      <div className="quick-actions">
                        <button 
                          className="quick-btn minus"
                          onClick={() => handleQuickUpdate(user, -10)}
                          title="Decrease by 10"
                          disabled={loading}
                        >
                          <Minus size={16} />
                          10
                        </button>
                        <button 
                          className="quick-btn plus"
                          onClick={() => handleQuickUpdate(user, 10)}
                          title="Increase by 10"
                          disabled={loading}
                        >
                          <Plus size={16} />
                          10
                        </button>
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(user)}
                        disabled={loading}
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          {Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, i) => (
            <button 
              key={i} 
              onClick={() => setPage(i + 1)} 
              className={page === i + 1 ? 'active' : ''}
              disabled={loading}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="modal-overlay">
          <div className="edit-modal crown-modal">
            <div className="modal-header">
              <h3>Edit Crown Score</h3>
              <button className="close-btn" onClick={() => setEditUser(null)}>×</button>
            </div>
            
            <div className="user-preview">
              <div className="user-avatar large">
                {editUser.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h4>{editUser.fullName}</h4>
                <p>{editUser.email}</p>
                <div className="current-level">
                  Current Level: {getCrownLevel(editUser.crownScore || 0).level}
                </div>
              </div>
            </div>

            <form onSubmit={e => { e.preventDefault(); handleUpdate(); }}>
              <div className="score-input-section">
                <label>Crown Score</label>
                <div className="score-input-wrapper">
                  <input 
                    name="crownScore" 
                    value={form.crownScore} 
                    onChange={handleFormChange} 
                    placeholder="Crown Score" 
                    type="number" 
                    min="0" 
                    max="9999"
                  />
                  <div className="score-preview">
                    New Level: {getCrownLevel(form.crownScore).level}
                  </div>
                </div>
              </div>

              <div className="quick-set-buttons">
                <button type="button" onClick={() => setForm({crownScore: 0})}>
                  Reset to 0
                </button>
                <button type="button" onClick={() => setForm({crownScore: 50})}>
                  Set to 50
                </button>
                <button type="button" onClick={() => setForm({crownScore: 100})}>
                  Set to 100
                </button>
                <button type="button" onClick={() => setForm({crownScore: 500})}>
                  Set to 500
                </button>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-update" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Score'}
                </button>
                <button type="button" className="btn-cancel" onClick={() => setEditUser(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .crown-score-page {
          max-width: 1200px;
        }

        .crown-header {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #ffd700, #ffb347);
          border-radius: 12px;
          color: #8b4513;
        }

        .crown-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .crown-header p {
          margin: 0;
          opacity: 0.8;
        }

        .crown-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-card.total-users .stat-icon {
          background: linear-gradient(135deg, #ddd6fe, #c4b5fd);
          color: #5b21b6;
        }

        .stat-card.total-crowns .stat-icon {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
        }

        .stat-card.average-score .stat-icon {
          background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
          color: #3730a3;
        }

        .stat-card.top-scorer .stat-icon {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #14532d;
        }

        .crown-section {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .crown-section h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .crown-table .crown-score {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .crown-level {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .level-icon {
          font-size: 1.2rem;
        }

        .quick-actions {
          display: flex;
          gap: 0.5rem;
        }

        .quick-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-btn.plus {
          background: #dcfce7;
          color: #166534;
        }

        .quick-btn.plus:hover {
          background: #bbf7d0;
        }

        .quick-btn.minus {
          background: #fecaca;
          color: #7f1d1d;
        }

        .quick-btn.minus:hover {
          background: #fca5a5;
        }

        .quick-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-edit {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .btn-edit:hover {
          background: #e5e7eb;
        }

        .btn-edit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .crown-modal {
          max-width: 500px;
        }

        .user-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .user-avatar.large {
          width: 60px;
          height: 60px;
          font-size: 1.5rem;
        }

        .user-preview h4 {
          margin: 0;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .user-preview p {
          margin: 0.25rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .current-level {
          font-size: 0.75rem;
          color: #059669;
          font-weight: 600;
        }

        .score-input-section {
          margin-bottom: 1.5rem;
        }

        .score-input-section label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .score-input-wrapper input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .score-input-wrapper input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .score-preview {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #f0f9ff;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #0369a1;
          font-weight: 500;
        }

        .quick-set-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .quick-set-buttons button {
          padding: 0.5rem;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-set-buttons button:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .trend.positive {
          color: #059669;
          background: #d1fae5;
        }

        .trend.neutral {
          color: #6b7280;
          background: #f3f4f6;
        }

        .trend.champion {
          color: #d97706;
          background: #fef3c7;
          font-weight: 600;
        }

        .trend {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .crown-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .quick-actions {
            flex-direction: column;
            gap: 0.25rem;
          }
          
          .quick-set-buttons {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminHandleCrownScore;
