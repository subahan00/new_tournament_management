import React, { useState, useEffect, useCallback } from 'react';
import { getAllWallpapersAdmin, deleteWallpaper } from '../services/wallpaperService.js'; // Ensure path is correct

const DeleteWallpaper = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [selectedWallpapers, setSelectedWallpapers] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'oldest'

  // IMPORTANT: Replace with your actual token from auth context or state
  const authToken = localStorage.getItem('authToken');

  const fetchWallpapers = useCallback(async (page, sortOrder) => {
    setLoading(true);
    setError('');
    try {
      // The backend route '/admin/all' sorts by newest first by default.
      const response = await getAllWallpapersAdmin(page, 20, authToken);

      let fetchedWallpapers = response.data.wallpapers || [];

      // If user wants oldest first, we reverse the array received from the backend.
      if (sortOrder === 'oldest') {
        fetchedWallpapers.reverse();
      }

      setWallpapers(fetchedWallpapers);
      // Matching the backend response structure: { pagination: { pages: ... } }
      setTotalPages(response.data.pagination.pages || 1);
    } catch (err) {
      setError('Failed to fetch wallpapers. Please ensure you are logged in and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authToken]); // Dependency on the token

  // Re-fetch wallpapers when page or sort order changes
  useEffect(() => {
    fetchWallpapers(currentPage, sortBy);
  }, [currentPage, sortBy, fetchWallpapers]);

  const handleSelectWallpaper = (id) => {
    setSelectedWallpapers(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedWallpapers.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedWallpapers.size} wallpaper(s)? This action is irreversible.`)) {
      return;
    }

    setLoading(true);
    const wallpaperIds = Array.from(selectedWallpapers);
    // Using Promise.allSettled to attempt all deletions even if some fail
    const results = await Promise.allSettled(
      wallpaperIds.map(id => deleteWallpaper(id, authToken))
    );

    const successfulDeletes = results.filter(res => res.status === 'fulfilled').length;
    if (successfulDeletes > 0) {
        alert(`${successfulDeletes} wallpaper(s) deleted successfully!`);
    }

    const failedDeletes = results.filter(res => res.status === 'rejected').length;
    if (failedDeletes > 0) {
        setError(`${failedDeletes} deletions failed. Check the console for details.`);
        console.error("Failed deletions:", results.filter(res => res.status === 'rejected'));
    }

    setSelectedWallpapers(new Set());
    // Refresh the current page to show the updated list
    fetchWallpapers(currentPage, sortBy);
  };

  return (
    <div className="p-4 md:p-8 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Manage Wallpapers
        </h1>
        <p className="text-center text-gray-500 mb-8">Select wallpapers to permanently delete them from the database and Cloudinary.</p>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-sm gap-4">
          <div className="flex items-center">
            <label htmlFor="sort-by" className="mr-2 text-gray-700 font-medium">Sort by:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedWallpapers.size === 0 || loading}
            className={`w-full sm:w-auto px-5 py-2 text-white font-semibold rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 ${
              selectedWallpapers.size > 0 && !loading
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing...' : `Delete (${selectedWallpapers.size}) Selected`}
          </button>
        </div>

        {loading && wallpapers.length === 0 ? (
          <p className="text-center text-xl text-gray-500 mt-16">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-600 bg-red-100 p-4 rounded-lg">{error}</p>
        ) : wallpapers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {wallpapers.map((wallpaper) => (
              <div
                key={wallpaper._id} // Using MongoDB '_id' as the key
                className={`relative border-2 rounded-lg overflow-hidden cursor-pointer group transition-all ${
                  selectedWallpapers.has(wallpaper._id) ? 'border-blue-500 scale-105 shadow-lg' : 'border-transparent'
                }`}
                onClick={() => handleSelectWallpaper(wallpaper._id)}
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={selectedWallpapers.has(wallpaper._id)}
                  className="absolute top-2 left-2 w-5 h-5 cursor-pointer z-20 accent-blue-500"
                />
                <img
                  // Using 'thumbnailUrl' for low-quality preview as per your backend
                  src={wallpaper.thumbnailUrl}
                  alt={wallpaper.title || 'Wallpaper'}
                  className="w-full h-48 object-cover block group-hover:opacity-75 transition-opacity"
                  loading="lazy"
                />
                 {selectedWallpapers.has(wallpaper._id) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 z-10"></div>
                )}
              </div>
            ))}
          </div>
        ) : (
             <p className="text-center text-xl text-gray-500 mt-16">No wallpapers found.</p>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2 sm:space-x-4">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-700 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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