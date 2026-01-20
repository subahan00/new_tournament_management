import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Menu, Crown, Shield, Swords, Star, Trophy, Award, UserCog } from 'lucide-react';

const Header = ({ onQuestClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
    return () => { 
      window.removeEventListener('scroll', handleScroll); 
      document.body.style.overflow = 'auto'; 
    };
  }, [scrolled, menuOpen]);

  const navLinks = [
    { href: "/", label: "Home", icon: Crown },
    { href: "#tournaments", label: "Arena", icon: Swords, isScroll: true },
    { href: "/standings", label: "Standings", icon: Award },
    { href: "#stats", label: "Legends", icon: Star, isScroll: true },
    { href: "/trophy-cabinet", label: "Trophy Cabinet", icon: Trophy },
    { href: "/login", label: "Admin", icon: UserCog },
    { href: "#join", label: "Join Arena", icon: Shield, isSpecial: true, action: onQuestClick },
  ];

  const NavItem = ({ item }) => {
    if (item.action) {
      return (
        <a 
          href={item.href} 
          onClick={(e) => { 
            e.preventDefault(); 
            item.action(); 
            setMenuOpen(false); 
          }} 
          className={`modern-nav-link ${item.isSpecial ? 'special' : ''}`}
        >
          <span className="flex items-center space-x-2">
            <item.icon size={16} />
            <span>{item.label}</span>
          </span>
          <span className="nav-underline"></span>
        </a>
      );
    }
    if (item.isScroll) {
      return (
        <a 
          href={item.href} 
          onClick={() => setMenuOpen(false)} 
          className="modern-nav-link"
        >
          <span className="flex items-center space-x-2">
            <item.icon size={16} />
            <span>{item.label}</span>
          </span>
          <span className="nav-underline"></span>
        </a>
      );
    }
    return (
      <Link 
        to={item.href} 
        onClick={() => setMenuOpen(false)} 
        className="modern-nav-link"
      >
        <span className="flex items-center space-x-2">
          <item.icon size={16} />
          <span>{item.label}</span>
        </span>
        <span className="nav-underline"></span>
      </Link>
    );
  };

  const MobileNavItem = ({ item }) => {
    const commonOnClick = (e) => {
      setMenuOpen(false);
      if (item.action) {
        e.preventDefault();
        item.action();
      }
    };

    if (item.action || item.isScroll) {
      return (
        <a 
          href={item.href} 
          onClick={commonOnClick} 
          className="modern-mobile-nav-link"
        >
          <item.icon size={24} className="mr-4" />
          {item.label}
        </a>
      );
    }
    return (
      <Link 
        to={item.href} 
        onClick={commonOnClick} 
        className="modern-mobile-nav-link"
      >
        <item.icon size={24} className="mr-4" />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled || menuOpen ? 'glass-header' : 'bg-transparent'}`}>
        <div className="relative px-4 sm:px-6 py-4 flex justify-between items-center max-w-screen-2xl mx-auto">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full modern-glow"></div>
              <Crown size={32} className="relative text-gold-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-title font-black tracking-wider text-white group-hover:text-gold-300 transition-colors duration-300">
                Official <span className="text-gold-400">90</span>
              </span>
            </div>
          </Link>

          <button 
            className="md:hidden focus:outline-none text-gold-300 hover:text-gold-100 p-2 rounded-lg transition-all duration-300 hover:bg-gold-500/10 z-50" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <nav className="hidden md:flex items-center space-x-1 text-sm font-heading font-bold">
            {navLinks.map((item) => <NavItem key={item.label} item={item} />)}
          </nav>
        </div>
      </header>

      <div className={`md:hidden fixed inset-0 modern-mobile-menu z-40 transition-all duration-500 ${menuOpen ? 'opacity-100 pointer-events-auto backdrop-blur-2xl' : 'opacity-0 pointer-events-none backdrop-blur-0'}`}>
        <nav className="flex flex-col items-center justify-center h-full text-center space-y-8">
          {navLinks.map((item) => <MobileNavItem key={item.label} item={item} />)}
        </nav>
      </div>
    </>
  );
};

export default Header;