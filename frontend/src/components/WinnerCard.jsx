import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const bidder = winner?.bidder || {};
  const avatar = bidder.profileImage || bidder.profileImg || bidder.avatar || 'https://res.cloudinary.com/dhjbphutc/image/upload/v1755457818/no-image-found_kgenoc.png';
  const bidderId = bidder._id || bidder.id || bidder || null;
  const sellerId = auction?.seller?._id || auction?.seller || null;
  const isWinner = Boolean(user && bidderId && String(user._id) === String(bidderId));
  const isSeller = Boolean(user && sellerId && String(user._id) === String(sellerId));
  
  // Permission rules: seller sees bidder contact; winner sees seller contact; others see no buttons
  const sellerCanContactBidder = Boolean(isSeller);
  const winnerCanContactSeller = Boolean(isWinner);
  const showOnlyProfile = !(sellerCanContactBidder || winnerCanContactSeller);
  const [showConfetti, setShowConfetti] = useState(false);

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('WinnerCard Debug:', {
      userId: user?._id,
      bidderId,
      sellerId,
      isWinner,
      isSeller,
      sellerCanContactBidder,
      winnerCanContactSeller,
      showOnlyProfile,
      bidderEmail: bidder?.email,
      sellerEmail: auction?.seller?.email
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
            {bidder.fullName || bidder.name || 'Anonymous'}
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
          {sellerCanContactBidder && bidder?.email ? (
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
                const body = `Dear ${bidder.fullName || bidder.username || 'Winner'},

Congratulations on winning the auction for "${auction.title}" with your bid of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: auction?.currency || 'USD' }).format(winner?.amount || 0)}.

Please contact me to discuss the next steps for completing this transaction.

Best regards,
${auction.seller?.fullName || auction.seller?.username || 'Auction Seller'}`;

                window.location.href = `mailto:${bidder.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
          ) : winnerCanContactSeller && auction?.seller?.email ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default WinnerCard;
