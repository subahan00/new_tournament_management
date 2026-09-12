import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowUp, Monitor, Smartphone, Grid } from 'lucide-react';
import WallpaperNav from '../../components/wallpapers/WallpaperNav';
import WallpaperGrid from '../../components/wallpapers/WallpaperGrid';
import WallpaperModal from '../../components/wallpapers/WallpaperModal';
import WallpaperSkeleton from '../../components/wallpapers/WallpaperSkeleton';
import { getDiscoverWallpapers, getWallpaperCategories, getWallpaperById } from '../../services/wallpaperService';

const WallpapersHome = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [orientation, setOrientation] = useState('all');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      getWallpaperById(id).then(res => {
        if(res.data) setSelectedWallpaper(res.data);
      }).catch(err => console.error("Error fetching shared wallpaper:", err));
      navigate('/wallpapers', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    let seed = sessionStorage.getItem('wp_discover_seed');
    if (!seed) {
      seed = Math.floor(Math.random() * 99999) + 1;
      sessionStorage.setItem('wp_discover_seed', seed);
    }
    
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [catsRes, wpRes] = await Promise.all([
          getWallpaperCategories(),
          getDiscoverWallpapers(seed, 1, 30, orientation, activeCategory !== 'all' ? activeCategory : undefined)
        ]);
        
        if (catsRes?.data) setCategories(catsRes.data);
        if (wpRes?.data?.wallpapers) {
          setWallpapers(wpRes.data.wallpapers);
          setPage(1);
          setHasMore(wpRes.data.pagination.current < wpRes.data.pagination.pages);
        }
      } catch (error) {
        console.error("Error fetching initial wallpapers:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [orientation, activeCategory]);
  
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const seed = sessionStorage.getItem('wp_discover_seed');
      const nextPage = page + 1;
      const res = await getDiscoverWallpapers(seed, nextPage, 30, orientation, activeCategory !== 'all' ? activeCategory : undefined);
      
      if (res?.data?.wallpapers) {
        setWallpapers(prev => [...prev, ...res.data.wallpapers]);
        setPage(nextPage);
        setHasMore(res.data.pagination.current < res.data.pagination.pages);
      }
    } catch (error) {
      console.error("Error loading more wallpapers:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, orientation, activeCategory]);

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
    <div className="min-h-screen bg-zinc-950 pt-28 sm:pt-32 pb-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <WallpaperNav activeTab="discover" />
      
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 mt-6">
        
        {/* Orientation Tabs */}
        <div className="flex bg-zinc-900 rounded-xl p-1 shrink-0 w-fit border border-white/5">
          <button 
            onClick={() => setOrientation('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${orientation === 'all' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Grid size={16} /> All
          </button>
          <button 
            onClick={() => setOrientation('portrait')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${orientation === 'portrait' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Smartphone size={16} /> Mobile
          </button>
          <button 
            onClick={() => setOrientation('landscape')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${orientation === 'landscape' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Monitor size={16} /> Desktop
          </button>
        </div>

        {/* Categories Row (Edge fading) */}
        {categories.length > 0 && (
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide flex gap-2 pb-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap shrink-0 border ${
                  activeCategory === 'all'
                    ? 'bg-zinc-200 text-zinc-900 border-zinc-200 shadow-md'
                    : 'bg-zinc-900 text-zinc-400 border-white/5 hover:bg-zinc-800'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap shrink-0 border ${
                    activeCategory === cat._id
                      ? 'bg-zinc-200 text-zinc-900 border-zinc-200 shadow-md'
                      : 'bg-zinc-900 text-zinc-400 border-white/5 hover:bg-zinc-800'
                  }`}
                >
                  <span className="capitalize">{cat._id}</span>
                  <span className="ml-2 text-[10px] opacity-60 font-mono">{cat.count}</span>
                </button>
              ))}
            </div>
            {/* Gradient masks for smooth scrolling edge fade */}
            <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
          </div>
        )}
      </div>

      {loading ? (
        <WallpaperSkeleton count={10} />
      ) : wallpapers.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-[50vh] text-center px-4">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
            <Grid size={32} className="text-zinc-500" />
          </div>
          <h3 className="text-xl font-bold text-zinc-200 mb-2 tracking-tight">No wallpapers found</h3>
          <p className="text-zinc-500 max-w-sm mb-6">We couldn't find any wallpapers matching these filters. Try clearing some to see more results.</p>
          <button 
            onClick={() => { setOrientation('all'); setActiveCategory('all'); }}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium text-white transition-all active:scale-95"
          >
            Clear Filters
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
          className="fixed bottom-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/80 text-zinc-300 border border-white/10 hover:bg-zinc-700 transition-colors z-50"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default WallpapersHome;
