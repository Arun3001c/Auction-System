import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PaymentModal = ({ isOpen, onClose, auctionId }) => {
  const [step, setStep] = useState(1); // 1: Payment Details, 2: Upload Screenshot, 3: Status
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'UPI',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentScreenshot: null
  });
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    if (isOpen && auctionId) {
      checkPaymentStatus();
    }
  }, [isOpen, auctionId]);

  const checkPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/payments/payment-status/${auctionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.hasPayment) {
        setPaymentStatus(response.data.paymentRequest);
        setStep(3); // Show status if payment exists
      } else {
        fetchPaymentDetails();
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      fetchPaymentDetails();
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/payments/payment-details/${auctionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentDetails(response.data.paymentDetails);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error(error.response?.data?.message || 'Error fetching payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      setPaymentData({ ...paymentData, paymentScreenshot: file });
    }
  };

  const submitPaymentProof = async () => {
    try {
      if (!paymentData.paymentScreenshot) {
        toast.error('Please upload payment screenshot');
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('auctionId', auctionId);
      formData.append('paymentAmount', paymentDetails.initialPaymentAmount);
      formData.append('paymentMethod', paymentData.paymentMethod);
      formData.append('transactionId', paymentData.transactionId);
      formData.append('paymentDate', paymentData.paymentDate);
      formData.append('paymentScreenshot', paymentData.paymentScreenshot);

      const response = await axios.post('/api/payments/submit-payment', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Payment proof submitted successfully!');
      setPaymentStatus(response.data.paymentRequest);
      setStep(3);
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error(error.response?.data?.message || 'Error submitting payment proof');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusBackground = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-300';
      case 'rejected':
        return 'bg-gradient-to-br from-red-100 to-pink-100 border-2 border-red-300';
      default:
        return 'bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-300';
    }
  };

  const getStatusIconBackground = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-200';
      case 'rejected':
        return 'bg-red-200';
      default:
        return 'bg-yellow-200';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-800';
      case 'rejected':
        return 'text-red-800';
      default:
        return 'text-yellow-800';
    }
  };

  const getStatusSubtextColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-700';
      case 'rejected':
        return 'text-red-700';
      default:
        return 'text-yellow-700';
    }
  };

  const getStatusIconLarge = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-12 h-12 text-red-600" />;
      default:
        return <Clock className="w-12 h-12 text-yellow-600" />;
    }
  };

  const getStatusTitle = (status) => {
    switch (status) {
      case 'approved':
        return '🎉 Payment Approved!';
      case 'rejected':
        return '❌ Payment Rejected';
      default:
        return '⏳ Payment Under Review';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'approved':
        return 'Congratulations! Your payment has been verified. You can now participate in the reserve auction.';
      case 'rejected':
        return 'Your payment verification was unsuccessful. Please check the admin notes and submit a new payment.';
      default:
        return 'Your payment is currently being verified by our admin team. You will be notified once the verification is complete.';
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(4px)',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '56rem',
          width: '90%',
          maxHeight: '95vh',
          overflowY: 'auto',
          position: 'relative',
          animation: 'fadeIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px'
          }}
        >
          <div style={{ color: 'white' }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              margin: 0 
            }}>
              {step === 1 && (
                <>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    padding: '8px',
                    fontSize: '1rem'
                  }}>
                    💳
                  </div>
                  Reserve Auction Payment
                </>
              )}
              {step === 2 && (
                <>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    padding: '8px',
                    fontSize: '1rem'
                  }}>
                    📤
                  </div>
                  Upload Payment Proof
                </>
              )}
              {step === 3 && (
                <>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    padding: '8px',
                    fontSize: '1rem'
                  }}>
                    📊
                  </div>
                  Payment Status
                </>
              )}
            </h2>
            <p style={{ 
              color: '#dbeafe', 
              fontSize: '0.875rem', 
              marginTop: '4px',
              margin: '4px 0 0 0'
            }}>
              {step === 1 && 'Complete your payment to join the auction'}
              {step === 2 && 'Upload your payment screenshot for verification'}
              {step === 3 && 'Check your payment verification status'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {loading && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '32px 0' 
            }}>
              <div style={{
                border: '2px solid #f3f4f6',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          )}

          {/* Step 1: Payment Details */}
          {step === 1 && paymentDetails && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Success Banner */}
              <div style={{
                background: 'linear-gradient(to right, #eff6ff, #e0e7ff)',
                border: '1px solid #3b82f6',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <div style={{
                    backgroundColor: '#dbeafe',
                    borderRadius: '50%',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
                  </div>
                </div>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold', 
                  color: '#1e40af', 
                  margin: '0 0 8px 0' 
                }}>
                  🎉 Congratulations!
                </h3>
                <p style={{ 
                  color: '#1e40af', 
                  fontSize: '1.125rem',
                  margin: '0 0 16px 0'
                }}>
                  You're one step away from joining this exclusive reserve auction!
                </p>
                <div style={{
                  marginTop: '16px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #dbeafe'
                }}>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280', 
                    margin: '0 0 4px 0' 
                  }}>
                    Initial Payment Required
                  </p>
                  <p style={{
                    fontSize: '1.875rem',
                    fontWeight: 'bold',
                    color: '#3b82f6',
                    margin: 0
                  }}>
                    {paymentDetails.initialPaymentAmount} {paymentDetails.currency}
                  </p>
                </div>
              </div>

              {/* Payment Methods Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  textAlign: 'center',
                  margin: '0 0 24px 0'
                }}>
                  🏆 Choose Your Payment Method
                </h4>
                
                {/* UPI Payment Card */}
                <div style={{
                  background: 'linear-gradient(to right, #f0fdf4, #dcfce7)',
                  border: '2px solid #10b981',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <h5 style={{
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      color: '#065f46',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: 0
                    }}>
                      💳 UPI Payment
                      <span style={{
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontWeight: 'normal'
                      }}>
                        Recommended
                      </span>
                    </h5>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    {/* QR Code Section */}
                    {paymentDetails.paymentMethods.upi.qrCode && (
                      <div style={{ textAlign: 'center' }}>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#065f46',
                          margin: '0 0 12px 0'
                        }}>
                          📱 Scan QR Code
                        </p>
                        <div style={{
                          backgroundColor: 'white',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '2px solid #10b981',
                          display: 'inline-block'
                        }}>
                          <img 
                            src={paymentDetails.paymentMethods.upi.qrCode} 
                            alt="UPI QR Code"
                            style={{
                              width: '128px',
                              height: '128px',
                              margin: '0 auto',
                              display: 'block'
                            }}
                          />
                        </div>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#059669',
                          margin: '8px 0 0 0'
                        }}>
                          Scan with any UPI app
                        </p>
                      </div>
                    )}
                    
                    {/* UPI Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #10b981'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#065f46'
                          }}>
                            UPI ID:
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                              fontWeight: 'bold',
                              color: '#065f46'
                            }}>
                              {paymentDetails.paymentMethods.upi.id}
                            </span>
                            <button
                              onClick={() => handleCopy(paymentDetails.paymentMethods.upi.id)}
                              style={{
                                padding: '4px',
                                color: '#059669',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Copy UPI ID"
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#d1fae5'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              <Copy style={{ width: '16px', height: '16px' }} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #10b981'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#065f46'
                          }}>
                            Name:
                          </span>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: '#065f46'
                          }}>
                            {paymentDetails.paymentMethods.upi.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Transfer Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #e0f2fe, #e1f5fe, #f0f8ff)',
                  border: '3px solid #0288d1',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: '0 20px 40px rgba(2, 136, 209, 0.15), 0 0 0 1px rgba(2, 136, 209, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative background elements */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    background: 'linear-gradient(45deg, rgba(2, 136, 209, 0.1), rgba(3, 155, 229, 0.1))',
                    borderRadius: '50%',
                    zIndex: 0
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-30px',
                    left: '-30px',
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(45deg, rgba(2, 136, 209, 0.08), rgba(3, 155, 229, 0.08))',
                    borderRadius: '50%',
                    zIndex: 0
                  }}></div>
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '24px'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #0277bd, #0288d1)',
                        borderRadius: '16px',
                        padding: '12px',
                        boxShadow: '0 8px 24px rgba(2, 119, 189, 0.3)'
                      }}>
                        <span style={{ fontSize: '24px' }}>🏦</span>
                      </div>
                      <h5 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#01579b',
                        margin: 0,
                        textShadow: '0 2px 4px rgba(1, 87, 155, 0.1)'
                      }}>
                        Bank Transfer Details
                      </h5>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '20px'
                    }}>
                      {/* Account Number Card */}
                      <div style={{
                        background: 'linear-gradient(135deg, #ffffff, #f8fbff)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '2px solid #e3f2fd',
                        boxShadow: '0 8px 32px rgba(2, 136, 209, 0.1)',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '12px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #1976d2, #1e88e5)',
                              borderRadius: '8px',
                              padding: '6px',
                              color: 'white'
                            }}>
                              <span style={{ fontSize: '16px' }}>🏧</span>
                            </div>
                            <span style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: '#0d47a1'
                            }}>
                              Account Number
                            </span>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f5f9ff',
                          borderRadius: '12px',
                          padding: '16px',
                          border: '1px solid #e1f5fe'
                        }}>
                          <span style={{
                            fontFamily: 'Monaco, Consolas, monospace',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: '#0d47a1',
                            letterSpacing: '1px'
                          }}>
                            {paymentDetails.paymentMethods.bankTransfer.accountNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(paymentDetails.paymentMethods.bankTransfer.accountNumber)}
                            style={{
                              background: 'linear-gradient(135deg, #1976d2, #1e88e5)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '10px',
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                              transition: 'all 0.2s ease'
                            }}
                            title="Copy Account Number"
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.1)';
                              e.target.style.boxShadow = '0 6px 20px rgba(25, 118, 210, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.3)';
                            }}
                          >
                            <Copy style={{ width: '18px', height: '18px' }} />
                          </button>
                        </div>
                      </div>

                      {/* IFSC Code Card */}
                      <div style={{
                        background: 'linear-gradient(135deg, #ffffff, #f8fbff)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '2px solid #e3f2fd',
                        boxShadow: '0 8px 32px rgba(2, 136, 209, 0.1)',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '12px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #1976d2, #1e88e5)',
                              borderRadius: '8px',
                              padding: '6px',
                              color: 'white'
                            }}>
                              <span style={{ fontSize: '16px' }}>🔢</span>
                            </div>
                            <span style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: '#0d47a1'
                            }}>
                              IFSC Code
                            </span>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f5f9ff',
                          borderRadius: '12px',
                          padding: '16px',
                          border: '1px solid #e1f5fe'
                        }}>
                          <span style={{
                            fontFamily: 'Monaco, Consolas, monospace',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: '#0d47a1',
                            letterSpacing: '1px'
                          }}>
                            {paymentDetails.paymentMethods.bankTransfer.ifsc}
                          </span>
                          <button
                            onClick={() => handleCopy(paymentDetails.paymentMethods.bankTransfer.ifsc)}
                            style={{
                              background: 'linear-gradient(135deg, #1976d2, #1e88e5)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '10px',
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                              transition: 'all 0.2s ease'
                            }}
                            title="Copy IFSC Code"
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.1)';
                              e.target.style.boxShadow = '0 6px 20px rgba(25, 118, 210, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.3)';
                            }}
                          >
                            <Copy style={{ width: '18px', height: '18px' }} />
                          </button>
                        </div>
                      </div>

                      {/* Account Name & Bank Card */}
                      <div style={{
                        background: 'linear-gradient(135deg, #ffffff, #f8fbff)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '2px solid #e3f2fd',
                        boxShadow: '0 8px 32px rgba(2, 136, 209, 0.1)',
                        gridColumn: 'span 2'
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '20px'
                        }}>
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                background: 'linear-gradient(135deg, #1976d2, #1e88e5)',
                                borderRadius: '8px',
                                padding: '6px',
                                color: 'white'
                              }}>
                                <span style={{ fontSize: '16px' }}>👤</span>
                              </div>
                              <span style={{
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                color: '#0d47a1'
                              }}>
                                Account Name
                              </span>
                            </div>
                            <div style={{
                              background: '#f5f9ff',
                              borderRadius: '12px',
                              padding: '16px',
                              border: '1px solid #e1f5fe'
                            }}>
                              <span style={{
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                color: '#0d47a1'
                              }}>
                                {paymentDetails.paymentMethods.bankTransfer.accountName}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                background: 'linear-gradient(135deg, #1976d2, #1e88e5)',
                                borderRadius: '8px',
                                padding: '6px',
                                color: 'white'
                              }}>
                                <span style={{ fontSize: '16px' }}>🏛️</span>
                              </div>
                              <span style={{
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                color: '#0d47a1'
                              }}>
                                Bank Name
                              </span>
                            </div>
                            <div style={{
                              background: '#f5f9ff',
                              borderRadius: '12px',
                              padding: '16px',
                              border: '1px solid #e1f5fe'
                            }}>
                              <span style={{
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                color: '#0d47a1'
                              }}>
                                {paymentDetails.paymentMethods.bankTransfer.bankName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Instructions */}
              <div style={{
                background: 'linear-gradient(135deg, #fff8e1, #fff3c4, #fffde7)',
                border: '3px solid #ff8f00',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 20px 40px rgba(255, 143, 0, 0.15), 0 0 0 1px rgba(255, 143, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative background elements */}
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-15px',
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(45deg, rgba(255, 143, 0, 0.1), rgba(255, 193, 7, 0.1))',
                  borderRadius: '50%',
                  zIndex: 0
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '-25px',
                  left: '-25px',
                  width: '70px',
                  height: '70px',
                  background: 'linear-gradient(45deg, rgba(255, 143, 0, 0.08), rgba(255, 193, 7, 0.08))',
                  borderRadius: '50%',
                  zIndex: 0
                }}></div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #ff8f00, #ffa000)',
                      borderRadius: '16px',
                      padding: '12px',
                      boxShadow: '0 8px 24px rgba(255, 143, 0, 0.3)'
                    }}>
                      <span style={{ fontSize: '24px' }}>⚠️</span>
                    </div>
                    <h4 style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#e65100',
                      margin: 0,
                      textShadow: '0 2px 4px rgba(230, 81, 0, 0.1)'
                    }}>
                      Important Instructions
                    </h4>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {paymentDetails.instructions.map((instruction, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '16px',
                        background: 'linear-gradient(135deg, #ffffff, #fffef7)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '2px solid #ffecb3',
                        boxShadow: '0 8px 32px rgba(255, 143, 0, 0.1)',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #ff8f00, #ffa000)',
                          color: 'white',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          marginTop: '2px',
                          boxShadow: '0 4px 12px rgba(255, 143, 0, 0.3)',
                          flexShrink: 0
                        }}>
                          {index + 1}
                        </div>
                        <span style={{
                          color: '#e65100',
                          fontSize: '1rem',
                          fontWeight: '600',
                          lineHeight: '1.5',
                          flex: 1
                        }}>
                          {instruction}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Action Button */}
              <div style={{ textAlign: 'center', paddingTop: '32px' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    background: 'linear-gradient(135deg, #4caf50, #66bb6a, #43a047)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    padding: '20px 40px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4), 0 0 0 1px rgba(76, 175, 80, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '0 auto',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-3px) scale(1.05)';
                    e.target.style.boxShadow = '0 20px 60px rgba(76, 175, 80, 0.5), 0 0 0 1px rgba(76, 175, 80, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = '0 12px 40px rgba(76, 175, 80, 0.4), 0 0 0 1px rgba(76, 175, 80, 0.1)';
                  }}
                >
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle style={{ width: '20px', height: '20px' }} />
                  </div>
                  <span>I have made the payment</span>
                  <span style={{ fontSize: '1.2rem' }}>💰</span>
                </button>
                <p style={{ 
                  fontSize: '0.8rem', 
                  color: '#666', 
                  marginTop: '12px',
                  fontStyle: 'italic'
                }}>
                  ✨ Click after completing your payment to proceed with verification
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Enhanced Upload Screenshot */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Enhanced Success Message */}
              <div style={{
                background: 'linear-gradient(135deg, #e8f5e8, #f0fff0, #e0ffe0)',
                border: '3px solid #4caf50',
                borderRadius: '24px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(76, 175, 80, 0.15), 0 0 0 1px rgba(76, 175, 80, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative elements */}
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.1), rgba(129, 199, 132, 0.1))',
                  borderRadius: '50%',
                  zIndex: 0
                }}></div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                      borderRadius: '50%',
                      padding: '16px',
                      boxShadow: '0 12px 24px rgba(76, 175, 80, 0.3)'
                    }}>
                      <CheckCircle style={{ width: '32px', height: '32px', color: 'white' }} />
                    </div>
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#2e7d32',
                    marginBottom: '12px',
                    textShadow: '0 2px 4px rgba(46, 125, 50, 0.1)'
                  }}>
                    🎉 Payment Completed!
                  </h3>
                  <p style={{
                    color: '#388e3c',
                    fontSize: '1.1rem',
                    fontWeight: '500'
                  }}>
                    Now upload your payment screenshot for verification
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Enhanced Payment Method Selection */}
                <div style={{
                  background: 'linear-gradient(135deg, #ffffff, #f8fbff)',
                  border: '3px solid #e3f2fd',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 12px 32px rgba(33, 150, 243, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
                      borderRadius: '12px',
                      padding: '10px',
                      boxShadow: '0 6px 16px rgba(33, 150, 243, 0.3)'
                    }}>
                      <span style={{ fontSize: '20px' }}>💳</span>
                    </div>
                    <label style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#0d47a1',
                      margin: 0
                    }}>
                      Payment Method
                    </label>
                  </div>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #bbdefb',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#0d47a1',
                      background: 'linear-gradient(135deg, #ffffff, #f5f9ff)',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2196f3';
                      e.target.style.boxShadow = '0 8px 24px rgba(33, 150, 243, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#bbdefb';
                      e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.1)';
                    }}
                  >
                    <option value="UPI">💰 UPI Payment</option>
                    <option value="Bank Transfer">🏦 Bank Transfer</option>
                    <option value="Other">🔄 Other</option>
                  </select>
                </div>

                {/* Enhanced Transaction ID */}
                <div style={{
                  background: 'linear-gradient(135deg, #ffffff, #f8fbff)',
                  border: '3px solid #e3f2fd',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 12px 32px rgba(33, 150, 243, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
                      borderRadius: '12px',
                      padding: '10px',
                      boxShadow: '0 6px 16px rgba(33, 150, 243, 0.3)'
                    }}>
                      <span style={{ fontSize: '20px' }}>🔢</span>
                    </div>
                    <label style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#0d47a1',
                      margin: 0
                    }}>
                      Transaction ID{' '}
                      <span style={{ color: '#757575', fontWeight: 'normal', fontSize: '0.9rem' }}>
                        (Optional)
                      </span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                    placeholder="Enter transaction ID if available"
                    style={{
                      width: '100%',
                      border: '2px solid #bbdefb',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      fontSize: '1rem',
                      color: '#0d47a1',
                      background: 'linear-gradient(135deg, #ffffff, #f5f9ff)',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2196f3';
                      e.target.style.boxShadow = '0 8px 24px rgba(33, 150, 243, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#bbdefb';
                      e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.1)';
                    }}
                  />
                </div>

                {/* Enhanced Payment Date */}
                <div style={{
                  background: 'linear-gradient(135deg, #ffffff, #f8fbff)',
                  border: '3px solid #e3f2fd',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 12px 32px rgba(33, 150, 243, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
                      borderRadius: '12px',
                      padding: '10px',
                      boxShadow: '0 6px 16px rgba(33, 150, 243, 0.3)'
                    }}>
                      <span style={{ fontSize: '20px' }}>📅</span>
                    </div>
                    <label style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#0d47a1',
                      margin: 0
                    }}>
                      Payment Date
                    </label>
                  </div>
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #bbdefb',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      fontSize: '1rem',
                      color: '#0d47a1',
                      background: 'linear-gradient(135deg, #ffffff, #f5f9ff)',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2196f3';
                      e.target.style.boxShadow = '0 8px 24px rgba(33, 150, 243, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#bbdefb';
                      e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.1)';
                    }}
                  />
                </div>

                {/* Enhanced File Upload */}
                <div style={{
                  background: 'linear-gradient(135deg, #e8f4fd, #f0f8ff, #e3f2fd)',
                  border: '3px dashed #2196f3',
                  borderRadius: '24px',
                  padding: '40px',
                  textAlign: 'center',
                  boxShadow: '0 20px 40px rgba(33, 150, 243, 0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative elements */}
                  <div style={{
                    position: 'absolute',
                    top: '-30px',
                    left: '-30px',
                    width: '120px',
                    height: '120px',
                    background: 'linear-gradient(45deg, rgba(33, 150, 243, 0.1), rgba(66, 165, 245, 0.1))',
                    borderRadius: '50%',
                    zIndex: 0
                  }}></div>
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
                        borderRadius: '50%',
                        padding: '20px',
                        boxShadow: '0 16px 32px rgba(33, 150, 243, 0.3)'
                      }}>
                        <Upload style={{ width: '40px', height: '40px', color: 'white' }} />
                      </div>
                    </div>
                    <h4 style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      color: '#0d47a1',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      📱 Payment Screenshot{' '}
                      <span style={{ color: '#f44336', fontSize: '1.2rem' }}>*</span>
                    </h4>
                    <p style={{
                      fontSize: '1rem',
                      color: '#1565c0',
                      marginBottom: '24px',
                      fontWeight: '500'
                    }}>
                      Upload a clear screenshot of your payment confirmation
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="screenshot-upload"
                    />
                    <label
                      htmlFor="screenshot-upload"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'linear-gradient(135deg, #2196f3, #1976d2, #1565c0)',
                        color: 'white',
                        padding: '16px 32px',
                        borderRadius: '16px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 12px 32px rgba(33, 150, 243, 0.4)',
                        transition: 'all 0.3s ease',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px) scale(1.05)';
                        e.target.style.boxShadow = '0 20px 40px rgba(33, 150, 243, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0) scale(1)';
                        e.target.style.boxShadow = '0 12px 32px rgba(33, 150, 243, 0.4)';
                      }}
                    >
                      <Upload style={{ width: '20px', height: '20px' }} />
                      Choose Screenshot
                    </label>
                    {paymentData.paymentScreenshot && (
                      <div style={{
                        marginTop: '20px',
                        background: 'linear-gradient(135deg, #e8f5e8, #f0fff0)',
                        border: '2px solid #4caf50',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 8px 24px rgba(76, 175, 80, 0.2)'
                      }}>
                        <p style={{
                          fontSize: '1rem',
                          color: '#2e7d32',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          margin: 0
                        }}>
                          ✅ Selected: {paymentData.paymentScreenshot.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '32px',
                gap: '20px'
              }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: 'linear-gradient(135deg, #f5f5f5, #e0e0e0)',
                    color: '#424242',
                    padding: '16px 24px',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 24px rgba(97, 97, 97, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #eeeeee, #d5d5d5)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #f5f5f5, #e0e0e0)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  ← Back to Payment Details
                </button>
                <button
                  onClick={submitPaymentProof}
                  disabled={!paymentData.paymentScreenshot || loading}
                  style={{
                    background: loading || !paymentData.paymentScreenshot 
                      ? 'linear-gradient(135deg, #cccccc, #999999)' 
                      : 'linear-gradient(135deg, #4caf50, #66bb6a, #43a047)',
                    color: 'white',
                    padding: '16px 32px',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: loading || !paymentData.paymentScreenshot ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: loading || !paymentData.paymentScreenshot 
                      ? '0 4px 12px rgba(153, 153, 153, 0.3)' 
                      : '0 12px 32px rgba(76, 175, 80, 0.4)',
                    transition: 'all 0.3s ease',
                    opacity: loading || !paymentData.paymentScreenshot ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && paymentData.paymentScreenshot) {
                      e.target.style.transform = 'translateY(-2px) scale(1.02)';
                      e.target.style.boxShadow = '0 20px 40px rgba(76, 175, 80, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && paymentData.paymentScreenshot) {
                      e.target.style.transform = 'translateY(0) scale(1)';
                      e.target.style.boxShadow = '0 12px 32px rgba(76, 175, 80, 0.4)';
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #ffffff40',
                        borderTop: '2px solid #ffffff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle style={{ width: '20px', height: '20px' }} />
                      Submit Payment Proof
                      <span style={{ fontSize: '1.2rem' }}>📤</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment Status */}
          {step === 3 && paymentStatus && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Status Card */}
              <div style={{
                background: paymentStatus.status === 'approved' 
                  ? 'linear-gradient(135deg, #e8f5e8, #f0fff0, #e0ffe0)'
                  : paymentStatus.status === 'rejected'
                  ? 'linear-gradient(135deg, #fee2e2, #fef2f2, #fde8e8)'
                  : 'linear-gradient(135deg, #fff8e1, #fffef7, #fff9c4)',
                border: paymentStatus.status === 'approved' 
                  ? '3px solid #4caf50'
                  : paymentStatus.status === 'rejected'
                  ? '3px solid #f44336'
                  : '3px solid #ff9800',
                borderRadius: '24px',
                padding: '40px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Background decoration */}
                <div style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  width: '120px',
                  height: '120px',
                  background: paymentStatus.status === 'approved' 
                    ? 'linear-gradient(45deg, rgba(76, 175, 80, 0.1), rgba(129, 199, 132, 0.1))'
                    : paymentStatus.status === 'rejected'
                    ? 'linear-gradient(45deg, rgba(244, 67, 54, 0.1), rgba(239, 83, 80, 0.1))'
                    : 'linear-gradient(45deg, rgba(255, 152, 0, 0.1), rgba(255, 193, 7, 0.1))',
                  borderRadius: '50%',
                  zIndex: 0
                }}></div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Status Icon */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{
                      background: paymentStatus.status === 'approved' 
                        ? 'linear-gradient(135deg, #4caf50, #66bb6a)'
                        : paymentStatus.status === 'rejected'
                        ? 'linear-gradient(135deg, #f44336, #e57373)'
                        : 'linear-gradient(135deg, #ff9800, #ffb74d)',
                      borderRadius: '50%',
                      padding: '20px',
                      boxShadow: '0 16px 32px rgba(0, 0, 0, 0.2)'
                    }}>
                      <span style={{ fontSize: '48px' }}>
                        {paymentStatus.status === 'approved' ? '✅' : 
                         paymentStatus.status === 'rejected' ? '❌' : '⏳'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status Title */}
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    color: paymentStatus.status === 'approved' 
                      ? '#2e7d32'
                      : paymentStatus.status === 'rejected'
                      ? '#c62828'
                      : '#e65100',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    {paymentStatus.status === 'approved' ? '🎉 Payment Approved!' :
                     paymentStatus.status === 'rejected' ? '❌ Payment Rejected' :
                     '⏳ Payment Under Review'}
                  </h3>
                  
                  {/* Status Message */}
                  <p style={{
                    fontSize: '1.25rem',
                    marginBottom: '32px',
                    color: paymentStatus.status === 'approved' 
                      ? '#388e3c'
                      : paymentStatus.status === 'rejected'
                      ? '#d32f2f'
                      : '#f57c00',
                    fontWeight: '500'
                  }}>
                    {paymentStatus.status === 'approved' 
                      ? 'Congratulations! Your payment has been verified and approved.'
                      : paymentStatus.status === 'rejected'
                      ? 'Your payment was not approved. Please check the admin notes below and resubmit if needed.'
                      : 'Your payment is currently being verified by our admin team. You will be notified once the verification is complete.'}
                  </p>

                  {/* Status Details */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '20px',
                      textAlign: 'left'
                    }}>
                      {/* Submitted Date */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <span style={{
                          color: '#64748b',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          📅 Submitted:
                        </span>
                        <span style={{
                          fontWeight: 'bold',
                          color: '#1e293b',
                          fontSize: '0.9rem'
                        }}>
                          {paymentStatus.submittedAt && !isNaN(new Date(paymentStatus.submittedAt)) 
                            ? new Date(paymentStatus.submittedAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Date not available'}
                        </span>
                      </div>
                      
                      {/* Verified Date (if available) */}
                      {paymentStatus.verifiedAt && !isNaN(new Date(paymentStatus.verifiedAt)) && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                          borderRadius: '12px',
                          border: '1px solid #bbf7d0'
                        }}>
                          <span style={{
                            color: '#16a34a',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            ✅ Verified:
                          </span>
                          <span style={{
                            fontWeight: 'bold',
                            color: '#15803d',
                            fontSize: '0.9rem'
                          }}>
                            {new Date(paymentStatus.verifiedAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Admin Notes */}
                    {paymentStatus.adminNotes && (
                      <div style={{
                        marginTop: '20px',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                        borderRadius: '12px',
                        borderLeft: '4px solid #3b82f6',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                      }}>
                        <h4 style={{
                          fontWeight: 'bold',
                          color: '#1e40af',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '1.1rem'
                        }}>
                          💬 Admin Message
                        </h4>
                        <p style={{
                          color: '#374151',
                          fontStyle: 'italic',
                          fontSize: '1rem',
                          lineHeight: '1.5',
                          margin: 0
                        }}>
                          "{paymentStatus.adminNotes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Messages */}
                  <div style={{ marginTop: '32px' }}>
                    {paymentStatus.status === 'approved' && (
                      <div style={{
                        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                        border: '2px solid #22c55e',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '16px'
                      }}>
                        <p style={{
                          color: '#15803d',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '1.1rem',
                          margin: 0
                        }}>
                          🎯 You can now participate in the auction!
                        </p>
                      </div>
                    )}

                    {paymentStatus.status === 'pending' && (
                      <div style={{
                        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                        border: '2px solid #f59e0b',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '16px'
                      }}>
                        <p style={{
                          color: '#92400e',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '1.1rem',
                          margin: 0
                        }}>
                          ⏳ Please wait for admin verification
                        </p>
                      </div>
                    )}

                    {paymentStatus.status === 'rejected' && (
                      <div style={{
                        background: 'linear-gradient(135deg, #fecaca, #fca5a5)',
                        border: '2px solid #ef4444',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '16px'
                      }}>
                        <p style={{
                          color: '#991b1b',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '1.1rem',
                          margin: 0
                        }}>
                          🔄 You can submit a new payment
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={onClose}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #6366f1)',
                    color: 'white',
                    padding: '16px 32px',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 12px 32px rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 16px 40px rgba(59, 130, 246, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)';
                  }}
                >
                  Close & Continue 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PaymentModal;