import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WinnerPaymentModal from './WinnerPaymentModal';
import api from '../utils/api';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const Confetti = ({trigger}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const w = canvas.width = window.innerWidth;
    const h = canvas.height = 240;

    function rand(min, max){ return Math.random() * (max - min) + min; }

    function createParticles(){
      particles = [];
      for(let i=0;i<80;i++){
        particles.push({
          x: rand(0,w),
          y: rand(0,h/2),
          r: rand(2,6),
          d: rand(1,3),
          color: ['#F59E0B','#FBBF24','#34D399','#60A5FA','#A78BFA'][Math.floor(rand(0,5))]
        });
      }
    }

    function draw(){
      ctx.clearRect(0,0,w,h);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.95;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      });
    }

    function update(){
      particles.forEach(p => {
        p.y += p.d + 1;
        p.x += Math.sin(p.d) * 2;
        if(p.y > h){ p.y = -10; p.x = rand(0,w); }
      });
    }

    createParticles();
    let raf = null;
    function loop(){ draw(); update(); raf = requestAnimationFrame(loop); }
    loop();

    // stop after 2.5s
    const timeout = setTimeout(() => { cancelAnimationFrame(raf); ctx.clearRect(0,0,w,h); }, 2500);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [trigger]);

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 6, pointerEvents:'none' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 240 }} />
    </div>
  );
};

