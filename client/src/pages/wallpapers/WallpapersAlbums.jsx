import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
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
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        handleLoadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleLoadMore]);

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 sm:pt-32 pb-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <WallpaperNav activeTab="albums" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Albums</h1>
        
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pl-10 p-2.5 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-900 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-zinc-500">
            {debouncedSearch ? `No albums found for "${debouncedSearch}"` : "No albums yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
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
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default WallpapersAlbums;
