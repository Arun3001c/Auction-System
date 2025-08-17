import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';
import { ArrowLeft, User, DollarSign, Clock, Gavel } from 'lucide-react';

const BidderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuctionDetails();
    // eslint-disable-next-line
  }, [id]);

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
                src={auction.image?.startsWith('http') ? auction.image : `http://localhost:5000/${auction.image}`}
                alt={auction.title}
                className="auction-image"
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
              {/* <div className={`auction-status status-active`}>
                {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
              </div> */}
              {/* {auction.featured && (
                <div className="featured-badge">Featured</div>
              )} */}
              
            </div>
          </div>

          {/* Details Section */}
          <div className="auction-info-section">
            {/* <div className="auction-header">
              <h1 className="auction-title">{auction.title}</h1>
              <p className="auction-category">{auction.category}</p>
            </div> */}

            <div className="auction-stats">
              {/* <div className="stat-card current-bid">
                <DollarSign className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-label">Current Bid</span>
                  <span className="stat-value">{formatPrice(auction.currentBid)}</span>
                </div>
              </div> */}

          
             
            </div>

          
          </div>
        </div>

        {/* Description Section */}
        {/* <div className="auction-description">
          <h2>Description</h2>
          <p>{auction.description}</p>
        </div> */}
      </div>
    </div>
  );
};

export default BidderPage;
