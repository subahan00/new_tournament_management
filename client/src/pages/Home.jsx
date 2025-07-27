import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Link } from 'react-router-dom'; // Keep Link for navigation
import * as THREE from 'three';
import axios from 'axios';
import { X, ChevronLeft, AlertCircle, ChevronRight, CheckCircle, Loader2, Menu, Crown, Shield, Instagram, Send, Trophy, Swords, Star, Zap, Users, Award, Calendar, UserCog } from 'lucide-react';

// NOTE: In a real app, components like Header, Footer, etc., would likely be in their own files.
// They are kept here to make this a single, runnable example.

//=================================================================
// 1. ENHANCED 3D NEBULA WITH DEPTH LAYERS
//=================================================================
const ThreeNebula = () => {
  const mountRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);
    camera.position.z = isMobile ? 8 : 6;

    const layers = [];
    const layerConfigs = [
      { count: isMobile ? 800 : 3000, size: 0.02, speed: 0.5, distance: 15 },
      { count: isMobile ? 600 : 2000, size: 0.015, speed: 0.8, distance: 10 },
      { count: isMobile ? 400 : 1500, size: 0.01, speed: 1.2, distance: 5 }
    ];

    layerConfigs.forEach((config, layerIndex) => {
      const positions = new Float32Array(config.count * 3);
      const colors = new Float32Array(config.count * 3);
      const colorPurple = new THREE.Color('#2c1b4b');
      const colorGold = new THREE.Color('#ffdf80');
      const colorDeepPurple = new THREE.Color('#1a0f2e');

      for (let i = 0; i < config.count * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * config.distance;

        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = r * Math.cos(phi);

        let mixedColor;
        const rand = Math.random();
        if (layerIndex === 0) mixedColor = rand > 0.85 ? colorGold.clone() : colorDeepPurple.clone();
        else if (layerIndex === 1) mixedColor = rand > 0.9 ? colorGold.clone() : colorPurple.clone();
        else mixedColor = rand > 0.95 ? colorGold.clone() : colorPurple.clone();

        colors[i] = mixedColor.r;
        colors[i + 1] = mixedColor.g;
        colors[i + 2] = mixedColor.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: config.size, vertexColors: true, blending: THREE.AdditiveBlending,
        transparent: true, opacity: 0.8 - layerIndex * 0.2,
      });

      const starField = new THREE.Points(geometry, material);
      layers.push({ mesh: starField, speed: config.speed });
      scene.add(starField);
    });

    const handleMouseMove = (event) => { mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1; };
    const handleDeviceOrientation = (event) => {
      const { gamma, beta } = event;
      if (gamma !== null && beta !== null) { mouse.current.x = (gamma / 45); mouse.current.y = (beta / 90); }
    };

    if (isMobile && window.DeviceOrientationEvent) { window.addEventListener('deviceorientation', handleDeviceOrientation); }
    else { window.addEventListener('mousemove', handleMouseMove); }

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      layers.forEach((layer) => {
        layer.mesh.rotation.y = elapsedTime * 0.02 * layer.speed;
        layer.mesh.rotation.x = elapsedTime * 0.01 * layer.speed;
      });
      camera.position.x += (mouse.current.x * 0.3 - camera.position.x) * 0.02;
      camera.position.y += (mouse.current.y * 0.3 - camera.position.y) * 0.02;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('resize', handleResize);
      if (mount && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isMobile]);

  return <div ref={mountRef} className="fixed inset-0 -z-20" />;
};

//=================================================================
// 2. MODERN INTERACTIVE CARD (NO TILT)
//=================================================================
const useScrollAnimation = () => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsInView(true); observer.unobserve(entry.target); }
    }, { threshold: 0.1 });
    if (ref.current) { observer.observe(ref.current); }
    return () => { if (ref.current) { observer.unobserve(ref.current); } };
  }, []);
  return [ref, isInView];
};

