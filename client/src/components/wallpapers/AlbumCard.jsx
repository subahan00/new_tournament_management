import React from 'react';

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const AlbumCard = ({ album, onClick }) => {
  const previews = album.previews || [];
  const displayPreviews = [...previews];
  
  // Pad with nulls up to 4 items
  while (displayPreviews.length < 4) {
    displayPreviews.push(null);
  }
  const top4 = displayPreviews.slice(0, 4);

  return (
    <div 
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-square bg-zinc-950 lg:hover:shadow-2xl lg:hover:shadow-black/50 transition-all duration-300"
    >
      <div className="grid grid-cols-2 grid-rows-2 gap-1 p-1 w-full h-full">
        {top4.map((src, idx) => (
          <div key={idx} className="w-full h-full bg-zinc-900 rounded-xl overflow-hidden">
            {src && (
              <img 
                src={src} 
                alt={`${album.name} preview ${idx + 1}`}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Dark overlay for text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none flex flex-col justify-end p-5">
        <h3 className="text-zinc-100 text-base font-semibold truncate tracking-tight">
          {capitalize(album.name)}
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5 font-medium">
          {album.count} {album.count === 1 ? 'wallpaper' : 'wallpapers'}
        </p>
      </div>

      {/* View Album Pill on Hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-sm font-medium border border-white/10 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          View Album &rarr;
        </div>
      </div>
    </div>
  );
};

export default AlbumCard;
