// src/pages/PublicWallpaper.jsx
import React, { useState, useEffect } from 'react';
import { 
  getPublicWallpapers, 
  getWallpaperById, 
  downloadWallpaper, 
  likeWallpaper,
  getWallpaperCategories,
  getWallpaperTags,
  getFeaturedWallpapers
} from '../services/wallpaperService';
import { FaSearch, FaHeart, FaDownload, FaShareAlt, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PublicWallpaper = () => {
  // State management
  const [wallpapers, setWallpapers] = useState([]);
  const [featuredWallpapers, setFeaturedWallpapers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tag: '',
    sort: 'newest',
    page: 1,
    limit: 12
  });
  const [totalPages, setTotalPages] = useState(1);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch wallpapers
        const wallpapersRes = await getPublicWallpapers(filters);
        setWallpapers(wallpapersRes.data.wallpapers);
        setTotalPages(wallpapersRes.data.totalPages);
        
        // Fetch featured wallpapers
        const featuredRes = await getFeaturedWallpapers();
        setFeaturedWallpapers(featuredRes.data);
        
        // Fetch categories
        const categoriesRes = await getWallpaperCategories();
        setCategories(categoriesRes.data);
        
        // Fetch tags
        const tagsRes = await getWallpaperTags();
        setTags(tagsRes.data);
        
      } catch (error) {
        toast.error('Failed to load wallpapers: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters]);

  // Handle wallpaper selection
  const handleSelectWallpaper = async (id) => {
    try {
      const res = await getWallpaperById(id);
      setSelectedWallpaper(res.data);
    } catch (error) {
      toast.error('Failed to load wallpaper details: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!selectedWallpaper) return;
    
    try {
      // Track download
      await downloadWallpaper(selectedWallpaper._id);
      
      // Create download link
      const link = document.createElement('a');
      link.href = selectedWallpaper.imageUrl;
      link.download = `football-wallpaper-${selectedWallpaper.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Update download count in UI
      setSelectedWallpaper(prev => ({
        ...prev,
        downloads: prev.downloads + 1
      }));
      
      toast.success('Download started!');
    } catch (error) {
      toast.error('Download failed: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle like
  const handleLike = async () => {
    if (!selectedWallpaper) return;
    
    try {
      await likeWallpaper(selectedWallpaper._id);
      setSelectedWallpaper(prev => ({
        ...prev,
        likes: prev.likes + 1,
        liked: true
      }));
      
      // Update like count in grid view
      setWallpapers(prev => prev.map(wp => 
        wp._id === selectedWallpaper._id 
          ? {...wp, likes: wp.likes + 1, liked: true} 
          : wp
      ));
      
      toast.success('Wallpaper liked!');
    } catch (error) {
      toast.error('Failed to like wallpaper: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle share
  const handleShare = () => {
    if (!selectedWallpaper) return;
    
    if (navigator.share) {
      navigator.share({
        title: `Football Wallpaper: ${selectedWallpaper.title}`,
        text: 'Check out this amazing football wallpaper!',
        url: window.location.href
      }).catch(error => console.log('Sharing failed', error));
    } else {
      // Fallback for browsers without Share API
      navigator.clipboard.writeText(window.location.href);
      toast.info('Link copied to clipboard!');
    }
  };

  // Handle search and filter changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1
    }));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Close wallpaper detail view
  const closeDetailView = () => {
    setSelectedWallpaper(null);
  };

  // Format resolution for display
  const formatResolution = (resolution) => {
    if (!resolution) return '1920x1080';
    if (typeof resolution === 'string') return resolution;
    if (resolution.width && resolution.height) 
      return `${resolution.width}x${resolution.height}`;
    return '1920x1080';
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading football wallpapers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-700 to-blue-800 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Football Wallpapers</h1>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Discover stunning wallpapers of your favorite football players, teams, and moments
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="Search players, teams, or moments..."
              className="w-full px-4 py-3 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            />
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
              onClick={handleSearchSubmit}
            >
              <FaSearch />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Section */}
        {featuredWallpapers.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-l-4 border-blue-600 pl-3">Featured Wallpapers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredWallpapers.map(wallpaper => (
                <div 
                  key={wallpaper._id} 
                  className="bg-white rounded-xl shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => handleSelectWallpaper(wallpaper._id)}
                >
                  <div className="relative overflow-hidden" style={{ paddingBottom: '100%' }}>
                    <img 
                      src={wallpaper.thumbnailUrl || wallpaper.imageUrl} 
                      alt={wallpaper.title} 
                      className="absolute h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <h3 className="text-white font-bold text-lg">{wallpaper.title}</h3>
                      <p className="text-gray-300 text-sm">
                        {wallpaper.category?.name || wallpaper.category}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.tag}
              onChange={(e) => handleFilterChange('tag', e.target.value)}
            >
              <option value="">All Tags</option>
              {tags.map(tag => (
                <option key={tag._id} value={tag.name}>
                  {tag.name} ({tag.count})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="downloads">Most Downloads</option>
            </select>
          </div>
          
          <button 
            className="mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            onClick={() => setFilters({ 
              search: '', 
              category: '', 
              tag: '', 
              sort: 'newest', 
              page: 1, 
              limit: 12 
            })}
          >
            Clear Filters
          </button>
        </div>

        {/* Wallpaper Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-l-4 border-green-600 pl-3">
            {filters.search ? `Search Results for "${filters.search}"` : 'All Wallpapers'}
          </h2>
          
          {wallpapers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-xl">No wallpapers found. Try different filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wallpapers.map(wallpaper => (
                  <div 
                    key={wallpaper._id} 
                    className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer group"
                    onClick={() => handleSelectWallpaper(wallpaper._id)}
                  >
                    <div className="relative overflow-hidden" style={{ paddingBottom: '125%' }}>
                      <img 
                        src={wallpaper.thumbnailUrl || wallpaper.imageUrl} 
                        alt={wallpaper.title} 
                        className="absolute h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-bold">{wallpaper.title}</h3>
                          <div className="flex justify-between mt-2 text-white/80">
                            <span>{wallpaper.category?.name || wallpaper.category}</span>
                            <span className="flex items-center gap-1">
                              <FaHeart className={`${wallpaper.liked ? 'text-red-500' : 'text-red-400'}`} /> 
                              {wallpaper.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-10">
                  <div className="flex items-center gap-2">
                    <button 
                      className={`p-2 rounded-full ${filters.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                      disabled={filters.page === 1}
                      onClick={() => handlePageChange(filters.page - 1)}
                    >
                      <FaChevronLeft />
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (filters.page <= 3) {
                        pageNum = i + 1;
                      } else if (filters.page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = filters.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`w-10 h-10 rounded-full ${
                            pageNum === filters.page 
                              ? 'bg-blue-600 text-white' 
                              : 'hover:bg-gray-200'
                          }`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {totalPages > 5 && filters.page < totalPages - 2 && (
                      <span className="px-2">...</span>
                    )}
                    
                    {totalPages > 5 && filters.page < totalPages - 2 && (
                      <button
                        className={`w-10 h-10 rounded-full ${
                          totalPages === filters.page 
                            ? 'bg-blue-600 text-white' 
                            : 'hover:bg-gray-200'
                        }`}
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </button>
                    )}
                    
                    <button 
                      className={`p-2 rounded-full ${filters.page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
                      disabled={filters.page === totalPages}
                      onClick={() => handlePageChange(filters.page + 1)}
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Wallpaper Detail Modal */}
      {selectedWallpaper && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">{selectedWallpaper.title}</h2>
              <button 
                className="text-gray-500 hover:text-gray-800"
                onClick={closeDetailView}
              >
                <FaTimes size={24} />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex flex-col md:flex-row overflow-auto">
              {/* Image */}
              <div className="md:w-2/3 p-4 flex items-center justify-center">
                <img 
                  src={selectedWallpaper.imageUrl} 
                  alt={selectedWallpaper.title} 
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                />
              </div>
              
              {/* Details */}
              <div className="md:w-1/3 p-4 border-l border-gray-200 flex flex-col">
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-2">Description</h3>
                  <p className="text-gray-700">
                    {selectedWallpaper.description || 'No description available'}
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium">
                        {selectedWallpaper.category?.name || selectedWallpaper.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Resolution</p>
                      <p className="font-medium">
                        {formatResolution(selectedWallpaper.resolution)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Downloads</p>
                      <p className="font-medium">{selectedWallpaper.downloads || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Likes</p>
                      <p className="font-medium flex items-center">
                        <FaHeart className="text-red-500 mr-1" /> {selectedWallpaper.likes || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                {selectedWallpaper.tags?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-lg mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedWallpaper.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-300"
                          onClick={() => handleFilterChange('tag', tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="mt-auto flex flex-wrap gap-3">
                  <button 
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                      selectedWallpaper.liked 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                    onClick={handleLike}
                  >
                    <FaHeart /> {selectedWallpaper.liked ? 'Liked' : 'Like'}
                  </button>
                  <button 
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    onClick={handleDownload}
                  >
                    <FaDownload /> Download
                  </button>
                  <button 
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    onClick={handleShare}
                  >
                    <FaShareAlt /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicWallpaper;