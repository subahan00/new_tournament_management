import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
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

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const albumName = capitalize(decodedTag);

  useEffect(() => {
    if (!decodedTag) return;

    const fetchWallpapers = async () => {
      setLoading(true);
      try {
        const res = await getPublicWallpapers({ tag: decodedTag, page: 1, limit: 30 });
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
  }, [decodedTag]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !decodedTag) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getPublicWallpapers({ tag: decodedTag, page: nextPage, limit: 30 });
      
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

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 sm:pt-32 pb-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <WallpaperNav activeTab="albums" />
      
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate('/wallpapers/albums')}
          className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          aria-label="Back to albums"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-baseline gap-2">
            {albumName}
            {totalCount > 0 && (
              <span className="text-sm font-normal text-zinc-500">{totalCount} wallpapers</span>
            )}
          </h1>
        </div>
      </div>

      {loading ? (
        <WallpaperSkeleton count={10} />
      ) : wallpapers.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-zinc-500">No wallpapers found in this album</p>
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

export default WallpapersAlbumView;
