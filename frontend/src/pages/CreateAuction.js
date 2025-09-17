import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Upload, X, Play, Calendar, DollarSign, Tag, FileText, Clock, Image as ImageIcon, Video, Plus } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';

const CreateAuction = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm();
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [certificatePreviews, setCertificatePreviews] = useState([]);

  const watchAuctionType = watch('auctionType');

  const auctionTypes = [
    {
      value: 'english',
      label: 'English Auction',
      description: 'Traditional ascending price auction where bidders compete with increasing bids'
    },
    {
      value: 'dutch',
      label: 'Dutch Auction',
      description: 'Descending price auction starting high and decreasing until someone bids'
    },
    {
      value: 'sealed',
      label: 'First-Price Sealed Bid',
      description: 'Bidders submit one sealed bid, highest bid wins and pays their bid amount'
    },
    {
      value: 'reserve',
      label: 'Reserve Auction',
      description: 'English auction with a minimum price that must be met for the item to sell'
    }
  ];

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Collectibles',
    'Art', 'Books', 'Music', 'Jewelry', 'Vehicles', 'Automotive', 'Other'
  ];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('Video file size must be less than 50MB');
        return;
      }
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoPreview(null);
  };

  const handleCertificateUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (certificates.length + files.length > 5) {
      toast.error('Maximum 5 certificate images allowed');
      return;
    }

    if (certificates.length + files.length < 1) {
      toast.error('At least 1 certificate image is required for reserve auctions');
      return;
    }

    // Validate file types (only images)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Only image files (JPEG, PNG, WebP) are allowed for certificates');
      return;
    }

    // Validate file size (5MB per file)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Certificate images must be less than 5MB each');
      return;
    }

    const newCertificates = [...certificates, ...files];
    setCertificates(newCertificates);

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setCertificatePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeCertificate = (index) => {
    const newCertificates = certificates.filter((_, i) => i !== index);
    const newPreviews = certificatePreviews.filter((_, i) => i !== index);
    setCertificates(newCertificates);
    setCertificatePreviews(newPreviews);
  };

  const generateAuctionId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `AUC-${timestamp}-${randomStr}`.toUpperCase();
  };

  // Generate random participation code (6 digits)
  const [participationCode, setParticipationCode] = useState('');
  const generateParticipationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setParticipationCode(code);
  };

  const onSubmit = async (data) => {
    // Check profile verification before allowing auction creation
    if (!user?.isEmailVerified || !user?.isPhoneVerified) {
      toast.error('Please verify your email and phone number to create an auction.');
      navigate('/profile');
      return;
    }

    // Validate certificates for reserve auctions
    if (data.auctionType === 'reserve') {
      if (certificates.length === 0) {
        toast.error('At least 1 ownership certificate is required for reserve auctions');
        return;
      }
      if (certificates.length > 5) {
        toast.error('Maximum 5 ownership certificates allowed');
        return;
      }
    }

    try {
      if (images.length === 0) {
        toast.error('At least one image is required');
        return;
      }

      if (!participationCode) {
        toast.error('Please generate a participation code');
        return;
      }

      const formData = new FormData();
      // Generate auction ID
      const auctionId = generateAuctionId();
      formData.append('auctionId', auctionId);

      // Use generated participation code
      formData.append('participationCode', participationCode);

      // Add form data
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });

      // Add images
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });

      // Add video if present
      if (video) {
        formData.append('video', video);
      }

      // Add certificates for reserve auctions
      if (data.auctionType === 'reserve' && certificates.length > 0) {
        certificates.forEach((certificate, index) => {
          formData.append(`certificates`, certificate);
        });
        // Mark as pending approval for reserve auctions
        formData.append('needsApproval', 'true');
      }

      const response = await api.post('/auctions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Handle different responses based on auction type
      if (response.data.requiresApproval) {
        // Reserve auction - submitted for approval
        toast.success(`Reserve auction submitted for approval! Your auction will be reviewed by admin and automatically created once your ownership certificates are verified. Participation Code: ${participationCode}`, {
          autoClose: 10000
        });
        navigate('/profile'); // Redirect to profile to see pending requests
      } else {
        // Regular auction - created immediately
        toast.success(`Auction created successfully! Participation Code: ${participationCode}`);
        navigate(`/auction/${response.data.auction._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create auction');
    }
  };

  return (
    <div className="create-auction-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <Plus className="page-icon" />
            Create New Auction
          </h1>
          <p className="page-subtitle">
            List your item and start receiving bids from interested buyers
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="create-auction-form">
          <div className="form-sections">
            {/* Basic Information Section */}
            <div className="form-section">
              <h2 className="section-title">
                <FileText className="section-icon" />
                Basic Information
              </h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <Tag className="label-icon" />
                    Auction Title *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter a descriptive title for your auction"
                    {...register('title', {
                      required: 'Title is required',
                      minLength: { value: 5, message: 'Title must be at least 5 characters' },
                      maxLength: { value: 100, message: 'Title must be less than 100 characters' }
                    })}
                  />
                  {errors.title && <span className="error-message">{errors.title.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Tag className="label-icon" />
                    Category *
                  </label>
                  <select
                    className="form-select"
                    {...register('category', { required: 'Category is required' })}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <span className="error-message">{errors.category.message}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FileText className="label-icon" />
                  Description *
                </label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Provide a detailed description of your item..."
                  {...register('description', {
                    required: 'Description is required',
                    minLength: { value: 20, message: 'Description must be at least 20 characters' }
                  })}
                />
                {errors.description && <span className="error-message">{errors.description.message}</span>}
              </div>
            </div>

            {/* Auction Settings Section */}
            <div className="form-section">
              <h2 className="section-title">
                <Clock className="section-icon" />
                Auction Settings
              </h2>

              <div className="form-group">
                <label className="form-label">
                  <Tag className="label-icon" />
                  Auction Type *
                </label>
                <div className="auction-types">
                  {auctionTypes.map(type => (
                    <label key={type.value} className="auction-type-option">
                      <input
                        type="radio"
                        value={type.value}
                        {...register('auctionType', { required: 'Auction type is required' })}
                      />
                      <div className="auction-type-content">
                        <h4>{type.label}</h4>
                        <p>{type.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.auctionType && <span className="error-message">{errors.auctionType.message}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <Calendar className="label-icon" />
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    min={new Date().toISOString().slice(0, 16)}
                    {...register('startDate', { required: 'Start date is required' })}
                  />
                  {errors.startDate && <span className="error-message">{errors.startDate.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Calendar className="label-icon" />
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    min={new Date().toISOString().slice(0, 16)}
                    {...register('endDate', { required: 'End date is required' })}
                  />
                  {errors.endDate && <span className="error-message">{errors.endDate.message}</span>}
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="form-section">
              <h2 className="section-title">
                <DollarSign className="section-icon" />
                Pricing
              </h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <DollarSign className="label-icon" />
                    Starting Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    placeholder="0.00"
                    {...register('startingPrice', {
                      required: 'Starting price is required',
                      min: { value: 0.01, message: 'Starting price must be greater than 0' }
                    })}
                  />
                  {errors.startingPrice && <span className="error-message">{errors.startingPrice.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Currency *
                  </label>
                  <select
                    className="form-select"
                    {...register('currency', { required: 'Currency is required' })}
                  >
                    <option value="">Select currency</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="NZD">NZD - New Zealand Dollar</option>
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="BRL">BRL - Brazilian Real</option>
                    <option value="RUB">RUB - Russian Ruble</option>
                    <option value="KRW">KRW - South Korean Won</option>
                    <option value="HKD">HKD - Hong Kong Dollar</option>
                    <option value="MXN">MXN - Mexican Peso</option>
                    <option value="SEK">SEK - Swedish Krona</option>
                    <option value="NOK">NOK - Norwegian Krone</option>
                    <option value="TRY">TRY - Turkish Lira</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="PLN">PLN - Polish Zloty</option>
                    <option value="THB">THB - Thai Baht</option>
                    <option value="IDR">IDR - Indonesian Rupiah</option>
                    <option value="MYR">MYR - Malaysian Ringgit</option>
                    <option value="PHP">PHP - Philippine Peso</option>
                    <option value="VND">VND - Vietnamese Dong</option>
                    <option value="EGP">EGP - Egyptian Pound</option>
                    <option value="PKR">PKR - Pakistani Rupee</option>
                    <option value="BDT">BDT - Bangladeshi Taka</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.currency && <span className="error-message">{errors.currency.message}</span>}
                </div>

                {watchAuctionType === 'sealed' && (
                  <div className="form-group">
                    <label className="form-label">
                      <DollarSign className="label-icon" />
                      Reserve Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      placeholder="0.00"
                      {...register('reservePrice', {
                        required: watchAuctionType === 'sealed' ? 'Reserve price is required for sealed bid auctions' : false,
                        min: { value: 0.01, message: 'Reserve price must be greater than 0' }
                      })}
                    />
                    {errors.reservePrice && <span className="error-message">{errors.reservePrice.message}</span>}
                  </div>
                )}

                {watchAuctionType === 'reserve' && (
                  <div className="form-group">
                    <label className="form-label">
                      <DollarSign className="label-icon" />
                      Minimum Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      placeholder="0.00"
                      {...register('minimumPrice', {
                        required: watchAuctionType === 'reserve' ? 'Minimum price is required for reserve auctions' : false,
                        min: { value: 0.01, message: 'Minimum price must be greater than 0' }
                      })}
                    />
                    {errors.minimumPrice && <span className="error-message">{errors.minimumPrice.message}</span>}
                  </div>
                )}

                {/* Reserve Auction Requirements Warning */}
                {watchAuctionType === 'reserve' && (
                  <div style={{
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e', fontSize: '16px' }}>
                      ⚠️ Reserve Auction Requirements
                    </h4>
                    <div style={{ color: '#92400e', fontSize: '14px', lineHeight: '1.5' }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}>
                        <strong>You need to upload TWO types of files:</strong>
                      </p>
                      <ol style={{ margin: '0', paddingLeft: '1.5rem' }}>
                        <li><strong>Auction Item Images:</strong> Photos of the item you're selling (uploaded above)</li>
                        <li><strong>Ownership Documents:</strong> Certificates/receipts proving you own the item (uploaded below)</li>
                      </ol>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '13px' }}>
                        Admin will review both before approving your auction.
                      </p>
                    </div>
                  </div>
                )}

                {/* Ownership Certificate Upload for Reserve Auctions */}
                {watchAuctionType === 'reserve' && (
                  <div className="form-group">
                    <label className="form-label">
                      <FileText className="label-icon" />
                      Ownership Certificates * (1-5 documents required)
                    </label>
                    <p className="form-description">
                      Upload ownership documents/certificates to verify you own the item. These are SEPARATE from auction item images above. 
                      Examples: purchase receipts, certificates of authenticity, ownership papers, etc.
                    </p>
                    
                    <div className="certificate-upload-section">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleCertificateUpload}
                        style={{ display: 'none' }}
                        id="certificate-upload"
                      />
                      
                      <label 
                        htmlFor="certificate-upload" 
                        className="upload-button certificate-upload-button"
                        style={{
                          display: 'flex',
                          color: '#f59e0b',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1rem',
                          border: '2px dashed #f59e0b',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: '#fffbeb',
                          transition: 'all 0.2s ease',
                          marginBottom: '1rem'
                        }}
                      >
                        <Upload size={20} />
                        Add Ownership Documents ({certificates.length}/5)
                      </label>

                      {/* Certificate Previews */}
                      {certificatePreviews.length > 0 && (
                        <div className="certificate-previews" style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                          gap: '1rem',
                          marginTop: '1rem'
                        }}>
                          {certificatePreviews.map((preview, index) => (
                            <div key={index} className="certificate-preview-item" style={{
                              position: 'relative',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '2px solid #e2e8f0'
                            }}>
                              <img
                                src={preview}
                                alt={`Certificate ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '120px',
                                  objectFit: 'cover'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeCertificate(index)}
                                className="remove-certificate-btn"
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Certificate requirement message */}
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        marginTop: '1rem'
                      }}>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.875rem',
                          color: '#92400e'
                        }}>
                          ⚠️ Reserve auctions require admin approval. Your auction will be in "Pending" status until certificates are verified.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Participation Code Display with Generate Button */}
              <div className="form-group">
                <label className="form-label">Auction Participation Code</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={participationCode}
                    readOnly
                    placeholder="Click Generate"
                    style={{ width: '180px' }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={generateParticipationCode}>
                    Generate
                  </button>
                </div>
                <small className="form-hint">Click 'Generate' to get your participation code for joining the auction.</small>
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="form-section">
              <h2 className="section-title">
                <ImageIcon className="section-icon" />
                Media Upload
              </h2>

              {/* Images Upload */}
              <div className="form-group">
                <label className="form-label">
                  <ImageIcon className="label-icon" />
                  Auction Item Images * (1-5 images required)
                </label>
                <p className="form-description">
                  Upload clear photos of the item you're auctioning. These images will be shown to bidders.
                </p>
                
                <div className="image-upload-area">
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                  />
                  <label htmlFor="images" className="upload-button">
                    <Upload className="upload-icon" />
                    Choose Auction Item Images
                  </label>
                  <p className="upload-hint">PNG, JPG, JPEG up to 5MB each. Maximum 5 images.</p>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="image-previews">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => removeImage(index)}
                        >
                          <X />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div className="form-group">
                <label className="form-label">
                  <Video className="label-icon" />
                  Video (Optional)
                </label>
                
                <div className="video-upload-area">
                  <input
                    type="file"
                    id="video"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="file-input"
                  />
                  <label htmlFor="video" className="upload-button">
                    <Video className="upload-icon" />
                    Choose Video
                  </label>
                  <p className="upload-hint">MP4, MOV, AVI up to 50MB</p>
                </div>

                {videoPreview && (
                  <div className="video-preview">
                    <video controls>
                      <source src={videoPreview} type={video?.type} />
                      Your browser does not support the video tag.
                    </video>
                    <button
                      type="button"
                      className="remove-video"
                      onClick={removeVideo}
                    >
                      <X />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAuction;
