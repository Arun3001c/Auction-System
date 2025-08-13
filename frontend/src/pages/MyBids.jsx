import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MyBids.css';
import { Search, Trophy } from 'lucide-react';

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    const fetchBids = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/my-bids', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBids(res.data);
      } catch (err) {
        setError('Failed to load bids');
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, []);

  const activeBids = bids.filter(bid => bid.status === 'active');
  const bidHistory = bids.filter(bid => bid.status !== 'active');

  return (
    <div className="dashboard-my-bids">
      <div className="dashboard-header">
        <h2><Search /> My Bids</h2>
      </div>
      <div className="bids-tabs">
        <button className={tab === 'active' ? 'tab active' : 'tab'} onClick={() => setTab('active')}>Active Bids</button>
        <button className={tab === 'history' ? 'tab active' : 'tab'} onClick={() => setTab('history')}>Bid History</button>
      </div>
      {loading ? <div className="loading">Loading...</div> : error ? <div className="error">{error}</div> : (
        <div className="bids-list">
          {(tab === 'active' ? activeBids : bidHistory).map(bid => (
            <div className="bid-card" key={bid._id}>
              <div className="bid-title">{bid.auctionTitle}</div>
              <div className="bid-details">
                <span>Your Bid: {bid.amount}</span>
                <span>Highest Bid: {bid.highestBid}</span>
                <span>Status: {bid.status}</span>
                {bid.winnerName && <span className="winner"><Trophy /> Winner: {bid.winnerName}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBids;
