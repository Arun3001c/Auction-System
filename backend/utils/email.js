const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email configuration missing. EMAIL_USER:', !!process.env.EMAIL_USER, 'EMAIL_PASS:', !!process.env.EMAIL_PASS);
    return null;
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, token, fullName) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email service not configured. Verification email would be sent to:', email, 'with OTP:', token);
    return { success: true, messageId: 'development-mode' };
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification - Auction System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Auction System!</h2>
        <p>Hello ${fullName},</p>
        <p>Thank you for registering with us. Please verify your email address by entering the following OTP:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
          <h3 style="color: #007bff; font-size: 24px; margin: 0;">${token}</h3>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Auction System Team</p>
      </div>
    `
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, fullName) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email service not configured. Password reset email would be sent to:', email, 'with OTP:', token);
    return { success: true, messageId: 'development-mode' };
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - Auction System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${fullName},</p>
        <p>You requested to reset your password. Please use the following OTP to reset your password:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
          <h3 style="color: #dc3545; font-size: 24px; margin: 0;">${token}</h3>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Auction System Team</p>
      </div>
    `
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send contact form notification to admin
const sendContactNotification = async (contactData) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email service not configured. Contact notification would be sent with data:', contactData);
    return { success: true, messageId: 'development-mode' };
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `New Contact Form Submission: ${contactData.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contactData.name}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <p><strong>Phone:</strong> ${contactData.phone}</p>
        <p><strong>Subject:</strong> ${contactData.subject}</p>
        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
          <p><strong>Message:</strong></p>
          <p>${contactData.message}</p>
        </div>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send auction winner notification email
const sendWinnerNotificationEmail = async (winnerData) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email service not configured. Winner notification would be sent to:', winnerData.email);
    return { success: true, messageId: 'development-mode' };
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: winnerData.email,
    subject: '🎉 Congratulations! You Won an Auction - Auction System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #28a745; font-size: 32px; margin: 0;">🎉 Congratulations!</h1>
            <h2 style="color: #333; font-size: 24px; margin: 10px 0;">You Won the Auction!</h2>
          </div>
          
          <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">Auction Details</h3>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Item:</strong> ${winnerData.auctionTitle}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Winning Bid:</strong> ${winnerData.currency || 'USD'} ${winnerData.amount}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Auction ID:</strong> ${winnerData.auctionId}</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Next Steps:</h3>
            <ol style="color: #666; line-height: 1.8;">
              <li>The seller will contact you soon to arrange payment and delivery</li>
              <li>Please keep this email as proof of your winning bid</li>
              <li>Contact our support team if you have any questions</li>
              <li>Payment should be completed within 7 days of auction end</li>
            </ol>
          </div>
          
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #495057; margin: 0 0 10px 0;">Winner Information:</h4>
            <p style="margin: 5px 0; color: #666;"><strong>Name:</strong> ${winnerData.fullName}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${winnerData.email}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Phone:</strong> ${winnerData.phone}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Thank you for participating in our auction system!<br>
              We hope you enjoy your new item.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated email from Auction System.<br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Winner notification email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendContactNotification,
  sendWinnerNotificationEmail
};
