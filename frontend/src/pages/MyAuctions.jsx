import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MyAuctions.css';
import { Link } from 'react-router-dom';
import { Gavel, Edit, Trash2, Plus, Clock, Zap, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const MyAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({
    total: 0,
    upcoming: 0,
    active: 0,
    ended: 0
  });
  // Add showActive state at the top
  const [showActive, setShowActive] = useState(false);
  
  // Approval status modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auctions/my', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAuctions(res.data);
        
        // Calculate counts
        const upcomingCount = res.data.filter(a => a.status === 'upcoming').length;
        const activeCount = res.data.filter(a => a.status === 'active').length;
        const endedCount = res.data.filter(a => a.status === 'ended').length;
        const deletedCount = res.data.filter(a => a.status === 'deleted').length;
        setCounts({
          total: res.data.length,
          upcoming: upcomingCount,
          active: activeCount,
          ended: endedCount,
          deleted: deletedCount
        });
      } catch (err) {
        setError('Failed to load auctions');
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, []);

  

  // Function to check approval status for reserve auctions
  const checkApprovalStatus = async (auction) => {
    try {
      setApprovalLoading(true);
      setSelectedAuction(auction);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5001/api/payments/winner-payment-status/${auction._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('Approval status response:', response.data);
      
      if (response.data && response.data.isAuctionCreator) {
        setApprovalStatus({
          isAuctionCreator: true,
          winnerPayment: response.data.hasPayment ? response.data.winnerPayment : null,
          message: response.data.message || null
        });
      } else {
        setApprovalStatus({
          isAuctionCreator: true,
          message: 'No winner payment found for this auction yet.'
        });
      }
      
      setShowApprovalModal(true);
    } catch (error) {
      console.error('Error checking approval status:', error);
      setApprovalStatus({
        error: true,
        message: 'Failed to load approval status. Please try again.'
      });
      setShowApprovalModal(true);
    } finally {
      setApprovalLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'upcoming':
        return <span className="status-badge status-upcoming"><Clock size={14} /> Upcoming</span>;
      case 'active':
        return <span className="status-badge status-active"><Zap size={14} /> Active</span>;
      case 'ended':
        return <span className="status-badge status-ended"><CheckCircle size={14} /> Ended</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="dashboard-my-auctions">
      <div className="dashboard-header">
        <div>
          <h1><Gavel className="icon" /> My Auctions</h1>
          <p className="auction-count">Total: {counts.total} | Upcoming: {counts.upcoming} | Active: {counts.active} | Ended: {counts.ended} | Deleted: {counts.deleted}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/create-auction" className="add-auction-btn"><Plus size={18} /> Add Auction</Link>
          <Link to="/dashboard/deleted-auctions" className="add-auction-btn" style={{ background: '#ef4444' }}>
            <Trash2 size={18} /> Deleted Auctions
          </Link>
        </div>
      </div>

      {/* Active Auctions Button and List */}
      <div style={{ margin: '1rem 0' }}>
        <button
          className="show-active-auctions-btn"
          onClick={() => setShowActive(prev => !prev)}
        >
          {showActive ? 'Hide Active Auctions' : 'Show Active Auctions'}
        </button>
      </div>

      {showActive && (
        <div id="active-auctions-section" style={{ marginBottom: '2rem' }}>
          <h3>Active Auctions</h3>
          {auctions.filter(a => a.status === 'active').length === 0 ? (
            <div style={{ color: '#888', marginBottom: '1rem' }}>No active auctions.</div>
          ) : (
            auctions.filter(a => a.status === 'active').map(a => (
              <div key={a._id} className="active-auction-card">
                <div className="active-auction-title">{a.title}</div>
                <Link to={`/auction/${a._id}/auctionbid`} className="go-bid-btn">
                  Go to Bidding Page
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="auction-table-wrapper">
          <table className="auction-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Starting Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map(auction => (
                <tr key={auction._id}>
                  <td>{auction.title}</td>
                  <td>{auction.category}</td>
                  <td>${auction.startingPrice.toFixed(2)}</td>
                  <td>{getStatusBadge(auction.status)}</td>
                  <td>
                    <div className="action-buttons">
                      {auction.status === 'deleted' ? (
                        <span className="status-deleted" >Deleted</span>
                      ) : auction.status === 'ended' ? (
                        <>
                          <Link to={`/dashboard/auction-ended-details/${auction._id}`} className="action-btn view-details-btn">
                            <Gavel size={16} /> View Results
                          </Link>
                          {/* Add approval status button for reserve auctions */}
                          {auction.auctionType === 'reserve' && (
                            <button
                              className="action-btn approval-btn"
                              onClick={() => checkApprovalStatus(auction)}
                              disabled={approvalLoading}
                              style={{
                                backgroundColor: '#6366f1',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <AlertCircle size={16} />
                              {approvalLoading ? 'Loading...' : 'Payment Status'}
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <Link to={`/dashboard/edit-auction/${auction._id}`} className="action-btn edit-btn">
                            <Edit size={16} /> Edit
                          </Link>
                          <button
                            className="action-btn delete-btn"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this auction?')) {
                                try {
                                  const token = localStorage.getItem('token');
                                  await axios.delete(`/api/auctions/${auction._id}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  setAuctions(prev => prev.filter(a => a._id !== auction._id));
                                } catch (err) {
                                  alert('Failed to delete auction');
                                }
                              }
                            }}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
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
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
                💳 Payment Approval Status
              </h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            {selectedAuction && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Auction: {selectedAuction.title}
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  ID: {selectedAuction._id}
                </p>
              </div>
            )}
            
            {approvalLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div>Loading payment status...</div>
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
                <XCircle style={{ width: '2rem', height: '2rem', margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Error</p>
                <p style={{ fontSize: '0.875rem' }}>{approvalStatus.message}</p>
              </div>
            ) : approvalStatus?.winnerPayment ? (
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
                      Amount: {approvalStatus.winnerPayment.amount} INR
                    </p>
                  )}
                  {approvalStatus.winnerPayment.winnerName && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      Winner: {approvalStatus.winnerPayment.winnerName}
                    </p>
                  )}
                  {approvalStatus.winnerPayment.submittedAt && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      Submitted: {new Date(approvalStatus.winnerPayment.submittedAt).toLocaleDateString()}
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
                        🎉 Payment Approved - Winner Contact Info Available:
                      </h5>
                      <p style={{ 
                        margin: '0.5rem 0 0 0',
                        fontSize: '0.875rem',
                        color: '#047857',
                        lineHeight: '1.6'
                      }}>
                        ✅ You can now see the winner's phone number in the auction details page.<br/>
                        ✅ Contact the winner to arrange item delivery.<br/>
                        ✅ You will receive <strong>{((approvalStatus.winnerPayment.amount || 0) * 0.95).toLocaleString()} INR</strong> (95% of winning bid)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
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
                  {approvalStatus?.message || 'No winner has submitted payment for this auction yet.'}
                </p>
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowApprovalModal(false)}
                style={{
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAuctions;