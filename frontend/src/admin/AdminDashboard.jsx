import React from 'react';
import './admin.css';

export default function AdminDashboard() {
  return (
    <div className="admin-container">
      <main className="admin-main-content">
        <div className="admin-card">
          <h2>Welcome, Admin!</h2>
          <p>This is your dashboard. You can manage users, auctions, and view logs here.</p>
          {/* Add dashboard widgets and navigation here */}
        </div>
      </main>
    </div>
  );
}
