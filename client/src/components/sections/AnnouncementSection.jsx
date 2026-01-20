import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Loader2, Trophy, Calendar, Star, Users } from 'lucide-react';
import InteractiveCard from '../ui/InteractiveCard';

const ParseAnnounceText = ({ text }) => {
  if (!text) return null;
  const parts = text.split('**');
  return (
    <p className="text-purple-200 text-center md:text-left text-base sm:text-lg font-body">
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-bold text-gold-400 font-heading tracking-wide">{part}</strong>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </p>
  );
};

const AnnouncementSection = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef(null);
  const availableIcons = [Trophy, Calendar, Star, Users];

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setError(null);

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        const response = await axios.get(`${backendUrl}/api/announcements`);

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          const formattedAnnouncements = response.data.data.map((announcement, index) => ({
            title: announcement.text || "Untitled Announcement",
            icon: availableIcons[index % availableIcons.length]
          }));
          setAnnouncements(formattedAnnouncements);
        } else {
          console.warn("Unexpected data format:", response.data);
          setError("Received invalid data from server.");
          setAnnouncements([]);
        }

      } catch (err) {
        console.error("Failed to fetch announcements:", err);
        setError("Could not load latest announcements.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    if (!isPaused && announcements.length > 0) {
      timeoutRef.current = setTimeout(
        () => setCurrentIndex(prevIndex => (prevIndex + 1) % announcements.length),
        5000
      );
    }
    return () => resetTimeout();
  }, [currentIndex, announcements, isPaused]);

  const handleNavClick = (direction) => {
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % announcements.length
      : (currentIndex - 1 + announcements.length) % announcements.length;
    setCurrentIndex(newIndex);
  };

  const currentAnnouncement = announcements.length > 0 ? announcements[currentIndex] : null;
  const CurrentIcon = currentAnnouncement ? currentAnnouncement.icon : Loader2;

  return (
    <section id="announcements" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <InteractiveCard>
          <div
            className="announcement-card"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="announcement-card-glow"></div>

            {!loading && !error && announcements.length > 1 && (
              <>
                <button 
                  onClick={() => handleNavClick('prev')} 
                  className="announcement-nav-button left-2 md:left-4" 
                  aria-label="Previous Announcement"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => handleNavClick('next')} 
                  className="announcement-nav-button right-2 md:right-4" 
                  aria-label="Next Announcement"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="w-full min-h-[80px] flex flex-col justify-center items-center">
              {loading ? (
                <div className="flex items-center gap-4 text-purple-200">
                  <Loader2 className="animate-spin text-gold-400" size={24} />
                  <span className="font-body">Loading Latest News...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-4 text-red-400">
                  <AlertCircle size={24} />
                  <span className="font-body">{error}</span>
                </div>
              ) : announcements.length > 0 ? (
                <>
                  <div key={currentIndex} className="announcement-content">
                    <CurrentIcon className="text-gold-400 flex-shrink-0" size={28} />
                    <ParseAnnounceText text={currentAnnouncement?.title || 'No announcement'} />
                  </div>

                  {announcements.length > 1 && (
                    <div className="flex gap-2.5 mt-4">
                      {announcements.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`announcement-dot ${currentIndex === index ? 'active' : ''}`}
                          aria-label={`Go to announcement ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-4 text-purple-200">
                  <CheckCircle size={24} />
                  <span className="font-body">No new announcements right now.</span>
                </div>
              )}
            </div>
          </div>
        </InteractiveCard>
      </div>
    </section>
  );
};

export default AnnouncementSection;