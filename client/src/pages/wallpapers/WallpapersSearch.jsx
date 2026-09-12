import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SearchX, ArrowUp, ArrowDownWideNarrow } from 'lucide-react';
import WallpaperNav from '../../components/wallpapers/WallpaperNav';
import WallpaperGrid from '../../components/wallpapers/WallpaperGrid';
import WallpaperModal from '../../components/wallpapers/WallpaperModal';
import WallpaperSkeleton from '../../components/wallpapers/WallpaperSkeleton';
import { getPublicWallpapers } from '../../services/wallpaperService';

const WallpapersSearch = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [wallpapers, setWallpapers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!query) {
      setWallpapers([]);
      setTotalCount(0);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await getPublicWallpapers({ search: query, page: 1, limit: 30, sort: sortBy });
        if (res?.data?.wallpapers) {
          setWallpapers(res.data.wallpapers);
          setTotalCount(res.data.pagination.total || 0);
          setHasMore(res.data.pagination.current < res.data.pagination.pages);
          setPage(1);
        }
      } catch (error) {
        console.error("Error searching wallpapers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, sortBy]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !query) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getPublicWallpapers({ search: query, page: nextPage, limit: 30, sort: sortBy });
      
      if (res?.data?.wallpapers) {
        setWallpapers(prev => [...prev, ...res.data.wallpapers]);
        setPage(nextPage);
        setHasMore(res.data.pagination.current < res.data.pagination.pages);
      }
    } catch (error) {
      console.error("Error loading more search results:", error);
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
    <div className="min-h-screen bg-zinc-950 pt-28 sm:pt-32 pb-8 px-4 sm:px-6 lg:px-8 xl:px-8">
      <WallpaperNav activeTab="discover" initialSearchQuery={query} />
      
      {query ? (
        <div className="mb-6 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
            Results for "{query}" <span className="text-zinc-500 font-medium ml-2 text-sm sm:text-base">· {totalCount} wallpapers</span>
          </h1>
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 rounded-lg px-3 py-2 w-fit">
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
      ) : (
        <div className="flex flex-col justify-center items-center h-[50vh] text-center px-4 mt-6">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
            <SearchX size={32} className="text-zinc-500" />
          </div>
          <h3 className="text-xl font-bold text-zinc-200 mb-2 tracking-tight">Search Wallpapers</h3>
          <p className="text-zinc-500 max-w-sm mb-6">Enter a keyword above to find stunning wallpapers for your devices.</p>
        </div>
      )}

      {loading ? (
        <WallpaperSkeleton count={10} />
      ) : query && wallpapers.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-[50vh] text-center px-4">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
            <SearchX size={32} className="text-zinc-500" />
          </div>
          <h3 className="text-xl font-bold text-zinc-200 mb-2 tracking-tight">No wallpapers found</h3>
          <p className="text-zinc-500 max-w-sm mb-6">We couldn't find anything matching '{query}'. Try different keywords.</p>
          <Link 
            to="/wallpapers/albums"
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-full text-sm font-medium text-white transition-all active:scale-95 shadow-md"
          >
            Browse Albums
          </Link>
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

export default WallpapersSearch;
