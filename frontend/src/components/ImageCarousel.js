import React, { useState, useEffect, useCallback } from 'react';
import './ImageCarousel.css';

const ImageCarousel = ({ images = [], alt = '', autoPlay = true, interval = 4000, showThumbnails = false }) => {
  const [current, setCurrent] = useState(0);

  // Navigation functions
  const goPrev = useCallback(() => {
    if (!images.length) return;
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    if (!images.length) return;
    setCurrent((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || !images.length) return;
    const timer = setInterval(goNext, interval);
    return () => clearInterval(timer);
  }, [goNext, autoPlay, interval, images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!images.length) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext, images.length]);

  // ✅ Now we conditionally render AFTER hooks
  if (!images.length) {
    return (
      <img 
        src="/placeholder-image.jpg" 
        alt="No image" 
        className="auction-image" 
      />
    );
  }

  return (
    <div className="carousel-container">
      <button className="carousel-btn prev" onClick={goPrev}>&lt;</button>

      <div className="carousel-slide">
        <img
          src={images[current].startsWith('http') ? images[current] : `http://localhost:5001/${images[current]}`}
          alt={alt || `Slide ${current + 1}`}
          className="auction-image fade-in"
          onError={e => { e.target.src = '/placeholder-image.jpg'; }}
        />
      </div>

      <button className="carousel-btn next" onClick={goNext}>&gt;</button>

      <div className="carousel-indicators">
        {images.map((img, idx) => (
          <span
            key={idx}
            className={idx === current ? 'active' : ''}
            onClick={() => setCurrent(idx)}
          ></span>
        ))}
      </div>

      {showThumbnails && (
        <div className="carousel-thumbnails">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img.startsWith('http') ? img : `http://localhost:5001/${img}`}
              alt={`Thumbnail ${idx + 1}`}
              className={`thumbnail ${idx === current ? 'active' : ''}`}
              onClick={() => setCurrent(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
