import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { Swords, GitMerge, BarChart3, Award, Zap, Users, ShieldQuestion, Crown, ChevronLeft } from 'lucide-react';

//=================================================================
// 1. THEME-ALIGNED COMPONENTS (Copied from your Home page for consistency)
//=================================================================

// NOTE: Ideally, these would be in a shared components folder.
// They are included here to make this a single, runnable file demonstrating the theme.

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

const InteractiveCard = ({ children, className = "", animationDelay = '0ms' }) => {
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
    <div ref={scrollRef} style={{ transitionDelay: animationDelay }} className={`modern-card-container transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>
      <div ref={cardRef} className="h-full w-full modern-interactive-card">
        {children}
        {!isMobile && <div className="modern-reflection" />}
      </div>
    </div>
  );
};


//=================================================================
// 2. RE-THEMED VIEW PAGE
//=================================================================

const ViewPage = () => {
  // Options for the grid, now including paths for routing
  const options = [
    { label: "View Tournaments", icon: Swords, path: "/competitions" },
    { label: "Knockout Fixtures", icon: GitMerge, path: "/public-ko" },
    { label: "League Standings", icon: BarChart3, path: "/standings" },
    { label: "Hall of Fame", icon: Award, path: "/hall-of-fame" },
    { label: "Player Directory", icon: Users, path: "#" }, // Example path
    { label: "FAQs & Support", icon: ShieldQuestion, path: "" }, // Example path
  ];

  return (
    <div className="min-h-screen flex flex-col modern-bg text-white font-serif overflow-x-hidden">
        {/* Font links for Cinzel and Lora */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />

        {/* Themed Nebula Background */}
        <Suspense fallback={<div className="fixed inset-0 bg-purple-950" />}>
            <ThreeNebula />
        </Suspense>

        {/* A simple, themed back button. In a real app, this would be part of a shared Header. */}
        <header className="fixed top-0 left-0 w-full z-50 p-4">
             <Link to="/" className="inline-flex items-center space-x-2 text-purple-300 hover:text-gold-300 transition-colors duration-300 group glass-header-light p-2 rounded-lg">
                <ChevronLeft size={20} className="transition-transform duration-300 group-hover:-translate-x-1" />
                <span className="font-cinzel font-bold text-sm">Back to Home</span>
            </Link>
        </header>

        <main className="flex-grow container mx-auto px-4 sm:px-6 py-24 md:py-32 relative z-10">
            <div className="text-center mb-16 md:mb-20">
                <h1 className="modern-hero-title" style={{fontSize: 'clamp(2.5rem, 7vw, 5rem)'}}>Explore The <span className="modern-brand-accent">Arena</span></h1>
                <p className="modern-hero-subtitle">
                    Dive into the heart of the competition. View standings, fixtures, and the hall of legends.
                </p>
            </div>

            {/* Themed Grid of Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto">
                {options.map((opt, index) => (
                    <InteractiveCard key={opt.label} className="group" animationDelay={`${index * 100}ms`}>
                        <Link to={opt.path} className="modern-info-card h-full">
                            <div className="modern-card-icon-wrapper">
                                <opt.icon size={40} className="modern-card-icon" />
                            </div>
                            <h2 className="modern-card-title" style={{fontSize: '1.5rem'}}>{opt.label}</h2>
                            {/* The button is part of the card's link structure */}
                        </Link>
                    </InteractiveCard>
                ))}
            </div>

            {/* Themed "Join the Clash" CTA Section */}
            <div className="text-center mt-20 md:mt-24">
                 <Link to="/" className="modern-cta-button inline-block">
                    <span className="relative z-10 flex items-center">
                        <Zap className="mr-3" size={24} /> JOIN THE CLASH
                    </span>
                    <div className="modern-cta-glow"></div>
                </Link>
            </div>
        </main>

        {/* Global styles copied from your Home page for theme consistency */}
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
              background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"%3E%3Cg fill-opacity="0.22"%3E%3Crect fill="%231a0f2e" width="800" height="800"/%3E%3Cg fill="%232c1b4b"%3E%3Ccircle cx="400" cy="400" r="100"/%3E%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
              opacity: 0.025; pointer-events: none; z-index: -1;
            }
            ::-webkit-scrollbar { width: 12px; } ::-webkit-scrollbar-track { background: linear-gradient(to bottom, #1a0f2e, #0a0510); border-radius: 6px; } ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, var(--gold-main), var(--gold-dark)); border-radius: 6px; border: 2px solid #1a0f2e; } ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #fff8e7, var(--gold-main)); }
            
            .glass-header-light { background: rgba(10, 5, 16, 0.5); backdrop-filter: blur(10px); border: 1px solid rgba(255, 223, 128, 0.1); }

            .modern-hero-title { font-size: clamp(3rem, 8vw, 7rem); font-family: 'Cinzel', serif; font-weight: 900; background: linear-gradient(135deg, #fff8e7 0%, var(--gold-main) 25%, var(--gold-dark) 50%, var(--gold-main) 75%, #fff8e7 100%); background-clip: text; -webkit-background-clip: text; color: transparent; margin-bottom: 2rem; line-height: 1.1; letter-spacing: -0.02em; animation: heroFadeIn 1.2s cubic-bezier(0.23, 1, 0.32, 1) 0.3s forwards; }
            .modern-brand-accent { background: linear-gradient(135deg, var(--purple-mid) 0%, var(--purple-light) 100%); background-clip: text; -webkit-background-clip: text; color: transparent; position: relative; }
            .modern-hero-subtitle { font-size: clamp(1.125rem, 2.5vw, 1.5rem); color: var(--purple-light); font-weight: 400; line-height: 1.6; max-w: 42rem; margin: 0 auto; animation: heroFadeIn 1.2s cubic-bezier(0.23, 1, 0.32, 1) 0.6s forwards; }
            
            @keyframes heroFadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            
            .modern-cta-button { position: relative; padding: 1.25rem 3rem; background: linear-gradient(135deg, var(--gold-main) 0%, var(--gold-dark) 100%); color: var(--purple-dark); border: none; border-radius: 16px; font-family: 'Cinzel', serif; font-weight: 700; font-size: 1.125rem; cursor: pointer; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); overflow: hidden; box-shadow: 0 12px 40px rgba(255, 223, 128, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4); text-decoration: none; }
            .modern-cta-button:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 60px rgba(255, 223, 128, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6); }
            .modern-cta-button:active { transform: translateY(-2px) scale(0.98); }
            .modern-cta-glow { position: absolute; inset: -2px; background: linear-gradient(135deg, rgba(255, 223, 128, 0.6), rgba(230, 180, 34, 0.6)); border-radius: 18px; opacity: 0; transition: opacity 0.4s ease; z-index: -1; filter: blur(8px); }
            .modern-cta-button:hover .modern-cta-glow { opacity: 1; }
            
            .modern-card-container { perspective: 2000px; }
            .modern-interactive-card { transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: relative; }
            .modern-reflection { position: absolute; inset: 0; background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.1) 0%, transparent 50%); opacity: 0; transition: opacity 0.4s ease; border-radius: 24px; pointer-events: none; }
            .modern-card-container:hover .modern-reflection { opacity: 1; }
            
            .modern-info-card { background: linear-gradient(135deg, rgba(44, 27, 75, 0.4) 0%, rgba(30, 42, 90, 0.3) 50%, rgba(44, 27, 75, 0.4) 100%); backdrop-filter: blur(20px); border: 1px solid rgba(255, 223, 128, 0.1); border-radius: 24px; padding: 2.5rem; height: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: relative; overflow: hidden; text-decoration: none; }
            .modern-info-card::before { 
                content: ''; 
                position: absolute; 
                inset: 0; 
                background: linear-gradient(135deg, rgba(255, 223, 128, 0.05) 0%, transparent 50%, rgba(255, 223, 128, 0.05) 100%); 
                opacity: 0; 
                transition: opacity 0.4s ease;
                pointer-events: none;
            }
            .group:hover .modern-info-card::before { opacity: 1; }
            .group:hover .modern-info-card { transform: translateY(-8px); border-color: rgba(255, 223, 128, 0.3); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 0 40px rgba(255, 223, 128, 0.1); }
            
            .modern-card-icon-wrapper { position: relative; margin-bottom: 2rem; }
            .modern-card-icon { color: var(--gold-main); transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); filter: drop-shadow(0 0 20px rgba(255, 223, 128, 0.4)); }
            .group:hover .modern-card-icon { transform: scale(1.1); filter: drop-shadow(0 0 30px rgba(255, 223, 128, 0.6)); }
            
            .modern-card-title { font-family: 'Cinzel', serif; font-size: 1.75rem; font-weight: 700; color: var(--gold-main); margin-bottom: 1.5rem; line-height: 1.3; }
        `}</style>
    </div>
  );
};

export default ViewPage;
