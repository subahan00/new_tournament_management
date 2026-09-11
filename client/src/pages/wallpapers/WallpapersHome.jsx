import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowUp, Monitor, Smartphone, Grid } from 'lucide-react';
import WallpaperNav from '../../components/wallpapers/WallpaperNav';
import WallpaperGrid from '../../components/wallpapers/WallpaperGrid';
import WallpaperModal from '../../components/wallpapers/WallpaperModal';
import WallpaperSkeleton from '../../components/wallpapers/WallpaperSkeleton';
import { getDiscoverWallpapers, getWallpaperTags, getWallpaperById } from '../../services/wallpaperService';

const WallpapersHome = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [tags, setTags] = useState([]);
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
      // Remove id from URL so refreshing doesn't pop it up again
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
        const [tagsRes, wpRes] = await Promise.all([
          getWallpaperTags(),
          getDiscoverWallpapers(seed, 1, 30, orientation)
        ]);
        
        if (tagsRes?.data) setTags(tagsRes.data);
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
  }, [orientation]);
  
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const seed = sessionStorage.getItem('wp_discover_seed');
      const nextPage = page + 1;
      const res = await getDiscoverWallpapers(seed, nextPage, 30, orientation);
      
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
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = useCallback(() => {
    if (!selectedWallpaper) return;
    const idx = wallpapers.findIndex(w => w._id === selectedWallpaper._id);
    if (idx !== -1 && idx < wallpapers.length - 1) {
      setSelectedWallpaper(wallpapers[idx + 1]);
    }
  }, [selectedWallpaper, wallpapers]);

  const handlePrev = useCallback(() => {
    if (!selectedWallpaper) return;
    const idx = wallpapers.findIndex(w => w._id === selectedWallpaper._id);
    if (idx > 0) {
      setSelectedWallpaper(wallpapers[idx - 1]);
    }
  }, [selectedWallpaper, wallpapers]);

  const hasNext = selectedWallpaper && wallpapers.findIndex(w => w._id === selectedWallpaper._id) < wallpapers.length - 1;
  const hasPrev = selectedWallpaper && wallpapers.findIndex(w => w._id === selectedWallpaper._id) > 0;

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 sm:pt-32 pb-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <WallpaperNav activeTab="discover" />
      
      {/* Filters and Tags */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex bg-zinc-900 rounded-xl p-1 shrink-0 w-fit">
          <button 
            onClick={() => setOrientation('all')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${orientation === 'all' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
          >
            <Grid size={16} /> All
          </button>
          <button 
            onClick={() => setOrientation('portrait')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${orientation === 'portrait' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
          >
            <Smartphone size={16} /> Mobile
          </button>
          <button 
            onClick={() => setOrientation('landscape')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${orientation === 'landscape' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
          >
            <Monitor size={16} /> Desktop
          </button>
        </div>

        {tags.length > 0 && (
          <div className="overflow-x-auto scrollbar-hide flex gap-2 sm:max-w-[50%] lg:max-w-2xl">
            {tags.map((tagObj) => (
              <button
                key={tagObj._id}
                onClick={() => navigate(`/wallpapers/search?q=${encodeURIComponent(tagObj._id)}`)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                {tagObj._id}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <WallpaperSkeleton count={10} />
      ) : wallpapers.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-zinc-500">No wallpapers yet for this filter</p>
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
