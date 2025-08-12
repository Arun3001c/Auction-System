import React from 'react';
import { Link } from 'react-router-dom';
import { Gavel, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <div className="footer-logo">
              <Gavel className="logo-icon" />
              <span>Auction Hub</span>
            </div>
            <p className="footer-description">
              Your trusted platform for online auctions. Discover amazing deals 
              and bid on unique items from verified sellers worldwide.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                <Facebook />
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <Twitter />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <Instagram />
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <Linkedin />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><a href="#">How It Works</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="footer-section">
            <h3 className="footer-title">Categories</h3>
            <ul className="footer-links">
              <li><a href="#">Electronics</a></li>
              <li><a href="#">Art & Collectibles</a></li>
              <li><a href="#">Jewelry</a></li>
              <li><a href="#">Vehicles</a></li>
              <li><a href="#">Fashion</a></li>
              <li><a href="#">Sports</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">Contact Info</h3>
            <div className="contact-info">
              <div className="contact-item">
                <Mail className="contact-icon" />
                <span>support@auctionhub.com</span>
              </div>
              <div className="contact-item">
                <Phone className="contact-icon" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="contact-item">
                <MapPin className="contact-icon" />
                <span>123 Auction Street, NY 10001</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2024 Auction Hub. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