const InteractiveCard = ({ children, className = "" }) => {
  const cardRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [scrollRef, isInView] = useScrollAnimation();

  useEffect(() => {
    if (isMobile) return;
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };
    card.addEventListener('mousemove', handleMouseMove);
    return () => { card.removeEventListener('mousemove', handleMouseMove); };
  }, [isMobile]);

  return (
    <div ref={scrollRef} className={`modern-card-container transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>
      <div ref={cardRef} className="h-full w-full modern-interactive-card">
        {children}
        {!isMobile && <div className="modern-reflection" />}
      </div>
    </div>
  );
};

//=================================================================
// 3. ENHANCED & REFINED COMPONENTS
//=================================================================

const Header = ({ onQuestClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
    return () => { window.removeEventListener('scroll', handleScroll); document.body.style.overflow = 'auto'; };
  }, [scrolled, menuOpen]);

  const navLinks = [
    { href: "/", label: "Home", icon: Crown },
    { href: "#tournaments", label: "Arena", icon: Swords, isScroll: true },
    { href: "/standings", label: "Standings", icon: Award },
    { href: "#stats", label: "Legends", icon: Star, isScroll: true },
    { href: "/trophy-cabinet", label: "Trophy Cabinet", icon: Trophy },
    { href: "/login", label: "Admin", icon: UserCog },
    { href: "#join", label: "Join Quest", icon: Shield, isSpecial: true, action: onQuestClick },
  ];

  const NavItem = ({ item }) => {
    if (item.action) {
      return (
        <a href={item.href} onClick={(e) => { e.preventDefault(); item.action(); setMenuOpen(false); }} className={`modern-nav-link ${item.isSpecial ? 'special' : ''}`}>
          <span className="flex items-center space-x-2"><item.icon size={16} /><span>{item.label}</span></span>
          <span className="nav-underline"></span>
        </a>
      );
    }
    if (item.isScroll) {
      return (
        <a href={item.href} onClick={() => setMenuOpen(false)} className="modern-nav-link">
          <span className="flex items-center space-x-2"><item.icon size={16} /><span>{item.label}</span></span>
          <span className="nav-underline"></span>
        </a>
      );
    }
    return (
      <Link to={item.href} onClick={() => setMenuOpen(false)} className="modern-nav-link">
        <span className="flex items-center space-x-2"><item.icon size={16} /><span>{item.label}</span></span>
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
        <a href={item.href} onClick={commonOnClick} className="modern-mobile-nav-link">
          <item.icon size={24} className="mr-4" />{item.label}
        </a>
      );
    }
    return (
      <Link to={item.href} onClick={commonOnClick} className="modern-mobile-nav-link">
        <item.icon size={24} className="mr-4" />{item.label}
      </Link>
    );
  };

  return (
    <><header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled || menuOpen ? 'glass-header' : 'bg-transparent'}`}><div className="relative px-4 sm:px-6 py-4 flex justify-between items-center max-w-screen-2xl mx-auto"><Link to="/" className="flex items-center space-x-2 sm:space-x-3 group"><div className="relative"><div className="absolute -inset-2 rounded-full modern-glow"></div><Crown size={32} className="relative text-gold-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" /></div><div><span className="text-xl sm:text-2xl font-cinzel font-black tracking-wider text-white group-hover:text-gold-300 transition-colors duration-300">Official <span className="text-gold-400">90</span></span></div></Link><button className="md:hidden focus:outline-none text-gold-300 hover:text-gold-100 p-2 rounded-lg transition-all duration-300 hover:bg-gold-500/10 z-50" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={28} /> : <Menu size={28} />}</button><nav className="hidden md:flex items-center space-x-1 text-sm font-cinzel font-bold">{navLinks.map((item) => <NavItem key={item.label} item={item} />)}</nav></div></header><div className={`md:hidden fixed inset-0 modern-mobile-menu z-40 transition-all duration-500 ${menuOpen ? 'opacity-100 pointer-events-auto backdrop-blur-2xl' : 'opacity-0 pointer-events-none backdrop-blur-0'}`}><nav className="flex flex-col items-center justify-center h-full text-center space-y-8">{navLinks.map((item, index) => <MobileNavItem key={item.label} item={item} />)}</nav></div></>
  );
};

