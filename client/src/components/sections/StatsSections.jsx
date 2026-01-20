import React, { useState, useEffect } from 'react';
import { Users, Trophy, Award, Zap } from 'lucide-react';
import useScrollAnimation from '../hooks/useScrollAnimation';

const AnimatedCounter = ({ end, duration = 2500, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const [ref, isInView] = useScrollAnimation();
  
  useEffect(() => {
    if (isInView) {
      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeOutExpo = 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(easeOutExpo * end));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);
  
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const StatsSection = () => {
  const [ref, isInView] = useScrollAnimation();
  
  const stats = [
    { icon: Users, value: 406, label: "Players", suffix: "+" }, 
    { icon: Trophy, value: 104, label: "Tournaments" },
    { icon: Award, value: 15000, label: "Matches", suffix: "+" }, 
    { icon: Zap, value: 206, label: "Winners", suffix: "" }
  ];
  
  return (
    <section 
      id="stats" 
      ref={ref} 
      className={`py-24 relative transition-all duration-1000 ${isInView ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="text-center group" 
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="modern-stat-card">
                <div className="relative mb-4">
                  <div className="stat-icon-glow"></div>
                  <stat.icon 
                    className="relative mx-auto text-gold-400 group-hover:scale-110 transition-transform duration-500" 
                    size={36} 
                  />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-title font-black text-gold-300 mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-purple-200 font-body text-sm sm:text-base font-medium">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;