import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const WinnerPaymentModal = ({ isOpen, onClose, auction, winner }) => {
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
    if (isOpen && auction?._id) {
      checkWinnerPaymentStatus();
    }
  }, [isOpen, auction?._id]);

  const checkWinnerPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('WinnerPaymentModal: Checking payment status for auction:', auction._id);
      
      const response = await axios.get(`/api/payments/winner-payment-status/${auction._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('WinnerPaymentModal: Payment status response:', response.data);

      if (response.data.hasPayment) {
        setPaymentStatus(response.data.paymentRequest);
        setStep(3); // Show status if payment exists
      } else {
        fetchWinnerPaymentDetails();
      }
    } catch (error) {
      console.error('WinnerPaymentModal: Error checking winner payment status:', error);
      console.error('WinnerPaymentModal: Status error response:', error.response?.data);
      fetchWinnerPaymentDetails();
    }
  };

  const fetchWinnerPaymentDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('WinnerPaymentModal: Fetching payment details for auction:', auction._id);
      
      const response = await axios.get(`/api/payments/winner-payment-details/${auction._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('WinnerPaymentModal: Payment details response:', response.data);
      setPaymentDetails(response.data.paymentDetails);
    } catch (error) {
      console.error('WinnerPaymentModal: Error fetching winner payment details:', error);
      console.error('WinnerPaymentModal: Error response:', error.response?.data);
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

  const submitWinnerPayment = async () => {
    try {
      if (!paymentData.paymentScreenshot) {
        toast.error('Please upload payment screenshot');
        return;
      }

      console.log('🔄 Starting winner payment submission...', {
        auctionId: auction._id,
        winnerAmount: winner?.amount,
        paymentData: {
          method: paymentData.paymentMethod,
          transactionId: paymentData.transactionId,
          date: paymentData.paymentDate,
          hasScreenshot: !!paymentData.paymentScreenshot
        }
      });

      setLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('auctionId', auction._id);
      formData.append('winningAmount', winner?.amount || 0);
      formData.append('paymentMethod', paymentData.paymentMethod);
      formData.append('transactionId', paymentData.transactionId);
      formData.append('paymentDate', paymentData.paymentDate);
      formData.append('paymentScreenshot', paymentData.paymentScreenshot);

      console.log('📤 Submitting form data to API...');

      const response = await axios.post('/api/payments/submit-winner-payment', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Payment submission successful:', response.data);

      toast.success('Winner payment submitted successfully!');
      setPaymentStatus(response.data.paymentRequest);
      setStep(3);
    } catch (error) {
      console.error('❌ Error submitting winner payment:', error);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Error submitting payment proof');
    } finally {
      setLoading(false);
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
            background: 'linear-gradient(to right, #f59e0b, #d97706)',
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
                    💰
                  </div>
                  Winner Full Payment
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
              color: '#fed7aa', 
              fontSize: '0.875rem', 
              marginTop: '4px',
              margin: '4px 0 0 0'
            }}>
              {step === 1 && 'Complete your full payment for the won auction'}
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
                borderTop: '2px solid #f59e0b',
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
              {/* Winner Celebration Banner */}
              <div style={{
                background: 'linear-gradient(to right, #fef3c7, #fed7aa)',
                border: '1px solid #f59e0b',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <div style={{
                    backgroundColor: '#fed7aa',
                    borderRadius: '50%',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '32px' }}>🏆</span>
                  </div>
                </div>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold', 
                  color: '#92400e', 
                  margin: '0 0 8px 0' 
                }}>
                  🎉 Congratulations on Winning!
                </h3>
                <p style={{ 
                  color: '#92400e', 
                  fontSize: '1.125rem',
                  margin: '0 0 16px 0'
                }}>
                  Complete your full payment to finalize the purchase
                </p>
                <div style={{
                  marginTop: '16px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #fed7aa'
                }}>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280', 
                    margin: '0 0 4px 0' 
                  }}>
                    Full Payment Amount
                  </p>
                  <p style={{
                    fontSize: '1.875rem',
                    fontWeight: 'bold',
                    color: '#f59e0b',
                    margin: 0
                  }}>
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: auction?.currency || 'USD' 
                    }).format(winner?.amount || 0)}
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
                  💳 Choose Your Payment Method
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

                {/* Bank Transfer Card - Simplified version */}
                <div style={{
                  background: 'linear-gradient(135deg, #e0f2fe, #e1f5fe)',
                  border: '2px solid #0288d1',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 12px 24px rgba(2, 136, 209, 0.15)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #0277bd, #0288d1)',
                      borderRadius: '12px',
                      padding: '10px',
                      boxShadow: '0 6px 16px rgba(2, 119, 189, 0.3)'
                    }}>
                      <span style={{ fontSize: '20px' }}>🏦</span>
                    </div>
                    <h5 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#01579b',
                      margin: 0
                    }}>
                      Bank Transfer Details
                    </h5>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    {/* Account Number */}
                    <div style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #81d4fa'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#0d47a1',
                            display: 'block',
                            marginBottom: '4px'
                          }}>
                            Account Number:
                          </span>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            color: '#0d47a1'
                          }}>
                            {paymentDetails.paymentMethods.bankTransfer.accountNumber}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(paymentDetails.paymentMethods.bankTransfer.accountNumber)}
                          style={{
                            background: '#0288d1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer'
                          }}
                          title="Copy Account Number"
                        >
                          <Copy style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>

                    {/* IFSC Code */}
                    <div style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #81d4fa'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#0d47a1',
                            display: 'block',
                            marginBottom: '4px'
                          }}>
                            IFSC Code:
                          </span>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            color: '#0d47a1'
                          }}>
                            {paymentDetails.paymentMethods.bankTransfer.ifsc}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(paymentDetails.paymentMethods.bankTransfer.ifsc)}
                          style={{
                            background: '#0288d1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer'
                          }}
                          title="Copy IFSC Code"
                        >
                          <Copy style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Account Name & Bank Name */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginTop: '16px'
                  }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #81d4fa'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#0d47a1',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Account Name:
                      </span>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#0d47a1'
                      }}>
                        {paymentDetails.paymentMethods.bankTransfer.accountName}
                      </span>
                    </div>
                    <div style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #81d4fa'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#0d47a1',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Bank Name:
                      </span>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#0d47a1'
                      }}>
                        {paymentDetails.paymentMethods.bankTransfer.bankName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div style={{
                background: 'linear-gradient(135deg, #fff8e1, #fff3c4)',
                border: '2px solid #ff8f00',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #ff8f00, #ffa000)',
                    borderRadius: '12px',
                    padding: '10px'
                  }}>
                    <span style={{ fontSize: '20px' }}>⚠️</span>
                  </div>
                  <h4 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#e65100',
                    margin: 0
                  }}>
                    Important Instructions
                  </h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {paymentDetails.instructions.map((instruction, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      background: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #ffecb3'
                    }}>
                      <div style={{
                        background: '#ff8f00',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>
                      <span style={{
                        color: '#e65100',
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        lineHeight: '1.4'
                      }}>
                        {instruction}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div style={{ textAlign: 'center', paddingTop: '24px' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    padding: '16px 32px',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 12px 32px rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '0 auto',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 16px 40px rgba(245, 158, 11, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.4)';
                  }}
                >
                  <CheckCircle style={{ width: '20px', height: '20px' }} />
                  <span>I have made the payment</span>
                  <span style={{ fontSize: '1.2rem' }}>💰</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Upload Screenshot - Similar to existing PaymentModal */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Success Message */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7, #fed7aa)',
                border: '2px solid #f59e0b',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    background: '#f59e0b',
                    borderRadius: '50%',
                    padding: '12px'
                  }}>
                    <CheckCircle style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#92400e',
                  marginBottom: '8px'
                }}>
                  🎉 Payment Completed!
                </h3>
                <p style={{
                  color: '#92400e',
                  fontSize: '1rem'
                }}>
                  Now upload your payment screenshot for verification
                </p>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Payment Method */}
                <div>
                  <label style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    💳 Payment Method
                  </label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      color: '#1f2937',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="UPI">💰 UPI Payment</option>
                    <option value="Bank Transfer">🏦 Bank Transfer</option>
                    <option value="Other">🔄 Other</option>
                  </select>
                </div>

                {/* Transaction ID */}
                <div>
                  <label style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    🔢 Transaction ID <span style={{ color: '#6b7280', fontWeight: 'normal' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                    placeholder="Enter transaction ID if available"
                    style={{
                      width: '100%',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      color: '#1f2937'
                    }}
                  />
                </div>

                {/* Payment Date */}
                <div>
                  <label style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    📅 Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '1rem',
                      color: '#1f2937'
                    }}
                  />
                </div>

                {/* File Upload */}
                <div style={{
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  border: '2px dashed #3b82f6',
                  borderRadius: '16px',
                  padding: '32px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      background: '#3b82f6',
                      borderRadius: '50%',
                      padding: '16px'
                    }}>
                      <Upload style={{ width: '32px', height: '32px', color: 'white' }} />
                    </div>
                  </div>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: '#1e40af',
                    marginBottom: '8px'
                  }}>
                    📱 Payment Screenshot *
                  </h4>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#3730a3',
                    marginBottom: '16px'
                  }}>
                    Upload a clear screenshot of your payment confirmation
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="winner-screenshot-upload"
                  />
                  <label
                    htmlFor="winner-screenshot-upload"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#3b82f6',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                  >
                    <Upload style={{ width: '16px', height: '16px' }} />
                    Choose Screenshot
                  </label>
                  {paymentData.paymentScreenshot && (
                    <div style={{
                      marginTop: '16px',
                      background: '#dcfce7',
                      border: '1px solid #16a34a',
                      borderRadius: '12px',
                      padding: '12px'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#15803d',
                        fontWeight: 'bold',
                        margin: 0
                      }}>
                        ✅ Selected: {paymentData.paymentScreenshot.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '24px',
                gap: '16px'
              }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Payment Details
                </button>
                <button
                  onClick={submitWinnerPayment}
                  disabled={!paymentData.paymentScreenshot || loading}
                  style={{
                    background: loading || !paymentData.paymentScreenshot 
                      ? '#9ca3af' 
                      : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: loading || !paymentData.paymentScreenshot ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: loading || !paymentData.paymentScreenshot ? 0.6 : 1
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ffffff40',
                        borderTop: '2px solid #ffffff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle style={{ width: '16px', height: '16px' }} />
                      Submit Payment Proof
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment Status - Similar to existing PaymentModal */}
          {step === 3 && paymentStatus && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Status Card */}
              <div style={{
                background: paymentStatus.status === 'approved' 
                  ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)'
                  : paymentStatus.status === 'rejected'
                  ? 'linear-gradient(135deg, #fecaca, #fca5a5)'
                  : 'linear-gradient(135deg, #fef3c7, #fed7aa)',
                border: paymentStatus.status === 'approved' 
                  ? '2px solid #16a34a'
                  : paymentStatus.status === 'rejected'
                  ? '2px solid #dc2626'
                  : '2px solid #f59e0b',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center'
              }}>
                {/* Status Icon */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <div style={{
                    background: paymentStatus.status === 'approved' 
                      ? '#16a34a'
                      : paymentStatus.status === 'rejected'
                      ? '#dc2626'
                      : '#f59e0b',
                    borderRadius: '50%',
                    padding: '16px'
                  }}>
                    <span style={{ fontSize: '32px' }}>
                      {paymentStatus.status === 'approved' ? '✅' : 
                       paymentStatus.status === 'rejected' ? '❌' : '⏳'}
                    </span>
                  </div>
                </div>
                
                {/* Status Title */}
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  color: paymentStatus.status === 'approved' 
                    ? '#15803d'
                    : paymentStatus.status === 'rejected'
                    ? '#991b1b'
                    : '#92400e'
                }}>
                  {paymentStatus.status === 'approved' ? '🎉 Payment Approved!' :
                   paymentStatus.status === 'rejected' ? '❌ Payment Rejected' :
                   '⏳ Payment Under Review'}
                </h3>
                
                {/* Status Message */}
                <p style={{
                  fontSize: '1.125rem',
                  marginBottom: '24px',
                  color: paymentStatus.status === 'approved' 
                    ? '#15803d'
                    : paymentStatus.status === 'rejected'
                    ? '#991b1b'
                    : '#92400e',
                  fontWeight: '500'
                }}>
                  {paymentStatus.status === 'approved' 
                    ? 'Congratulations! Your winner payment has been verified and approved.'
                    : paymentStatus.status === 'rejected'
                    ? 'Your payment was not approved. Please check the admin notes below and resubmit if needed.'
                    : 'Your winner payment is currently being verified by our admin team.'}
                </p>

                {/* Status Details */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'left'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    {/* Submitted Date */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: '8px'
                    }}>
                      <span style={{ color: '#64748b', fontWeight: '600' }}>📅 Submitted:</span>
                      <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem' }}>
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
                        padding: '8px 12px',
                        background: '#f0fdf4',
                        borderRadius: '8px'
                      }}>
                        <span style={{ color: '#16a34a', fontWeight: '600' }}>✅ Verified:</span>
                        <span style={{ fontWeight: 'bold', color: '#15803d', fontSize: '0.9rem' }}>
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
                      marginTop: '16px',
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      borderLeft: '4px solid #3b82f6'
                    }}>
                      <h4 style={{
                        fontWeight: 'bold',
                        color: '#1e40af',
                        marginBottom: '8px',
                        fontSize: '1rem'
                      }}>
                        💬 Admin Message
                      </h4>
                      <p style={{
                        color: '#374151',
                        fontStyle: 'italic',
                        fontSize: '0.9rem',
                        margin: 0
                      }}>
                        "{paymentStatus.adminNotes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={onClose}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
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

export default WinnerPaymentModal;
