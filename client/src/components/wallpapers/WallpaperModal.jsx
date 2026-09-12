import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Heart, Layers, Share2, ChevronLeft, ChevronRight, Check, Smartphone, Lock } from 'lucide-react';
import { likeWallpaper, getSimilarWallpapers } from '../../services/wallpaperService';
import { useNavigate } from 'react-router-dom';
import { triggerDownload } from '../../utils/downloadUtils';
import { triggerToast } from '../ui/Toast';

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const WallpaperModal = ({ wallpaper, onClose, onNext, onPrev, hasNext, hasPrev, onSelectSimilar }) => {
  const navigate = useNavigate();
  const [similar, setSimilar] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showMockup, setShowMockup] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      setDateStr(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (wallpaper) {
      document.body.style.overflow = 'hidden';
      setLikesCount(wallpaper.likes || 0);
      setHasLiked(false);
      setShowMockup(false);
      
      getSimilarWallpapers(wallpaper._id)
        .then(res => setSimilar(res.data))
        .catch(console.error);
    } else {
      document.body.style.overflow = 'auto';
    }
    
    const handleKeydown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeydown);
    
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      // Let Header.jsx manage overflow if it needs to, just ensure we don't trap it
      document.body.style.overflow = '';
    };
  }, [wallpaper, onClose, onNext, onPrev, hasNext, hasPrev]);

  const onTouchStartEvent = (e) => {
    if (showMockup) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveEvent = (e) => {
    if (showMockup) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (showMockup || !touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && onNext && hasNext) onNext();
    if (isRightSwipe && onPrev && hasPrev) onPrev();
  };

  const handleDownload = () => {
    if (!wallpaper) return;
    triggerDownload(wallpaper);
  };

  const handleLike = async () => {
    if (!wallpaper || hasLiked) return;
    try {
      setHasLiked(true);
      setLikesCount(prev => prev + 1);
      await likeWallpaper(wallpaper._id);
    } catch (err) {
      setHasLiked(false);
      setLikesCount(prev => prev - 1);
      console.error('Like failed:', err);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/wallpapers?id=${wallpaper._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: wallpaper.title,
          url: url
        });
        return;
      } catch (err) {
        // Fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      triggerToast('Link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      triggerToast('Failed to copy link', 'error');
    }
  };

  const handleTagClick = (tag) => {
    onClose();
    navigate(`/wallpapers/albums/${encodeURIComponent(tag)}`);
  };

  return (
    <AnimatePresence>
      {wallpaper && (
        <motion.div 
          key="modal-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-4"
        >
          {/* Backdrop with stronger blur */}
          <div
            onClick={onClose}
            className="absolute inset-0 bg-black/95 lg:bg-black/80 lg:backdrop-blur-2xl cursor-zoom-out"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full h-full lg:h-[95vh] lg:max-w-[95vw] xl:max-w-[90vw] lg:rounded-[2rem] bg-zinc-950 shadow-2xl flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden wallpaper-scrollbar border border-white/[0.05]"
          >
            {/* Desktop Navigation Arrows */}
            {hasPrev && !showMockup && (
              <button 
                onClick={onPrev}
                className="hidden lg:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/80 hover:scale-110 backdrop-blur-md transition-all border border-white/10"
              >
                <ChevronLeft size={28} />
              </button>
            )}
            {hasNext && !showMockup && (
              <button 
                onClick={onNext}
                className="hidden lg:flex absolute right-4 lg:right-[380px] xl:right-[420px] top-1/2 -translate-y-1/2 z-[60] w-12 h-12 items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/80 hover:scale-110 backdrop-blur-md transition-all border border-white/10"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* Immersive Image Section */}
            <div 
              className={`relative w-full shrink-0 lg:h-auto lg:flex-1 flex items-center justify-center p-0 lg:p-8 z-0 overflow-hidden ${
                showMockup ? 'h-[100dvh] lg:h-full' : 'h-[75vh]'
              }`}
              style={{ backgroundColor: wallpaper.dominantColor || '#0a0a0a' }}
              onTouchStart={onTouchStartEvent}
              onTouchMove={onTouchMoveEvent}
              onTouchEnd={onTouchEndEvent}
            >
              {/* Blur backdrop for mockup */}
              {showMockup && (
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-3xl opacity-50 scale-110"
                  style={{ backgroundImage: `url(${wallpaper.thumbnailUrl})` }}
                />
              )}

              {/* Close Button - fixed on mobile, absolute on desktop */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-[80] w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:text-white hover:bg-black/60 backdrop-blur-md transition-all border border-white/10"
              >
                <X size={20} />
              </button>

              {/* Mockup / Image Container */}
              <div 
                className={`relative transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center justify-center ${
                  showMockup ? 'h-[85vh] max-h-[693px] aspect-[320/693] sm:h-[693px] sm:w-[320px]' : 'w-full h-full'
                }`}
              >
                {showMockup ? (
                  /* Realistic iPhone Bezel */
                  <div className="relative w-full h-full bg-black rounded-[2.5rem] sm:rounded-[3rem] border-[6px] sm:border-[8px] border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 z-10 flex shrink-0 mx-auto overflow-hidden">
                    {/* Dynamic Island */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[85px] h-[24px] bg-black rounded-full z-30" />
                    
                    {/* Image inside mockup */}
                    <img
                      key={wallpaper._id}
                      src={wallpaper.imageUrl.replace('/upload/', '/upload/q_auto:best,f_auto/')}
                      alt={wallpaper.title}
                      className="w-full h-full object-cover rounded-[2rem] sm:rounded-[2.5rem] transition-opacity duration-700"
                    />

                    {/* Lock Screen UI Overlay */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { delay: 0.3 } }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 pointer-events-none flex flex-col items-center pt-14 sm:pt-16 text-white z-20"
                      style={{ textShadow: '0px 2px 16px rgba(0,0,0,0.4), 0px 0px 4px rgba(0,0,0,0.6)' }}
                    >
                      <Lock size={20} className="mb-3 opacity-90" />
                      <div className="text-6xl sm:text-7xl leading-none font-medium tracking-tight font-sans">
                        {timeStr}
                      </div>
                      <div className="text-lg sm:text-xl font-medium tracking-wide mt-2">
                        {dateStr}
                      </div>
                      <div className="absolute bottom-3 w-32 h-1.5 bg-white/70 backdrop-blur-md rounded-full" />
                    </motion.div>
                  </div>
                ) : (
                  /* Standard Image View */
                  <img
                    key={wallpaper._id}
                    src={wallpaper.imageUrl.replace('/upload/', '/upload/q_auto:best,f_auto/')}
                    alt={wallpaper.title}
                    className="w-full h-full object-contain transition-opacity duration-700 shadow-2xl"
                  />
                )}
              </div>
              
              {!showMockup && <div className="absolute inset-0 z-10 lg:hidden" />}
            </div>

            {/* Info Panel - Glassmorphic on Desktop */}
            <AnimatePresence>
              {!showMockup && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="relative w-full lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col bg-zinc-950 lg:bg-zinc-900/60 lg:backdrop-blur-3xl border-l border-white/5 z-20"
                >
                  <div className="flex flex-col h-full overflow-y-auto wallpaper-scrollbar">
                    
                    <div className="p-6 lg:p-8 flex-1">
                      
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <h2 className="text-2xl font-bold text-zinc-100 leading-tight pr-4 tracking-tight">{wallpaper.title}</h2>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowMockup(true)}
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition-colors shrink-0"
                            title="Preview Lock Screen"
                          >
                            <Smartphone size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      {wallpaper.description && (
                        <p className="text-sm text-zinc-400 leading-relaxed mb-6 font-medium">
                          {wallpaper.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mb-8 font-medium tracking-wide">
                        {wallpaper.resolution && (
                          <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <Layers size={14} />
                            {wallpaper.resolution.width} × {wallpaper.resolution.height}
                          </span>
                        )}
                        {wallpaper.fileSize && (
                          <span className="bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                            {formatFileSize(wallpaper.fileSize)}
                          </span>
                        )}
                      </div>

                      {/* Primary Actions */}
                      <div className="flex items-center gap-3 mb-10">
                        <button
                          onClick={handleDownload}
                          className="flex-1 py-3.5 bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10"
                        >
                          <Download size={20} />
                          Download Free
                        </button>
                        <button
                          onClick={handleLike}
                          disabled={hasLiked}
                          className={`w-[60px] h-[52px] rounded-xl flex items-center justify-center transition-all ${
                            hasLiked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 hover:scale-[1.02] active:scale-[0.98]'
                          }`}
                          title="Like"
                        >
                          <Heart size={22} className={hasLiked ? 'fill-current' : ''} />
                        </button>
                        <button
                          onClick={handleShare}
                          className="w-[60px] h-[52px] bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-zinc-300 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98]"
                          title="Share Link"
                        >
                          {copied ? <Check size={20} className="text-emerald-400" /> : <Share2 size={20} />}
                        </button>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-zinc-500 mb-10 px-2">
                        <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                        <span>{wallpaper.downloads || 0} Downloads</span>
                      </div>

                      {/* Tags */}
                      {wallpaper.tags && wallpaper.tags.length > 0 && (
                        <div className="mb-10">
                          <h3 className="text-xs font-bold text-zinc-500 mb-4 uppercase tracking-widest">Related Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {wallpaper.tags.map(tag => (
                              <button
                                key={tag}
                                onClick={() => handleTagClick(tag)}
                                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-full text-xs text-zinc-300 transition-colors font-medium tracking-wide"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Similar Wallpapers */}
                      {similar.length > 0 && (
                        <div className="pb-8 lg:pb-0">
                          <h3 className="text-xs font-bold text-zinc-500 mb-4 uppercase tracking-widest">More like this</h3>
                          <div className="grid grid-cols-3 gap-2">
                            {similar.map(sim => (
                              <div 
                                key={sim._id} 
                                onClick={() => onSelectSimilar && onSelectSimilar(sim)}
                                className="aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-zinc-400 transition-all"
                              >
                                <img 
                                  src={sim.thumbnailUrl || sim.imageUrl} 
                                  alt={sim.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mockup Close Button */}
            <AnimatePresence>
              {showMockup && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                  exit={{ opacity: 0, y: 20 }}
                  onClick={() => setShowMockup(false)}
                  className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur-xl border border-white/10 rounded-full text-white text-sm font-medium shadow-2xl transition-all"
                >
                  Exit Preview
                </motion.button>
              )}
            </AnimatePresence>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WallpaperModal;
