import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

const AdminPaymentDetails = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    averagePayment: 0
  });

  useEffect(() => {
    // Simulate fetching payment data
    setTimeout(() => {
      const mockPayments = [
        {
          id: 'PAY-001',
          auctionTitle: 'Vintage Guitar Collection',
          winnerName: 'John Doe',
          amount: 1250.00,
          status: 'completed',
          date: '2025-09-14',
          method: 'Credit Card'
        },
        {
          id: 'PAY-002',
          auctionTitle: 'Modern Art Painting',
          winnerName: 'Jane Smith',
          amount: 3500.00,
          status: 'pending',
          date: '2025-09-15',
          method: 'Bank Transfer'
        },
        {
          id: 'PAY-003',
          auctionTitle: 'Antique Watch Set',
          winnerName: 'Mike Johnson',
          amount: 875.50,
          status: 'completed',
          date: '2025-09-13',
          method: 'PayPal'
        },
        {
          id: 'PAY-004',
          auctionTitle: 'Designer Jewelry',
          winnerName: 'Sarah Wilson',
          amount: 2100.00,
          status: 'processing',
          date: '2025-09-15',
          method: 'Credit Card'
        }
      ];

      setPayments(mockPayments);
      
      const completed = mockPayments.filter(p => p.status === 'completed');
      const pending = mockPayments.filter(p => p.status === 'pending');
      const total = mockPayments.reduce((sum, p) => sum + p.amount, 0);
      const average = total / mockPayments.length;

      setStats({
        totalRevenue: total,
        pendingPayments: pending.length,
        completedPayments: completed.length,
        averagePayment: average
      });

      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="status-icon completed" />;
      case 'pending':
        return <Clock size={16} className="status-icon pending" />;
      case 'processing':
        return <AlertCircle size={16} className="status-icon processing" />;
      default:
        return <AlertCircle size={16} className="status-icon" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'processing':
        return 'status-processing';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page payment-details">
      <div className="payment-header">
        <h2>💳 Payment Management</h2>
        <p>Monitor and manage all auction payments and transactions</p>
      </div>

      {/* Payment Stats */}
      <div className="payment-stats">
        <div className="stat-card revenue">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>${stats.totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
            <span className="trend positive">
              <TrendingUp size={16} />
              +12.5% this month
            </span>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.completedPayments}</h3>
            <p>Completed</p>
            <span className="trend positive">All processed</span>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingPayments}</h3>
            <p>Pending</p>
            <span className="trend warning">Needs attention</span>
          </div>
        </div>

        <div className="stat-card average">
          <div className="stat-icon">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <h3>${stats.averagePayment.toLocaleString()}</h3>
            <p>Average Payment</p>
            <span className="trend neutral">Per transaction</span>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="payments-section">
        <h3>Recent Payments</h3>
        <table className="user-table payments-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Auction</th>
              <th>Winner</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td className="payment-id">{payment.id}</td>
                <td>{payment.auctionTitle}</td>
                <td>{payment.winnerName}</td>
                <td className="payment-amount">${payment.amount.toLocaleString()}</td>
                <td>{payment.method}</td>
                <td>{new Date(payment.date).toLocaleDateString()}</td>
                <td>
                  <span className={`payment-status ${getStatusClass(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="payment-actions">
                    <button className="btn-view">View</button>
                    {payment.status === 'pending' && (
                      <button className="btn-approve">Approve</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .payment-details {
          max-width: 1200px;
        }

        .payment-header {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 12px;
          color: white;
        }

        .payment-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .payment-header p {
          margin: 0;
          opacity: 0.9;
        }

        .payment-stats {
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
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-card.revenue .stat-icon {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          color: #065f46;
        }

        .stat-card.completed .stat-icon {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #14532d;
        }

        .stat-card.pending .stat-icon {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
        }

        .stat-card.average .stat-icon {
          background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
          color: #3730a3;
        }

        .payments-section {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .payments-section h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .payments-table .payment-id {
          font-family: monospace;
          font-weight: 600;
          color: #3b82f6;
        }

        .payment-amount {
          font-weight: 600;
          color: #059669;
        }

        .payment-status {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-completed {
          background: #dcfce7;
          color: #166534;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-processing {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .payment-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-view, .btn-approve {
          padding: 0.25rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-view:hover {
          background: #e5e7eb;
        }

        .btn-approve {
          background: #10b981;
          color: white;
        }

        .btn-approve:hover {
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

        .trend {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
        }

        .trend.positive {
          color: #059669;
          background: #d1fae5;
        }

        .trend.warning {
          color: #d97706;
          background: #fef3c7;
        }

        .trend.neutral {
          color: #6b7280;
          background: #f3f4f6;
        }
      `}</style>
    </div>
  );
};

export default AdminPaymentDetails;
