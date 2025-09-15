import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';
import { Trophy, X, Mail, Phone, DollarSign } from 'lucide-react';

const WinnerNotifications = ({ show, onClose, forceRefresh }) => {
  const { user } = useAuth();
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && user) {
      fetchWinnerNotifications();
    }
  }, [show, user, forceRefresh]);

  const fetchWinnerNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/auctions/user/winner-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWinners(response.data || []);
    } catch (error) {
      console.error('Error fetching winner notifications:', error);
      setWinners([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    if (!currency || currency === 'Other') {
      return `$${price}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const closeNotifications = () => {
    onClose();
  };

  if (!show || loading) {
    return null;
  }

  return (
    <div className="winner-notifications-overlay">
      <div className="winner-notifications-container">
        <div className="winner-notifications-header">
          <div className="winner-header-content">
            <Trophy className="winner-trophy-icon" />
            <h2>🎉 {winners.length > 0 ? 'Congratulations! You Won!' : 'No Auctions Won Yet'}</h2>
          </div>
          <button 
            className="winner-close-btn"
            onClick={closeNotifications}
          >
            <X />
          </button>
        </div>

        <div className="winner-notifications-content">
          {winners.length === 0 ? (
            <div className="no-winners-message">
              <p>You haven't won any auctions yet. Keep bidding and good luck! 🍀</p>
            </div>
          ) : (
            winners.map((winner, index) => (
            <div key={winner._id || index} className="winner-notification-card">
              <div className="winner-card-header">
                <h3>{winner.auction?.title || 'Auction Item'}</h3>
                <span className="winner-badge">Winner</span>
              </div>
              
              <div className="winner-card-details">
                <div className="winner-detail-item">
                  <DollarSign className="winner-detail-icon" />
                  <span>Winning Bid: {formatPrice(winner.amount, winner.auction?.currency)}</span>
                </div>
                
                <div className="winner-detail-item">
                  <Mail className="winner-detail-icon" />
                  <span>Email: {winner.email}</span>
                </div>
                
                <div className="winner-detail-item">
                  <Phone className="winner-detail-icon" />
                  <span>Phone: {winner.phone}</span>
                </div>
              </div>

              <div className="winner-card-actions">
                <p className="winner-next-steps">
                  The seller will contact you soon to arrange payment and delivery. 
                  Please keep this notification for your records.
                </p>
              </div>
            </div>
          ))
          )}
        </div>

        <div className="winner-notifications-footer">
          <button 
            className="winner-close-footer-btn"
            onClick={closeNotifications}
          >
            Close Notifications
          </button>
        </div>
      </div>

      <style jsx>{`
        .winner-notifications-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-in-out;
        }

        .winner-notifications-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          animation: slideIn 0.3s ease-out;
        }

        .winner-notifications-header {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          padding: 20px;
          border-radius: 16px 16px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .winner-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .winner-trophy-icon {
          width: 32px;
          height: 32px;
          color: #ffd700;
        }

        .winner-header-content h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .winner-close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: background-color 0.2s;
        }

        .winner-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .winner-notifications-content {
          padding: 20px;
        }

        .winner-notification-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          border-left: 4px solid #28a745;
        }

        .winner-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .winner-card-header h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
          font-weight: 600;
        }

        .winner-badge {
          background: #28a745;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .winner-card-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .winner-detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
        }

        .winner-detail-icon {
          width: 16px;
          height: 16px;
          color: #28a745;
        }

        .winner-next-steps {
          background: #e3f2fd;
          border: 1px solid #2196f3;
          border-radius: 8px;
          padding: 12px;
          margin: 0;
          color: #1976d2;
          font-size: 14px;
          line-height: 1.5;
        }

        .winner-notifications-footer {
          padding: 20px;
          border-top: 1px solid #dee2e6;
          text-align: center;
        }

        .winner-close-footer-btn {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .winner-close-footer-btn:hover {
          background: #5a6268;
        }

        .no-winners-message {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        .no-winners-message p {
          font-size: 16px;
          margin: 0;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .winner-notifications-container {
            width: 95%;
            margin: 20px;
          }

          .winner-header-content h2 {
            font-size: 20px;
          }

          .winner-card-details {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default WinnerNotifications;
