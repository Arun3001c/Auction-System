import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';
import BidSection from './BidSection';
import { ArrowLeft, User, DollarSign, Clock, Gavel } from 'lucide-react';

const AuctionBidPage = () => {
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
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= auction.currentBid) return;
    if (amount < auction.currentBid + auction.bidIncrement) return;
    setIsSubmittingBid(true);
    try {
      const response = await api.post(`/auctions/${id}/bid`, { amount });
      setAuction(response.data.auction);
      setBidAmount((response.data.auction.currentBid + response.data.auction.bidIncrement).toString());
    } catch (error) {}
    setIsSubmittingBid(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const isOwner = user && auction && auction.seller._id === user.id;
  const isHighestBidder = user && auction && auction.currentHighestBidder?._id === user.id;

  if (loading) return <div>Loading...</div>;
  if (!auction) return <div>Auction not found</div>;

  return (
    <div className="auction-bid-page">
      <button onClick={() => navigate(-1)} className="back-btn">
        <ArrowLeft /> Back
      </button>
      <div className="auction-details-grid">
        <div className="auction-image-section">
          <img src={auction.image?.startsWith('http') ? auction.image : `http://localhost:5000/${auction.image}`} alt={auction.title} className="auction-image" />
          <div className="auction-status">{auction.status}</div>
        </div>
        <div className="auction-info-section">
          <h1>{auction.title}</h1>
          <p>{auction.category}</p>
          <div className="auction-stats">
            <div><DollarSign /> {formatPrice(auction.currentBid)}</div>
            <div><Clock /> Time Left</div>
            <div><Gavel /> {auction.bids?.length || 0} Bids</div>
          </div>
          <div className="seller-info">
            <User /> Seller: {auction.seller.fullName}
          </div>
        </div>
      </div>
      <BidSection
        auction={auction}
        isAuthenticated={isAuthenticated}
        isOwner={isOwner}
        isHighestBidder={isHighestBidder}
        handlePlaceBid={handlePlaceBid}
        bidAmount={bidAmount}
        setBidAmount={setBidAmount}
        isSubmittingBid={isSubmittingBid}
        formatPrice={formatPrice}
      />
      <div className="auction-description">
        <h2>Description</h2>
        <p>{auction.description}</p>
      </div>
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
  );
};

export default AuctionBidPage;
