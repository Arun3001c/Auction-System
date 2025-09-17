import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WinnerPaymentModal from './WinnerPaymentModal';

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
                  onClick={() => {
                    // Navigate to admin approval page
                    window.open('/admin/handle-auctions', '_blank');
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
                  }}
                >
                  🔍 See Admin Approval Status
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
            // Winner view - show pay full amount for reserve auctions
            auction?.auctionType === 'reserve' ? (
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
                  marginTop: '1rem',
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
    </div>
  );
};

export default WinnerCard;