const Footer = () => (
  <footer className="relative modern-footer overflow-hidden mt-20">
    <div className="absolute inset-0 modern-footer-bg"></div>
    <div className="modern-accent-line"></div>
    <div className="relative container mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div className="md:col-span-1 md:text-left">
          <h4 className="modern-footer-title">Quick Links</h4>
          <ul className="space-y-4">
            {[
              { label: 'Tournaments', href: '#tournaments', isScroll: true },
              { label: 'Standings', href: '/standings' },
              { label: 'Rules', href: '/rules' },
              { label: 'Discord', href: '#discord', isScroll: true },
              { label: 'Support', href: '/support' }
            ].map((link) => (
              <li key={link.label}>
                {link.isScroll ? (
                  <a href={link.href} className="modern-footer-link group">
                    <Zap size={14} className="opacity-70 group-hover:opacity-100 group-hover:text-gold-400 transition-all" />
                    <span>{link.label}</span>
                  </a>
                ) : (
                  <Link to={link.href} className="modern-footer-link group">
                    <Zap size={14} className="opacity-70 group-hover:opacity-100 group-hover:text-gold-400 transition-all" />
                    <span>{link.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-1 flex flex-col items-center order-first md:order-none">
          <div className="relative mb-6">
            <div className="absolute -inset-3 rounded-full modern-glow"></div>
            <Crown size={56} className="relative text-gold-400" />
          </div>
          <p className="text-purple-300 text-sm font-lora mb-2">
            © {new Date().getFullYear()} <span className="font-bold text-gold-400 font-cinzel">Official_90</span>. All rights reserved.
          </p>
          <p className="text-purple-400 text-xs font-lora">
            Forged in the fires of competition ⚔️
          </p>
        </div>

        <div className="md:col-span-1 md:text-right">
          <h4 className="modern-footer-title">Follow The Saga</h4>
          <div className="flex justify-center md:justify-end space-x-4">
            <a href="https://www.instagram.com/official.t90__/" target="_blank" rel="noopener noreferrer" className="modern-social-link" title="Instagram">
              <Instagram />
            </a>
            <a href="https://t.me/official_t90x" target="_blank" rel="noopener noreferrer" className="modern-social-link" title="Telegram">
              <Send />
            </a>
            <a href="#discord" className="modern-social-link" title="Community Discord">
              <Users />
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

const AnimatedCounter = ({ end, duration = 2500, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const [ref, isInView] = useScrollAnimation();
  useEffect(() => {
    if (isInView) {
      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeOutExpo = 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(easeOutExpo * end));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const StatsSection = () => {
  const [ref, isInView] = useScrollAnimation();
  const stats = [
    { icon: Users, value: 406, label: "Players", suffix: "+" }, { icon: Trophy, value: 104, label: "Tournaments" },
    { icon: Award, value: 15000, label: "Matches", suffix: "+" }, { icon: Zap, value: 206, label: "Winners", suffix: "" }
  ];
  return (<section id="stats" ref={ref} className={`py-24 relative transition-all duration-1000 ${isInView ? 'opacity-100' : 'opacity-0'}`}><div className="container mx-auto px-4 sm:px-6 relative z-10"><div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">{stats.map((stat, index) => (<div key={stat.label} className="text-center group" style={{ animationDelay: `${index * 200}ms` }}><div className="modern-stat-card"><div className="relative mb-4"><div className="stat-icon-glow"></div><stat.icon className="relative mx-auto text-gold-400 group-hover:scale-110 transition-transform duration-500" size={36} /></div><div className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-black text-gold-300 mb-2"><AnimatedCounter end={stat.value} suffix={stat.suffix} /></div><p className="text-purple-200 font-lora text-sm sm:text-base font-medium">{stat.label}</p></div></div>))}</div></div></section>);
};

//=================================================================
// 4. UPDATED REGISTRATION FORM MODAL
//=================================================================
const RegistrationFormModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    club: '',
    age: '',
    location: '',
    playingSince: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setLoading(false);
      setFormData({
        fullName: '', whatsapp: '', club: '', age: '',
        location: '', playingSince: '',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/submit`, formData);
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    { name: 'fullName', label: 'Full Name', type: 'text', icon: '👤' },
    { name: 'whatsapp', label: 'WhatsApp Number', type: 'tel', icon: '📱' },
    { name: 'club', label: 'Club You Support', type: 'text', icon: '⚽' },
    { name: 'age', label: 'Age', type: 'number', icon: '🎂' },
    { name: 'location', label: 'Where Are You From', type: 'text', icon: '📍' },
    { name: 'playingSince', label: 'Playing eFootball Since', type: 'text', icon: '🎮' },
  ];

  return (
    <div className="fixed inset-0 modern-modal-backdrop z-[100] flex items-start justify-center p-4 overflow-y-auto md:items-center" onClick={onClose}>
      <div className="modern-form-container max-w-sm w-full my-4 relative" onClick={e => e.stopPropagation()}>
        <div className="modern-form-glow"></div>
        <button onClick={onClose} className="absolute top-3 right-3 text-gold-300 hover:text-gold-100 transition-all duration-300 z-20 p-1 rounded-full hover:bg-purple-800/30 hover:scale-110" aria-label="Close form">
          <X size={18} />
        </button>

        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-4 sm:p-5">
          {!submitted ? (
            <div className="relative z-10">
              <div className="text-center mb-4">
                <h2 className="text-xl font-cinzel font-black modern-gradient-text mb-2">⚔️ Join The Quest</h2>
                <p className="text-purple-200 text-sm leading-relaxed">Enter the arena and prove your worth</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                {formFields.map((field) => (
                  <div key={field.name} className="relative group">
                    <label htmlFor={field.name} className="block text-xs text-purple-200 mb-1 flex items-center gap-1 font-cinzel font-semibold">
                      <span className="text-sm">{field.icon}</span>{field.label}
                    </label>
                    <input
                      type={field.type}
                      id={field.name}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      required
                      className="modern-input text-sm px-3 py-1.5 h-9"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
                <button type="submit" disabled={loading} className="w-full py-2 modern-submit-button flex items-center justify-center text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <><Loader2 className="animate-spin mr-2" size={16} />Submitting...</>
                  ) : (
                    <span className="flex items-center gap-1.5">🚀 Submit Registration</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-4 relative z-10">
              <div className="relative mb-3">
                <CheckCircle className="relative text-green-400 mx-auto animate-bounce" size={40} />
              </div>
              <h3 className="text-lg font-cinzel font-black modern-gradient-text mb-2">🎉 Registration Complete!</h3>
              <p className="text-purple-200 mb-3 text-sm leading-relaxed">We'll contact you via WhatsApp within 24 hours</p>
              <div className="modern-success-card p-3">
                <a href="https://www.instagram.com/official.t90__/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300 font-semibold transition-colors text-sm">
                  <Instagram size={14} />Follow for Updates
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const ParseAnnounceText = ({ text }) => {
  if (!text) return null;
  const parts = text.split('**');
  return (
    <p className="text-purple-200 text-center md:text-left text-base sm:text-lg font-lora">
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-bold text-gold-400 font-cinzel tracking-wide">{part}</strong>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </p>
  );
};
//=================================================================
// 5. NEW ANNOUNCEMENT TICKER COMPONENT
//=================================================================
const AnnouncementSection = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef(null);
  const availableIcons = [Trophy, Calendar, Star, Users];

  // Simulate fetching announcements from an API
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setError(null);

      try {
        const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${backendUrl}/api/announcements`);

        console.log("Raw response from backend:", response);

        if (response.data && Array.isArray(response.data)) {
          const formattedAnnouncements = response.data.map((announcement, index) => ({
            title: announcement.text || "Untitled Announcement",
            icon: availableIcons[index % availableIcons.length]
          }));

          console.log("Formatted announcements:", formattedAnnouncements);
          setAnnouncements(formattedAnnouncements);
        } else {
          console.warn("Unexpected data format:", response.data);
          setAnnouncements([]);
        }

      } catch (err) {
        console.error("Failed to fetch announcements:", err);
        setError("Could not load latest announcements. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);


  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    if (!isPaused && announcements.length > 0) {
      timeoutRef.current = setTimeout(
        () => setCurrentIndex(prevIndex => (prevIndex + 1) % announcements.length),
        5000 // 5 second delay
      );
    }
    return () => resetTimeout();
  }, [currentIndex, announcements, isPaused]);

  const handleNavClick = (direction) => {
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % announcements.length
      : (currentIndex - 1 + announcements.length) % announcements.length;
    setCurrentIndex(newIndex);
  };

  // Guard against no announcements
  const currentAnnouncement = announcements.length > 0 ? announcements[currentIndex] : null;
  const CurrentIcon = currentAnnouncement ? currentAnnouncement.icon : Loader2;

  return (
    <section id="announcements" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <InteractiveCard>
          <div
            className="announcement-card"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="announcement-card-glow"></div>

            {/* Navigation Controls */}
            {!loading && !error && announcements.length > 1 && (
              <>
                <button onClick={() => handleNavClick('prev')} className="announcement-nav-button left-2 md:left-4" aria-label="Previous Announcement">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => handleNavClick('next')} className="announcement-nav-button right-2 md:right-4" aria-label="Next Announcement">
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="w-full min-h-[80px] flex flex-col justify-center items-center">
              {loading ? (
                <div className="flex items-center gap-4 text-purple-200">
                  <Loader2 className="animate-spin text-gold-400" size={24} />
                  <span className="font-lora">Loading Latest News...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-4 text-red-400">
                  <AlertCircle size={24} />
                  <span className="font-lora">{error}</span>
                </div>
              ) : (
                <>
                  <div key={currentIndex} className="announcement-content">
                    <CurrentIcon className="text-gold-400 flex-shrink-0" size={28} />
                    <ParseAnnounceText text={currentAnnouncement.title} />
                  </div>

                  {/* Progress Dots */}
                  {announcements.length > 1 && (
                    <div className="flex gap-2.5 mt-4">
                      {announcements.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`announcement-dot ${currentIndex === index ? 'active' : ''}`}
                          aria-label={`Go to announcement ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </InteractiveCard>
      </div>
    </section>
  );
};

//=================================================================
// 6. HOME PAGE COMPONENT (DEFAULT EXPORT)
//=================================================================
export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const handleCloseForm = () => setShowForm(false);

  return (
    <div className="min-h-screen flex flex-col modern-bg text-white font-serif overflow-x-hidden">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />

      <Suspense fallback={<div className="fixed inset-0 bg-purple-950" />}>
        <ThreeNebula />
      </Suspense>

      <Header onQuestClick={() => setShowForm(true)} />

      <main className="flex-grow relative z-10 w-full">
        <section id="home" className="min-h-screen flex items-center justify-center text-center px-4 sm:px-6 relative">
          <div className="modern-hero-content">
            <h1 className="modern-hero-title">Welcome to <span className="modern-brand-accent">Official_90</span></h1>
            <p className="modern-hero-subtitle">Start your journey to greatness. Compete, grow, and make your name unforgettable.
            </p>
            <div className="modern-hero-cta">
              <button id="join" onClick={() => setShowForm(true)} className="modern-cta-button">
                <span className="relative z-10">⚔️ Join The Arena</span>
                <div className="modern-cta-glow"></div>
              </button>
            </div>
          </div>
        </section>

        <AnnouncementSection />

        <section id="tournaments" className="container mx-auto px-4 sm:px-6 py-24">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
            <InteractiveCard className="group cursor-pointer">
              <div className="modern-info-card">
                <div className="modern-card-icon-wrapper"><Swords size={48} className="modern-card-icon" /></div>
                <h2 className="modern-card-title">Weekly Arenas</h2>
                <p className="modern-card-desc">Battle strong opponents every weekend for glory, rewards, and a place in the hall of legends.
                </p>
                <Link to="/view" className="modern-card-button">Enter The Arena</Link>
              </div>
            </InteractiveCard>
            <InteractiveCard className="group cursor-pointer" style={{ transitionDelay: '200ms' }}>
              <div className="modern-info-card">
                <div className="modern-card-icon-wrapper"><Star size={48} className="modern-card-icon" /></div>
                <h2 className="modern-card-title">Wallpapers</h2>
                <p className="modern-card-desc">Decorate your devices with stunning HD art featuring legendary football heroes.
</p>
                <Link to="/wallpaper" className="modern-card-button">Browse Gallery</Link>
              </div>
            </InteractiveCard>
          </div>
        </section>

        <StatsSection />
      </main>

      <Footer />

      <RegistrationFormModal isOpen={showForm} onClose={handleCloseForm} />

      <style jsx global>{`
                :root { --purple-dark: #2c1b4b; --purple-mid: #4a2a6c; --purple-light: #8b7bb8; --gold-main: #ffdf80; --gold-dark: #e6b422; }
                .font-cinzel { font-family: 'Cinzel', serif; } .font-lora { font-family: 'Lora', serif; }
                .modern-bg {
                  background-color: #0a0510;
                  background-image: linear-gradient(160deg, #0a0510 0%, #1a0f2e 40%, #1a0f2e 60%, #0a0510 100%);
                  position: relative;
                  overflow-x: hidden;
                  font-family: 'Lora', serif;
                }
                .modern-bg::after {
                  content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                  width: 100vw; height: 100vh;
                  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"%3E%3Cg fill-opacity="0.22"%3E%3Crect fill="%231a0f2e" width="800" height="800"/%3E%3Cg fill="%232c1b4b"%3E%3Ccircle cx="400" cy="400" r="100"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
                  opacity: 0.025; pointer-events: none; z-index: -1;
                }
                ::-webkit-scrollbar { width: 12px; } ::-webkit-scrollbar-track { background: linear-gradient(to bottom, #1a0f2e, #0a0510); border-radius: 6px; } ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, var(--gold-main), var(--gold-dark)); border-radius: 6px; border: 2px solid #1a0f2e; } ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #fff8e7, var(--gold-main)); }
                .glass-header { background: rgba(10, 5, 16, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255, 223, 128, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
                .modern-glow { background: radial-gradient(circle, rgba(255, 223, 128, 0.15) 0%, transparent 70%); filter: blur(8px); }
                .modern-nav-link { position: relative; padding: 0.75rem 1.25rem; border-radius: 12px; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); color: var(--purple-light); background: transparent; overflow: hidden; text-decoration: none; }
                .modern-nav-link::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255, 223, 128, 0.05) 0%, rgba(255, 223, 128, 0.02) 100%); opacity: 0; transition: opacity 0.4s ease; border-radius: 12px; }
                .modern-nav-link:hover::before { opacity: 1; }
                .modern-nav-link:hover { color: var(--gold-main); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(255, 223, 128, 0.15); }
                .modern-nav-link.special { color: var(--gold-main); background: linear-gradient(135deg, rgba(255, 223, 128, 0.1) 0%, rgba(255, 223, 128, 0.05) 100%); border: 1px solid rgba(255, 223, 128, 0.2); }
                .modern-nav-link.special:hover { background: linear-gradient(135deg, rgba(255, 223, 128, 0.15) 0%, rgba(255, 223, 128, 0.08) 100%); border-color: rgba(255, 223, 128, 0.4); box-shadow: 0 8px 25px rgba(255, 223, 128, 0.25); }
                .nav-underline { position: absolute; bottom: 0; left: 50%; width: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--gold-main), transparent); transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); transform: translateX(-50%); }
                .modern-nav-link:hover .nav-underline { width: 80%; }
                .modern-mobile-menu { background: linear-gradient(135deg, rgba(10, 5, 16, 0.95) 0%, rgba(44, 27, 75, 0.9) 100%); }
                .modern-mobile-nav-link { font-size: 1.5rem; font-family: 'Cinzel', serif; font-weight: 700; color: var(--purple-light); display: flex; align-items: center; padding: 1rem 0; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); opacity: 0; transform: translateY(30px); animation: slideInMobile 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; text-decoration: none;}
                .modern-mobile-nav-link:hover { color: var(--gold-main); transform: scale(1.05) translateY(30px); }
                @keyframes slideInMobile { to { opacity: 1; transform: translateY(0); } }
                .modern-hero-content { max-width: 5xl; margin: 0 auto; }
                .modern-hero-title { font-size: clamp(3rem, 8vw, 7rem); font-family: 'Cinzel', serif; font-weight: 900; background: linear-gradient(135deg, #fff8e7 0%, var(--gold-main) 25%, var(--gold-dark) 50%, var(--gold-main) 75%, #fff8e7 100%); background-clip: text; -webkit-background-clip: text; color: transparent; margin-bottom: 2rem; line-height: 1.1; letter-spacing: -0.02em; opacity: 0; animation: heroFadeIn 1.2s cubic-bezier(0.23, 1, 0.32, 1) 0.3s forwards; }
                .modern-brand-accent { background: linear-gradient(135deg, var(--purple-mid) 0%, var(--purple-light) 100%); background-clip: text; -webkit-background-clip: text; color: transparent; position: relative; }
                .modern-hero-subtitle { font-size: clamp(1.125rem, 2.5vw, 1.5rem); color: var(--purple-light); font-weight: 400; line-height: 1.6; max-w: 42rem; margin: 0 auto 3rem; opacity: 0; animation: heroFadeIn 1.2s cubic-bezier(0.23, 1, 0.32, 1) 0.6s forwards; }
                .modern-hero-cta { opacity: 0; animation: heroFadeIn 1.2s cubic-bezier(0.23, 1, 0.32, 1) 0.9s forwards; }
                @keyframes heroFadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .modern-cta-button { position: relative; padding: 1.25rem 3rem; background: linear-gradient(135deg, var(--gold-main) 0%, var(--gold-dark) 100%); color: var(--purple-dark); border: none; border-radius: 16px; font-family: 'Cinzel', serif; font-weight: 700; font-size: 1.125rem; cursor: pointer; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); overflow: hidden; box-shadow: 0 12px 40px rgba(255, 223, 128, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4); }
                .modern-cta-button:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 60px rgba(255, 223, 128, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6); }
                .modern-cta-button:active { transform: translateY(-2px) scale(0.98); }
                .modern-cta-glow { position: absolute; inset: -2px; background: linear-gradient(135deg, rgba(255, 223, 128, 0.6), rgba(230, 180, 34, 0.6)); border-radius: 18px; opacity: 0; transition: opacity 0.4s ease; z-index: -1; filter: blur(8px); }
                .modern-cta-button:hover .modern-cta-glow { opacity: 1; }
                .modern-card-container { perspective: 2000px; }
                .modern-interactive-card { transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: relative; }
                .modern-reflection { position: absolute; inset: 0; background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.1) 0%, transparent 50%); opacity: 0; transition: opacity 0.4s ease; border-radius: 24px; pointer-events: none; }
                .modern-card-container:hover .modern-reflection { opacity: 1; }
                .modern-info-card { background: linear-gradient(135deg, rgba(44, 27, 75, 0.4) 0%, rgba(30, 42, 90, 0.3) 50%, rgba(44, 27, 75, 0.4) 100%); backdrop-filter: blur(20px); border: 1px solid rgba(255, 223, 128, 0.1); border-radius: 24px; padding: 2.5rem; height: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: relative; overflow: hidden; }
                .modern-info-card::before { 
                    content: ''; 
                    position: absolute; 
                    inset: 0; 
                    background: linear-gradient(135deg, rgba(255, 223, 128, 0.05) 0%, transparent 50%, rgba(255, 223, 128, 0.05) 100%); 
                    opacity: 0; 
                    transition: opacity 0.4s ease;
                    pointer-events: none; /* ✅ THIS IS THE FIX */
                }
                .group:hover .modern-info-card::before { opacity: 1; }
                .group:hover .modern-info-card { transform: translateY(-8px); border-color: rgba(255, 223, 128, 0.3); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 0 40px rgba(255, 223, 128, 0.1); }
                .modern-card-icon-wrapper { position: relative; margin-bottom: 2rem; }
                .modern-card-icon { color: var(--gold-main); transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); filter: drop-shadow(0 0 20px rgba(255, 223, 128, 0.4)); }
                .group:hover .modern-card-icon { transform: scale(1.1); filter: drop-shadow(0 0 30px rgba(255, 223, 128, 0.6)); }
                .modern-card-title { font-family: 'Cinzel', serif; font-size: 1.75rem; font-weight: 700; color: var(--gold-main); margin-bottom: 1.5rem; line-height: 1.3; }
                .modern-card-desc { color: var(--purple-light); line-height: 1.6; margin-bottom: 2rem; flex-grow: 1; font-size: 1rem; }
                .modern-card-button { padding: 0.75rem 2rem; background: linear-gradient(135deg, rgba(255, 223, 128, 0.8) 0%, rgba(230, 180, 34, 0.8) 100%); color: var(--purple-dark); border: none; border-radius: 12px; font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.875rem; text-decoration: none; transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: 0 4px 15px rgba(255, 223, 128, 0.2); }
                .modern-card-button:hover { background: linear-gradient(135deg, var(--gold-main) 0%, var(--gold-dark) 100%); transform: translateY(-2px) scale(1.05); box-shadow: 0 8px 25px rgba(255, 223, 128, 0.3); }
                .announcement-card { background: linear-gradient(145deg, rgba(44, 27, 75, 0.6) 0%, rgba(30, 42, 90, 0.5) 100%); backdrop-filter: blur(25px); border: 1px solid rgba(255, 223, 128, 0.15); border-radius: 24px; padding: 1.5rem 2rem; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); padding-top: 2rem;
    padding-bottom: 2rem; }
                .announcement-nav-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background-color: rgba(255, 223, 128, 0.1);
    color: var(--gold-main);
    border: 1px solid rgba(255, 223, 128, 0.2);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0;
    z-index: 10;
}
                .announcement-card:hover .announcement-nav-button {
    opacity: 1;
}
                  .announcement-nav-button:hover {
    background-color: rgba(255, 223, 128, 0.2);
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 0 15px rgba(255, 223, 128, 0.3);
}

.announcement-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: rgba(147, 51, 234, 0.4);
    transition: all 0.4s ease;
    cursor: pointer;
    border: none;
}

.announcement-dot:hover {
    background-color: rgba(255, 223, 128, 0.8);
}

.announcement-dot.active {
    background-color: var(--gold-main);
    transform: scale(1.4);
    box-shadow: 0 0 10px rgba(255, 223, 128, 0.5);
}
                .announcement-card-glow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 24px; background: linear-gradient(120deg, transparent, rgba(255, 223, 128, 0.1), transparent 40%, transparent 60%, rgba(255, 223, 128, 0.1), transparent); background-size: 200% 100%; animation: featuredGlow 8s linear infinite; }
                @keyframes featuredGlow { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                .announcement-content { display: flex; align-items: center; gap: 1.5rem; animation: announce-in 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
                @keyframes announce-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .modern-stat-card { background: linear-gradient(135deg, rgba(44, 27, 75, 0.3) 0%, rgba(30, 42, 90, 0.2) 50%, rgba(44, 27, 75, 0.3) 100%); backdrop-filter: blur(15px); border: 1px solid rgba(255, 223, 128, 0.1); border-radius: 20px; padding: 2rem 1.5rem; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: relative; overflow: hidden; }
                .modern-stat-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255, 223, 128, 0.03) 0%, transparent 50%, rgba(255, 223, 128, 0.03) 100%); opacity: 0; transition: opacity 0.4s ease; }
                .group:hover .modern-stat-card::before { opacity: 1; }
                .group:hover .modern-stat-card { border-color: rgba(255, 223, 128, 0.25); box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2); transform: translateY(-5px); }
                .stat-icon-glow { position: absolute; inset: -10px; background: radial-gradient(circle, rgba(255, 223, 128, 0.15) 0%, transparent 70%); filter: blur(15px); opacity: 0; transition: opacity 0.4s ease; }
                .group:hover .stat-icon-glow { opacity: 1; }
                .modern-footer { background: linear-gradient(135deg, rgba(10, 5, 16, 0.95) 0%, rgba(26, 15, 46, 0.9) 50%, rgba(10, 5, 16, 0.95) 100%); border-top: 1px solid rgba(255, 223, 128, 0.1); }
                .modern-footer-bg { background: radial-gradient(ellipse at center, rgba(44, 27, 75, 0.1) 0%, transparent 70%); }
                .modern-accent-line { height: 3px; background: linear-gradient(90deg, transparent 0%, var(--gold-main) 25%, var(--gold-dark) 50%, var(--gold-main) 75%, transparent 100%); box-shadow: 0 0 20px rgba(255, 223, 128, 0.3); }
                .modern-footer-title { color: var(--gold-main); font-family: 'Cinzel', serif; font-weight: 700; font-size: 1.25rem; margin-bottom: 1.5rem; letter-spacing: 0.05em; }
                .modern-footer-link { color: var(--purple-light); transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); display: flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none; }
                @media (min-width: 768px) { .modern-footer-link { justify-content: flex-start; } .modern-footer-link:hover { transform: translateX(8px) !important; } }
                .modern-footer-link:hover { color: var(--gold-main); }
                .modern-social-link { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, rgba(255, 223, 128, 0.1) 0%, rgba(255, 223, 128, 0.05) 100%); border: 1px solid rgba(255, 223, 128, 0.2); color: var(--gold-main); transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
                .modern-social-link:hover { transform: translateY(-4px) scale(1.1); background: linear-gradient(135deg, rgba(255, 223, 128, 0.15) 0%, rgba(255, 223, 128, 0.08) 100%); border-color: rgba(255, 223, 128, 0.4); box-shadow: 0 12px 30px rgba(255, 223, 128, 0.2); }
                .modern-modal-backdrop { background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); }
                .modern-form-container { background: linear-gradient(135deg, rgba(15, 8, 25, 0.98) 0%, rgba(44, 27, 75, 0.95) 25%, rgba(30, 42, 90, 0.95) 75%, rgba(8, 4, 12, 0.99) 100%); backdrop-filter: blur(30px); border: 2px solid rgba(255, 223, 128, 0.2); border-radius: 24px; box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5); animation: modalAppear 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
                .modern-form-glow { position: absolute; inset: -3px; background: linear-gradient(135deg, rgba(255, 223, 128, 0.3) 0%, rgba(147, 51, 234, 0.3) 50%, rgba(59, 130, 246, 0.3) 100%); border-radius: 27px; opacity: 0.5; filter: blur(10px); z-index: -1; }
                @keyframes modalAppear { from { opacity: 0; transform: scale(0.9) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .modern-gradient-text { background: linear-gradient(135deg, var(--gold-main) 0%, #fff8e7 100%); background-clip: text; -webkit-background-clip: text; color: transparent; }
                .modern-input { width: 100%; padding: 1rem 1.25rem; background: rgba(10, 5, 15, 0.8); border: 2px solid rgba(127, 90, 155, 0.3); border-radius: 12px; color: white; font-size: 1rem; transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); outline: none; }
                .modern-input:focus { border-color: var(--gold-main); box-shadow: 0 0 0 3px rgba(255, 223, 128, 0.1), 0 0 20px rgba(255, 223, 128, 0.2); background: rgba(10, 5, 15, 0.9); }
                .modern-submit-button { background: linear-gradient(135deg, var(--gold-main) 0%, var(--gold-dark) 100%); color: var(--purple-dark); border: none; border-radius: 16px; font-family: 'Cinzel', serif; font-weight: 700; cursor: pointer; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: 0 12px 40px rgba(255, 223, 128, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4); }
                .modern-submit-button:hover:not(:disabled) { transform: translateY(-3px) scale(1.02); box-shadow: 0 20px 60px rgba(255, 223, 128, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6); }
                .success-glow { position: absolute; inset: -15px; background: radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%); filter: blur(20px); }
                .modern-success-card { background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); border: 1px solid rgba(255, 223, 128, 0.2); border-radius: 16px; padding: 1.5rem; backdrop-filter: blur(10px); }
                @media (max-width: 768px) { .modern-info-card { padding: 2rem 1.5rem; } .modern-card-title { font-size: 1.5rem; } .modern-stat-card { padding: 1.5rem 1rem; } .modern-form-container { margin: 1rem; padding: 2rem 1.5rem; } .announcement-card { padding: 1rem 1.5rem; } .announcement-content { gap: 1rem; } }
            `}</style>
    </div>
  );
}
