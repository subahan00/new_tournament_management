import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadWallpaper } from '../../services/wallpaperService';

const WallpaperCard = ({ wallpaper, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  const w = wallpaper.resolution?.width || 3;
  const h = wallpaper.resolution?.height || 4;
  const bgColor = wallpaper.dominantColor || '#1a1a1a';

  const handleDownload = async (e) => {
    e.stopPropagation();
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

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl cursor-pointer lg:hover:scale-[1.02] transition-transform duration-300 w-full"
      style={{ aspectRatio: `${w}/${h}`, backgroundColor: bgColor, breakInside: 'avoid' }}
    >
      <img
        src={wallpaper.thumbnailUrl || wallpaper.imageUrl}
        alt={wallpaper.title}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
          loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-105'
        }`}
      />
      
      {/* Mobile: Gradient & Title always visible. Desktop: Fades in on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 p-3 lg:translate-y-4 lg:group-hover:translate-y-0 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 pointer-events-none flex items-end justify-between">
        <span className="text-xs font-medium text-white truncate max-w-[80%] drop-shadow-md">
          {wallpaper.title}
        </span>
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
