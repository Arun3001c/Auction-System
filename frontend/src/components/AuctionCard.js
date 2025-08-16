import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, DollarSign } from 'lucide-react';

const AuctionCard = ({ auction }) => {
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
    if (auction.status === 'upcoming') {
      target = new Date(auction.startTime || auction.startDate);
      label = 'Starts in';
    } else {
      target = new Date(auction.endTime || auction.endDate);
      label = 'Ends in';
    }
    if (!target || isNaN(target.getTime())) return 'Unknown';
    const diff = target - now;
    if (diff <= 0) return auction.status === 'upcoming' ? 'Started' : 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${label} ${days}d ${hours}h`;
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

  return (
    <div className="auction-card">
      <div className="auction-image-container">
        <img 
          src={auction.image?.startsWith('http') ? auction.image : `http://localhost:5000/${auction.image}`} 
          alt={auction.title}
          className="auction-image"
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg';
          }}
        />
        <div className={`auction-status ${getStatusColor(auction.status)}`}>
          {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
        </div>
        {auction.featured && (
          <div className="featured-badge">
            Featured
          </div>
        )}
      </div>

      <div className="auction-content">
        <h3 className="auction-title">{auction.title}</h3>
        <p className="auction-category">{auction.category}</p>
        
        <div className="auction-stats">
          <div className="stat-item">
            <DollarSign className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Current Bid</span>
              <span className="stat-value">{formatPrice(auction.currentBid)}</span>
            </div>
          </div>

          <div className="stat-item">
            <Clock className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Time Left</span>
              <span className="stat-value">{formatTimeLeft(auction)}</span>
            </div>
          </div>
        </div>

        <div className="auction-footer">
          <div className="bid-info">
            <span className="bid-count">{auction.bids?.length || 0} bids</span>
            <span className="seller-info">by {auction.seller?.fullName}</span>
          </div>
          
          <Link 
            to={`/auction/${auction._id}`} 
            className="view-details-btn"
          >
            <Eye className="btn-icon" />
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;
