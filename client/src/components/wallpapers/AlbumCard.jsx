import React from 'react';

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const AlbumCard = ({ album, onClick }) => {
  const previews = album.previews || [];
  
  // We need at least 3 previews for a good stack, fallback to the first one if we don't have enough
  const p1 = previews[0];
  const p2 = previews[1] || p1;
  const p3 = previews[2] || p1;

  return (
    <div 
      onClick={onClick}
      className="group relative cursor-pointer aspect-[4/5] flex items-end justify-center pb-2 pt-6 px-4"
    >
      {/* Background Card 2 (Left) */}
      <div className="absolute w-[75%] h-[80%] top-6 left-[5%] bg-zinc-800 rounded-xl overflow-hidden shadow-lg -rotate-6 lg:group-hover:-rotate-12 lg:group-hover:-translate-x-4 transition-all duration-300 opacity-60 border border-white/5">
        {p3 && <img src={p3} alt="" className="w-full h-full object-cover" loading="lazy" />}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Background Card 1 (Right) */}
      <div className="absolute w-[75%] h-[80%] top-6 right-[5%] bg-zinc-800 rounded-xl overflow-hidden shadow-lg rotate-6 lg:group-hover:rotate-12 lg:group-hover:translate-x-4 transition-all duration-300 opacity-80 border border-white/5">
        {p2 && <img src={p2} alt="" className="w-full h-full object-cover" loading="lazy" />}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Main Front Card */}
      <div className="relative w-[85%] h-[85%] z-10 bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl lg:group-hover:-translate-y-4 transition-transform duration-300 border border-white/10 ring-1 ring-black/50">
        {p1 ? (
          <img 
            src={p1.replace('/upload/', '/upload/c_scale,w_400/q_auto:good,f_auto/')} 
            alt={album.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none flex flex-col justify-end p-5">
          <h3 className="text-white text-lg font-bold truncate drop-shadow-md">
            {capitalize(album.name)}
          </h3>
          <p className="text-sm font-medium text-zinc-300 mt-1 drop-shadow-md">
            {album.count} {album.count === 1 ? 'wallpaper' : 'wallpapers'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlbumCard;
