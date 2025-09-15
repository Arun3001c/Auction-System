import React, { useEffect, useState, useRef } from 'react';
import { Search, Users, UserCheck, UserX, Edit3, Shield, ShieldOff, Mail, Phone, Crown } from 'lucide-react';
import axios from 'axios';

const PAGE_SIZE = 10;

const AdminHandleUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    suspendedUsers: 0,
    adminUsers: 0
  });

  // Debounce search input
  const searchTimeout = useRef();
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [search, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Replace with your backend API endpoint
      const res = await axios.get(`http://localhost:5001/api/admin/users`, {
        params: { search: search.trim(), page, pageSize: PAGE_SIZE }
      });
      setUsers(res.data.users);
      setTotal(res.data.total);
      
      // Calculate stats
      const verified = res.data.users.filter(u => u.isEmailVerified && u.isPhoneVerified).length;
      const suspended = res.data.users.filter(u => u.suspended).length;
      const admins = res.data.users.filter(u => u.role === 'admin').length;
      
      setStats({
        totalUsers: res.data.total,
        verifiedUsers: verified,
        suspendedUsers: suspended,
        adminUsers: admins
      });
    } catch (err) {
      console.error('Error fetching users:', err);
    }
    setLoading(false);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({ ...user, password: '' });
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // Ensure boolean values for verification fields
      const payload = {
        ...form,
        isEmailVerified: !!form.isEmailVerified,
        isPhoneVerified: !!form.isPhoneVerified,
      };
      const res = await axios.put(`http://localhost:5001/api/admin/users/${editUser._id}`, payload);
      if (res.status === 200) {
        alert('Profile updated successfully');
      } else {
        alert(res.data?.message || 'Update failed');
      }
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed: ' + err.message);
    }
    setLoading(false);
  };

  const handleSuspendToggle = async (user) => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/admin/users/${user._id}/${user.suspended ? 'unsuspend' : 'suspend'}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status');
    }
    setLoading(false);
  };

  return (
    <div className="admin-users-page">
      {/* Header */}
      <div className="users-header">
        <h2>👥 User Management</h2>
        <p>Monitor and manage user accounts, permissions, and verification status</p>
      </div>

      {/* Stats Cards */}
      <div className="users-stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card verified">
          <div className="stat-icon">
            <UserCheck size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.verifiedUsers}</h3>
            <p>Verified Users</p>
          </div>
        </div>

        <div className="stat-card suspended">
          <div className="stat-icon">
            <UserX size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.suspendedUsers}</h3>
            <p>Suspended</p>
          </div>
        </div>

        <div className="stat-card admins">
          <div className="stat-icon">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.adminUsers}</h3>
            <p>Administrators</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="users-section">
        <div className="section-header">
          <h3>All Users</h3>
          <div className="user-search-bar">
            <div className="search-input-wrapper">
              {/* <Search size={20} className="search-icon" /> */}
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchUsers(); }}
              />
            </div>
            <button className="search-btn" onClick={fetchUsers} title="Search">
              Search
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className={user.suspended ? 'suspended-row' : ''}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="user-name">{user.fullName}</div>
                          <div className="user-id">ID: {user._id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-item">
                          <Mail size={14} />
                          {user.email}
                        </div>
                        <div className="contact-item">
                          <Phone size={14} />
                          {user.phoneNumber}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' && <Shield size={14} />}
                        {user.role === 'user' && <Users size={14} />}
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div className="verification-status">
                        <span className={`verify-badge ${user.isEmailVerified ? 'verified' : 'unverified'}`}>
                          <Mail size={12} />
                          {user.isEmailVerified ? 'Verified' : 'Pending'}
                        </span>
                        <span className={`verify-badge ${user.isPhoneVerified ? 'verified' : 'unverified'}`}>
                          <Phone size={12} />
                          {user.isPhoneVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${user.suspended ? 'suspended' : 'active'}`}>
                        {user.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="user-actions">
                        <button 
                          className="btn-edit" 
                          onClick={() => handleEdit(user)}
                          title="Edit User"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          className={`btn-suspend ${user.suspended ? 'unsuspend' : 'suspend'}`}
                          onClick={() => handleSuspendToggle(user)}
                          title={user.suspended ? 'Unsuspend User' : 'Suspend User'}
                        >
                          {user.suspended ? <Shield size={16} /> : <ShieldOff size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="pagination">
          {Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, i) => (
            <button 
              key={i} 
              onClick={() => setPage(i + 1)} 
              className={page === i + 1 ? 'active' : ''}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3>Edit User Profile</h3>
              <button className="close-btn" onClick={() => setEditUser(null)}>×</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleUpdate(); }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    name="fullName" 
                    value={form.fullName || ''} 
                    onChange={handleFormChange} 
                    placeholder="Full Name" 
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    name="email" 
                    value={form.email || ''} 
                    onChange={handleFormChange} 
                    placeholder="Email" 
                    type="email"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    name="phoneNumber" 
                    value={form.phoneNumber || ''} 
                    onChange={handleFormChange} 
                    placeholder="Phone Number" 
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={form.role || ''} onChange={handleFormChange}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>New Password (optional)</label>
                  <input 
                    name="password" 
                    value={form.password || ''} 
                    onChange={handleFormChange} 
                    placeholder="New Password (leave empty to keep current)" 
                    type="password" 
                  />
                </div>
              </div>
              
              <div className="verification-checkboxes">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="isEmailVerified" 
                    checked={form.isEmailVerified || false} 
                    onChange={e => setForm(f => ({...f, isEmailVerified: e.target.checked}))} 
                  />
                  <span className="checkmark"></span>
                  Email Verified
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="isPhoneVerified" 
                    checked={form.isPhoneVerified || false} 
                    onChange={e => setForm(f => ({...f, isPhoneVerified: e.target.checked}))} 
                  />
                  <span className="checkmark"></span>
                  Phone Verified
                </label>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-update">
                  Update Profile
                </button>
                <button type="button" className="btn-cancel" onClick={() => setEditUser(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn-suspend-modal ${editUser.suspended ? 'unsuspend' : 'suspend'}`}
                  onClick={async () => {
                    await handleSuspendToggle(editUser);
                    setEditUser(null);
                  }}
                >
                  {editUser.suspended ? (
                    <>
                      <Shield size={16} />
                      Unsuspend User
                    </>
                  ) : (
                    <>
                      <ShieldOff size={16} />
                      Suspend User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-users-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }

        .users-header {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 12px;
          color: white;
        }

        .users-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .users-header p {
          margin: 0;
          opacity: 0.9;
        }

        .users-stats {
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

        .stat-card.total .stat-icon {
          background: linear-gradient(135deg, #ddd6fe, #c4b5fd);
          color: #5b21b6;
        }

        .stat-card.verified .stat-icon {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #14532d;
        }

        .stat-card.suspended .stat-icon {
          background: linear-gradient(135deg, #fecaca, #fca5a5);
          color: #7f1d1d;
        }

        .stat-card.admins .stat-icon {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
        }

        .stat-content h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .stat-content p {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .users-section {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .section-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .user-search-bar {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          color: #6b7280;
          z-index: 1;
        }

        .user-search-bar input {
          padding: 0.5rem 0.75rem 0.5rem 2.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.875rem;
          min-width: 250px;
          transition: border-color 0.2s;
        }

        .user-search-bar input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .search-btn {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .search-btn:hover {
          background: #2563eb;
        }

        .table-container {
          overflow-x: auto;
          margin-bottom: 1rem;
        }

        .user-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
        }

        .user-table th,
        .user-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .user-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }

        .suspended-row {
          opacity: 0.6;
          background: #fef2f2;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
        }

        .user-id {
          font-size: 0.75rem;
          color: #6b7280;
          font-family: monospace;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .role-badge.admin {
          background: #fef3c7;
          color: #92400e;
        }

        .role-badge.user {
          background: #e0e7ff;
          color: #3730a3;
        }

        .verification-status {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .verify-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .verify-badge.verified {
          background: #dcfce7;
          color: #166534;
        }

        .verify-badge.unverified {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.suspended {
          background: #fecaca;
          color: #7f1d1d;
        }

        .user-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-edit, .btn-suspend {
          padding: 0.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-edit {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-edit:hover {
          background: #e5e7eb;
        }

        .btn-suspend.suspend {
          background: #fecaca;
          color: #7f1d1d;
        }

        .btn-suspend.suspend:hover {
          background: #fca5a5;
        }

        .btn-suspend.unsuspend {
          background: #dcfce7;
          color: #166534;
        }

        .btn-suspend.unsuspend:hover {
          background: #bbf7d0;
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .pagination button {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pagination button:hover {
          background: #f3f4f6;
        }

        .pagination button.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .edit-modal {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: #f3f4f6;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .form-group input,
        .form-group select {
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .verification-checkboxes {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          color: #374151;
        }

        .checkbox-label input[type="checkbox"] {
          display: none;
        }

        .checkmark {
          width: 20px;
          height: 20px;
          border: 2px solid #e5e7eb;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .checkbox-label input[type="checkbox"]:checked + .checkmark {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
          content: '✓';
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .btn-update,
        .btn-cancel,
        .btn-suspend-modal {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-update {
          background: #10b981;
          color: white;
        }

        .btn-update:hover {
          background: #059669;
        }

        .btn-cancel {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-cancel:hover {
          background: #e5e7eb;
        }

        .btn-suspend-modal.suspend {
          background: #ef4444;
          color: white;
        }

        .btn-suspend-modal.suspend:hover {
          background: #dc2626;
        }

        .btn-suspend-modal.unsuspend {
          background: #10b981;
          color: white;
        }

        .btn-suspend-modal.unsuspend:hover {
          background: #059669;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .users-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .section-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .user-search-bar {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .user-search-bar input {
            min-width: auto;
          }
          
          .modal-actions {
            flex-direction: column;
          }
          
          .verification-checkboxes {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminHandleUsers;
