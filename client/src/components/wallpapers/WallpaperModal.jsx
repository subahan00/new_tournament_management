import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Heart, Layers } from 'lucide-react';
import { downloadWallpaper, likeWallpaper } from '../../services/wallpaperService';
import { useNavigate } from 'react-router-dom';

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const WallpaperModal = ({ wallpaper, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (wallpaper) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [wallpaper, onClose]);

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
      // Optional: Add some visual feedback for liking
    } catch (err) {
      console.error('Like failed:', err);
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
            className="absolute inset-0 bg-black/95 backdrop-blur-sm cursor-zoom-out"
          />
          
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="relative w-full h-full lg:h-[90vh] lg:max-w-6xl lg:rounded-2xl bg-zinc-950 flex flex-col lg:flex-row overflow-hidden shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Image Section */}
            <div className="flex-1 relative bg-black/50 flex items-center justify-center overflow-hidden p-0 lg:p-8">
              <img
                src={wallpaper.imageUrl}
                alt={wallpaper.title}
                className="w-full h-full object-contain"
                style={{ backgroundColor: wallpaper.dominantColor || '#1a1a1a' }}
              />
            </div>

            {/* Info Section */}
            <div className="w-full lg:w-96 bg-zinc-900 flex flex-col shrink-0">
              <div className="p-6 overflow-y-auto flex-1 wallpaper-scrollbar">
                <h2 className="text-xl font-bold text-zinc-100 mb-2">{wallpaper.title}</h2>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-6">
                  {wallpaper.resolution && (
                    <span className="flex items-center gap-1">
                      <Layers size={14} />
                      {wallpaper.resolution.width} x {wallpaper.resolution.height}
                    </span>
                  )}
                  {wallpaper.fileSize && (
                    <span>{formatFileSize(wallpaper.fileSize)}</span>
                  )}
                  {wallpaper.downloads !== undefined && (
                    <span className="flex items-center gap-1">
                      <Download size={14} />
                      {wallpaper.downloads}
                    </span>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors duration-200"
                  >
                    <Download size={20} />
                    Download Wallpaper
                  </button>
                  <button
                    onClick={handleLike}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors duration-200"
                  >
                    <Heart size={20} className="text-zinc-400" />
                    Like
                    {wallpaper.likes !== undefined && <span className="ml-1 text-zinc-500">({wallpaper.likes})</span>}
                  </button>
                </div>

                {wallpaper.tags && wallpaper.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {wallpaper.tags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className="px-3 py-1 bg-zinc-800/50 hover:bg-zinc-700 rounded-full text-xs text-zinc-300 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WallpaperModal;
