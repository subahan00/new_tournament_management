import React, { useState, useEffect } from 'react';
import { Trophy, Menu, X, Shield, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [competitions, setCompetitions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && !e.target.closest('.mobile-menu-container')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0d1b2a]/75 backdrop-blur-xl border-b border-[#1a237e]/50 shadow-lg">
      <div className="relative px-6 py-4 flex justify-between items-center max-w-screen-xl mx-auto">
        {/* Site Logo/Title */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <Trophy size={32} className="text-[#ffc107] group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-wide text-white group-hover:text-[#ffc107] transition-colors duration-300">
              Official <span className="text-[#ffc107]">90</span>
            </span>
          </div>
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden focus:outline-none text-gray-300 hover:text-[#ffc107] p-2 rounded-lg transition-colors duration-300"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          {[
            { to: "/", label: "Home" },
            { to: "/standings", label: "Standings" },
            { to: "/competitions", label: "Competitions", hasCount: true },
            { to: "/login", label: "Admin", isSpecial: true },
            {to :"/trophy-cabinet", label:"Trophy Cabinet"}
          ].map((item, index) => (
            <Link
              key={index}
              to={item.to}
              className={`relative group px-3 py-2 rounded-md transition-all duration-300 ${
                item.isSpecial 
                  ? 'text-[#ffc107] border border-[#ffc107]/30 hover:border-[#ffc107] hover:bg-[#ffc107]/10' 
                  : 'text-gray-300 hover:text-[#ffc107] hover:bg-white/5'
              }`}
            >
              <span className="flex items-center space-x-2">
                {item.isSpecial && <Shield size={16} />}
                <span>{item.label}</span>
                {item.hasCount && competitions.length > 0 && (
                  <span className="bg-[#ffc107] text-black rounded-full px-2 py-0.5 text-xs font-bold">
                    {competitions.length}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`mobile-menu-container md:hidden bg-[#0d1b2a]/90 backdrop-blur-lg border-t border-[#1a237e]/30 transition-all duration-300 ease-in-out ${
          menuOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="px-6 py-4">
          <nav className="flex flex-col space-y-1">
            {[
              { to: "/", label: "Home" },
              { to: "/standings", label: "Standings" },
              { to: "/competitions", label: "Competitions", hasCount: true },
              { to: "/login", label: "Admin Login", isSpecial: true },
              {to :"/trophy-cabinet", label:"Trophy Cabinet"}
            ].map((item, index) => (
              <Link
                key={index}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`group flex items-center justify-between py-3 px-4 rounded-lg text-base transition-all duration-300 ${
                  item.isSpecial 
                    ? 'text-[#ffc107] border border-[#ffc107]/30 hover:border-[#ffc107] hover:bg-[#ffc107]/10' 
                    : 'text-gray-300 hover:text-[#ffc107] hover:bg-white/5'
                }`}
              >
                <span className="flex items-center space-x-3">
                  {item.isSpecial && <Crown size={18} />}
                  <span>{item.label}</span>
                </span>
                {item.hasCount && competitions.length > 0 && (
                  <span className="bg-[#ffc107] text-black rounded-full px-2 py-1 text-sm font-bold">
                    {competitions.length}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
