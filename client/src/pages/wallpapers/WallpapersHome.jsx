import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import WallpaperNav from '../../components/wallpapers/WallpaperNav';
import WallpaperGrid from '../../components/wallpapers/WallpaperGrid';
import WallpaperModal from '../../components/wallpapers/WallpaperModal';
import WallpaperSkeleton from '../../components/wallpapers/WallpaperSkeleton';
import { getDiscoverWallpapers, getWallpaperTags } from '../../services/wallpaperService';

const WallpapersHome = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [tags, setTags] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const navigate = useNavigate();

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
          getDiscoverWallpapers(seed, 1, 30)
        ]);
        
        if (tagsRes?.data) setTags(tagsRes.data);
        if (wpRes?.data?.wallpapers) {
          setWallpapers(wpRes.data.wallpapers);
          setHasMore(wpRes.data.pagination.current < wpRes.data.pagination.pages);
        }
      } catch (error) {
        console.error("Error fetching initial wallpapers:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
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
      const res = await getDiscoverWallpapers(seed, nextPage, 30);
      
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

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 sm:pt-32 pb-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <WallpaperNav activeTab="discover" />
      
      {tags.length > 0 && (
        <div className="mb-6 overflow-x-auto scrollbar-hide flex gap-2 py-3">
          {tags.map((tagObj) => (
            <button
              key={tagObj._id}
              onClick={() => navigate(`/wallpapers/search?q=${encodeURIComponent(tagObj._id)}`)}
              className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              {tagObj._id}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <WallpaperSkeleton count={10} />
      ) : wallpapers.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-zinc-500">No wallpapers yet</p>
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
