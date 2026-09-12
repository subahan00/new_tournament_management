import React, { useState, useEffect, useCallback } from 'react';
import { getAllWallpapersAdmin, deleteWallpaper } from '../services/wallpaperService.js';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, CheckSquare, Square } from 'lucide-react';
import { triggerToast } from '../components/ui/Toast';

const DeleteWallpaper = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [selectedWallpapers, setSelectedWallpapers] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const fetchWallpapers = useCallback(async (page, sortOrder) => {
    setLoading(true);
    try {
      const response = await getAllWallpapersAdmin(page, 30);
      let fetchedWallpapers = response.data.wallpapers || [];

      if (sortOrder === 'oldest') {
        fetchedWallpapers.reverse();
      }

      setWallpapers(fetchedWallpapers);
      setTotalPages(response.data.pagination.pages || 1);
    } catch (err) {
      triggerToast('Failed to fetch wallpapers', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallpapers(currentPage, sortBy);
  }, [currentPage, sortBy, fetchWallpapers]);

  const handleSelectWallpaper = (id) => {
    setSelectedWallpapers(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedWallpapers.size === wallpapers.length) {
      setSelectedWallpapers(new Set());
    } else {
      setSelectedWallpapers(new Set(wallpapers.map(w => w._id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedWallpapers.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedWallpapers.size} wallpaper(s)? This action is irreversible.`)) return;

    setLoading(true);
    const wallpaperIds = Array.from(selectedWallpapers);
    const results = await Promise.allSettled(
      wallpaperIds.map(id => deleteWallpaper(id))
    );

    const successfulDeletes = results.filter(res => res.status === 'fulfilled').length;
    if (successfulDeletes > 0) {
      triggerToast(`${successfulDeletes} wallpaper(s) deleted`, 'success');
    }

    const failedDeletes = results.filter(res => res.status === 'rejected').length;
    if (failedDeletes > 0) {
      triggerToast(`${failedDeletes} deletions failed`, 'error');
    }

    setSelectedWallpapers(new Set());
    fetchWallpapers(currentPage, sortBy);
  };

  return (
    <div className="p-4 md:p-8 font-sans bg-zinc-950 min-h-screen text-zinc-200">
      <div className="mb-8">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] shadow-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2 tracking-tight">
          Manage Wallpapers
        </h1>
        <p className="text-zinc-500 mb-8">Select wallpapers to permanently delete them from the database and Cloudinary.</p>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 p-4 bg-zinc-900 border border-white/5 rounded-xl shadow-lg gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <label htmlFor="sort-by" className="mr-2 text-zinc-400 font-medium text-sm">Sort:</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-zinc-950 border border-white/10 rounded-lg shadow-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm text-zinc-200 py-1.5 px-3 outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            
            {wallpapers.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {selectedWallpapers.size === wallpapers.length ? <CheckSquare size={16} /> : <Square size={16} />}
                Select All on Page
              </button>
            )}
          </div>

          <button
            onClick={handleDeleteSelected}
            disabled={selectedWallpapers.size === 0 || loading}
            className={`w-full sm:w-auto px-5 py-2 text-white font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 ${
              selectedWallpapers.size > 0 && !loading
                ? 'bg-rose-600 hover:bg-rose-500 active:scale-95'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <Trash2 size={16} />
            {loading ? 'Processing...' : `Delete (${selectedWallpapers.size})`}
          </button>
        </div>

        {loading && wallpapers.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : wallpapers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {wallpapers.map((wallpaper) => (
              <div
                key={wallpaper._id}
                className={`relative flex flex-col gap-2 cursor-pointer group`}
                onClick={() => handleSelectWallpaper(wallpaper._id)}
              >
                <div className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  selectedWallpapers.has(wallpaper._id) ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] scale-[0.98]' : 'border-white/5 hover:border-white/20'
                }`}>
                  <div className={`absolute top-2 left-2 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedWallpapers.has(wallpaper._id) ? 'bg-indigo-500 border-indigo-500' : 'border-white/40 bg-black/40 opacity-0 group-hover:opacity-100'
                  }`}>
                    {selectedWallpapers.has(wallpaper._id) && <CheckSquare size={12} className="text-white" />}
                  </div>
                  
                  <img
                    src={wallpaper.thumbnailUrl || wallpaper.imageUrl}
                    alt={wallpaper.title || 'Wallpaper'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {selectedWallpapers.has(wallpaper._id) && (
                    <div className="absolute inset-0 bg-indigo-500/20 z-10 pointer-events-none"></div>
                  )}
                </div>
                <div className="px-1 text-center">
                  <p className="text-xs font-medium text-zinc-300 truncate">{wallpaper.title}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-xl text-zinc-500 mt-16 font-medium">No wallpapers found.</p>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 space-x-4">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1 || loading}
              className="px-5 py-2 bg-zinc-900 border border-white/10 rounded-lg text-zinc-300 font-medium shadow-sm hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="text-zinc-500 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-5 py-2 bg-zinc-900 border border-white/10 rounded-lg text-zinc-300 font-medium shadow-sm hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteWallpaper;
