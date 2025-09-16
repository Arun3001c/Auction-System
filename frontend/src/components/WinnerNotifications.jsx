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
                
                {/* Debug info - remove this in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
                    Debug: AuctionType={winner.auction?.auctionType || 'unknown'}, SellerEmail={winner.auction?.seller?.email ? 'present' : 'missing'}
                  </div>
                )}
                
                {/* Contact Buttons - Always show at least one option */}
                <div 
                  className="winner-contact-buttons"
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginTop: '16px'
                  }}
                >
                  {/* Always show Contact Seller as primary action */}
                  <button 
                    className="contact-seller-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #28a745, #20c997)',
                      color: 'white',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      const sellerEmail = winner.auction?.seller?.email || 'seller@example.com';
                      const auctionTitle = winner.auction?.title || 'Auction Item';
                      const amount = formatPrice(winner.amount, winner.auction?.currency);
                      window.location.href = `mailto:${sellerEmail}?subject=Auction Won - ${auctionTitle}&body=Hello, I won your auction "${auctionTitle}" with a winning bid of ${amount}. Please contact me to arrange payment and delivery.`;
                    }}
                    title="Contact Seller"
                  >
                    <Mail className="contact-btn-icon" style={{ width: '16px', height: '16px' }} />
                    Contact Seller
                  </button>
                  
                  {/* Show Contact Admin for reserve auctions OR as backup option */}
                  {(winner.auction?.auctionType === 'reserve' || !winner.auction?.seller?.email) && (
                    <button 
                      className="contact-admin-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #007bff, #0056b3)',
                        color: 'white',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        const auctionTitle = winner.auction?.title || 'Auction Item';
                        window.location.href = `mailto:admin@auctionsite.com?subject=Auction Winner Support - ${auctionTitle}&body=Hello, I won the auction "${auctionTitle}" and need assistance with contacting the seller or completing the transaction.`;
                      }}
                      title="Contact Admin for Support"
                    >
                      <Mail className="contact-btn-icon" style={{ width: '16px', height: '16px' }} />
                      Contact Admin
                    </button>
                  )}
                </div>
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
          margin: 0 0 16px 0;
          color: #1976d2;
          font-size: 14px;
          line-height: 1.5;
        }

        .winner-contact-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-start;
        }

        .contact-seller-btn, .contact-admin-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .contact-seller-btn {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
        }

        .contact-seller-btn:hover {
          background: linear-gradient(135deg, #218838, #1ea884);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }

        .contact-admin-btn {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
        }

        .contact-admin-btn:hover {
          background: linear-gradient(135deg, #0056b3, #003d82);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .contact-btn-icon {
          width: 16px;
          height: 16px;
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

          .winner-contact-buttons {
            flex-direction: column;
            gap: 8px;
          }

          .contact-seller-btn, .contact-admin-btn {
            width: 100%;
            justify-content: center;
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default WinnerNotifications;
