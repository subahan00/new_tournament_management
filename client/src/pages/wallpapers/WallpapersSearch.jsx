import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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

  useEffect(() => {
    if (!query) {
      setWallpapers([]);
      setTotalCount(0);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await getPublicWallpapers({ search: query, page: 1, limit: 30 });
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
  }, [query]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !query) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getPublicWallpapers({ search: query, page: nextPage, limit: 30 });
      
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

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 sm:pt-32 pb-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <WallpaperNav activeTab="discover" initialSearchQuery={query} />
      
      {query ? (
        <div className="mb-6">
          <h1 className="text-lg sm:text-xl font-semibold text-zinc-100">
            Results for "{query}" <span className="text-zinc-500 font-normal ml-2 text-sm sm:text-base">· {totalCount} wallpapers</span>
          </h1>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-zinc-500 text-lg">Enter a search term to find wallpapers</p>
        </div>
      )}

      {loading ? (
        <WallpaperSkeleton count={10} />
      ) : query && wallpapers.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <p className="text-zinc-400 text-lg">No wallpapers found for '{query}'</p>
          <p className="text-zinc-500">
            Try different keywords or browse <Link to="/wallpapers/albums" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">Albums</Link>
          </p>
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
    </div>
  );
};

export default WallpapersSearch;
