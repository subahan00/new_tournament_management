import React, { useState, useEffect } from 'react';
import { Trophy, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [competitions, setCompetitions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);



   
  // Close menu when clicking outside (optional)
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
    <header className="fixed top-0 left-0 w-full z-50 bg-black text-white shadow-md">
      <div className="relative px-4 py-3 flex justify-between items-center max-w-screen-xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <Trophy size={26} className="text-[#FFD700]" />
          <span className="text-xl font-bold tracking-wider">
            Official <span className="text-[#FFD700]">90</span>
          </span>
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden focus:outline-none text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex space-x-6 text-sm font-semibold">
          <Link to="/" className="hover:text-[#FFD700] transition-colors duration-200">Home</Link>
          <Link to="/fixtures" className="hover:text-[#FFD700] transition-colors duration-200">Fixtures</Link>
          <Link to="/standings" className="hover:text-[#FFD700] transition-colors duration-200">Standings</Link>
          <Link to="/competitions" className="hover:text-[#FFD700] transition-colors duration-200">
            Competitions
            {competitions.length > 0 && (
              <span className="ml-1 text-xs bg-[#FFD700] text-black rounded-full px-2 py-0.5">
                {competitions.length}
              </span>
            )}
          </Link>
          <Link to="/about" className="hover:text-[#FFD700] transition-colors duration-200">About</Link>
         <Link to="/login" className="hover:text-[#FFD700] transition-colors duration-200">admin login</Link>

        </nav>
      </div>

      {/* Mobile nav menu */}
      <div
        className={`mobile-menu-container md:hidden bg-black text-white px-4 pt-3 pb-6 transition-all duration-300 ease-in-out ${
          menuOpen ? 'block' : 'hidden'
        }`}
      >
        <nav className="flex flex-col">
          <Link 
            to="/" 
            onClick={() => setMenuOpen(false)} 
            className="block py-3 border-b border-white/10 text-lg hover:text-[#FFD700] transition-colors duration-200"
          >
            Home
          </Link>
          <Link 
            to="/fixtures" 
            onClick={() => setMenuOpen(false)} 
            className="block py-3 border-b border-white/10 text-lg hover:text-[#FFD700] transition-colors duration-200"
          >
            Fixtures
          </Link>
          <Link 
            to="/standings" 
            onClick={() => setMenuOpen(false)} 
            className="block py-3 border-b border-white/10 text-lg hover:text-[#FFD700] transition-colors duration-200"
          >
            Standings
          </Link>
          <Link 
            to="/competitions" 
            onClick={() => setMenuOpen(false)} 
            className="block py-3 border-b border-white/10 text-lg hover:text-[#FFD700] transition-colors duration-200"
          >
            Competitions
            {competitions.length > 0 && (
              <span className="ml-2 text-xs bg-[#FFD700] text-black rounded-full px-2 py-0.5">
                {competitions.length}
              </span>
            )}
          </Link>
          <Link 
            to="/about" 
            onClick={() => setMenuOpen(false)} 
            className="block py-3 text-lg hover:text-[#FFD700] transition-colors duration-200"
          >
            About
          </Link>
        <Link to="/login" className="hover:text-[#FFD700] transition-colors duration-200">admin login</Link>

        </nav>
      </div>
    </header>
  );
};

export default Header;
