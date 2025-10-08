import { useState } from 'react';
import './DroneInstructions.css';

function DroneInstructions() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 6;

  const handlePrevious = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  // Keyboard navigation
  const handleKeyPress = (e) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  return (
    <div 
      className="instructions-container" 
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      <div className="slide-wrapper">
        <img 
          src={`/drone/workshop-slides/${currentSlide}-drone-instructions.png`}
          alt={`Drone instructions slide ${currentSlide}`}
          className="slide-image"
        />
      </div>

      <div className="navigation-controls">
        <button 
          onClick={handlePrevious}
          disabled={currentSlide === 1}
          className="nav-arrow left-arrow"
          aria-label="Previous slide"
        >
          ← Previous
        </button>

        <span className="slide-counter">
          {currentSlide} / {totalSlides}
        </span>

        <button 
          onClick={handleNext}
          disabled={currentSlide === totalSlides}
          className="nav-arrow right-arrow"
          aria-label="Next slide"
        >
          Next →
        </button>
      </div>

      {/* Slide indicator dots */}
      <div className="slide-indicators">
        {Array.from({ length: totalSlides }, (_, i) => i + 1).map((slide) => (
          <button
            key={slide}
            className={`indicator-dot ${currentSlide === slide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(slide)}
            aria-label={`Go to slide ${slide}`}
          />
        ))}
      </div>
    </div>
  );
}

export default DroneInstructions;

