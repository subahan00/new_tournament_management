import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Heart, Layers, Share2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
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
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

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
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveEvent = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
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
            {hasPrev && (
              <button 
                onClick={onPrev}
                className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-md transition-all border border-white/10"
              >
                <ChevronLeft size={28} />
              </button>
            )}
            {hasNext && (
              <button 
                onClick={onNext}
                className="hidden lg:flex absolute right-4 lg:right-auto lg:left-[calc(100%-28rem)] xl:left-[calc(100%-30rem)] top-1/2 -translate-y-1/2 z-[60] w-12 h-12 items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-md transition-all border border-white/10"
                style={{ right: '1rem' }} /* Fallback, but we want it near the edge. Actually, let's keep arrows at the true edges of the image container! */
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* Immersive Image Section */}
            <div 
              className="absolute inset-0 lg:static flex-1 bg-black flex items-center justify-center p-0 lg:p-4 z-0"
              onTouchStart={onTouchStartEvent}
              onTouchMove={onTouchMoveEvent}
              onTouchEnd={onTouchEndEvent}
            >
              <img
                key={wallpaper._id}
                src={wallpaper.imageUrl.replace('/upload/', '/upload/q_auto:best,f_auto/')}
                alt={wallpaper.title}
                className="w-full h-full object-contain animate-fadeIn"
                style={{ backgroundColor: wallpaper.dominantColor || '#0a0a0a' }}
              />
              
              {/* Invisible overlay for swiping on mobile */}
              <div className="absolute inset-0 z-10 lg:hidden" />
            </div>

            {/* Glassmorphic Info Panel (Floating on Desktop, Bottom Sheet on Mobile) */}
            <div className="absolute bottom-0 left-0 right-0 lg:relative lg:w-96 xl:w-[28rem] z-50 flex flex-col max-h-[80vh] lg:max-h-full">
              
              {/* The Panel Background */}
              <div className="w-full h-full bg-zinc-950/80 lg:bg-zinc-900/40 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-none">
                
                {/* Drag handle for mobile (visual only) */}
                <div className="w-full flex justify-center py-3 lg:hidden">
                  <div className="w-12 h-1.5 rounded-full bg-white/20" />
                </div>

                <div className="p-6 lg:p-8 overflow-y-auto flex-1 wallpaper-scrollbar">
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-2xl font-bold text-white leading-tight pr-4 drop-shadow-md">{wallpaper.title}</h2>
                    <button 
                      onClick={handleShare}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0"
                      title="Share Link"
                    >
                      {copied ? <Check size={18} className="text-green-400" /> : <Share2 size={18} />}
                    </button>
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WallpaperModal;
