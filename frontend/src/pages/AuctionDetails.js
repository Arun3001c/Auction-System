import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, User, Clock, DollarSign, Gavel, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';
// import './AuctionDetails.css'; // Assuming you have a CSS file for styling
const AuctionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  useEffect(() => {
    fetchAuctionDetails();
  }, [id]);

  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auctions/${id}`);
      setAuction(response.data);
      setBidAmount((response.data.currentBid + response.data.bidIncrement).toString());
    } catch (error) {
      console.error('Error fetching auction details:', error);
      toast.error('Failed to load auction details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to place a bid');
      navigate('/login');
      return;
    }

    const amount = parseFloat(bidAmount);
    
    if (isNaN(amount) || amount <= auction.currentBid) {
      toast.error(`Bid must be higher than current bid of $${auction.currentBid}`);
      return;
    }

    if (amount < auction.currentBid + auction.bidIncrement) {
      toast.error(`Minimum bid increment is $${auction.bidIncrement}`);
      return;
    }

    setIsSubmittingBid(true);
    try {
      const response = await api.post(`/auctions/${id}/bid`, { amount });
      setAuction(response.data.auction);
      setBidAmount((response.data.auction.currentBid + response.data.auction.bidIncrement).toString());
      toast.success('Bid placed successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to place bid';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatTimeLeft = (auction) => {
    const now = new Date();
    let target;
    let label = '';
    if (auction?.status === 'upcoming') {
      target = new Date(auction?.startTime || auction?.startDate);
      label = 'Starts in';
    } else {
      target = new Date(auction?.endTime || auction?.endDate);
      label = 'Ends in';
    }
    if (!target || isNaN(target.getTime())) return 'Unknown';
    const diff = target - now;
    if (diff <= 0) return auction?.status === 'upcoming' ? 'Started' : 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${label} ${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${label} ${hours}h ${minutes}m`;
    return `${label} ${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'upcoming':
        return 'status-upcoming';
      case 'ended':
        return 'status-ended';
      default:
        return 'status-default';
    }
  };

  const isOwner = user && auction && auction.seller._id === user._id;
  const isHighestBidder = user && auction && auction.currentHighestBidder?._id === user.id;

  if (loading) {
    return (
      <div className="auction-details-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading auction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="auction-details-page">
        <div className="container">
          <div className="error-container">
            <h2>Auction not found</h2>
            <button onClick={() => navigate('/')} className="back-btn">
              <ArrowLeft className="btn-icon" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-details-page">
      <div className="container">
        <button onClick={() => navigate('/')} className="back-btn">
          <ArrowLeft className="btn-icon" />
          Back to Auctions
        </button>

        <div className="auction-details-grid">
          {/* Image Section */}
          <div className="auction-image-section">
            <div className="auction-image-container">
              {/* Support multiple images from Cloudinary */}
              {Array.isArray(auction.images) && auction.images.length > 0 ? (
                auction.images.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl.startsWith('http') ? imgUrl : `http://localhost:5001/${imgUrl}`}
                    alt={auction.title}
                    className="auction-image"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                ))
              ) : auction.image ? (
                <img
                  src={auction.image.startsWith('http') ? auction.image : `http://localhost:5001/${auction.image}`}
                  alt={auction.title}
                  className="auction-image"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              ) : (
                <img src="/placeholder-image.jpg" alt="No image" className="auction-image" />
              )}
              <div className={`auction-status ${getStatusColor(auction.status)}`}>
                {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
              </div>
              {auction.featured && (
                <div className="featured-badge">
                  Featured
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="auction-info-section">
            <div className="auction-header">
              <h1 className="auction-title">{auction.title}</h1>
              <p className="auction-category">{auction.category}</p>
            </div>

            <div className="auction-stats">
              <div className="stat-card current-bid">
                <DollarSign className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-label">Current Bid</span>
                  <span className="stat-value">{formatPrice(auction.currentBid)}</span>
                </div>
              </div>

              <div className="stat-card time-left">
                <Clock className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-label">Time Left</span>
                  <span className="stat-value">{formatTimeLeft(auction)}</span>
                </div>
              </div>

              <div className="stat-card bid-count">
                <Gavel className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-label">Total Bids</span>
                  <span className="stat-value">{auction.bids?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="seller-info">
              <User className="seller-icon" />
              <div className="seller-details">
                <span className="seller-label">Seller</span>
                <span className="seller-name">{auction.seller.fullName}</span>
              </div>
            </div>
            
          </div>
        </div>

        {/* Description Section */}
        <div className="auction-description">
          <h2>Description</h2>
          <p>{auction.description}</p>
        </div>
        {/* Conditional rendering for bidding/participation button */}
        {isOwner ? (
          <button
            className="add-auction-btn"
            style={{ marginTop: '1rem', display: 'inline-block', width: 'fit-content' }}
            onClick={() => navigate(`/auction/${auction._id}/bid`)}
          >
            Go to Bidding Page
          </button>
        ) : (
          <button
            className="add-auction-btn"
            style={{ marginTop: '1rem', display: 'inline-block', width: 'fit-content' }}
            onClick={() => navigate(`/auction/${auction._id}/bidder`)}
          >
            Participate in Auction
          </button>
        )}

        {/* Bid History */}
        {auction.bids && auction.bids.length > 0 && (
          <div className="bid-history">
            <h2>Bid History</h2>
            <div className="bid-list">
              {auction.bids
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10)
                .map((bid, index) => (
                  <div key={index} className="bid-item">
                    <div className="bid-user">
                      <User className="user-icon" />
                      <span>{bid.bidder.fullName}</span>
                    </div>
                    <div className="bid-amount">{formatPrice(bid.amount)}</div>
                    <div className="bid-time">
                      {new Date(bid.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionDetails;
