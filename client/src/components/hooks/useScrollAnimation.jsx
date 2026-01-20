import { useRef, useState, useEffect } from 'react';

const useScrollAnimation = () => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { 
          setIsInView(true); 
          observer.unobserve(entry.target); 
        }
      }, 
      { threshold: 0.1 }
    );
    
    if (ref.current) { 
      observer.observe(ref.current); 
    }
    
    return () => { 
      if (ref.current) { 
        observer.unobserve(ref.current); 
      } 
    };
  }, []);
  
  return [ref, isInView];
};

export default useScrollAnimation;