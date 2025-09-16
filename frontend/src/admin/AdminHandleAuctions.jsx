

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminHandleAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [auctionRequests, setAuctionRequests] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('auctions'); // 'auctions', 'requests', or 'payments'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentCounts, setPaymentCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  useEffect(() => {
    fetchAuctions();
    fetchAuctionRequests();
    fetchPaymentRequests();
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

  const fetchAuctionRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/admin/auction-requests');
      setAuctionRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch auction requests:', err);
    }
  };

  const fetchPaymentRequests = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('AdminToken:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.error('No admin token found in localStorage');
        setError('Admin authentication required. Please login.');
        return;
      }
      
      console.log('Fetching payment requests...');
      const res = await axios.get('http://localhost:5001/api/admin/payments/payment-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Payment requests response:', res.data);
      setPaymentRequests(res.data.paymentRequests || []);
      setPaymentCounts(res.data.counts || { pending: 0, approved: 0, rejected: 0, total: 0 });
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Failed to fetch payment requests:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to fetch payment requests: ${err.response?.data?.message || err.message}`);
    }
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

  const handleApproveRequest = async (requestId) => {
    if (!window.confirm('Approve this reserve auction request? This will create the auction and make it live.')) return;
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5001/api/admin/auction-requests/${requestId}/approve`, {
        adminNotes: 'Approved by admin'
      });
      alert('Auction request approved successfully! The auction has been created.');
      fetchAuctionRequests();
      fetchAuctions(); // Refresh auctions list to show the new auction
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve auction request.');
    }
    setLoading(false);
  };

  const handleRejectRequest = async (requestId) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    setLoading(true);
    try {
      await axios.post(`http://localhost:5001/api/admin/auction-requests/${requestId}/reject`, {
        adminNotes: reason
      });
      alert('Auction request rejected successfully.');
      fetchAuctionRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject auction request.');
    }
    setLoading(false);
  };

  const viewCertificates = (certificates) => {
    if (!certificates || certificates.length === 0) {
      alert('No certificates uploaded for this request.');
      return;
    }
    
    // Open certificates in new windows/tabs
    certificates.forEach((cert, index) => {
      window.open(cert, `_blank`);
    });
  };

  const viewImages = (images, title = 'Auction Images') => {
    if (!images || images.length === 0) {
      alert('No images available for this auction.');
      return;
    }
    
    // Create a modal-like popup with images
    const imageViewerWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    imageViewerWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            h2 { color: #333; text-align: center; }
            .image-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .image-container { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            img { width: 100%; height: auto; border-radius: 4px; cursor: pointer; transition: transform 0.2s; }
            img:hover { transform: scale(1.05); }
            .image-counter { text-align: center; color: #666; margin-top: 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <div class="image-grid">
            ${images.map((img, index) => `
              <div class="image-container">
                <img src="${img}" alt="Image ${index + 1}" onclick="window.open('${img}', '_blank')" />
                <div class="image-counter">Image ${index + 1} of ${images.length}</div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
  };

  const handleMigrateReserveAuctions = async () => {
    if (!window.confirm('This will migrate existing reserve auctions to pending approval requests. Continue?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/admin/migrate-reserve-auctions');
      alert(`Migration completed! ${response.data.migrated} auctions migrated to pending requests.`);
      fetchAuctionRequests();
      fetchAuctions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to migrate reserve auctions.');
    }
    setLoading(false);
  };

  // Payment Request Handlers
  const handleApprovePayment = async (paymentRequestId) => {
    const adminNotes = window.prompt('Add any notes for approval (optional):') || 'Payment approved by admin';
    
    if (!window.confirm('Approve this payment request? The user will be able to bid on the auction.')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`http://localhost:5001/api/admin/payments/payment-requests/${paymentRequestId}/approve`, 
        { adminNotes }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Payment request approved successfully!');
      fetchPaymentRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve payment request.');
    }
    setLoading(false);
  };

  const handleRejectPayment = async (paymentRequestId) => {
    const adminNotes = window.prompt('Please provide a reason for rejection:');
    if (!adminNotes || adminNotes.trim().length === 0) {
      alert('Rejection reason is required.');
      return;
    }
    
    if (!window.confirm('Reject this payment request?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`http://localhost:5001/api/admin/payments/payment-requests/${paymentRequestId}/reject`, 
        { adminNotes }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Payment request rejected successfully.');
      fetchPaymentRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject payment request.');
    }
    setLoading(false);
  };

  const viewPaymentScreenshot = (screenshotUrl, userFullName) => {
    if (!screenshotUrl) {
      alert('No payment screenshot available.');
      return;
    }
    
    // Open payment screenshot in a new window with enhanced formatting
    const screenshotWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes');
    screenshotWindow.document.write(`
      <html>
        <head>
          <title>Payment Screenshot - ${userFullName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
            }
            
            .header {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              border-radius: 20px;
              padding: 24px;
              margin-bottom: 24px;
              box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
              text-align: center;
              width: 100%;
              max-width: 600px;
            }
            
            .header h2 { 
              color: #1a202c;
              font-size: 1.8rem;
              font-weight: bold;
              margin-bottom: 8px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            
            .user-info {
              color: #4a5568;
              font-size: 1.1rem;
              font-weight: 500;
            }
            
            .screenshot-container { 
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              padding: 32px;
              border-radius: 24px;
              box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
              max-width: 90%;
              max-height: 70vh;
              overflow: auto;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            
            .screenshot-wrapper {
              position: relative;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
              background: white;
              padding: 8px;
            }
            
            .screenshot-image { 
              max-width: 100%;
              max-height: 500px;
              border-radius: 12px;
              object-fit: contain;
              display: block;
              cursor: zoom-in;
              transition: transform 0.3s ease;
            }
            
            .screenshot-image:hover {
              transform: scale(1.02);
            }
            
            .zoom-note {
              margin-top: 16px;
              color: #718096;
              font-size: 0.9rem;
              text-align: center;
              font-style: italic;
            }
            
            .close-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: linear-gradient(135deg, #ff6b6b, #ee5a52);
              color: white;
              border: none;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              font-size: 1.2rem;
              font-weight: bold;
              cursor: pointer;
              box-shadow: 0 8px 20px rgba(255, 107, 107, 0.4);
              transition: all 0.3s ease;
              z-index: 1000;
            }
            
            .close-button:hover {
              transform: scale(1.1);
              box-shadow: 0 12px 24px rgba(255, 107, 107, 0.6);
            }
            
            .download-button {
              margin-top: 20px;
              background: linear-gradient(135deg, #4caf50, #45a049);
              color: white;
              border: none;
              border-radius: 12px;
              padding: 12px 24px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .download-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 24px rgba(76, 175, 80, 0.4);
            }
            
            .error-message {
              color: #e53e3e;
              background: rgba(254, 178, 178, 0.2);
              padding: 16px;
              border-radius: 12px;
              border: 2px solid #feb2b2;
              text-align: center;
              font-weight: 500;
            }
            
            @media (max-width: 768px) {
              .screenshot-container {
                padding: 20px;
                margin: 10px;
              }
              
              .header {
                padding: 16px;
                margin-bottom: 16px;
              }
              
              .header h2 {
                font-size: 1.4rem;
              }
            }
          </style>
        </head>
        <body>
          <button class="close-button" onclick="window.close()" title="Close Window">×</button>
          
          <div class="header">
            <h2>💰 Payment Screenshot</h2>
            <div class="user-info">Submitted by: ${userFullName}</div>
          </div>
          
          <div class="screenshot-container">
            <div class="screenshot-wrapper">
              <img 
                src="${screenshotUrl}" 
                alt="Payment Screenshot" 
                class="screenshot-image"
                onclick="this.style.transform = this.style.transform === 'scale(1.5)' ? 'scale(1)' : 'scale(1.5)'"
                onerror="this.parentElement.innerHTML = '<div class=\\"error-message\\">❌ Unable to load payment screenshot. The image may be corrupted or the URL is invalid.</div>'"
              />
            </div>
            
            <div class="zoom-note">
              💡 Click on the image to zoom in/out
            </div>
            
            <button class="download-button" onclick="window.open('${screenshotUrl}', '_blank')">
              📥 Download Screenshot
            </button>
          </div>
          
          <script>
            // Add keyboard shortcuts
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                window.close();
              }
            });
            
            // Auto-focus for better accessibility
            window.focus();
          </script>
        </body>
      </html>
    `);
  };

  return (
    <div className="admin-auctions-page" style={{padding: '2rem'}}>
      <h2>Handle Auctions & Requests</h2>
      
      {/* Migration Button */}
      <div style={{marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6'}}>
        <p style={{margin: '0 0 0.5rem 0', fontSize: '14px', color: '#6c757d'}}>
          If you have existing reserve auctions that are not showing in pending requests, click the button below to migrate them:
        </p>
        <button
          onClick={handleMigrateReserveAuctions}
          disabled={loading}
          style={{
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '0.5rem 1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Migrating...' : 'Migrate Reserve Auctions'}
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div style={{marginBottom: '2rem', borderBottom: '1px solid #e5e7eb'}}>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button
            onClick={() => setActiveTab('auctions')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === 'auctions' ? '#3b82f6' : 'transparent',
              color: activeTab === 'auctions' ? 'white' : '#6b7280',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Live Auctions ({auctions.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === 'requests' ? '#3b82f6' : 'transparent',
              color: activeTab === 'requests' ? 'white' : '#6b7280',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Pending Requests ({auctionRequests.filter(req => req.approvalStatus === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === 'payments' ? '#3b82f6' : 'transparent',
              color: activeTab === 'payments' ? 'white' : '#6b7280',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              position: 'relative'
            }}
          >
            Payment Requests ({paymentCounts.pending})
            {paymentCounts.pending > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {paymentCounts.pending}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && <div style={{color:'red',marginBottom:'1rem', padding: '1rem', background: '#fee2e2', borderRadius: '4px'}}>{error}</div>}
      
      {activeTab === 'auctions' && (
        <>
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
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center'}}>Images</th>
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
                        <button 
                          style={{
                            background: '#3b82f6', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '0.3rem 0.6rem', 
                            cursor: 'pointer',
                            fontSize: '11px'
                          }} 
                          onClick={() => viewImages(auction.images, auction.title)}
                        >
                          View ({auction.images?.length || 0})
                        </button>
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
        </>
      )}

      {activeTab === 'requests' && (
        <>
          {loading ? (
            <div style={{textAlign: 'center', padding: '2rem'}}>Loading auction requests...</div>
          ) : auctionRequests.length === 0 ? (
            <div style={{textAlign: 'center', padding: '2rem', color: '#666'}}>No auction requests found.</div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table className="admin-requests-table" style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb'}}>
                <thead>
                  <tr style={{background: '#f3f4f6'}}>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Title</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Status</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Type</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Seller</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Starting Price</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Submitted</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Images</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Certificates</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auctionRequests.map(request => (
                    <tr 
                      key={request._id} 
                      style={{
                        background: request.approvalStatus === 'pending' ? '#fff3cd' : 
                                   request.approvalStatus === 'approved' ? '#d1edff' : 
                                   request.approvalStatus === 'rejected' ? '#f8d7da' : '#fff'
                      }}
                    >
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>{request.title || 'Untitled'}</td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'white',
                          background: request.approvalStatus === 'pending' ? '#f59e0b' :
                                     request.approvalStatus === 'approved' ? '#22c55e' :
                                     request.approvalStatus === 'rejected' ? '#ef4444' : '#64748b'
                        }}>
                          {request.approvalStatus}
                        </span>
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>{request.auctionType || 'N/A'}</td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>{request.seller?.fullName || 'Unknown'}</td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                        {request.currency || 'USD'} {request.startingPrice || 0}
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                        {request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : '--'}
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center'}}>
                        <button 
                          style={{
                            background: '#3b82f6', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '0.3rem 0.6rem', 
                            cursor: 'pointer',
                            fontSize: '11px',
                            marginRight: '4px'
                          }} 
                          onClick={() => viewImages(request.images, `${request.title} - Images`)}
                        >
                          Images ({request.images?.length || 0})
                        </button>
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center'}}>
                        <button 
                          style={{
                            background: '#f59e0b', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '0.3rem 0.6rem', 
                            cursor: 'pointer',
                            fontSize: '11px'
                          }} 
                          onClick={() => viewCertificates(request.certificates)}
                        >
                          Certificates ({request.certificates?.length || 0})
                        </button>
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center'}}>
                        {request.approvalStatus === 'pending' ? (
                          <>
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
                              onClick={() => handleApproveRequest(request._id)}
                              disabled={loading}
                            >
                              Approve
                            </button>
                            <button 
                              style={{
                                background: '#ef4444', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: 4, 
                                padding: '0.4rem 0.8rem', 
                                cursor: 'pointer',
                                fontSize: '12px'
                              }} 
                              onClick={() => handleRejectRequest(request._id)}
                              disabled={loading}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span style={{fontSize: '12px', color: '#6b7280'}}>
                            {request.approvalStatus === 'approved' ? 'Auction Created' : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'payments' && (
        <>
          {/* Payment Requests Summary */}
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{margin: '0 0 1rem 0', color: '#334155'}}>Payment Verification Dashboard</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid #f59e0b',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e'}}>{paymentCounts.pending}</div>
                <div style={{fontSize: '0.875rem', color: '#92400e', fontWeight: '500'}}>Pending Approval</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid #22c55e',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#166534'}}>{paymentCounts.approved}</div>
                <div style={{fontSize: '0.875rem', color: '#166534', fontWeight: '500'}}>Approved</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid #ef4444',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b'}}>{paymentCounts.rejected}</div>
                <div style={{fontSize: '0.875rem', color: '#991b1b', fontWeight: '500'}}>Rejected</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid #3b82f6',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af'}}>{paymentCounts.total}</div>
                <div style={{fontSize: '0.875rem', color: '#1e40af', fontWeight: '500'}}>Total Requests</div>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{textAlign: 'center', padding: '2rem'}}>Loading payment requests...</div>
          ) : error ? (
            <div style={{
              textAlign: 'center', 
              padding: '2rem', 
              color: '#dc2626', 
              background: '#fee2e2', 
              borderRadius: '8px', 
              margin: '1rem 0'
            }}>
              <strong>Error:</strong> {error}
              <br />
              <button 
                onClick={() => {
                  const token = localStorage.getItem('adminToken');
                  if (!token) {
                    alert('Please set admin token first. Check browser console for instructions.');
                    console.log('Set admin token with:\nlocalStorage.setItem("adminToken", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Yzk2MDNiMzNiMjkwNGJkYmU3MzAyZiIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgwMjc5MTQsImV4cCI6MTc1ODExNDMxNH0.lnZIhgFT-4oPRZt7cY3yCh8Pj0J-g3XKf9HqZ8NfwDI");\nwindow.location.reload();');
                  } else {
                    fetchPaymentRequests();
                  }
                }}
                style={{
                  marginTop: '1rem',
                  padding: '8px 16px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Retry / Set Token
              </button>
            </div>
          ) : paymentRequests.length === 0 ? (
            <div style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
              No payment requests found.
              <br />
              <button 
                onClick={fetchPaymentRequests}
                style={{
                  marginTop: '1rem',
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Refresh
              </button>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table className="admin-payments-table" style={{width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb'}}>
                <thead>
                  <tr style={{background: '#f3f4f6'}}>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>User</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Auction</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Amount</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Method</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Status</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Submitted</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left'}}>Transaction ID</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center'}}>Screenshot</th>
                    <th style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRequests.map(payment => (
                    <tr 
                      key={payment._id} 
                      style={{
                        background: payment.verificationStatus === 'pending' ? '#fffbeb' : 
                                   payment.verificationStatus === 'approved' ? '#f0fdf4' : 
                                   payment.verificationStatus === 'rejected' ? '#fef2f2' : '#fff'
                      }}
                    >
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                        <div>
                          <div style={{fontWeight: 'bold', color: '#1f2937'}}>{payment.user?.fullName || 'Unknown'}</div>
                          <div style={{fontSize: '12px', color: '#6b7280'}}>{payment.user?.email || 'No email'}</div>
                          {payment.user?.phone && (
                            <div style={{fontSize: '12px', color: '#6b7280'}}>{payment.user.phone}</div>
                          )}
                        </div>
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                        <div>
                          <div style={{fontWeight: 'bold', color: '#1f2937'}}>{payment.auction?.title || 'Unknown Auction'}</div>
                          <div style={{fontSize: '12px', color: '#6b7280'}}>
                            {payment.auction?.auctionType === 'reserve' ? '🔒 Reserve' : '🔓 Regular'} Auction
                          </div>
                          <div style={{fontSize: '12px', color: '#6b7280'}}>
                            Starting: {payment.auction?.currency || 'USD'} {payment.auction?.startingPrice || 0}
                          </div>
                        </div>
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                        <div style={{fontWeight: 'bold', color: '#059669'}}>
                          {payment.auction?.currency || 'USD'} {payment.paymentAmount || 0}
                        </div>
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: payment.paymentMethod === 'UPI' ? '#dbeafe' : '#f3e8ff',
                          color: payment.paymentMethod === 'UPI' ? '#1e40af' : '#7c3aed'
                        }}>
                          {payment.paymentMethod || 'Unknown'}
                        </span>
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'white',
                          background: payment.verificationStatus === 'pending' ? '#f59e0b' :
                                     payment.verificationStatus === 'approved' ? '#22c55e' :
                                     payment.verificationStatus === 'rejected' ? '#ef4444' : '#64748b'
                        }}>
                          {payment.verificationStatus}
                        </span>
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                        <div style={{fontSize: '12px'}}>
                          {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '--'}
                        </div>
                        <div style={{fontSize: '11px', color: '#6b7280'}}>
                          {payment.createdAt ? new Date(payment.createdAt).toLocaleTimeString() : '--'}
                        </div>
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb'}}>
                        <div style={{fontSize: '12px', fontFamily: 'monospace'}}>
                          {payment.transactionId || 'Not provided'}
                        </div>
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center'}}>
                        <button 
                          style={{
                            background: '#8b5cf6', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 6, 
                            padding: '0.4rem 0.8rem', 
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500'
                          }} 
                          onClick={() => viewPaymentScreenshot(payment.paymentScreenshot, payment.user?.fullName)}
                        >
                          View Screenshot 📱
                        </button>
                      </td>
                      <td style={{padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center'}}>
                        {payment.verificationStatus === 'pending' ? (
                          <div style={{display: 'flex', gap: '4px', justifyContent: 'center'}}>
                            <button 
                              style={{
                                background: '#22c55e', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: 4, 
                                padding: '0.4rem 0.8rem', 
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                              }} 
                              onClick={() => handleApprovePayment(payment._id)}
                              disabled={loading}
                            >
                              ✅ Approve
                            </button>
                            <button 
                              style={{
                                background: '#ef4444', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: 4, 
                                padding: '0.4rem 0.8rem', 
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                              }} 
                              onClick={() => handleRejectPayment(payment._id)}
                              disabled={loading}
                            >
                              ❌ Reject
                            </button>
                          </div>
                        ) : (
                          <div style={{fontSize: '11px', color: '#6b7280'}}>
                            {payment.verificationStatus === 'approved' ? '✅ Approved' : '❌ Rejected'}
                            {payment.verifiedAt && (
                              <div style={{marginTop: '2px'}}>
                                {new Date(payment.verifiedAt).toLocaleDateString()}
                              </div>
                            )}
                            {payment.adminNotes && (
                              <div style={{marginTop: '4px', fontSize: '10px', fontStyle: 'italic'}}>
                                "{payment.adminNotes}"
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminHandleAuctions;