const WinnerCard = ({ auction, winner, user }) => {
  const navigate = useNavigate();
  
  // Handle different data structures:
  // 1. winner from auction.bids (bid object with bidder field)
  // 2. winner from Winner collection (winner object with user field)
  const bidder = winner?.bidder || winner?.user || winner || {};
  const avatar = bidder.profileImage || bidder.profileImg || bidder.avatar || 'https://res.cloudinary.com/dhjbphutc/image/upload/v1755457818/no-image-found_kgenoc.png';
  
  // Get IDs for comparison - handle different field names
  let bidderId = null;
  if (winner?.bidder) {
    // This is a bid object, bidder could be ID or populated object
    bidderId = winner.bidder._id || winner.bidder.id || winner.bidder;
  } else if (winner?.user) {
    // This is a Winner object, user could be ID or populated object
    bidderId = winner.user._id || winner.user.id || winner.user;
  } else if (winner?._id) {
    // Winner object might have user data directly embedded
    bidderId = winner._id;
  }
  
  const sellerId = auction?.seller?._id || auction?.seller || null;
  
  // User role checks
  const isWinner = Boolean(user && bidderId && String(user._id) === String(bidderId));
  const isSeller = Boolean(user && sellerId && String(user._id) === String(sellerId));
  
  // Permission rules: seller sees bidder contact; winner sees seller contact; others see no buttons
  const sellerCanContactBidder = Boolean(isSeller);
  const winnerCanContactSeller = Boolean(isWinner);
  const showOnlyProfile = !(sellerCanContactBidder || winnerCanContactSeller);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinnerPaymentModal, setShowWinnerPaymentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [loadingApproval, setLoadingApproval] = useState(false);

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('WinnerCard Debug:', {
      userId: user?._id,
      bidderId,
      sellerId,
      isWinner,
      isSeller,
      auctionType: auction?.auctionType,
      auctionStatus: auction?.status,
      sellerCanContactBidder,
      winnerCanContactSeller,
      showOnlyProfile,
      bidderData: bidder,
      winnerData: winner,
      winnerStructure: {
        hasBidder: !!winner?.bidder,
        hasUser: !!winner?.user,
        hasId: !!winner?._id,
        bidderType: typeof winner?.bidder,
        userType: typeof winner?.user
      },
      bidderEmail: bidder?.email || winner?.email,
      sellerEmail: auction?.seller?.email,
      buttonType: isSeller 
        ? (auction?.auctionType === 'reserve' ? 'Admin Buttons' : 'Contact Bidder')
        : isWinner 
          ? (auction?.auctionType === 'reserve' ? 'Pay Full Amount' : 'Contact Seller')
          : 'No Buttons (Just Animation)'
    });
  }

  // Check approval status for payments
  const checkApprovalStatus = async () => {
    try {
      setLoadingApproval(true);
      const token = localStorage.getItem('token');
      
      if (isSeller) {
        // For auction creators - check if there are winner payments for their auction
        try {
          const winnerResponse = await api.get(`/api/payments/winner-payment-status/${auction._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Winner payment status response:', winnerResponse.data);
          
          if (winnerResponse.data && winnerResponse.data.isAuctionCreator) {
            const statusData = {
              isAuctionCreator: true,
              winnerPayment: winnerResponse.data.hasPayment ? winnerResponse.data.winnerPayment : null,
              message: winnerResponse.data.message || null
            };
            
            setApprovalStatus(statusData);
            setShowApprovalModal(true);
          } else {
            // Fallback for old response format
            const statusData = {
              isAuctionCreator: true,
              winnerPayment: null
            };
            
            if (winnerResponse.data && winnerResponse.data.hasPayment) {
              statusData.winnerPayment = {
                status: winnerResponse.data.paymentRequest.status,
                submittedAt: winnerResponse.data.paymentRequest.submittedAt,
                verifiedAt: winnerResponse.data.paymentRequest.verifiedAt,
                adminNotes: winnerResponse.data.paymentRequest.adminNotes,
                amount: winner?.amount || 0
              };
            }
            
            setApprovalStatus(statusData);
            setShowApprovalModal(true);
          }
        } catch (error) {
          console.log('No winner payment found for this auction:', error);
          setApprovalStatus({
            isAuctionCreator: true,
            message: 'No winner payment requests found for this auction yet.'
          });
          setShowApprovalModal(true);
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
      api.get(`/api/payments/payment-status/${auction._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      api.get(`/api/payments/winner-payment-status/${auction._id}`, {
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

  useEffect(() => {
    // show confetti once when component mounts if auction has ended
    if (auction?.status === 'ended') {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [auction?.status]);

  return (
    <div 
      className="auction-winner-display" 
      style={{
        margin: '2rem auto',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
        padding: '3rem 2rem',
        maxWidth: '420px',
        textAlign: 'center',
        border: '2px solid #f8fafc',
        position: 'relative',
        overflow: 'hidden'
      }}
      role="region" 
      aria-label="Auction winner"
    >
      {/* Gradient top border */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899)'
      }} />
      
      {/* Debug role indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          padding: '4px 8px',
          fontSize: '10px',
          fontWeight: 'bold',
          borderRadius: '4px',
          background: isSeller ? '#3b82f6' : isWinner ? '#10b981' : '#6b7280',
          color: 'white'
        }}>
          {isSeller ? 'SELLER' : isWinner ? 'WINNER' : 'OTHER'}
        </div>
      )}
      
      {showConfetti && <Confetti trigger={showConfetti} />}
      
      <div 
        className="winner-profile-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}
      >
        <div className="winner-avatar-wrapper">
          <img 
            className="winner-circular-avatar" 
            src={avatar} 
            alt={bidder.fullName || 'Winner'}
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '6px solid #ffffff',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.15)',
              background: '#f1f5f9'
            }}
            onError={(e) => { 
              e.target.src = 'https://res.cloudinary.com/dhjbphutc/image/upload/v1755457818/no-image-found_kgenoc.png'; 
            }} 
          />
        </div>
        
        <div 
          className="winner-info-section"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            width: '100%'
          }}
        >
          <h3 
            className="winner-display-name"
            style={{
              fontSize: '2rem',
              fontWeight: '900',
              color: '#1e293b',
              margin: '0',
              letterSpacing: '-0.02em',
              textAlign: 'center'
            }}
          >
            {bidder.fullName || bidder.name || winner?.fullName || winner?.name || bidder.username || winner?.username || 'Anonymous'}
          </h3>
          
          <div 
            className="winner-bid-amount"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '20px',
              fontWeight: '800',
              fontSize: '1.4rem',
              boxShadow: '0 8px 25px rgba(79, 70, 229, 0.4)',
              border: 'none',
              display: 'inline-block',
              letterSpacing: '0.02em',
              minWidth: '200px'
            }}
          >
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: auction?.currency || 'USD' }).format(winner?.amount || 0)}
          </div>

          {showOnlyProfile ? (
            <p 
              className="winner-message"
              style={{
                color: '#64748b',
                fontSize: '1.1rem',
                margin: '0.5rem 0',
                lineHeight: '1.6',
                textAlign: 'center'
              }}
            >
              Better luck next time
            </p>
          ) : (
            <p 
              className="winner-message"
              style={{
                color: '#64748b',
                fontSize: '1.1rem',
                margin: '0.5rem 0',
                lineHeight: '1.6',
                textAlign: 'center'
              }}
            >
              Congratulations to the highest bidder
            </p>
          )}

          {/* Contact Buttons Section */}
          {sellerCanContactBidder && (bidder?.email || winner?.email) ? (
            // Seller view - show admin buttons for reserve auctions
            auction?.auctionType === 'reserve' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  className="see-admin-approval-btn"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2.5rem',
                    borderRadius: '15px',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={checkApprovalStatus}
                  disabled={loadingApproval}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
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
                    padding: '1rem 2.5rem',
                    borderRadius: '15px',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(5, 150, 105, 0.3)',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => {
                    const subject = `Reserve Auction Completed - ${auction.title}`;
                    const body = `Dear Admin,

My reserve auction "${auction.title}" has ended successfully.

Winner Details:
- Winner: ${bidder.fullName || bidder.username || 'Winner'}
- Winning Bid: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: auction?.currency || 'USD' }).format(winner?.amount || 0)}
- Auction ID: ${auction._id || auction.auctionId}

Please assist with the final payment processing and transaction completion.

Best regards,
${auction.seller?.fullName || auction.seller?.username || 'Auction Seller'}`;

                    window.location.href = `mailto:admin@auctionsite.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 12px 30px rgba(5, 150, 105, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(5, 150, 105, 0.3)';
                  }}
                >
                  � Contact Admin
                </button>
              </div>
            ) : (
              // Regular auction - show contact bidder button
              <button 
                className="contact-bidder-btn"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2.5rem',
                  borderRadius: '15px',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  marginTop: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => {
                  const subject = `Regarding Your Winning Bid - ${auction.title}`;
                  const body = `Dear ${bidder.fullName || bidder.username || winner?.fullName || 'Winner'},

Congratulations on winning the auction for "${auction.title}" with your bid of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: auction?.currency || 'USD' }).format(winner?.amount || 0)}.

Please contact me to discuss the next steps for completing this transaction.

Best regards,
${auction.seller?.fullName || auction.seller?.username || 'Auction Seller'}`;

                  window.location.href = `mailto:${bidder.email || winner?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 12px 30px rgba(59, 130, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                }}
              >
                Contact Bidder
              </button>
            )
          ) : winnerCanContactSeller && auction?.seller?.email ? (
            // Winner view - show approval status button and pay full amount for reserve auctions
            auction?.auctionType === 'reserve' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  className="see-admin-approval-btn"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2.5rem',
                    borderRadius: '15px',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={checkApprovalStatus}
                  disabled={loadingApproval}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
                  }}
                >
                  {loadingApproval ? '⏳ Loading...' : '🔍 See Admin Approval Status'}
                </button>
                
                <button 
                  className="pay-full-amount-btn"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2.5rem',
                    borderRadius: '15px',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setShowWinnerPaymentModal(true)}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 12px 30px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.3)';
                  }}
                >
                  💰 Pay Full Amount
                </button>
              </div>
            ) : (
              // Regular auction - show contact seller
              <button 
                className="contact-seller-btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2.5rem',
                  borderRadius: '15px',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  marginTop: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => {
                  const subject = `Congratulations - I Won Your Auction: ${auction.title}`;
                  const body = `Dear ${auction.seller?.fullName || auction.seller?.username || 'Seller'},

I am writing regarding the auction "${auction.title}" that I won with a bid of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: auction?.currency || 'USD' }).format(winner?.amount || 0)}.

Please contact me to discuss payment and delivery arrangements.

Best regards,
${user?.fullName || user?.username || 'Auction Winner'}`;

                  window.location.href = `mailto:${auction.seller.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                }}
              >
                Contact Seller
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* Winner Payment Modal */}
      <WinnerPaymentModal
        isOpen={showWinnerPaymentModal}
        onClose={() => setShowWinnerPaymentModal(false)}
        auction={auction}
        winner={winner}
      />

      {/* Approval Status Modal */}
      {showApprovalModal && (
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
                {approvalStatus?.isAuctionCreator ? (
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                      🏪 Winner Payment Status for Your Auction
                    </h3>
                    
                    {approvalStatus?.winnerPayment ? (
                      <div style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          {approvalStatus.winnerPayment.status === 'approved' ? (
                            <CheckCircle style={{ color: '#059669', width: '1.25rem', height: '1.25rem' }} />
                          ) : approvalStatus.winnerPayment.status === 'rejected' ? (
                            <XCircle style={{ color: '#dc2626', width: '1.25rem', height: '1.25rem' }} />
                          ) : (
                            <AlertCircle style={{ color: '#d97706', width: '1.25rem', height: '1.25rem' }} />
                          )}
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                            🏆 Winner Payment Status
                          </h4>
                        </div>
                        <div style={{ marginLeft: '2rem' }}>
                          <p style={{
                            margin: '0.25rem 0',
                            fontWeight: '600',
                            fontSize: '1.125rem',
                            color: approvalStatus.winnerPayment.status === 'approved' ? '#059669' : 
                                   approvalStatus.winnerPayment.status === 'rejected' ? '#dc2626' : '#d97706'
                          }}>
                            Status: {approvalStatus.winnerPayment.status?.toUpperCase()}
                          </p>
                          {approvalStatus.winnerPayment.amount && (
                            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                              Amount: {approvalStatus.winnerPayment.amount} {auction.currency}
                            </p>
                          )}
                          {approvalStatus.winnerPayment.submittedAt && (
                            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                              Submitted: {new Date(approvalStatus.winnerPayment.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                          {approvalStatus.winnerPayment.verifiedAt && (
                            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                              Verified: {new Date(approvalStatus.winnerPayment.verifiedAt).toLocaleDateString()}
                            </p>
                          )}
                          {approvalStatus.winnerPayment.adminNotes && (
                            <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#374151', fontStyle: 'italic' }}>
                              Admin Notes: {approvalStatus.winnerPayment.adminNotes}
                            </p>
                          )}
                          
                          {/* Enhanced message for approved payments */}
                          {approvalStatus.winnerPayment.status === 'approved' && (
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
                                🎉 Payment Approved - Next Steps:
                              </h5>
                              <ul style={{ 
                                margin: '0.5rem 0 0 0',
                                paddingLeft: '1.2rem',
                                fontSize: '0.875rem',
                                color: '#047857',
                                lineHeight: '1.6'
                              }}>
                                <li>Transport the item to the bidder</li>
                                <li>You will receive <strong>{((approvalStatus.winnerPayment.amount || 0) * 0.95).toLocaleString()} {auction.currency}</strong> (95% of winning bid)</li>
                                <li>5% commission fee: <strong>{((approvalStatus.winnerPayment.amount || 0) * 0.05).toLocaleString()} {auction.currency}</strong></li>
                                <li>Contact admin if you need assistance with delivery arrangements</li>
                              </ul>
                            </div>
                          )}
                          
                          {/* Message for pending payments */}
                          {approvalStatus.winnerPayment.status === 'pending' && (
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
                                ⏳ Winner payment is under review by admin. You will be notified once approved.
                              </p>
                            </div>
                          )}
                          
                          {/* Message for rejected payments */}
                          {approvalStatus.winnerPayment.status === 'rejected' && (
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
                                ❌ Winner payment was rejected. Please contact admin for more information.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : approvalStatus?.message ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#6b7280',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <AlertCircle style={{ width: '2rem', height: '2rem', margin: '0 auto 0.5rem' }} />
                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>No Winner Payment Yet</p>
                        <p style={{ fontSize: '0.875rem' }}>
                          {approvalStatus.message}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  /* Regular content for bidders/winners */
                  <div>
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
                      {approvalStatus.winnerPayment.status === 'approved' ? (
                        <CheckCircle style={{ color: '#059669', width: '1.25rem', height: '1.25rem' }} />
                      ) : approvalStatus.winnerPayment.status === 'rejected' ? (
                        <XCircle style={{ color: '#dc2626', width: '1.25rem', height: '1.25rem' }} />
                      ) : (
                        <AlertCircle style={{ color: '#d97706', width: '1.25rem', height: '1.25rem' }} />
                      )}
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                        🏆 Winner Payment
                      </h4>
                    </div>
                    <div style={{ marginLeft: '2rem' }}>
                      <p style={{
                        margin: '0.25rem 0',
                        fontWeight: '600',
                        color: approvalStatus.winnerPayment.status === 'approved' ? '#059669' : 
                               approvalStatus.winnerPayment.status === 'rejected' ? '#dc2626' : '#d97706'
                      }}>
                        Status: {approvalStatus.winnerPayment.status?.toUpperCase()}
                      </p>
                      {approvalStatus.winnerPayment.amount && (
                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                          Amount: {approvalStatus.winnerPayment.amount} {auction.currency}
                        </p>
                      )}
                      
                      {/* Enhanced message for approved payments */}
                      {approvalStatus.winnerPayment.status === 'approved' && (
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
                            🎉 Payment Approved - Next Steps:
                          </h5>
                          <ul style={{ 
                            margin: '0.5rem 0 0 0',
                            paddingLeft: '1.2rem',
                            fontSize: '0.875rem',
                            color: '#047857',
                            lineHeight: '1.6'
                          }}>
                            <li>Transport the item to the bidder</li>
                            <li>You will receive <strong>{((winner?.amount || 0) * 0.95).toLocaleString()} {auction.currency}</strong> (95% of winning bid)</li>
                            <li>5% commission fee: <strong>{((winner?.amount || 0) * 0.05).toLocaleString()} {auction.currency}</strong></li>
                            <li>Contact admin if you need assistance with delivery arrangements</li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Message for pending payments */}
                      {approvalStatus.winnerPayment.status === 'pending' && (
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
                            ⏳ Your payment is under review by admin. You will be notified once approved.
                          </p>
                        </div>
                      )}
                      
                      {/* Message for rejected payments */}
                      {approvalStatus.winnerPayment.status === 'rejected' && (
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
                            ❌ Payment was rejected. Please contact admin for more information.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* No payment requests found */}
                {!approvalStatus?.winnerPayment && !approvalStatus?.allPayments && (
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
                    {approvalStatus?.isAuctionCreator 
                      ? ' As auction creator, you can see all payment requests for your auction. Contact admin if you need assistance with transaction processing.'
                      : approvalStatus?.winnerPayment?.status === 'pending' 
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
      )}

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

export default WinnerCard;
