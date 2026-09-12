import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowUp, ArrowDownWideNarrow, FolderOpen } from 'lucide-react';
import WallpaperNav from '../../components/wallpapers/WallpaperNav';
import WallpaperGrid from '../../components/wallpapers/WallpaperGrid';
import WallpaperModal from '../../components/wallpapers/WallpaperModal';
import WallpaperSkeleton from '../../components/wallpapers/WallpaperSkeleton';
import { getPublicWallpapers } from '../../services/wallpaperService';

const WallpapersAlbumView = () => {
  const { tag } = useParams();
  const decodedTag = tag ? decodeURIComponent(tag) : '';
  const navigate = useNavigate();
  
  const [wallpapers, setWallpapers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const albumName = capitalize(decodedTag);

  useEffect(() => {
    if (!decodedTag) return;

    const fetchWallpapers = async () => {
      setLoading(true);
      try {
        const res = await getPublicWallpapers({ tag: decodedTag, page: 1, limit: 30, sort: sortBy });
        if (res?.data?.wallpapers) {
          setWallpapers(res.data.wallpapers);
          setTotalCount(res.data.pagination.total || 0);
          setHasMore(res.data.pagination.current < res.data.pagination.pages);
          setPage(1);
        }
      } catch (error) {
        console.error("Error fetching album wallpapers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallpapers();
  }, [decodedTag, sortBy]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !decodedTag) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getPublicWallpapers({ tag: decodedTag, page: nextPage, limit: 30, sort: sortBy });
      
      if (res?.data?.wallpapers) {
        setWallpapers(prev => [...prev, ...res.data.wallpapers]);
        setPage(nextPage);
        setHasMore(res.data.pagination.current < res.data.pagination.pages);
      }
    } catch (error) {
      console.error("Error loading more album wallpapers:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleNext = useCallback(() => {
    if (!selectedWallpaper) return;
    const idx = wallpapers.findIndex(w => w._id === selectedWallpaper._id);
    if (idx !== -1 && idx < wallpapers.length - 1) setSelectedWallpaper(wallpapers[idx + 1]);
  }, [selectedWallpaper, wallpapers]);

  const handlePrev = useCallback(() => {
    if (!selectedWallpaper) return;
    const idx = wallpapers.findIndex(w => w._id === selectedWallpaper._id);
    if (idx > 0) setSelectedWallpaper(wallpapers[idx - 1]);
  }, [selectedWallpaper, wallpapers]);

  const { hasNext, hasPrev } = React.useMemo(() => {
    if (!selectedWallpaper) return { hasNext: false, hasPrev: false };
    const idx = wallpapers.findIndex(w => w._id === selectedWallpaper._id);
    return {
      hasNext: idx !== -1 && idx < wallpapers.length - 1,
      hasPrev: idx > 0
    };
  }, [selectedWallpaper, wallpapers]);

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 sm:pt-32 pb-8 px-4 sm:px-6 lg:px-8">
      <WallpaperNav activeTab="albums" />
      
      <div className="mb-6 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/wallpapers/albums')}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
            aria-label="Back to albums"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-baseline gap-2 tracking-tight">
              {albumName}
              {totalCount > 0 && (
                <span className="text-sm font-medium text-zinc-500 tracking-normal">· {totalCount} wallpapers</span>
              )}
            </h1>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 rounded-lg px-3 py-2 w-fit shrink-0">
          <ArrowDownWideNarrow size={16} className="text-zinc-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-sm font-medium text-zinc-300 focus:outline-none appearance-none cursor-pointer pr-4"
          >
            <option value="newest" className="bg-zinc-900">Newest</option>
            <option value="popular" className="bg-zinc-900">Most Downloaded</option>
            <option value="liked" className="bg-zinc-900">Most Liked</option>
          </select>
        </div>
      </div>

      {loading ? (
        <WallpaperSkeleton count={10} />
      ) : wallpapers.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-[50vh] text-center px-4">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
            <FolderOpen size={32} className="text-zinc-500" />
          </div>
          <h3 className="text-xl font-bold text-zinc-200 mb-2 tracking-tight">Album is empty</h3>
          <p className="text-zinc-500 max-w-sm mb-6">There are currently no wallpapers in this album.</p>
          <button 
            onClick={() => navigate('/wallpapers/albums')}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-full text-sm font-medium text-white transition-all active:scale-95 shadow-md"
          >
            Back to Albums
          </button>
        </div>
      ) : (
        <WallpaperGrid 
          wallpapers={wallpapers} 
          onLoadMore={handleLoadMore} 
          hasMore={hasMore}
          loadingMore={loadingMore}
          onWallpaperClick={setSelectedWallpaper}
        />
      )}

      {selectedWallpaper && (
        <WallpaperModal 
          wallpaper={selectedWallpaper} 
          onClose={() => setSelectedWallpaper(null)}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onSelectSimilar={(sim) => setSelectedWallpaper(sim)} 
        />
      )}

      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 hover:scale-105 shadow-xl transition-all z-50"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default WallpapersAlbumView;
