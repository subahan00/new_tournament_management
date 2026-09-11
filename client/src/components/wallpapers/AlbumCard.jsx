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
      className="group relative rounded-xl overflow-hidden cursor-pointer aspect-square bg-zinc-900 lg:hover:scale-[1.03] transition-transform duration-300"
    >
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full">
        {top4.map((src, idx) => (
          <div key={idx} className="w-full h-full bg-zinc-800">
            {src && (
              <img 
                src={src} 
                alt={`${album.name} preview ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none flex flex-col justify-end p-4">
        <h3 className="text-white text-sm font-semibold truncate">
          {capitalize(album.name)}
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          {album.count} {album.count === 1 ? 'wallpaper' : 'wallpapers'}
        </p>
      </div>
    </div>
  );
};

export default AlbumCard;
