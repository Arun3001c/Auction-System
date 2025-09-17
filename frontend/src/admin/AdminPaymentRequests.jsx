import React, { useState, useEffect } from 'react';
import { Eye, Check, X, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminPaymentRequests = () => {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  // Helper function to format image URL
  const formatImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL (Cloudinary or other), return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // For legacy local files, convert to server URL
    // Convert Windows backslashes to forward slashes for web URLs
    const normalizedPath = imagePath.replace(/\\/g, '/');
    
    // Ensure path starts with uploads/ 
    const finalPath = normalizedPath.startsWith('uploads/') 
      ? normalizedPath 
      : `uploads/${normalizedPath}`;
    
    return `http://localhost:5001/${finalPath}`;
  };
  const [filter, setFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all'); // Default to all payments
  const [searchTerm, setSearchTerm] = useState('');
  const [counts, setCounts] = useState({ 
    pending: 0, 
    approved: 0, 
    rejected: 0, 
    total: 0,
    winner_payments: 0,
    participation_fees: 0 
  });
  const [pagination, setPagination] = useState({ current: 1, total: 1, limit: 20 });

  useEffect(() => {
    fetchPaymentRequests();
  }, [filter, paymentTypeFilter]);

  const fetchPaymentRequests = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      console.log('Fetching payment requests with filters:', { 
        status: filter, 
        paymentType: paymentTypeFilter, 
        page 
      });
      
      const response = await axios.get('/api/admin/payments/payment-requests', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: filter,
          paymentType: paymentTypeFilter,
          page,
          limit: 20
        }
      });

      console.log('Received payment requests:', response.data);

      setPaymentRequests(response.data.paymentRequests);
      setCounts(response.data.counts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      toast.error('Error loading payment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const adminNotes = prompt('Enter approval notes (optional):');
      if (adminNotes === null) return; // User cancelled

      const token = localStorage.getItem('adminToken');
      await axios.post(`/api/admin/payments/payment-requests/${requestId}/approve`, {
        adminNotes: adminNotes || 'Payment approved by admin'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Payment request approved successfully');
      fetchPaymentRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving payment request:', error);
      toast.error(error.response?.data?.message || 'Error approving payment request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const adminNotes = prompt('Enter rejection reason (required):');
      if (!adminNotes || adminNotes.trim().length === 0) {
        toast.error('Rejection reason is required');
        return;
      }

      const token = localStorage.getItem('adminToken');
      await axios.post(`/api/admin/payments/payment-requests/${requestId}/reject`, {
        adminNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Payment request rejected');
      fetchPaymentRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting payment request:', error);
      toast.error(error.response?.data?.message || 'Error rejecting payment request');
    }
  };

  const viewDetails = async (requestId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`/api/admin/payments/payment-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedRequest(response.data.paymentRequest);
    } catch (error) {
      console.error('Error fetching payment request details:', error);
      toast.error('Error loading payment request details');
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: 'status-badge pending',
      approved: 'status-badge approved',
      rejected: 'status-badge rejected'
    };
    return configs[status];
  };

  const getPaymentTypeDisplay = (paymentType) => {
    switch (paymentType) {
      case 'winner_payment':
        return { text: '🏆 Winner Payment', classes: 'winner-payment' };
      case 'participation_fee':
      default:
        return { text: '🎯 Participation Fee', classes: 'participation-fee' };
    }
  };

  const filteredRequests = paymentRequests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="admin-users-page payment-requests">
      <div className="payment-header">
        <h2>💳 Payment Management</h2>
        <p>Monitor and manage all auction payments and transactions</p>
        
        {/* Status Counts */}
        <div className="payment-stats">
          <div className="stat-item pending">
            <div className="stat-number">{counts.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-item approved">
            <div className="stat-number">{counts.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-item rejected">
            <div className="stat-number">{counts.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
          <div className="stat-item winner-payments">
            <div className="stat-number">{counts.winner_payments || 0}</div>
            <div className="stat-label">🏆 Winner Payments</div>
          </div>
          <div className="stat-item participation-fees">
            <div className="stat-number">{counts.participation_fees || 0}</div>
            <div className="stat-label">🎯 Participation Fees</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="payment-filters">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Payment Type:</label>
          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="winner_payment">🏆 Winner Payments Only</option>
            <option value="participation_fee">🎯 Participation Fees Only</option>
            <option value="all">All Payment Types</option>
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Search by user name, auction title, or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Payment Requests Table */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading payment requests...</p>
        </div>
      ) : (
        <div className="payments-table-container">
          <table className="user-table payments-table">
            <thead>
              <tr>
                <th>Bidder (Payer)</th>
                <th>Auctioneer (Seller)</th>
                <th>Auction</th>
                <th>Payment Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-name">👤 {request.user.fullName}</div>
                      <div className="user-email">📧 {request.user.email}</div>
                      {request.user.phone && (
                        <div className="user-phone">📱 {request.user.phone}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="seller-info">
                      {request.auction.seller ? (
                        <>
                          <div className="seller-name">🏪 {request.auction.seller.fullName}</div>
                          <div className="seller-email">📧 {request.auction.seller.email}</div>
                          {request.auction.seller.phone && (
                            <div className="seller-phone">📱 {request.auction.seller.phone}</div>
                          )}
                        </>
                      ) : (
                        <div className="seller-unknown">Seller info not available</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="auction-info">
                      <div className="auction-title">{request.auction.title}</div>
                      <div className="auction-id">{request.auction.auctionId}</div>
                      <div className="auction-type">Type: {request.auction.auctionType}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`payment-type-badge ${
                      getPaymentTypeDisplay(request.paymentType || 'participation_fee').classes
                    }`}>
                      {getPaymentTypeDisplay(request.paymentType || 'participation_fee').text}
                    </span>
                  </td>
                  <td>
                    <div className="payment-amount">
                      {request.paymentAmount} {request.auction.currency}
                      {request.paymentType === 'winner_payment' && request.auction.auctionType === 'reserve' && (
                        <div className="payment-breakdown">
                          <small style={{ color: '#059669', fontWeight: '500' }}>
                            Additional amount for reserve auction
                          </small>
                          <small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block' }}>
                            (Winner bid - Min. price already paid)
                          </small>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="payment-method">{request.paymentMethod}</span>
                  </td>
                  <td>
                    <span className={getStatusBadge(request.verificationStatus)}>
                      {request.verificationStatus}
                    </span>
                  </td>
                  <td>
                    <div className="date-info">
                      <div className="payment-date">
                        {new Date(request.paymentDate).toLocaleDateString()}
                      </div>
                      <div className="submitted-date">
                        Submitted: {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="payment-actions">
                      <button
                        onClick={() => viewDetails(request._id)}
                        className="action-btn view-btn"
                        title="View Details"
                      >
                        <Eye className="action-icon" />
                        View
                      </button>
                      {request.verificationStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request._id)}
                            className="action-btn approve-btn"
                            title="Approve"
                          >
                            <Check className="action-icon" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request._id)}
                            className="action-btn reject-btn"
                            title="Reject"
                          >
                            <X className="action-icon" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <div className="no-requests-message">
              <Clock className="no-requests-icon" />
              <p>No payment requests found</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Request Detail Modal */}
      {selectedRequest && (
        <div className="modal-overlay">
          <div className="payment-detail-modal">
            <div className="modal-header">
              <h3>Payment Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="close-btn"
              >
                <X className="close-icon" />
              </button>
            </div>

            <div className="modal-content">
              {/* Transaction Parties Section */}
              <div className="transaction-parties">
                <h4 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.2rem' }}>Transaction Parties</h4>
                <div className="parties-grid">
                  <div className="party-details bidder-details">
                    <div className="party-header">
                      <h5 style={{ color: '#059669', marginBottom: '0.5rem' }}>👤 Bidder (Payer)</h5>
                    </div>
                    <div className="party-info">
                      <p className="detail-value">{selectedRequest.user.fullName}</p>
                      <p className="detail-subtext">📧 {selectedRequest.user.email}</p>
                      {selectedRequest.user.phone && (
                        <p className="detail-subtext">📱 {selectedRequest.user.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="party-details seller-details">
                    <div className="party-header">
                      <h5 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>🏪 Auctioneer (Seller)</h5>
                    </div>
                    <div className="party-info">
                      {selectedRequest.auction.seller ? (
                        <>
                          <p className="detail-value">{selectedRequest.auction.seller.fullName}</p>
                          <p className="detail-subtext">📧 {selectedRequest.auction.seller.email}</p>
                          {selectedRequest.auction.seller.phone && (
                            <p className="detail-subtext">📱 {selectedRequest.auction.seller.phone}</p>
                          )}
                        </>
                      ) : (
                        <p className="detail-subtext">Seller information not available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details Section */}
              <div className="payment-details-section">
                <h4 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.2rem' }}>Payment Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label className="detail-label">Auction</label>
                    <p className="detail-value">{selectedRequest.auction.title}</p>
                    <p className="detail-subtext">{selectedRequest.auction.auctionId}</p>
                    <p className="detail-subtext">Type: {selectedRequest.auction.auctionType}</p>
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Payment Amount</label>
                    <p className="detail-value">{selectedRequest.paymentAmount} {selectedRequest.auction.currency}</p>
                    {selectedRequest.paymentType === 'winner_payment' && selectedRequest.auction.auctionType === 'reserve' && (
                      <div className="detail-subtext" style={{ backgroundColor: '#f0f9ff', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#1e40af' }}>
                          💡 Reserve Auction Payment Breakdown:
                        </p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#374151' }}>
                          • This is the <strong>additional amount</strong> the winner needs to pay
                        </p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#374151' }}>
                          • Minimum price was already paid as participation fee
                        </p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#374151' }}>
                          • Calculation: Winner's bid - Minimum price = Additional payment
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Payment Type</label>
                    <span className={`payment-type-badge ${
                      getPaymentTypeDisplay(selectedRequest.paymentType || 'participation_fee').classes
                    }`}>
                      {getPaymentTypeDisplay(selectedRequest.paymentType || 'participation_fee').text}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Payment Method</label>
                    <p className="detail-value">{selectedRequest.paymentMethod}</p>
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Transaction ID</label>
                    <p className="detail-value">{selectedRequest.transactionId || 'Not provided'}</p>
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Payment Date</label>
                    <p className="detail-value">{new Date(selectedRequest.paymentDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="screenshot-section">
                <label className="detail-label">Payment Screenshot</label>
                <div className="screenshot-container">
                  <img
                    src={formatImageUrl(selectedRequest.paymentScreenshot)}
                    alt="Payment Screenshot"
                    className="payment-screenshot"
                    onClick={() => {
                      setCurrentImageUrl(formatImageUrl(selectedRequest.paymentScreenshot));
                      setShowImageModal(true);
                    }}
                    onError={(e) => {
                      console.error('Failed to load payment screenshot:', selectedRequest.paymentScreenshot);
                      e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                    }}
                  />
                  <p className="screenshot-hint">Click to view full size</p>
                </div>
              </div>

              <div className="status-section">
                <label className="detail-label">Status</label>
                <span className={getStatusBadge(selectedRequest.verificationStatus)}>
                  {selectedRequest.verificationStatus}
                </span>
              </div>

              {selectedRequest.adminNotes && (
                <div className="admin-notes-section">
                  <label className="detail-label">Admin Notes</label>
                  <p className="admin-notes">{selectedRequest.adminNotes}</p>
                </div>
              )}

              {selectedRequest.verificationStatus === 'pending' && (
                <div className="modal-actions">
                  <button
                    onClick={() => handleApprove(selectedRequest._id)}
                    className="action-btn approve-btn-full"
                  >
                    Approve Payment
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest._id)}
                    className="action-btn reject-btn-full"
                  >
                    Reject Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && currentImageUrl && (
        <div 
          className="image-modal-overlay"
          onClick={() => {
            setShowImageModal(false);
            setCurrentImageUrl(null);
          }}
        >
          <div 
            className="image-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowImageModal(false);
                setCurrentImageUrl(null);
              }}
              className="image-close-btn"
            >
              <X className="close-icon-large" />
            </button>
            <img
              src={currentImageUrl}
              alt="Payment Screenshot"
              className="full-image"
              onError={(e) => {
                console.error('Failed to load modal image:', currentImageUrl);
                e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentRequests;