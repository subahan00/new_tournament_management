import React, { useState } from 'react';
import { Trophy, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

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
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex space-x-6 text-sm font-semibold">
          <Link to="/" className="hover:text-[#FFD700] transition">Home</Link>
          <Link to="/fixtures" className="hover:text-[#FFD700] transition">Fixtures</Link>
          <Link to="/standings" className="hover:text-[#FFD700] transition">Standings</Link>
          <Link to="/competitions" className="hover:text-[#FFD700] transition">Competitions</Link>
          <Link to="/about" className="hover:text-[#FFD700] transition">About</Link>
        </nav>
      </div>

      {/* Mobile nav menu */}
      <div
        className={`md:hidden bg-black text-white px-4 pt-3 pb-6 transition-all duration-300 ease-in-out ${
          menuOpen ? 'block' : 'hidden'
        }`}
      >
        <Link to="/" onClick={() => setMenuOpen(false)} className="block py-3 border-b border-white/10 text-lg hover:text-[#FFD700]">Home</Link>
        <Link to="/fixtures" onClick={() => setMenuOpen(false)} className="block py-3 border-b border-white/10 text-lg hover:text-[#FFD700]">Fixtures</Link>
        <Link to="/standings" onClick={() => setMenuOpen(false)} className="block py-3 border-b border-white/10 text-lg hover:text-[#FFD700]">Standings</Link>
        <Link to="/competitions" onClick={() => setMenuOpen(false)} className="block py-3 border-b border-white/10 text-lg hover:text-[#FFD700]">Competitions</Link>
        <Link to="/about" onClick={() => setMenuOpen(false)} className="block py-3 text-lg hover:text-[#FFD700]">About</Link>
      </div>
    </header>
  );
};

export default Header;
