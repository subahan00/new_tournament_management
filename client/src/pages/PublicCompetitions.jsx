import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Loader2, AlertTriangle, Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import competitionService from '../services/competitionService';

const ITEMS_PER_PAGE = 6;

// Re-introducing the animated nebula background
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

    layerConfigs.forEach((config) => {
      const positions = new Float32Array(config.count * 3);
      const colorPurple = new THREE.Color('#2c1b4b');
      const colorGold = new THREE.Color('#ffdf80');

      for (let i = 0; i < config.count * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * config.distance;
        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = r * Math.cos(phi);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        size: config.size,
        color: Math.random() > 0.5 ? colorPurple : colorGold,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.7
      });
      const starField = new THREE.Points(geometry, material);
      layers.push({ mesh: starField, speed: config.speed });
      scene.add(starField);
    });

    const handleMouseMove = (event) => { mouse.current = { x: (event.clientX / window.innerWidth) * 2 - 1, y: -(event.clientY / window.innerHeight) * 2 + 1 }; };
    window.addEventListener('mousemove', handleMouseMove);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      layers.forEach(layer => {
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
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
    };
  }, [isMobile]);

  return <div ref={mountRef} className="fixed inset-0 -z-10" />;
};


// A reusable, themed competition card component with motion
const CompetitionCard = ({ competition }) => {
    const { name, status, startDate, endDate, teamsCount, _id } = competition;
    const statusInfo = {
        Active: { class: 'bg-green-500/20 text-green-300', label: 'Active' },
        Completed: { class: 'bg-gray-500/20 text-gray-300', label: 'Completed' },
        Upcoming: { class: 'bg-yellow-500/20 text-yellow-300', label: 'Upcoming' },
    }[status] || { class: 'bg-purple-500/20 text-purple-300', label: 'Unknown' };

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ y: -5, scale: 1.03 }}
            className="bg-slate-900/50 backdrop-blur-md border border-gold-400/20 rounded-2xl p-6 shadow-lg shadow-gold-500/10 h-full"
        >
            <Link to={`/competitions/${_id}`} className="flex flex-col h-full">
                <div className="flex-grow">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-bold font-cinzel text-gold-300 pr-4">{name}</h3>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusInfo.class}`}>{statusInfo.label}</span>
                    </div>
                    <div className="space-y-3 text-sm text-purple-200 font-lora">
                        <div className="flex items-center"><Calendar size={14} className="mr-3 text-gold-400/70" /><span>{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</span></div>
                        <div className="flex items-center"><Users size={14} className="mr-3 text-gold-400/70" /><span>{teamsCount} Teams</span></div>
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gold-400/20 text-right">
                    <span className="font-cinzel font-bold text-sm text-gold-300 group-hover:text-white transition-colors">View Details →</span>
                </div>
            </Link>
        </motion.div>
    );
};


const Competitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                setLoading(true);
                const data = await competitionService.getAllCompetitions();
                const sorted = [...(data || [])].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
                setCompetitions(sorted);
            } catch (err) {
                console.error(err);
                setError('Failed to load competitions. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchCompetitions();
    }, []);

    const totalPages = Math.ceil(competitions.length / ITEMS_PER_PAGE);
    const paginatedCompetitions = competitions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-16 h-16 border-4 border-gold-400 border-t-transparent rounded-full"
                    />
                </div>
            );
        }

        if (error) {
            return (
                <div className="modern-info-card text-center max-w-lg mx-auto">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="modern-card-title text-red-400">Error Loading Data</h2>
                    <p className="modern-card-desc text-purple-300">{error}</p>
                </div>
            );
        }

        if (paginatedCompetitions.length === 0) {
            return (
                 <div className="modern-info-card text-center max-w-lg mx-auto">
                    <h2 className="modern-card-title">No Competitions Found</h2>
                    <p className="modern-card-desc text-purple-300">Check back later for new tournaments!</p>
                </div>
            );
        }

        return (
            <>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {paginatedCompetitions.map((comp) => (
                        <CompetitionCard key={comp._id} competition={comp} />
                    ))}
                </motion.div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-12 space-x-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="modern-pagination-button disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={20} /></motion.button>
                        <span className="font-cinzel text-gold-300 text-sm">Page {currentPage} of {totalPages}</span>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="modern-pagination-button disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={20} /></motion.button>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="min-h-screen flex flex-col modern-bg text-white font-serif overflow-x-hidden">
            <Suspense fallback={<div className="fixed inset-0 bg-purple-950" />}>
                <ThreeNebula />
            </Suspense>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />
            
            <main className="flex-grow container mx-auto px-4 sm:px-6 py-24 md:py-32 relative z-10">
                <header className="text-center mb-12 md:mb-16">
                    <motion.h1 initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="modern-hero-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>Tournaments</motion.h1>
                    <motion.p initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' }} className="modern-hero-subtitle">Browse all available arenas of competition.</motion.p>
                </header>
                {renderContent()}
            </main>

            <style jsx global>{`
                :root { --purple-dark: #2c1b4b; --purple-mid: #4a2a6c; --purple-light: #8b7bb8; --gold-main: #ffdf80; --gold-dark: #e6b422; }
                .font-cinzel { font-family: 'Cinzel', serif; } .font-lora { font-family: 'Lora', serif; }
                .modern-bg { background-color: #0a0510; position: relative; overflow-x: hidden; font-family: 'Lora', serif; }
                ::-webkit-scrollbar { width: 12px; } ::-webkit-scrollbar-track { background: linear-gradient(to bottom, #1a0f2e, #0a0510); border-radius: 6px; } ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, var(--gold-main), var(--gold-dark)); border-radius: 6px; border: 2px solid #1a0f2e; } ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #fff8e7, var(--gold-main)); }
                .modern-hero-title { font-size: clamp(3rem, 8vw, 7rem); font-family: 'Cinzel', serif; font-weight: 900; background: linear-gradient(135deg, #fff8e7 0%, var(--gold-main) 25%, var(--gold-dark) 50%, var(--gold-main) 75%, #fff8e7 100%); background-clip: text; -webkit-background-clip: text; color: transparent; margin-bottom: 1rem; line-height: 1.1; letter-spacing: -0.02em; }
                .modern-hero-subtitle { font-size: clamp(1.125rem, 2.5vw, 1.5rem); color: var(--purple-light); font-weight: 400; line-height: 1.6; max-w: 42rem; margin: 0 auto; }
                .modern-info-card { background: linear-gradient(135deg, rgba(44, 27, 75, 0.4) 0%, rgba(30, 42, 90, 0.3) 50%, rgba(44, 27, 75, 0.4) 100%); backdrop-filter: blur(20px); border: 1px solid rgba(255, 223, 128, 0.1); border-radius: 24px; padding: 1.5rem; text-decoration: none; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
                .modern-info-card:hover { transform: translateY(-8px); border-color: rgba(255, 223, 128, 0.3); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 0 40px rgba(255, 223, 128, 0.1); }
                .modern-card-title { font-family: 'Cinzel', serif; font-size: 1.75rem; font-weight: 700; color: var(--gold-main); line-height: 1.3; }
                .modern-card-desc { color: var(--purple-light); line-height: 1.6; font-size: 1rem; }
                .modern-pagination-button { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: rgba(44, 27, 75, 0.5); border: 1px solid rgba(255, 223, 128, 0.2); color: var(--gold-main); transition: all 0.3s ease; }
                .modern-pagination-button:not(:disabled):hover { background: rgba(255, 223, 128, 0.15); }
            `}</style>
        </div>
    );
};

export default Competitions;
