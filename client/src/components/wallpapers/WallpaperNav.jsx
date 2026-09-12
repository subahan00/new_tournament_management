import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

const WallpaperNav = ({ activeTab, initialSearchQuery = '' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const lastScrollYRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/wallpapers/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchActive(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 w-full z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-white/[0.06] transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col py-2">
          {!isSearchActive ? (
            <>
              <div className="flex items-center justify-between min-h-[44px]">
                <Link to="/wallpapers" className="text-lg font-semibold text-zinc-100 tracking-tight">
                  Wallpapers
                </Link>
                <button
                  onClick={() => setIsSearchActive(true)}
                  className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Search size={20} />
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 pb-2">
                <Link
                  to="/wallpapers"
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'discover'
                      ? 'bg-zinc-200 text-zinc-900 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 bg-white/5'
                  }`}
                >
                  Discover
                </Link>
                <Link
                  to="/wallpapers/albums"
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                    activeTab === 'albums'
                      ? 'bg-zinc-200 text-zinc-900 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 bg-white/5'
                  }`}
                >
                  Albums
                </Link>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 min-h-[44px] py-1">
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder="Search wallpapers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setIsSearchActive(false)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-full pl-9 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200">
                    <X size={14} />
                  </button>
                )}
              </form>
              <button
                onClick={() => setIsSearchActive(false)}
                className="p-2 text-zinc-400 hover:text-zinc-200"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between min-h-[64px]">
          <div className="flex items-center gap-8">
            <Link to="/wallpapers" className="text-lg font-semibold text-zinc-100 tracking-tight">
              Wallpapers
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to="/wallpapers"
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'discover'
                    ? 'bg-zinc-200 text-zinc-900 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 bg-white/5'
                }`}
              >
                Discover
              </Link>
              <Link
                to="/wallpapers/albums"
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'albums'
                    ? 'bg-zinc-200 text-zinc-900 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 bg-white/5'
                }`}
              >
                Albums
              </Link>
            </div>
          </div>
          <div className="w-64">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Escape') setSearchQuery(''); }}
                className="w-full bg-zinc-900 border border-white/10 rounded-full pl-9 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default WallpaperNav;
