import React from 'react';

const TestComponent = () => {
  return (
    <div style={{ padding: '2rem', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1>🧪 Payment Requests Styling Test</h1>
      
      {/* Payment Stats Test */}
      <div className="payment-stats">
        <div className="stat-item pending">
          <div className="stat-number">5</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-item approved">
          <div className="stat-number">3</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-item rejected">
          <div className="stat-number">1</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-item total">
          <div className="stat-number">9</div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      {/* Payment Type Badges Test */}
      <div style={{ margin: '2rem 0' }}>
        <h2>Payment Type Badges:</h2>
        <span className="payment-type-badge winner-payment" style={{ marginRight: '1rem' }}>
          🏆 Winner Payment
        </span>
        <span className="payment-type-badge participation-fee">
          🎯 Participation Fee
        </span>
      </div>

      {/* Status Badges Test */}
      <div style={{ margin: '2rem 0' }}>
        <h2>Status Badges:</h2>
        <span className="status-badge pending" style={{ marginRight: '1rem' }}>
          pending
        </span>
        <span className="status-badge approved" style={{ marginRight: '1rem' }}>
          approved
        </span>
        <span className="status-badge rejected">
          rejected
        </span>
      </div>

      {/* Action Buttons Test */}
      <div style={{ margin: '2rem 0' }}>
        <h2>Action Buttons:</h2>
        <div className="payment-actions">
          <button className="action-btn view-btn">
            👁️ View
          </button>
          <button className="action-btn approve-btn">
            ✅ Approve
          </button>
          <button className="action-btn reject-btn">
            ❌ Reject
          </button>
        </div>
      </div>

      {/* Table Test */}
      <div className="payments-table-container">
        <table className="user-table payments-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Auction</th>
              <th>Payment Type</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="user-info">
                  <div className="user-name">Test User</div>
                  <div className="user-email">test@example.com</div>
                </div>
              </td>
              <td>
                <div className="auction-info">
                  <div className="auction-title">Sample Auction</div>
                  <div className="auction-id">AUC-123</div>
                </div>
              </td>
              <td>
                <span className="payment-type-badge winner-payment">
                  🏆 Winner Payment
                </span>
              </td>
              <td>
                <div className="payment-amount">₹5000</div>
              </td>
              <td>
                <span className="status-badge pending">
                  pending
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestComponent;