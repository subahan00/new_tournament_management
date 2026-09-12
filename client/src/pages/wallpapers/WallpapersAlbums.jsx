import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUp, FolderSearch } from 'lucide-react';
import WallpaperNav from '../../components/wallpapers/WallpaperNav';
import AlbumCard from '../../components/wallpapers/AlbumCard';
import { getAlbums } from '../../services/wallpaperService';

const WallpapersAlbums = () => {
  const [albums, setAlbums] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchInitialAlbums = async () => {
      setLoading(true);
      try {
        const res = await getAlbums(1, 24, debouncedSearch);
        if (res?.data?.albums) {
          setAlbums(res.data.albums);
          setHasMore(res.data.pagination.current < res.data.pagination.pages);
          setPage(1);
        }
      } catch (error) {
        console.error("Error fetching albums:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialAlbums();
  }, [debouncedSearch]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getAlbums(nextPage, 24, debouncedSearch);
      
      if (res?.data?.albums) {
        setAlbums(prev => [...prev, ...res.data.albums]);
        setPage(nextPage);
        setHasMore(res.data.pagination.current < res.data.pagination.pages);
      }
    } catch (error) {
      console.error("Error loading more albums:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, debouncedSearch]);
  
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        handleLoadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleLoadMore]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 sm:pt-32 pb-8 px-4 sm:px-6 lg:px-8">
      <WallpaperNav activeTab="albums" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">Browse Albums</h1>
        
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 text-zinc-200 text-sm rounded-full focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 block pl-10 p-2.5 transition-all outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 xl:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-900 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-[50vh] text-center px-4">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
            <FolderSearch size={32} className="text-zinc-500" />
          </div>
          <h3 className="text-xl font-bold text-zinc-200 mb-2 tracking-tight">No albums found</h3>
          <p className="text-zinc-500 max-w-sm">
            {debouncedSearch ? `No albums match "${debouncedSearch}". Try a different keyword.` : "There are currently no albums available."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 xl:gap-5 mb-8">
          {albums.map((album, idx) => (
            <AlbumCard 
              key={album.name || idx} 
              album={album} 
              onClick={() => navigate(`/wallpapers/albums/${encodeURIComponent(album.name)}`)}
            />
          ))}
        </div>
      )}
      
      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin"></div>
        </div>
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

export default WallpapersAlbums;
