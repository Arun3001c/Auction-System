import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Gavel, Mail, Phone } from 'lucide-react';
import './AuctionEndedDetails.css';

const AuctionEndedDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const fetchAuction = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/auctions/${id}`);
        setAuction(res.data);
        
        // If it's a reserve auction, check payment status
        if (res.data.auctionType === 'reserve') {
          await checkPaymentStatus(res.data._id, token);
        }
      } catch (err) {
        setError('Failed to load auction details');
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();
  }, [id]);

  const checkPaymentStatus = async (auctionId, token) => {
    try {
      setPaymentLoading(true);
      const response = await axios.get(
        `http://localhost:5001/api/payments/winner-payment-status/${auctionId}`,
        {
          headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
        }
      );
      
      if (response.data && response.data.isAuctionCreator) {
        setPaymentStatus({
          approved: response.data.hasPayment && response.data.winnerPayment?.status === 'approved',
          status: response.data.hasPayment ? response.data.winnerPayment?.status : 'none'
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus({ approved: false, status: 'error' });
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!auction) return null;

  return (
    <div className="auction-ended-details-container">
      <button onClick={() => navigate('/my-auctions')} className="back-btn">
        <ArrowLeft /> Back
      </button>
      <h2>{auction.title} - Ended Auction Details</h2>
      
      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          padding: '8px', 
          background: '#e3f2fd', 
          borderRadius: '4px', 
          fontSize: '12px', 
          color: '#1565c0',
          marginBottom: '1rem'
        }}>
          Debug: Auction Type = {auction.auctionType || 'unknown'} | Winner Email = {auction.currentHighestBidder?.email || auction.bids?.[0]?.bidder?.email || 'missing'} | Bids Count = {auction.bids?.length || 0}
        </div>
      )}
      <div className="winner-section" style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          color: '#2d3748'
        }}>
          Winner
        </h3>
        {auction.currentHighestBidder ? (
          <div className="winner-info" style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <div className="winner-display" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              fontSize: '1.1rem',
              fontWeight: '500',
              color: '#2d3748'
            }}>
              <User size={24} color="#4a5568" /> 
              {auction.currentHighestBidder.fullName || auction.currentHighestBidder.username || 'Unknown Winner'} 
              <span style={{
                backgroundColor: '#48bb78',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                Bid: ${auction.currentHighestBid || auction.currentBid || 0}
              </span>
            </div>
            
            {/* Contact Buttons for Seller */}
            <div className="contact-winner-section">
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '1rem'
              }}>
                Contact Winner
              </h4>
              <div 
                className="contact-buttons"
                style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  marginBottom: '1.5rem'
                }}
              >
                {/* Always show Contact Bidder button */}
                <button 
                  className="contact-bidder-btn"
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
                    // Try multiple ways to get the winner's email
                    const bidderEmail = auction.currentHighestBidder?.email || 
                                      auction.bids?.[0]?.bidder?.email || 
                                      auction.bids?.find(bid => bid.amount === auction.currentHighestBid || auction.currentBid)?.bidder?.email;
                    
                    if (!bidderEmail || bidderEmail === 'bidder@example.com') {
                      alert('Winner email not available. Please check the auction data.');
                      return;
                    }
                    
                    const bidderName = auction.currentHighestBidder?.fullName || 
                                     auction.currentHighestBidder?.username ||
                                     auction.bids?.[0]?.bidder?.username || 
                                     'Winner';
                    const auctionTitle = auction.title || 'Auction Item';
                    const bidAmount = auction.currentHighestBid || auction.currentBid || 0;
                    
                    window.location.href = `mailto:${bidderEmail}?subject=Auction Won - ${auctionTitle}&body=Hello ${bidderName}, Congratulations on winning the auction "${auctionTitle}" with your bid of $${bidAmount}. Please contact me to arrange payment and delivery. Thank you!`;
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                  title="Contact the winning bidder"
                >
                  <Mail style={{ width: '16px', height: '16px' }} />
                  Contact Bidder
                </button>
                
                {/* Show Contact Admin for reserve auctions */}
                {auction.auctionType === 'reserve' && (
                  <>
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
                        const auctionTitle = auction.title || 'Reserve Auction';
                        window.location.href = `mailto:admin@auctionsite.com?subject=Reserve Auction Completed - ${auctionTitle}&body=Hello Admin, My reserve auction "${auctionTitle}" has ended with a winning bid of $${auction.currentBid}. Please assist with the transaction process. Auction ID: ${auction._id}`;
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                      title="Contact Admin for Reserve Auction Support"
                    >
                      <Mail style={{ width: '16px', height: '16px' }} />
                      Contact Admin
                    </button>
                    
                    {/* Payment Status Indicator for Reserve Auctions */}
                    {paymentStatus && (
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: paymentStatus.approved ? '#d4edda' : 
                                         paymentStatus.status === 'pending' ? '#fff3cd' : '#f8d7da',
                        color: paymentStatus.approved ? '#155724' : 
                               paymentStatus.status === 'pending' ? '#856404' : '#721c24',
                        border: `1px solid ${paymentStatus.approved ? '#c3e6cb' : 
                                paymentStatus.status === 'pending' ? '#ffeaa7' : '#f5c6cb'}`
                      }}>
                        {paymentStatus.approved ? '✅ Payment Approved' : 
                         paymentStatus.status === 'pending' ? '⏳ Payment Pending' :
                         paymentStatus.status === 'rejected' ? '❌ Payment Rejected' :
                         '📝 No Payment Yet'}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Winner Contact Info Display */}
              <div 
                className="winner-contact-info"
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <h5 style={{ 
                  margin: '0 0 0.75rem 0', 
                  color: '#4a5568',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  Winner Contact Information:
                </h5>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.5rem', 
                  fontSize: '0.9rem' 
                }}>
                  {/* Email from multiple possible sources */}
                  {(auction.currentHighestBidder?.email || auction.bids?.[0]?.bidder?.email) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail style={{ width: '16px', height: '16px', color: '#6c757d' }} />
                      <span>
                        <strong>Email:</strong> {auction.currentHighestBidder?.email || auction.bids?.[0]?.bidder?.email}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc3545' }}>
                      <Mail style={{ width: '16px', height: '16px', color: '#dc3545' }} />
                      <span><strong>Email:</strong> Not available</span>
                    </div>
                  )}
                  
                  {/* Phone from multiple possible sources - only show for non-reserve or approved reserve auctions */}
                  {(auction.currentHighestBidder?.phone || auction.bids?.[0]?.bidder?.phone) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone style={{ width: '16px', height: '16px', color: '#6c757d' }} />
                      <span>
                        <strong>Phone:</strong>{' '}
                        {/* Show phone number only if it's not a reserve auction OR if payment is approved */}
                        {auction.auctionType !== 'reserve' || paymentStatus?.approved ? (
                          auction.currentHighestBidder?.phone || auction.bids?.[0]?.bidder?.phone
                        ) : (
                          <span style={{ color: '#d97706', fontStyle: 'italic' }}>
                            {paymentLoading ? 'Checking payment status...' : 
                             paymentStatus?.status === 'pending' ? 'Hidden - Payment pending approval' :
                             paymentStatus?.status === 'rejected' ? 'Hidden - Payment rejected' :
                             'Hidden - Payment not submitted yet'}
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6c757d' }}>
                      <Phone style={{ width: '16px', height: '16px', color: '#6c757d' }} />
                      <span><strong>Phone:</strong> Not provided</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '2rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6c757d',
            border: '1px solid #e2e8f0'
          }}>
            <User size={48} color="#6c757d" style={{ marginBottom: '1rem' }} />
            <h4 style={{ color: '#495057', marginBottom: '0.5rem' }}>No Winner Found</h4>
            <p>This auction ended without any bids or the winner data is not available.</p>
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ 
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                fontSize: '0.8rem',
                textAlign: 'left'
              }}>
                <strong>Debug Info:</strong><br/>
                - currentHighestBidder: {auction.currentHighestBidder ? 'exists' : 'null'}<br/>
                - bids array length: {auction.bids?.length || 0}<br/>
                - currentHighestBid: {auction.currentHighestBid || 'not set'}<br/>
                - currentBid: {auction.currentBid || 'not set'}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="participants-section">
        <h3>Participants</h3>
        <ul>
            {[...new Set(
              auction.bids
                .filter(bid => bid.bidder && bid.bidder.fullName)
                .map(bid => bid.bidder.fullName)
            )].map((name, idx) => (
              <li key={idx}><User /> {name}</li>
            ))}
        </ul>
      </div>
      <div className="bid-history-section">
        <h3>Bidding History</h3>
        <ul>
            {auction.bids
              .filter(bid => bid.bidder && bid.bidder.fullName)
              .map((bid, idx) => (
                <li key={idx}>
                  <User /> {bid.bidder.fullName} - ${bid.amount} at {new Date(bid.timestamp).toLocaleString()}
                </li>
              ))}
        </ul>
      </div>
    </div>
  );
};

export default AuctionEndedDetails;
