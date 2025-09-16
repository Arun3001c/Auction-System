import React, { useState, useEffect } from 'react';
import { Eye, Check, X, Clock, Search, Filter } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminPaymentRequests = () => {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [pagination, setPagination] = useState({ current: 1, total: 1, limit: 20 });

  useEffect(() => {
    fetchPaymentRequests();
  }, [filter]);

  const fetchPaymentRequests = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/payments/payment-requests', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: filter,
          page,
          limit: 20
        }
      });

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
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${configs[status]}`;
  };

  const filteredRequests = paymentRequests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment Requests</h2>
        
        {/* Status Counts */}
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">{counts.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{counts.approved}</div>
            <div className="text-xs text-gray-600">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{counts.rejected}</div>
            <div className="text-xs text-gray-600">Rejected</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by user name, auction title, or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Payment Requests Table */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auction</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{request.user.fullName}</div>
                      <div className="text-sm text-gray-500">{request.user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{request.auction.title}</div>
                      <div className="text-sm text-gray-500">{request.auction.auctionId}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{request.paymentAmount} {request.auction.currency}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{request.paymentMethod}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={getStatusBadge(request.verificationStatus)}>
                      {request.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {new Date(request.paymentDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Submitted: {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewDetails(request._id)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.verificationStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request._id)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(request._id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
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
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payment requests found</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Payment Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">User</label>
                  <p className="font-medium">{selectedRequest.user.fullName}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Auction</label>
                  <p className="font-medium">{selectedRequest.auction.title}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.auction.auctionId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Amount</label>
                  <p className="font-medium">{selectedRequest.paymentAmount} {selectedRequest.auction.currency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Method</label>
                  <p className="font-medium">{selectedRequest.paymentMethod}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                  <p className="font-medium">{selectedRequest.transactionId || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Date</label>
                  <p className="font-medium">{new Date(selectedRequest.paymentDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Payment Screenshot</label>
                <div className="mt-2">
                  <img
                    src={selectedRequest.paymentScreenshot}
                    alt="Payment Screenshot"
                    className="max-w-full h-auto rounded-lg border cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Click to view full size</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <span className={`ml-2 ${getStatusBadge(selectedRequest.verificationStatus)}`}>
                  {selectedRequest.verificationStatus}
                </span>
              </div>

              {selectedRequest.adminNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Admin Notes</label>
                  <p className="bg-gray-50 p-2 rounded mt-1">{selectedRequest.adminNotes}</p>
                </div>
              )}

              {selectedRequest.verificationStatus === 'pending' && (
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => handleApprove(selectedRequest._id)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve Payment
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest._id)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
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
      {showImageModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedRequest.paymentScreenshot}
              alt="Payment Screenshot"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentRequests;