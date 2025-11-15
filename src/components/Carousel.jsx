import React, { useEffect, useState, useRef } from "react";

/**
 * Props:
 * - images: [{src, alt}]
 * - autoPlayInterval: milliseconds (optional)
 */
export default function Carousel({ images = [], autoPlayInterval = 0 }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const timerRef = useRef(null);

  const goPrev = () => setIndex((i) => (i - 1 + count) % count);
  const goNext = () => setIndex((i) => (i + 1) % count);
  const goTo = (i) => setIndex(i % count);

  // autoplay effect
  useEffect(() => {
    if (!autoPlayInterval || count <= 1) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, autoPlayInterval);

    return () => clearInterval(timerRef.current);
  }, [autoPlayInterval, count]);

  // pause autoplay when user hovers
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    if (!autoPlayInterval || count <= 1) return;
    if (isHovered) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    } else if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % count);
      }, autoPlayInterval);
    }
    return () => {};
  }, [isHovered, autoPlayInterval, count]);

  if (count === 0) return <div>No images provided</div>;

  return (
    <div
      className="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="carousel-window">
        {images.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={img.alt || `Slide ${i + 1}`}
            className={`carousel-image ${i === index ? "active" : ""}`}
            aria-hidden={i === index ? "false" : "true"}
            style={{ transform: `translateX(${(i - index) * 100}%)` }}
            draggable="false"
          />
        ))}
      </div>

      <button className="carousel-btn left" onClick={goPrev} aria-label="Previous slide">
        ‹
      </button>
      <button className="carousel-btn right" onClick={goNext} aria-label="Next slide">
        ›
      </button>

      <div className="carousel-dots" role="tablist" aria-label="Slide indicators">
        {images.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === index ? "dot-active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-selected={i === index}
          />
        ))}
      </div>
    </div>
  );
}
