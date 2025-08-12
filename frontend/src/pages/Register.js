import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { UserPlus, User, Mail, Phone, Lock, Eye, EyeOff, Upload, Camera } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const password = watch('password');

  const validatePassword = (value) => {
    const minLength = value.length >= 8;
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!minLength) return 'Password must be at least 8 characters long';
    if (!hasUppercase) return 'Password must contain at least one uppercase letter';
    if (!hasLowercase) return 'Password must contain at least one lowercase letter';
    if (!hasNumber) return 'Password must contain at least one number';
    if (!hasSpecialChar) return 'Password must contain at least one special character';
    
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Append form fields
      Object.keys(data).forEach(key => {
        if (key !== 'confirmPassword') {
          formData.append(key, data[key]);
        }
      });
      
      // Append file if selected
      if (selectedFile) {
        formData.append('profileImg', selectedFile);
      }

      const response = await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { user, token } = response.data;
      
      login(user, token);
      toast.success('Registration successful! Please verify your email and phone number.');
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container register">
        <div className="auth-card">
          <div className="auth-header">
            <UserPlus className="auth-icon" />
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join our auction community today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            {/* Profile Image Upload */}
            <div className="form-group profile-upload">
              <label className="form-label">Profile Picture (Optional)</label>
              <div className="file-upload-container">
                <div className="file-preview">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="preview-image" />
                  ) : (
                    <div className="preview-placeholder">
                      <Camera className="placeholder-icon" />
                      <span>No image selected</span>
                    </div>
                  )}
                </div>
                <label htmlFor="profileImg" className="file-upload-btn">
                  <Upload className="btn-icon" />
                  Choose Image
                </label>
                <input
                  type="file"
                  id="profileImg"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
              </div>
              <p className="file-hint">Max size: 5MB. Supported formats: JPG, PNG, GIF</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  <User className="label-icon" />
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  className={`form-input ${errors.fullName ? 'error' : ''}`}
                  placeholder="Enter your full name"
                  {...register('fullName', {
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    },
                    maxLength: {
                      value: 50,
                      message: 'Name must be less than 50 characters'
                    }
                  })}
                />
                {errors.fullName && (
                  <span className="error-message">{errors.fullName.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <Mail className="label-icon" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address'
                    }
                  })}
                />
                {errors.email && (
                  <span className="error-message">{errors.email.message}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label">
                <Phone className="label-icon" />
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                placeholder="Enter your phone number"
                {...register('phoneNumber', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[\+]?[\d\s\-\(\)]{10,}$/,
                    message: 'Please enter a valid phone number'
                  }
                })}
              />
              {errors.phoneNumber && (
                <span className="error-message">{errors.phoneNumber.message}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <Lock className="label-icon" />
                  Password
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Create a password"
                    {...register('password', {
                      required: 'Password is required',
                      validate: validatePassword
                    })}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.password && (
                  <span className="error-message">{errors.password.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  <Lock className="label-icon" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm your password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                />
                {errors.confirmPassword && (
                  <span className="error-message">{errors.confirmPassword.message}</span>
                )}
              </div>
            </div>

            {/* Password Requirements */}
            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={password && password.length >= 8 ? 'valid' : ''}>
                  At least 8 characters long
                </li>
                <li className={password && /[A-Z]/.test(password) ? 'valid' : ''}>
                  One uppercase letter
                </li>
                <li className={password && /[a-z]/.test(password) ? 'valid' : ''}>
                  One lowercase letter
                </li>
                <li className={password && /\d/.test(password) ? 'valid' : ''}>
                  One number
                </li>
                <li className={password && /[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'valid' : ''}>
                  One special character
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="btn-spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="btn-icon" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-features">
          <h3>Join Thousands of Happy Users</h3>
          <ul className="features-list">
            <li>Free account creation</li>
            <li>Secure profile verification</li>
            <li>Access to exclusive auctions</li>
            <li>Real-time bid notifications</li>
            <li>Trusted seller protection</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;
