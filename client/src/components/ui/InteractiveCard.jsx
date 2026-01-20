import React, { useRef, useEffect } from 'react';
import useScrollAnimation from '../hooks/useScrollAnimation';

const InteractiveCard = ({ children, className = "" }) => {
  const cardRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [scrollRef, isInView] = useScrollAnimation();

  useEffect(() => {
    if (isMobile) return;
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };
    card.addEventListener('mousemove', handleMouseMove);
    return () => { 
      card.removeEventListener('mousemove', handleMouseMove); 
    };
  }, [isMobile]);

  return (
    <div 
      ref={scrollRef} 
      className={`modern-card-container transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
    >
      <div ref={cardRef} className="h-full w-full modern-interactive-card">
        {children}
        {!isMobile && <div className="modern-reflection" />}
      </div>
    </div>
  );
};

export default InteractiveCard;