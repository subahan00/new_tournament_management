import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { triggerDownload } from '../../utils/downloadUtils';

const WallpaperCard = ({ wallpaper, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  const w = wallpaper.resolution?.width || 3;
  const h = wallpaper.resolution?.height || 4;
  const bgColor = wallpaper.dominantColor || '#1a1a1a';

  const handleDownload = (e) => {
    e.stopPropagation();
    triggerDownload(wallpaper);
  };

  const tinyUrl = wallpaper.imageUrl ? wallpaper.imageUrl.replace('/upload/', '/upload/w_10,c_scale,e_blur:200,q_auto,f_auto/') : '';

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer lg:hover:scale-[1.02] lg:hover:shadow-2xl lg:hover:shadow-black/50 transition-all duration-300 w-full bg-cover bg-center ${!loaded ? 'animate-pulse' : ''}`}
      style={{ 
        aspectRatio: `${w}/${h}`, 
        backgroundColor: bgColor,
        backgroundImage: !loaded && tinyUrl ? `url(${tinyUrl})` : 'none',
        breakInside: 'avoid' 
      }}
    >
      <img
        src={wallpaper.imageUrl ? wallpaper.imageUrl.replace('/upload/', '/upload/c_scale,w_600/q_auto:good,f_auto/') : wallpaper.thumbnailUrl}
        alt={wallpaper.title}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
          loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'
        }`}
      />
      
      {/* Top Left Category Badge */}
      {wallpaper.category && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] uppercase tracking-wider font-semibold opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
          {wallpaper.category}
        </div>
      )}

      {/* Smoother Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 p-3 lg:translate-y-4 lg:group-hover:translate-y-0 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 pointer-events-none flex flex-col justify-end gap-1">
        <span className="text-xs font-semibold text-zinc-100 truncate max-w-[80%] drop-shadow-md">
          {wallpaper.title}
        </span>
        {wallpaper.downloads > 10 && (
          <span className="text-[10px] text-zinc-300 flex items-center gap-1 font-medium">
            <Download size={10} /> {wallpaper.downloads}
          </span>
        )}
      </div>

      {/* Desktop Download Button */}
      <button
        onClick={handleDownload}
        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center opacity-0 lg:group-hover:opacity-100 hover:bg-white hover:scale-105 transition-all duration-300 z-10"
        title="Download"
      >
        <Download size={18} />
      </button>
    </div>
  );
};

export default WallpaperCard;
