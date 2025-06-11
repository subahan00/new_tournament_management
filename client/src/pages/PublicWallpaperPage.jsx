// src/pages/PublicWallpaper.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  getPublicWallpapers, 
  getWallpaperById, 
  downloadWallpaper, 
  likeWallpaper,
  getWallpaperCategories,
  getWallpaperTags,
  getFeaturedWallpapers,
  
} from '../services/wallpaperService';
import { 
  FaSearch, FaHeart, FaDownload, FaShareAlt, FaTimes, 
  FaChevronLeft, FaChevronRight, FaExpand, FaCompress,
  FaFilter, FaBookmark, FaRegBookmark
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Masonry from 'react-masonry-css';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [relatedWallpapers, setRelatedWallpapers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef(null);

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
      
      // Fetch related wallpapers
      const relatedRes = await getRelatedWallpapers(id);
      setRelatedWallpapers(relatedRes.data);
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

  // Handle save to collection
  

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

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!imageRef.current) return;
    
    if (!isFullscreen) {
      if (imageRef.current.requestFullscreen) {
        imageRef.current.requestFullscreen();
      } else if (imageRef.current.webkitRequestFullscreen) {
        imageRef.current.webkitRequestFullscreen();
      } else if (imageRef.current.msRequestFullscreen) {
        imageRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
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
    setIsFullscreen(false);
  };

  // Format resolution for display
  const formatResolution = (resolution) => {
    if (!resolution) return '1920x1080';
    if (typeof resolution === 'string') return resolution;
    if (resolution.width && resolution.height) 
      return `${resolution.width}x${resolution.height}`;
    return '1920x1080';
  };

  // Masonry breakpoints
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-yellow-100">Loading premium football wallpapers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-800 via-yellow-900 to-gray-800 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-0"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-yellow-400 font-serif">Premium Football Wallpapers</h1>
          <p className="text-xl max-w-3xl mx-auto mb-8 text-yellow-100">
            Exclusive collection of high-definition wallpapers for true football enthusiasts
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-yellow-500">
              <FaSearch />
            </div>
            <input
              type="text"
              placeholder="Search players, teams, or moments..."
              className="w-full pl-12 pr-4 py-3 rounded-full bg-gray-800/70 backdrop-blur-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-yellow-700 placeholder-yellow-700"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            />
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-full transition-all duration-300 hover:scale-110"
              onClick={handleSearchSubmit}
            >
              <FaSearch />
            </button>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 border-4 border-yellow-500/20 rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 border-4 border-yellow-500/20 rounded-full"></div>
          <div className="absolute top-1/3 right-1/4 w-12 h-12 border-4 border-yellow-500/20 rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Section */}
        {featuredWallpapers.length > 0 && (
          <section className="mb-16 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 border-l-4 border-yellow-500 pl-3 py-1 font-serif">Featured Wallpapers</h2>
              <div className="flex items-center gap-2 text-yellow-500">
                <div className="w-10 h-0.5 bg-yellow-500"></div>
                <span className="text-xs uppercase tracking-widest">Exclusive Collection</span>
                <div className="w-10 h-0.5 bg-yellow-500"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredWallpapers.map(wallpaper => (
                <div 
                  key={wallpaper._id} 
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer group relative border border-yellow-700/30"
                  onClick={() => handleSelectWallpaper(wallpaper._id)}
                >
                  <div className="relative overflow-hidden" style={{ paddingBottom: '100%' }}>
                    <img 
                      src={wallpaper.thumbnailUrl || wallpaper.imageUrl} 
                      alt={wallpaper.title} 
                      className="absolute h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 className="text-white font-bold text-lg">{wallpaper.title}</h3>
                          <p className="text-yellow-400 text-sm">
                            {wallpaper.category?.name || wallpaper.category}
                          </p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="bg-yellow-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <FaHeart className="text-red-400" /> {wallpaper.likes}
                          </span>
                          <span className="bg-yellow-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <FaDownload /> {wallpaper.downloads || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters Section */}
        <div className="flex justify-between items-center mb-8">
          <button 
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 px-4 rounded-lg border border-yellow-700/50 transition-colors"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className="text-yellow-500" /> 
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
          
          <div className="text-yellow-500 text-sm">
            <span className="bg-yellow-900/50 px-3 py-1 rounded-full">
              {wallpapers.length} Premium Wallpapers
            </span>
          </div>
        </div>

        {showFilters && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-6 mb-8 border border-yellow-700/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Category</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-700/50 border border-yellow-700/50 text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="" className="bg-gray-800">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id} className="bg-gray-800">
                        {category.name} ({category.count})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-yellow-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Tags</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-700/50 border border-yellow-700/50 text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none"
                    value={filters.tag}
                    onChange={(e) => handleFilterChange('tag', e.target.value)}
                  >
                    <option value="" className="bg-gray-800">All Tags</option>
                    {tags.map(tag => (
                      <option key={tag._id} value={tag.name} className="bg-gray-800">
                        {tag.name} ({tag.count})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-yellow-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">Sort By</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-700/50 border border-yellow-700/50 text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none"
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                  >
                    <option value="newest" className="bg-gray-800">Newest</option>
                    <option value="popular" className="bg-gray-800">Most Popular</option>
                    <option value="downloads" className="bg-gray-800">Most Downloads</option>
                    <option value="featured" className="bg-gray-800">Featured</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-yellow-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button 
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setFilters({ 
                  search: '', 
                  category: '', 
                  tag: '', 
                  sort: 'newest', 
                  page: 1, 
                  limit: 12 
                })}
              >
                <FaTimes /> Reset Filters
              </button>
              
              <div className="text-yellow-500 text-sm flex items-center gap-2">
                <span>Premium Collection</span>
                <div className="w-8 h-px bg-yellow-500"></div>
                <span>{filters.category || filters.tag ? 'Filtered' : 'All'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Wallpaper Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yellow-400 border-l-4 border-yellow-500 pl-3 py-1 font-serif">
              {filters.search ? `Search Results for "${filters.search}"` : 'Premium Gallery'}
            </h2>
            <div className="text-xs text-yellow-500 uppercase tracking-widest">
              Page {filters.page} of {totalPages}
            </div>
          </div>
          
          {wallpapers.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-yellow-700/30">
              <p className="text-yellow-500 text-xl">No premium wallpapers found. Try different filters.</p>
            </div>
          ) : (
            <>
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex -ml-6 w-auto"
                columnClassName="pl-6 bg-clip-padding"
              >
                {wallpapers.map(wallpaper => (
                  <div 
                    key={wallpaper._id} 
                    className="mb-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl cursor-pointer group border border-yellow-700/30"
                    onClick={() => handleSelectWallpaper(wallpaper._id)}
                  >
                    <div className="relative overflow-hidden">
                      <img 
                        src={wallpaper.thumbnailUrl || wallpaper.imageUrl} 
                        alt={wallpaper.title} 
                        className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        style={{ minHeight: '200px' }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                        <div>
                          <h3 className="text-white font-bold">{wallpaper.title}</h3>
                          <div className="flex justify-between mt-2 text-yellow-400">
                            <span className="text-sm">{wallpaper.category?.name || wallpaper.category}</span>
                            <span className="flex items-center gap-1 text-sm">
                              <FaHeart className={`${wallpaper.liked ? 'text-red-500' : 'text-red-400'}`} /> 
                              {wallpaper.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          className="bg-gray-800/80 hover:bg-yellow-600 text-white p-2 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(wallpaper);
                          }}
                        >
                          <FaHeart className={wallpaper.liked ? 'text-red-500' : ''} />
                        </button>
                        <button 
                          className="bg-gray-800/80 hover:bg-yellow-600 text-white p-2 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(wallpaper);
                          }}
                        >
                          <FaDownload />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </Masonry>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-10">
                  <div className="flex items-center gap-2 bg-gray-800/50 rounded-full p-2 border border-yellow-700/30">
                    <button 
                      className={`p-3 rounded-full ${filters.page === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-yellow-500 hover:bg-yellow-900/50'}`}
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
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            pageNum === filters.page 
                              ? 'bg-yellow-600 text-white' 
                              : 'hover:bg-gray-700 text-gray-300'
                          }`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {totalPages > 5 && filters.page < totalPages - 2 && (
                      <span className="px-2 text-gray-500">•••</span>
                    )}
                    
                    {totalPages > 5 && filters.page < totalPages - 2 && (
                      <button
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          totalPages === filters.page 
                            ? 'bg-yellow-600 text-white' 
                            : 'hover:bg-gray-700 text-gray-300'
                        }`}
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </button>
                    )}
                    
                    <button 
                      className={`p-3 rounded-full ${filters.page === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-yellow-500 hover:bg-yellow-900/50'}`}
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
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border-2 border-yellow-600/30 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-yellow-700/30">
              <h2 className="text-xl font-bold text-yellow-400">{selectedWallpaper.title}</h2>
              <div className="flex items-center gap-3">
                <button 
                  className="text-gray-300 hover:text-yellow-500 transition-colors"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
                </button>
                <button 
                  className="text-gray-300 hover:text-yellow-500 transition-colors"
                  onClick={closeDetailView}
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex flex-col lg:flex-row overflow-auto">
              {/* Image */}
              <div className="lg:w-2/3 p-4 flex items-center justify-center bg-black">
                <img 
                  ref={imageRef}
                  src={selectedWallpaper.imageUrl} 
                  alt={selectedWallpaper.title} 
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                />
              </div>
              
              {/* Details */}
              <div className="lg:w-1/3 p-6 border-l border-yellow-700/30 flex flex-col">
                <div className="mb-8">
                  <h3 className="font-bold text-lg mb-3 text-yellow-400 border-b border-yellow-700/30 pb-2">Description</h3>
                  <p className="text-gray-300">
                    {selectedWallpaper.description || 'Premium football wallpaper with no description'}
                  </p>
                </div>
                
                <div className="mb-8">
                  <h3 className="font-bold text-lg mb-3 text-yellow-400 border-b border-yellow-700/30 pb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-yellow-700/30">
                      <p className="text-sm text-yellow-500">Category</p>
                      <p className="font-medium text-gray-200">
                        {selectedWallpaper.category?.name || selectedWallpaper.category}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-yellow-700/30">
                      <p className="text-sm text-yellow-500">Resolution</p>
                      <p className="font-medium text-gray-200">
                        {formatResolution(selectedWallpaper.resolution)}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-yellow-700/30">
                      <p className="text-sm text-yellow-500">Downloads</p>
                      <p className="font-medium text-gray-200">{selectedWallpaper.downloads || 0}</p>
                    </div>
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-yellow-700/30">
                      <p className="text-sm text-yellow-500">Likes</p>
                      <p className="font-medium text-gray-200 flex items-center">
                        <FaHeart className="text-red-500 mr-1" /> {selectedWallpaper.likes || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                {selectedWallpaper.tags?.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-bold text-lg mb-3 text-yellow-400 border-b border-yellow-700/30 pb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedWallpaper.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="bg-yellow-900/30 text-yellow-500 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-yellow-800/50 transition-colors"
                          onClick={() => handleFilterChange('tag', tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Related Wallpapers */}
                {relatedWallpapers.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-bold text-lg mb-3 text-yellow-400 border-b border-yellow-700/30 pb-2">Related Wallpapers</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {relatedWallpapers.slice(0, 3).map(wp => (
                        <div 
                          key={wp._id}
                          className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-yellow-500 transition-all cursor-pointer"
                          onClick={() => handleSelectWallpaper(wp._id)}
                        >
                          <img 
                            src={wp.thumbnailUrl} 
                            alt={wp.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="mt-auto flex flex-wrap gap-3">
                  <button 
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                      selectedWallpaper.liked 
                        ? 'bg-red-600/80 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={handleLike}
                  >
                    <FaHeart /> {selectedWallpaper.liked ? 'Liked' : 'Like'}
                  </button>
                  <button 
                    className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-gray-900 py-3 px-4 rounded-lg font-medium transition-all"
                    onClick={handleDownload}
                  >
                    <FaDownload /> Download
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