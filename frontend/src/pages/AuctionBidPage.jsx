import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';
import BidSection from './BidSection';
import { ArrowLeft, User, DollarSign, Clock, Gavel } from 'lucide-react';
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

  useEffect(() => {
    fetchAuctionDetails();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (auction && user) {
      // Check if current user is the auction creator
      const isCreator = user._id === auction.seller?._id || user._id === auction.seller;
      setIsAuctionCreator(isCreator);
      
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
    </div>
  );
};

export default AuctionBidPage;
