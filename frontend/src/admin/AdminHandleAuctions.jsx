

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminHandleAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:5001/api/admin/handle-auctions');
      setAuctions(res.data || []);
    } catch (err) {
      setError('Failed to fetch auctions. Please check your backend or database.');
      setAuctions([]);
    }
    setLoading(false);
  };

  const handleStop = async (id) => {
    if (!window.confirm('Are you sure you want to stop this auction?')) return;
    setLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/admin/handle-auctions/${id}/stop`);
      fetchAuctions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to stop auction.');
    }
    setLoading(false);
  };

  const handleContinue = async (id) => {
    if (!window.confirm('Continue this stopped auction?')) return;
    setLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/admin/handle-auctions/${id}/continue`);
      fetchAuctions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to continue auction.');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this auction?')) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5001/api/admin/handle-auctions/${id}`);
      fetchAuctions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete auction.');
    }
    setLoading(false);
  };

  return (
    <div className="admin-auctions-page" style={{padding: '2rem'}}>
      <h2>Handle Auctions</h2>
      {error && <div style={{color:'red',marginBottom:'1rem', padding: '1rem', background: '#fee2e2', borderRadius: '4px'}}>{error}</div>}
      {loading ? (
        <div style={{textAlign: 'center', padding: '2rem'}}>Loading auctions...</div>
      ) : auctions.length === 0 ? (
        <div style={{textAlign: 'center', padding: '2rem', color: '#666'}}>No auctions found.</div>
      ) : (
        <div style={{overflowX: 'auto'}}>
          <table className="admin-auctions-table" style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb'}}>
            <thead>
              <tr style={{background: '#f3f4f6'}}>
                <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Title</th>
                <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Status</th>
                <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Type</th>
                <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Seller</th>
                <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Current Bid</th>
                <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Start Date</th>
                <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>End Date</th>
                <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map(auction => (
                <tr 
                  key={auction._id} 
                  style={{
                    background: auction.status === 'stopped' ? '#fee2e2' : 
                               auction.status === 'deleted' ? '#f3f4f6' : 
                               auction.status === 'ended' ? '#ecfdf5' : '#fff'
                  }}
                >
                  <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>{auction.title || 'Untitled'}</td>
                  <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      background: auction.status === 'active' ? '#22c55e' :
                                 auction.status === 'upcoming' ? '#3b82f6' :
                                 auction.status === 'ended' ? '#8b5cf6' :
                                 auction.status === 'stopped' ? '#ef4444' :
                                 auction.status === 'deleted' ? '#6b7280' : '#64748b'
                    }}>
                      {auction.status}
                    </span>
                  </td>
                  <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>{auction.auctionType || 'N/A'}</td>
                  <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>{auction.seller?.fullName || 'Unknown'}</td>
                  <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                    {auction.currency || 'USD'} {auction.currentBid || auction.startingPrice || 0}
                  </td>
                  <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                    {auction.startDate ? new Date(auction.startDate).toLocaleString() : '--'}
                  </td>
                  <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                    {auction.endDate ? new Date(auction.endDate).toLocaleString() : '--'}
                  </td>
                  <td style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center'}}>
                    {auction.status === 'active' || auction.status === 'upcoming' ? (
                      <button 
                        style={{
                          marginRight: 8, 
                          background: '#ef4444', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 4, 
                          padding: '0.4rem 0.8rem', 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }} 
                        onClick={() => handleStop(auction._id)}
                        disabled={loading}
                      >
                        Stop
                      </button>
                    ) : null}
                    {auction.status === 'stopped' ? (
                      <button 
                        style={{
                          marginRight: 8, 
                          background: '#22c55e', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 4, 
                          padding: '0.4rem 0.8rem', 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }} 
                        onClick={() => handleContinue(auction._id)}
                        disabled={loading}
                      >
                        Continue
                      </button>
                    ) : null}
                    <button 
                      style={{
                        background: '#64748b', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 4, 
                        padding: '0.4rem 0.8rem', 
                        cursor: 'pointer',
                        fontSize: '12px'
                      }} 
                      onClick={() => handleDelete(auction._id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminHandleAuctions;
