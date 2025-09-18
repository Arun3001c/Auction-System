import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';
import { Trophy, X, Mail, Phone, DollarSign, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const WinnerNotifications = ({ show, onClose, forceRefresh }) => {
  const { user } = useAuth();
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Payment status modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  
  // Store payment statuses for each winner
  const [winnerPaymentStatuses, setWinnerPaymentStatuses] = useState({});

  useEffect(() => {
    if (show && user) {
      fetchWinnerNotifications();
    }
  }, [show, user, forceRefresh]);

  const fetchWinnerNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching winner notifications with token:', token ? 'Present' : 'Missing');
      
      const response = await api.get('/auctions/user/winner-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Winner notifications API response:', response.data);
      const winnersData = response.data || [];
      console.log('Winners data length:', winnersData.length);
      setWinners(winnersData);
      
      // Fetch payment status for each reserve auction winner
      const statusPromises = winnersData
        .filter(winner => winner.auction?.auctionType === 'reserve')
        .map(async (winner) => {
          try {
            const paymentResponse = await api.get(
              `/payments/winner-payment-status/${winner.auction._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return {
              auctionId: winner.auction._id,
              approved: paymentResponse.data.hasPayment && paymentResponse.data.paymentRequest?.status === 'approved'
            };
          } catch (error) {
            console.error('Error fetching payment status for auction:', winner.auction._id, error);
            return { auctionId: winner.auction._id, approved: false };
          }
        });
      
      const statuses = await Promise.all(statusPromises);
      const statusMap = {};
      statuses.forEach(status => {
        statusMap[status.auctionId] = status.approved;
      });
      setWinnerPaymentStatuses(statusMap);
      
    } catch (error) {
      console.error('Error fetching winner notifications:', error);
      setWinners([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to check payment status for reserve auctions
  const checkPaymentStatus = async (winner) => {
    try {
      setPaymentLoading(true);
      setSelectedWinner(winner);
      
      const token = localStorage.getItem('token');
      const response = await api.get(
        `/payments/winner-payment-status/${winner.auction._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('Payment status response:', response.data);
      
      if (response.data && !response.data.isAuctionCreator) {
        // For winners (not auction creators)
        setPaymentStatus({
          isWinner: true,
          hasPayment: response.data.hasPayment,
          paymentRequest: response.data.hasPayment ? response.data.paymentRequest : null,
          message: response.data.message || null
        });
      } else {
        setPaymentStatus({
          isWinner: true,
          hasPayment: false,
          message: 'No payment information found for this auction.'
        });
      }
      
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus({
        error: true,
        message: 'Failed to load payment status. Please try again.'
      });
      setShowPaymentModal(true);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Function to close payment modal and refresh statuses
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    // Refresh payment statuses to update phone number visibility
    if (selectedWinner && selectedWinner.auction?.auctionType === 'reserve') {
      fetchWinnerNotifications();
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
                  <span>Your Email: {winner.email}</span>
                </div>
                
                <div className="winner-detail-item">
                  <Phone className="winner-detail-icon" />
                  <span>Your Phone: {winner.phone}</span>
                </div>
                
                {/* Seller Information Section - Only for Reserve Auctions */}
                {winner.auction?.auctionType === 'reserve' && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    backgroundColor: '#f0f9ff', 
                    borderRadius: '8px',
                    border: '1px solid #e0f2fe'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 0.75rem 0', 
                      color: '#0369a1', 
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}>
                      🏪 Seller Contact Information:
                    </h4>
                    
                    <div className="seller-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Seller Email - Always show for reserve auctions */}
                      <div className="winner-detail-item">
                        <Mail className="winner-detail-icon" />
                        <span>
                          <strong>Seller Email:</strong> {winner.auction?.seller?.email || 'Contact admin for seller details'}
                        </span>
                      </div>
                      
                      {/* Seller Phone - Conditional based on payment approval */}
                      <div className="winner-detail-item">
                        <Phone className="winner-detail-icon" />
                        <span>
                          <strong>Seller Phone:</strong>{' '}
                          {winnerPaymentStatuses[winner.auction._id] ? (
                            winner.auction?.seller?.phoneNumber || 'Not provided'
                          ) : (
                            <span style={{ color: '#d97706', fontStyle: 'italic' }}>
                              Available after payment approval
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Payment Status Button for Reserve Auctions */}
                    <div style={{ marginTop: '1rem' }}>
                      <button
                        onClick={() => checkPaymentStatus(winner)}
                        disabled={paymentLoading}
                        style={{
                          backgroundColor: '#6366f1',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <AlertCircle size={16} />
                        {paymentLoading ? 'Checking...' : 'Check Payment Status'}
                      </button>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: '#6b7280', 
                        margin: '0.5rem 0 0 0',
                        fontStyle: 'italic'
                      }}>
                        💡 Submit payment to unlock seller's phone number
                      </p>
                    </div>
                  </div>
                )}
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
                      // Get seller email from multiple possible sources
                      const sellerEmail = winner.auction?.seller?.email || 'admin@auctionsite.com';
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

      {/* Payment Status Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
                💳 Your Payment Status
              </h3>
              <button
                onClick={() => closePaymentModal()}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            {selectedWinner && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Auction: {selectedWinner.auction?.title}
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Winning Bid: {formatPrice(selectedWinner.amount, selectedWinner.auction?.currency)}
                </p>
              </div>
            )}
            
            {paymentLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div>Loading payment status...</div>
              </div>
            ) : paymentStatus?.error ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                <XCircle style={{ width: '2rem', height: '2rem', margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Error</p>
                <p style={{ fontSize: '0.875rem' }}>{paymentStatus.message}</p>
              </div>
            ) : paymentStatus?.hasPayment && paymentStatus?.paymentRequest ? (
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {paymentStatus.paymentRequest.status === 'approved' ? (
                    <CheckCircle style={{ color: '#059669', width: '1.25rem', height: '1.25rem' }} />
                  ) : paymentStatus.paymentRequest.status === 'rejected' ? (
                    <XCircle style={{ color: '#dc2626', width: '1.25rem', height: '1.25rem' }} />
                  ) : (
                    <AlertCircle style={{ color: '#d97706', width: '1.25rem', height: '1.25rem' }} />
                  )}
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                    Your Payment Status
                  </h4>
                </div>
                <div style={{ marginLeft: '2rem' }}>
                  <p style={{
                    margin: '0.25rem 0',
                    fontWeight: '600',
                    fontSize: '1.125rem',
                    color: paymentStatus.paymentRequest.status === 'approved' ? '#059669' : 
                           paymentStatus.paymentRequest.status === 'rejected' ? '#dc2626' : '#d97706'
                  }}>
                    Status: {paymentStatus.paymentRequest.status?.toUpperCase()}
                  </p>
                  {paymentStatus.paymentRequest.submittedAt && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      Submitted: {new Date(paymentStatus.paymentRequest.submittedAt).toLocaleDateString()}
                    </p>
                  )}
                  {paymentStatus.paymentRequest.verifiedAt && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      Verified: {new Date(paymentStatus.paymentRequest.verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                  {paymentStatus.paymentRequest.adminNotes && (
                    <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#374151', fontStyle: 'italic' }}>
                      Admin Notes: {paymentStatus.paymentRequest.adminNotes}
                    </p>
                  )}
                  
                  {/* Status-specific messages */}
                  {paymentStatus.paymentRequest.status === 'approved' && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <h5 style={{ 
                        margin: '0 0 0.5rem 0', 
                        color: '#059669', 
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}>
                        🎉 Payment Approved - Seller Contact Info Unlocked:
                      </h5>
                      <p style={{ 
                        margin: '0.5rem 0 0 0',
                        fontSize: '0.875rem',
                        color: '#047857',
                        lineHeight: '1.6'
                      }}>
                        ✅ You can now see the seller's phone number above.<br/>
                        ✅ Contact the seller to arrange item pickup/delivery.<br/>
                        ✅ Complete the transaction as agreed.
                      </p>
                    </div>
                  )}
                  
                  {paymentStatus.paymentRequest.status === 'pending' && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#fffbeb',
                      borderRadius: '8px',
                      border: '1px solid #fde68a'
                    }}>
                      <p style={{ 
                        margin: 0, 
                        color: '#d97706', 
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        ⏳ Your payment is being reviewed by admin. You will be notified once approved.
                      </p>
                    </div>
                  )}
                  
                  {paymentStatus.paymentRequest.status === 'rejected' && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      <p style={{ 
                        margin: 0, 
                        color: '#dc2626', 
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        ❌ Your payment was rejected. Please contact admin for assistance or resubmit payment.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <AlertCircle style={{ width: '2rem', height: '2rem', margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Payment Not Submitted Yet</p>
                <p style={{ fontSize: '0.875rem' }}>
                  {paymentStatus?.message || 'You need to submit your payment to unlock seller contact details.'}
                </p>
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#e0f2fe',
                  borderRadius: '8px',
                  border: '1px solid #b3e5fc'
                }}>
                  <p style={{ 
                    margin: 0, 
                    color: '#0277bd', 
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    💡 Go to the auction page to submit your winner payment and unlock seller's phone number.
                  </p>
                </div>
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => closePaymentModal()}
                style={{
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
