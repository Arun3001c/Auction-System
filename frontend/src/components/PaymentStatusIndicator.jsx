import React from 'react';
import { CheckCircle, Clock, XCircle, CreditCard } from 'lucide-react';

const PaymentStatusIndicator = ({ auctionType, paymentStatus, onPaymentClick }) => {
  // Only show for reserve auctions
  if (auctionType !== 'reserve') {
    return null;
  }

  const getStatusConfig = () => {
    if (!paymentStatus || !paymentStatus.hasPayment) {
      return {
        icon: <CreditCard className="w-4 h-4" />,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        text: 'Payment Required',
        clickable: true
      };
    }

    switch (paymentStatus.paymentRequest.status) {
      case 'approved':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Payment Verified',
          clickable: false
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Payment Rejected',
          clickable: true
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Verification Pending',
          clickable: false
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${config.color} ${
        config.clickable ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      onClick={config.clickable ? onPaymentClick : undefined}
    >
      {config.icon}
      <span>{config.text}</span>
      {config.clickable && (
        <span className="text-xs">(Click to pay)</span>
      )}
    </div>
  );
};

export default PaymentStatusIndicator;