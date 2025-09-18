const Winner = require('../models/Winner');
const { sendWinnerNotificationEmail } = require('../utils/email');

// Get all winner notifications for a user
exports.getWinnerNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const winners = await Winner.find({ user: userId })
      .populate({
        path: 'auction',
        populate: {
          path: 'seller',
          select: 'fullName email phoneNumber'
        }
      });
    res.json(winners);
  } catch (error) {
    console.error('Error fetching winner notifications:', error);
    res.status(500).json({ message: 'Server error fetching winner notifications' });
  }
};

// Send winner notification email
exports.sendWinnerNotification = async (winnerData) => {
  try {
    console.log('Sending winner notification email to:', winnerData.email);
    
    const emailResult = await sendWinnerNotificationEmail(winnerData);
    
    if (emailResult.success !== false) {
      // Update the winner record to mark as notified
      await Winner.findByIdAndUpdate(winnerData.winnerId, { notified: true });
      console.log('Winner notification email sent successfully');
      return { success: true };
    } else {
      console.error('Failed to send winner notification email:', emailResult.error);
      return { success: false, error: emailResult.error };
    }
  } catch (error) {
    console.error('Error sending winner notification:', error);
    return { success: false, error: error.message };
  }
};
