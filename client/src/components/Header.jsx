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
    <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#0d1b2a] via-[#1a237e] to-[#0d1b2a] border-b border-[#ffc107]/20 backdrop-blur-sm shadow-2xl shadow-[#ffc107]/10">
      {/* Premium top accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#ffc107] to-transparent"></div>
      
      <div className="relative px-6 py-4 flex justify-between items-center max-w-screen-xl mx-auto">
        {/* Premium Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-[#ffc107]/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
            <Trophy size={32} className="relative text-[#ffc107] group-hover:text-[#ffab00] transition-colors duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-wider text-white group-hover:text-[#ffc107] transition-colors duration-300">
              Official <span className="text-[#ffc107] group-hover:text-[#ffab00]">90</span>
            </span>
            <div className="w-0 group-hover:w-full h-0.5 bg-gradient-to-r from-[#ffab00] to-[#ffc107] transition-all duration-500"></div>
          </div>
        </Link>

        {/* Mobile menu button - Premium styling */}
        <button
          className="md:hidden focus:outline-none text-white hover:text-[#ffc107] p-2 rounded-lg border border-[#ffc107]/20 hover:border-[#ffc107]/60 hover:bg-[#ffc107]/10 transition-all duration-300"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Desktop nav - Premium styling */}
        <nav className="hidden md:flex space-x-8 text-sm font-semibold">
          {[
            { to: "/", label: "Home" },
            { to: "/fixtures", label: "Fixtures" },
            { to: "/standings", label: "Standings" },
            { to: "/competitions", label: "Competitions", hasCount: true },
            { to: "/about", label: "About" },
            { to: "/login", label: "Admin", isSpecial: true }
          ].map((item, index) => (
            <Link
              key={index}
              to={item.to}
              className={`relative group px-4 py-2 rounded-lg transition-all duration-300 ${
                item.isSpecial 
                  ? 'text-[#ffc107] border border-[#ffc107]/30 hover:border-[#ffc107] hover:bg-[#ffc107]/10 hover:shadow-lg hover:shadow-[#ffc107]/20' 
                  : 'hover:text-[#ffc107] hover:bg-white/5'
              }`}
            >
              <span className="relative z-10 flex items-center space-x-2">
                {item.isSpecial && <Shield size={16} />}
                <span>{item.label}</span>
                {item.hasCount && competitions.length > 0 && (
                  <span className="bg-gradient-to-r from-[#ffab00] to-[#ffc107] text-black rounded-full px-2 py-0.5 text-xs font-bold shadow-lg">
                    {competitions.length}
                  </span>
                )}
              </span>
              {!item.isSpecial && (
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#ffab00] to-[#ffc107] group-hover:w-full transition-all duration-300"></div>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile nav menu - Premium styling */}
      <div
        className={`mobile-menu-container md:hidden bg-gradient-to-b from-[#0d1b2a] to-[#1a237e] text-white border-t border-[#ffc107]/20 transition-all duration-300 ease-in-out ${
          menuOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="px-6 py-4">
          <nav className="flex flex-col space-y-2">
            {[
              { to: "/", label: "Home" },
              { to: "/fixtures", label: "Fixtures" },
              { to: "/standings", label: "Standings" },
              { to: "/competitions", label: "Competitions", hasCount: true },
              { to: "/about", label: "About" },
              { to: "/login", label: "Admin Login", isSpecial: true }
            ].map((item, index) => (
              <Link
                key={index}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`group flex items-center justify-between py-4 px-4 rounded-lg border-b border-white/5 text-lg transition-all duration-300 ${
                  item.isSpecial 
                    ? 'text-[#ffc107] border border-[#ffc107]/30 hover:border-[#ffc107] hover:bg-[#ffc107]/10' 
                    : 'hover:text-[#ffc107] hover:bg-white/5'
                }`}
              >
                <span className="flex items-center space-x-3">
                  {item.isSpecial && <Crown size={20} />}
                  <span>{item.label}</span>
                </span>
                {item.hasCount && competitions.length > 0 && (
                  <span className="bg-gradient-to-r from-[#ffab00] to-[#ffc107] text-black rounded-full px-3 py-1 text-sm font-bold shadow-lg">
                    {competitions.length}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Mobile menu bottom accent */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#ffc107] to-transparent"></div>
      </div>
    </header>
  );
};

export default Header;