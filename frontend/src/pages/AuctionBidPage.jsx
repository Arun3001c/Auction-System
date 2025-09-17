import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';
import BidSection from './BidSection';
import { ArrowLeft, User, DollarSign, Clock, Gavel, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import WinnerCard from '../components/WinnerCard';

const AuctionBidPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidHistory, setBidHistory] = useState([]);
  const [allAuctionBids, setAllAuctionBids] = useState([]);
  const [isAuctionCreator, setIsAuctionCreator] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [loadingApproval, setLoadingApproval] = useState(false);

  useEffect(() => {
    fetchAuctionDetails();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (auction && user) {
      // Check if current user is the auction creator
      const isCreator = user._id === auction.seller?._id || user._id === auction.seller;
      setIsAuctionCreator(isCreator);
      
      // Debug logging for reserve auction features
      if (process.env.NODE_ENV === 'development') {
        console.log('AuctionBidPage Debug:', {
          auctionType: auction.auctionType,
          auctionStatus: auction.status,
          isAuctionCreator: isCreator,
          userId: user._id,
          sellerId: auction.seller?._id || auction.seller,
          showAdminButtons: auction.auctionType === 'reserve' && isCreator && (auction.status === 'ended' || auction.status === 'stopped')
        });
      }
      
      if (isCreator) {
        // If user is auction creator, fetch all bids for this auction
        fetchAllAuctionBids();
      } else {
        // If user is a bidder, fetch their bid history
        fetchBidHistory();
      }
    }
  }, [auction, user]);

  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auctions/${id}`);
      setAuction(response.data);
    } catch (error) {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Always fetch bid history on mount
  const fetchBidHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/auctions/user/participated-bids', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && user?._id) {
        // Compare ObjectId as string
        const userBids = res.data.filter(bid => {
          if (String(bid.auction) === String(id)) return true;
          if (bid.auction && bid.auction._id && String(bid.auction._id) === String(id)) return true;
          return false;
        });
        setBidHistory(userBids);
      } else {
        setBidHistory([]);
      }
    } catch (err) {
      setBidHistory([]);
    }
  };

  // Fetch all bids for auction creator
  const fetchAllAuctionBids = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/auctions/user/created-bids/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setAllAuctionBids(res.data.bids || []);
        console.log('Fetched all auction bids:', res.data.bids);
      } else {
        setAllAuctionBids([]);
      }
    } catch (err) {
      console.error('Error fetching auction bids:', err);
      setAllAuctionBids([]);
    }
  };

  // Check approval status for payments
  const checkApprovalStatus = async () => {
    try {
      setLoadingApproval(true);
      const token = localStorage.getItem('token');
      
      if (isAuctionCreator) {
        // For auction creators - get all payment requests for their auction
        try {
          const response = await api.get(`/api/admin/payments/auction/${id}/payment-requests`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data && response.data.paymentRequests) {
            // Transform the admin data format to match our modal format
            const paymentRequests = response.data.paymentRequests;
            const statusData = {
              participationFee: null,
              winnerPayment: null,
              allPayments: paymentRequests
            };
            
            // Find latest participation fee and winner payment
            const participationFees = paymentRequests.filter(p => p.paymentType === 'participation_fee');
            const winnerPayments = paymentRequests.filter(p => p.paymentType === 'winner_payment');
            
            if (participationFees.length > 0) {
              statusData.participationFee = {
                status: participationFees[0].verificationStatus,
                amount: participationFees[0].paymentAmount,
                count: participationFees.length
              };
            }
            
            if (winnerPayments.length > 0) {
              statusData.winnerPayment = {
                status: winnerPayments[0].verificationStatus,
                amount: winnerPayments[0].paymentAmount,
                user: winnerPayments[0].user,
                count: winnerPayments.length
              };
            }
            
            setApprovalStatus(statusData);
            setShowApprovalModal(true);
          } else {
            throw new Error('No payment data received');
          }
        } catch (adminError) {
          console.log('Admin endpoint failed, trying regular endpoints:', adminError);
          // Fallback to regular endpoints if admin access fails
          await checkRegularApprovalStatus(token);
        }
      } else {
        // For bidders/winners - get their own payment status
        await checkRegularApprovalStatus(token);
      }

    } catch (error) {
      console.error('Error checking approval status:', error);
      setApprovalStatus({
        error: 'Failed to load approval status. Please try again.'
      });
      setShowApprovalModal(true);
    } finally {
      setLoadingApproval(false);
    }
  };

  // Helper function for regular approval status check
  const checkRegularApprovalStatus = async (token) => {
    // Check both participation fee and winner payment status
    const [participationResponse, winnerResponse] = await Promise.allSettled([
      api.get(`/api/payments/payment-status/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      api.get(`/api/payments/winner-payment-status/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const statusData = {
      participationFee: null,
      winnerPayment: null
    };

    if (participationResponse.status === 'fulfilled') {
      statusData.participationFee = participationResponse.value.data;
    }

    if (winnerResponse.status === 'fulfilled') {
      statusData.winnerPayment = winnerResponse.value.data;
    }

    setApprovalStatus(statusData);
    setShowApprovalModal(true);
  };

  const formatPrice = (price) => {
    if (!auction?.currency || auction.currency === 'Other') {
      return `${price}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: auction.currency
    }).format(price);
  };

  const formatTimeLeft = (auction) => {
    const now = new Date();
    let target;
    let label = '';
    // Prefer startTime/endTime, fallback to startDate/endDate
    if (auction?.status === 'upcoming') {
      target = auction?.startTime ? new Date(auction.startTime) : (auction?.startDate ? new Date(auction.startDate) : null);
      label = 'Starts in';
    } else {
      target = auction?.endTime ? new Date(auction.endTime) : (auction?.endDate ? new Date(auction.endDate) : null);
      label = 'Ends in';
    }
    // If no valid date, show '--' instead of 'Unknown'
    if (!target || isNaN(target.getTime())) return '--';
    const diff = target - now;
    if (diff <= 0) return auction?.status === 'upcoming' ? 'Started' : 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${label} ${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${label} ${hours}h ${minutes}m`;
    return `${label} ${minutes}m`;
  };

  const getWinner = (auction) => {
    if (!auction || !auction.bids || auction.bids.length === 0) return null;
    try {
      return auction.bids.reduce((max, bid) => (bid.amount > (max.amount || 0) ? bid : max), auction.bids[0]);
    } catch (err) {
      return auction.bids[0];
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!auction) return <div>Auction not found</div>;

  // Approval Status Modal Component
  const ApprovalStatusModal = () => {
    const getStatusIcon = (status) => {
      switch (status) {
        case 'approved':
          return <CheckCircle style={{ color: '#059669', width: '1.25rem', height: '1.25rem' }} />;
        case 'rejected':
          return <XCircle style={{ color: '#dc2626', width: '1.25rem', height: '1.25rem' }} />;
        case 'pending':
          return <AlertCircle style={{ color: '#d97706', width: '1.25rem', height: '1.25rem' }} />;
        default:
          return <AlertCircle style={{ color: '#6b7280', width: '1.25rem', height: '1.25rem' }} />;
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'approved': return '#059669';
        case 'rejected': return '#dc2626';
        case 'pending': return '#d97706';
        default: return '#6b7280';
      }
    };

    return (
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
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
              💳 Payment Approval Status
            </h2>
            <button
              onClick={() => setShowApprovalModal(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X style={{ width: '1.5rem', height: '1.5rem', color: '#6b7280' }} />
            </button>
          </div>

          {loadingApproval ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}></div>
              <p>Loading approval status...</p>
            </div>
          ) : approvalStatus?.error ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <XCircle style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Error Loading Status</p>
              <p style={{ fontSize: '0.875rem' }}>{approvalStatus.error}</p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                  Auction: {auction.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                  ID: {auction.auctionId || auction._id}
                </p>
              </div>

              {/* Enhanced content for auction creators */}
              {approvalStatus?.allPayments && isAuctionCreator ? (
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                    🏪 All Payment Requests for Your Auction
                  </h3>
                  
                  {/* Summary Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: '0 0 0.25rem 0' }}>
                        Total Requests
                      </p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e40af', margin: 0 }}>
                        {approvalStatus.allPayments.length}
                      </p>
                    </div>
                    
                    {approvalStatus.participationFee?.count && (
                      <div style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <p style={{ fontSize: '0.875rem', color: '#15803d', margin: '0 0 0.25rem 0' }}>
                          Participation Fees
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#15803d', margin: 0 }}>
                          {approvalStatus.participationFee.count}
                        </p>
                      </div>
                    )}
                    
                    {approvalStatus.winnerPayment?.count && (
                      <div style={{
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: '8px',
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <p style={{ fontSize: '0.875rem', color: '#92400e', margin: '0 0 0.25rem 0' }}>
                          Winner Payments
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#92400e', margin: 0 }}>
                          {approvalStatus.winnerPayment.count}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* All Payment Requests List */}
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {approvalStatus.allPayments.map((payment, index) => (
                      <div key={index} style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          {getStatusIcon(payment.verificationStatus)}
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                              {payment.paymentType === 'participation_fee' ? '🎯 Participation Fee' : '🏆 Winner Payment'}
                            </h4>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                              From: {payment.user?.fullName || 'Unknown User'}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{
                              margin: '0.25rem 0',
                              fontWeight: '600',
                              color: getStatusColor(payment.verificationStatus)
                            }}>
                              {payment.verificationStatus?.toUpperCase()}
                            </p>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                              {payment.paymentAmount} {auction.currency}
                            </p>
                          </div>
                        </div>
                        
                        {payment.verificationStatus === 'approved' && payment.paymentType === 'winner_payment' && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            backgroundColor: '#f0fdf4',
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0'
                          }}>
                            <p style={{ 
                              margin: '0 0 0.5rem 0', 
                              color: '#059669', 
                              fontWeight: '600',
                              fontSize: '0.875rem'
                            }}>
                              🎉 Next Steps for You as Seller:
                            </p>
                            <ul style={{ 
                              margin: 0,
                              paddingLeft: '1.2rem',
                              fontSize: '0.875rem',
                              color: '#047857',
                              lineHeight: '1.4'
                            }}>
                              <li>Transport the item to {payment.user?.fullName}</li>
                              <li>You will receive <strong>{((payment.paymentAmount || 0) * 0.95).toLocaleString()} {auction.currency}</strong> (95%)</li>
                              <li>Platform commission: <strong>{((payment.paymentAmount || 0) * 0.05).toLocaleString()} {auction.currency}</strong> (5%)</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Regular content for bidders/winners */
                <div>
                  {/* Participation Fee Status */}
                  {approvalStatus?.participationFee && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {getStatusIcon(approvalStatus.participationFee.status)}
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                          🎯 Participation Fee
                        </h4>
                      </div>
                      <div style={{ marginLeft: '2rem' }}>
                        <p style={{
                          margin: '0.25rem 0',
                          fontWeight: '600',
                          color: getStatusColor(approvalStatus.participationFee.status)
                        }}>
                          Status: {approvalStatus.participationFee.status?.toUpperCase()}
                        </p>
                        {approvalStatus.participationFee.amount && (
                          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                            Amount: {approvalStatus.participationFee.amount} {auction.currency}
                          </p>
                        )}
                        {approvalStatus.participationFee.canBid !== undefined && (
                          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                            Can Bid: {approvalStatus.participationFee.canBid ? 'Yes' : 'No'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Winner Payment Status */}
                  {approvalStatus?.winnerPayment && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {getStatusIcon(approvalStatus.winnerPayment.status)}
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                          🏆 Winner Payment
                        </h4>
                      </div>
                      <div style={{ marginLeft: '2rem' }}>
                        <p style={{
                          margin: '0.25rem 0',
                          fontWeight: '600',
                          color: getStatusColor(approvalStatus.winnerPayment.status)
                        }}>
                          Status: {approvalStatus.winnerPayment.status?.toUpperCase()}
                        </p>
                        {approvalStatus.winnerPayment.amount && (
                          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                            Amount: {approvalStatus.winnerPayment.amount} {auction.currency}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No payment requests found */}
              {!approvalStatus?.participationFee && !approvalStatus?.winnerPayment && !approvalStatus?.allPayments && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <AlertCircle style={{ width: '2rem', height: '2rem', margin: '0 auto 0.5rem' }} />
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>No Payment Requests Found</p>
                  <p style={{ fontSize: '0.875rem' }}>
                    You haven't submitted any payment requests for this auction yet.
                  </p>
                </div>
              )}

              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
                  💡 <strong>Note:</strong> 
                  {isAuctionCreator 
                    ? ' As auction creator, you can see all payment requests for your auction. Contact admin if you need assistance with transaction processing.'
                    : approvalStatus?.participationFee?.status === 'pending' || approvalStatus?.winnerPayment?.status === 'pending' 
                    ? ' Payment approvals are processed by admin. Your request is under review.' 
                    : ' Payment approvals are processed by admin. Contact admin if you have any questions.'}
                </p>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              onClick={() => setShowApprovalModal(false)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="auction-details-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft className="btn-icon" />
          Back to Auctions
        </button>

          <div className="auction-details-header">
           <div>

             <h1 className="auction-title">{auction.title}</h1>
             {/* Seller Info */}
            <div className="seller-info">
              <User className="seller-icon" />
              <div className="seller-details">
                <span className="seller-label">Seller</span>
                <span className="seller-name">{auction.seller.fullName}</span>
              </div>
               </div>
           </div>
            <div className="bid-time-left">
                <Clock className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-label">Time Left</span>
                  <span className="stat-value">{formatTimeLeft(auction)}</span>
                </div>
              </div>
             <div className="bid-total-count">
                <Gavel className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-label">Total Bids</span>
                  <span className="stat-value">{auction.bids?.length || 0}</span>
                </div>
              </div>


            </div>

         

        <div className="auction-details-grid">
          {/* Image Section */}
          <div className="auction-image-section">
            <div className="auction-image-container">
              <img 
                src={auction.images && auction.images.length > 0
                  ? (auction.images[0].startsWith('http')
                      ? auction.images[0]
                      : `http://localhost:5000/${auction.images[0]}`)
                  : auction.image
                    ? (auction.image.startsWith('http')
                        ? auction.image
                        : `http://localhost:5000/${auction.image}`)
                    : 'https://res.cloudinary.com/dhjbphutc/image/upload/v1755457818/no-image-found_kgenoc.png'}
                alt={auction.title}
                style={{ width: '100%', maxWidth: '500px', height: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                onError={(e) => {
                  e.target.src = 'https://res.cloudinary.com/dhjbphutc/image/upload/v1755457818/no-image-found_kgenoc.png';
                }}
              />
            </div>
        {/* End Auction Button for Seller */}
       

              </div>


           {/* Bidder List Section (iframe-like block) */}
        {/* Bidders or Winner Section */}
        {(auction.status === 'ended' || auction.status === 'stopped') ? (
          // Auction ended or not active -> show winner card
          (() => {
            const winner = getWinner(auction);
            if (!winner) return <div className="winner-empty">No winner — no bids were placed.</div>;
            return <WinnerCard auction={auction} winner={winner} user={user} />;
          })()
        ) : (
          // Auction is active -> show bidders for all auction types
          <div className="auction-bidder-iframe" style={{marginTop: '2rem', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem'}}>
            <h2 style={{fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem'}}>
              {auction.auctionType === 'reserve' ? 'Sealed Bids' : 'Bidders'}
            </h2>
            
            {auction.auctionType === 'reserve' ? (
              // Reserve auction - show different content based on user role
              <div>
                {isAuctionCreator ? (
                  // Auction creator view - show all sealed bids
                  <div>
                    <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem'}}>
                      All Sealed Bids ({allAuctionBids.length})
                    </h3>
                    {allAuctionBids && allAuctionBids.length > 0 ? (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                        {allAuctionBids.map((bid, idx) => (
                          <div key={idx} style={{
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            background: idx === 0 ? '#f0f9ff' : '#f8fafc', // Highlight highest bid
                            borderRadius: '8px', 
                            padding: '0.75rem 1rem',
                            border: idx === 0 ? '2px solid #3b82f6' : '1px solid #e5e7eb'
                          }}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                              <User style={{width: '1rem', height: '1rem', color: '#64748b'}} />
                              <span style={{fontWeight: 600, color: '#1e293b'}}>
                                {bid.bidder?.fullName || 'Anonymous Bidder'}
                                {idx === 0 && <span style={{color: '#3b82f6', marginLeft: '0.5rem'}}>(Highest)</span>}
                              </span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                              <span style={{fontWeight: 600, color: idx === 0 ? '#3b82f6' : '#4f46e5'}}>
                                {formatPrice(bid.amount)}
                              </span>
                              <span style={{fontSize: '0.75rem', color: '#64748b'}}>
                                {new Date(bid.createdAt).toLocaleDateString()} {new Date(bid.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                        {/* Show reserved amount if available */}
                        {auction.reservedAmount && (
                          <div style={{marginTop: '1rem', color: '#0ea5e9', fontWeight: 600, textAlign: 'center', padding: '0.75rem', background: '#e0f2fe', borderRadius: '8px'}}>
                            Reserved Amount: {formatPrice(auction.reservedAmount)}
                          </div>
                        )}
                        
                        {/* Admin Approval and Contact Admin buttons for reserve auctions - ONLY WHEN AUCTION ENDS */}
                        {(auction.status === 'ended' || auction.status === 'stopped') && (
                          <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                            <button 
                              className="see-admin-approval-btn"
                              style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '12px',
                                fontWeight: '600',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                              }}
                              onClick={checkApprovalStatus}
                              disabled={loadingApproval}
                              onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                              }}
                            >
                              {loadingApproval ? '⏳ Loading...' : '🔍 See Admin Approval Status'}
                            </button>
                            
                            <button 
                              className="contact-admin-btn"
                              style={{
                                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '12px',
                                fontWeight: '600',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                              }}
                              onClick={() => {
                                const subject = `Reserve Auction Support - ${auction.title}`;
                                const body = `Dear Admin,

I need assistance with my reserve auction "${auction.title}" (ID: ${auction._id || auction.auctionId}).

Current Details:
- Auction Type: Reserve
- Total Bids: ${allAuctionBids.length}
- Highest Bid: ${allAuctionBids.length > 0 ? formatPrice(allAuctionBids[0].amount) : 'No bids yet'}
- Reserved Amount: ${auction.reservedAmount ? formatPrice(auction.reservedAmount) : 'Not set'}

Please contact me regarding the approval process and next steps.

Best regards,
${user?.fullName || user?.username || 'Auction Creator'}`;

                                window.location.href = `mailto:admin@auctionsite.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                              }}
                              onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
                              }}
                            >
                              📧 Contact Admin
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '8px'}}>
                        No bids received yet.
                      </div>
                    )}
                  </div>
                ) : (
                  // Bidder view - show only their sealed bid
                  <div>
                    <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem'}}>Your Sealed Bid</h3>
                    {user && bidHistory && bidHistory.length > 0 ? (
                      (() => {
                        // Find user's highest bid
                        const highestBid = bidHistory.reduce((max, bid) => bid.amount > max.amount ? bid : max, bidHistory[0]);
                        return (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '8px', padding: '0.75rem 1rem'}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <User style={{width: '1rem', height: '1rem', color: '#64748b'}} />
                                <span style={{fontWeight: 600, color: '#1e293b'}}>Your Highest Bid</span>
                              </div>
                              <span style={{fontWeight: 600, color: '#4f46e5'}}>{formatPrice(highestBid.amount)}</span>
                            </div>
                            {/* Show reserved amount if available */}
                            {auction.reservedAmount && (
                              <div style={{marginTop: '1rem', color: '#0ea5e9', fontWeight: 600}}>
                                Reserved Amount: {formatPrice(auction.reservedAmount)}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <span style={{color: '#64748b'}}>No bids yet.</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Regular auction - show all bidders
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                {auction.bids && auction.bids.length > 0 ? (
                  auction.bids.map((bid, idx) => (
                    <div key={idx} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '8px', padding: '0.75rem 1rem'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <User style={{width: '1rem', height: '1rem', color: '#64748b'}} />
                        <span style={{fontWeight: 600, color: '#1e293b'}}>{bid.bidder.fullName}</span>
                      </div>
                      <span style={{fontWeight: 600, color: '#4f46e5'}}>{formatPrice(bid.amount)}</span>
                    </div>
                  ))
                ) : (
                  <span style={{color: '#64748b'}}>No bids yet.</span>
                )}
              </div>
            )}
          </div>
        )}
         {auction.status === 'active' && user && auction.seller && user._id === auction.seller._id && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              style={{ background: '#ef4444', color: 'white', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', border: 'none', cursor: 'pointer' }}
              onClick={async () => {
                if (window.confirm('Are you sure you want to end this auction?')) {
                  try {
                    await api.put(`/auctions/${auction._id}/endtime`, { endTime: new Date().toISOString() });
                    window.location.reload();
                  } catch (err) {
                    alert('Failed to end auction.');
                  }
                }
              }}
            >End Auction</button>
          </div>
        )}


        </div>

       
      </div>

      {/* Approval Status Modal */}
      {showApprovalModal && <ApprovalStatusModal />}

      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuctionBidPage;
