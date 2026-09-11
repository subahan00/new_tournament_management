import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Heart, Layers, Share2, ChevronLeft, ChevronRight, Check, Smartphone, Lock } from 'lucide-react';
import { downloadWallpaper, likeWallpaper, getSimilarWallpapers } from '../../services/wallpaperService';
import { useNavigate } from 'react-router-dom';

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
      getSimilarWallpapers(wallpaper._id)
        .then(res => setSimilar(res.data))
        .catch(console.error);
    } else {
      document.body.style.overflow = 'auto';
    }
    
    const handleKeydown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeydown);
    
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [wallpaper, onClose, onNext, onPrev, hasNext, hasPrev]);

  const onTouchStartEvent = (e) => {
    if (showMockup) return; // disable swipe during mockup to prevent accidental touches
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

  const handleDownload = async () => {
    if (!wallpaper) return;
    try {
      await downloadWallpaper(wallpaper._id);
      const optimizedUrl = wallpaper.imageUrl.replace('/upload/', '/upload/q_auto:best,f_auto/');
      const response = await fetch(optimizedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = blob.type.split('/')[1] || 'jpg';
      a.download = `wallpaper-${wallpaper.title.replace(/\s+/g, '-').toLowerCase()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleLike = async () => {
    if (!wallpaper) return;
    try {
      await likeWallpaper(wallpaper._id);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/wallpapers?id=${wallpaper._id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
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
          <div
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl cursor-zoom-out"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full h-full lg:h-[95vh] lg:max-w-[90vw] xl:max-w-[85vw] lg:rounded-2xl bg-black overflow-hidden shadow-2xl flex flex-col lg:flex-row"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-[60] w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 backdrop-blur-md transition-all border border-white/10"
            >
              <X size={20} />
            </button>

            {/* Navigation Arrows */}
            {hasPrev && !showMockup && (
              <button 
                onClick={onPrev}
                className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-md transition-all border border-white/10"
              >
                <ChevronLeft size={28} />
              </button>
            )}
            {hasNext && !showMockup && (
              <button 
                onClick={onNext}
                className="hidden lg:flex absolute right-4 lg:right-auto lg:left-[calc(100%-28rem)] xl:left-[calc(100%-30rem)] top-1/2 -translate-y-1/2 z-[60] w-12 h-12 items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-md transition-all border border-white/10"
                style={{ right: '1rem' }}
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* Immersive Image Section with Mockup Support */}
            <div 
              className="absolute inset-0 lg:static flex-1 bg-black flex items-center justify-center p-0 lg:p-4 z-0"
              onTouchStart={onTouchStartEvent}
              onTouchMove={onTouchMoveEvent}
              onTouchEnd={onTouchEndEvent}
            >
              <div 
                className={`relative transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden ${
                  showMockup 
                    ? 'w-full h-full lg:w-[400px] lg:h-[850px] max-h-[95vh] lg:rounded-[3rem] lg:border-[8px] border-zinc-900 shadow-2xl' 
                    : 'w-full h-full'
                }`}
              >
                <img
                  key={wallpaper._id}
                  src={wallpaper.imageUrl.replace('/upload/', '/upload/q_auto:best,f_auto/')}
                  alt={wallpaper.title}
                  className={`w-full h-full transition-all duration-500 animate-fadeIn ${showMockup ? 'object-cover' : 'object-contain'}`}
                  style={{ backgroundColor: wallpaper.dominantColor || '#0a0a0a' }}
                />

                {/* Lock Screen Mockup Overlay */}
                <AnimatePresence>
                  {showMockup && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { delay: 0.2 } }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      className="absolute inset-0 pointer-events-none flex flex-col items-center pt-16 lg:pt-20 text-white"
                      style={{ textShadow: '0px 2px 16px rgba(0,0,0,0.4), 0px 0px 4px rgba(0,0,0,0.6)' }}
                    >
                      <Lock size={22} className="mb-4 opacity-90" />
                      <div className="text-[5.5rem] leading-none font-medium tracking-tight font-sans">
                        {timeStr}
                      </div>
                      <div className="text-xl font-medium tracking-wide mt-1">
                        {dateStr}
                      </div>
                      
                      <div className="absolute bottom-4 w-32 h-1.5 bg-white/60 backdrop-blur-md rounded-full shadow-lg" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Invisible overlay for swiping on mobile */}
              {!showMockup && <div className="absolute inset-0 z-10 lg:hidden" />}
            </div>

            {/* Glassmorphic Info Panel (Floating on Desktop, Bottom Sheet on Mobile) */}
            <AnimatePresence>
              {!showMockup && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="absolute bottom-0 left-0 right-0 lg:relative lg:w-96 xl:w-[28rem] z-50 flex flex-col max-h-[80vh] lg:max-h-full"
                >
                  <div className="w-full h-full bg-zinc-950/80 lg:bg-zinc-900/40 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-none">
                    <div className="w-full flex justify-center py-3 lg:hidden">
                      <div className="w-12 h-1.5 rounded-full bg-white/20" />
                    </div>

                    <div className="p-6 lg:p-8 overflow-y-auto flex-1 wallpaper-scrollbar">
                      
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h2 className="text-2xl font-bold text-white leading-tight pr-4 drop-shadow-md">{wallpaper.title}</h2>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowMockup(true)}
                            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0"
                            title="Preview Lock Screen"
                          >
                            <Smartphone size={18} />
                          </button>
                          <button 
                            onClick={handleShare}
                            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0"
                            title="Share Link"
                          >
                            {copied ? <Check size={18} className="text-green-400" /> : <Share2 size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-8 font-medium">
                        {wallpaper.resolution && (
                          <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                            <Layers size={14} />
                            {wallpaper.resolution.width} × {wallpaper.resolution.height}
                          </span>
                        )}
                        {wallpaper.fileSize && (
                          <span className="bg-white/5 px-2 py-1 rounded-md">{formatFileSize(wallpaper.fileSize)}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-3 mb-10">
                        <button
                          onClick={handleDownload}
                          className="w-full py-3.5 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                        >
                          <Download size={20} />
                          Download Free
                        </button>
                        <button
                          onClick={handleLike}
                          className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] border border-white/5"
                        >
                          <Heart size={20} className="text-zinc-400" />
                          Like
                          {wallpaper.likes !== undefined && <span className="ml-1 text-white/50">{wallpaper.likes}</span>}
                        </button>
                      </div>

                      {/* Tags */}
                      {wallpaper.tags && wallpaper.tags.length > 0 && (
                        <div className="mb-10">
                          <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">Related Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {wallpaper.tags.map(tag => (
                              <button
                                key={tag}
                                onClick={() => handleTagClick(tag)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-white/80 transition-colors"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Similar Wallpapers */}
                      {similar.length > 0 && (
                        <div className="pb-8">
                          <h3 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wider">More like this</h3>
                          <div className="grid grid-cols-3 gap-3">
                            {similar.map(sim => (
                              <div 
                                key={sim._id} 
                                onClick={() => onSelectSimilar && onSelectSimilar(sim)}
                                className="aspect-[3/4] bg-white/5 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/50 transition-all"
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

            {/* Mockup Close/Exit Button for Mobile */}
            <AnimatePresence>
              {showMockup && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                  exit={{ opacity: 0, y: 20 }}
                  onClick={() => setShowMockup(false)}
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/20 rounded-full text-white font-medium shadow-2xl transition-colors"
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
