import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RefreshCw, Play, ExternalLink, Clock, Tv } from 'lucide-react';
import axios from '../services/api';
import { Link } from "react-router-dom";

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

const ViewLinks = () => {
    const [liveLinks, setLiveLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLiveLinks();
        const interval = setInterval(fetchLiveLinks, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Mock API call for demonstration
    const fetchLiveLinks = async () => {
        try {
            // Replace this with your actual API call
            const response = await axios.get('/livelinks');
            setLiveLinks(response.data);

            // Mock data for demonstration

            setError('');
        } catch (error) {
            console.error('Error fetching live links:', error);
            setError('Failed to fetch live links');
        } finally {
            setLoading(false);
        }
    };

    const getTimeRemaining = (expiresAt) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires - now;

        if (diff <= 0) return { expired: true, text: 'Expired' };

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return {
            expired: false,
            text: `${hours}h ${minutes}m remaining`,
            urgent: hours < 1
        };
    };

    const handleLinkClick = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (loading) {
        return (
            <div className="min-h-screen modern-bg flex items-center justify-center">
                {/* Font links */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700&family=Orbitron:wght@700;900&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />

                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-2 border-transparent border-t-gold-main mx-auto mb-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-purple-light m-1"></div>
                    </div>
                    <p className="text-white text-xl font-poppins font-medium">Loading live games...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen modern-bg text-white overflow-x-hidden">
            {/* Font links */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700&family=Orbitron:wght@700;900&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />

            {/* Header */}
            <header className="fixed top-0 left-0 w-full z-50 p-3 md:p-4">
                <div className="glass-header-light backdrop-blur-md border border-gold-main/10 rounded-2xl px-3 py-2 md:p-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto relative">

                        {/* Left - Back Button */}
                        <Link
                            to="/"
                            className="inline-flex items-center space-x-1 md:space-x-2 text-purple-light hover:text-gold-main transition-colors duration-300 group"
                        >
                            <ChevronLeft
                                size={18}
                                className="transition-transform duration-300 group-hover:-translate-x-1"
                            />
                            <span className="font-poppins font-semibold text-xs md:text-sm tracking-wide">
                            </span>
                        </Link>

                        {/* Center - Title */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 text-center max-w-[80%]">
                            <h1 className="text-lg md:text-2xl lg:text-3xl font-orbitron font-bold text-gold-main truncate">
                                ⚽ Live Football Streams
                            </h1>
                            <p className="hidden sm:block text-purple-light text-xs md:text-sm font-poppins">
                                Watch your favorite matches live - Links auto-expire after 8 hours
                            </p>
                        </div>

                        {/* Right - Spacer for symmetry */}
                        <div className="w-12 md:w-32"></div>
                    </div>
                </div>
            </header>



            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 py-32 md:py-40 relative z-10">
                {error && (
                    <InteractiveCard className="mb-8 max-w-2xl mx-auto">
                        <div className="modern-error-card">
                            <div className="text-center">
                                <div className="text-4xl mb-4">⚠️</div>
                                <h3 className="text-xl font-orbitron font-bold text-red-300 mb-2">Connection Error</h3>
                                <p className="text-purple-light mb-4 font-poppins">{error}</p>
                                <button
                                    onClick={fetchLiveLinks}
                                    className="modern-retry-button"
                                >
                                    <RefreshCw size={18} className="mr-2" />
                                    Retry Connection
                                </button>
                            </div>
                        </div>
                    </InteractiveCard>
                )}

                {liveLinks.length === 0 && !loading && !error && (
                    <InteractiveCard className="max-w-2xl mx-auto">
                        <div className="modern-empty-state">
                            <div className="text-center py-12">
                                <div className="text-6xl mb-6">
                                    <Tv className="mx-auto text-purple-light" size={80} />
                                </div>
                                <h3 className="text-3xl font-orbitron font-bold text-gold-main mb-4">No Live Games</h3>
                                <p className="text-purple-light font-poppins text-lg leading-relaxed">
                                    No football matches are currently streaming. The arena awaits the next battle!
                                </p>
                            </div>
                        </div>
                    </InteractiveCard>
                )}

                {liveLinks.length > 0 && (
                    <>
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center space-x-3 glass-header-light px-6 py-3 rounded-full border border-gold-main/20">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <p className="text-gold-main font-poppins font-semibold">
                                    {liveLinks.length} Live Game{liveLinks.length !== 1 ? 's' : ''} Available
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-8 md:gap-10 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto">
                            {liveLinks.map((link, index) => {
                                const timeRemaining = getTimeRemaining(link.expiresAt);

                                return (
                                    <InteractiveCard key={link._id} className="group" animationDelay={`${index * 100}ms`}>
                                        <div className="modern-stream-card">
                                            {/* Image Container with flexible bigger aspect ratio */}
                                            <div className="relative w-full mb-6 overflow-hidden rounded-xl bg-purple-dark/30">
                                                <div className="relative w-full pt-[75%]">
                                                    {/* 4:3 ratio → taller than 16:9 */}
                                                    <img
                                                        src={link.image.url}
                                                        alt={link.title}
                                                        className="absolute top-0 left-0 w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                </div>

                                                {/* LIVE badge */}
                                                <div className="absolute top-3 right-3">
                                                    <span className="bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-inter font-bold flex items-center border border-red-400/30">
                                                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                                        LIVE
                                                    </span>
                                                </div>

                                                {/* Timer badge */}
                                                <div className="absolute bottom-3 left-3">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-inter font-medium backdrop-blur-sm border ${timeRemaining.expired
                                                            ? "bg-red-600/90 text-white border-red-400/30"
                                                            : timeRemaining.urgent
                                                                ? "bg-orange-500/90 text-white border-orange-400/30"
                                                                : "bg-green-600/90 text-white border-green-400/30"
                                                            }`}
                                                    >
                                                        <Clock size={12} className="inline mr-1" />
                                                        {timeRemaining.text}
                                                    </span>
                                                </div>
                                            </div>


                                            {/* Content */}
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-orbitron font-bold text-gold-main leading-tight line-clamp-2">
                                                    {link.title}
                                                </h3>
                                                <p className="text-purple-light font-poppins text-sm leading-relaxed line-clamp-3">
                                                    {link.description}
                                                </p>

                                                {/* Stream Links */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-2">
                                                        <Play size={16} className="text-gold-main" />
                                                        <p className="text-gold-main font-poppins font-semibold text-sm">
                                                            Available Streams:
                                                        </p>
                                                    </div>
                                                    {link.links.map((streamLink, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleLinkClick(streamLink.url)}
                                                            className="modern-stream-button group/btn"
                                                        >
                                                            <span className="flex items-center">
                                                                <Play size={18} className="mr-2" />
                                                                {streamLink.platform}
                                                            </span>
                                                            <ExternalLink size={16} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Footer Info */}
                                                <div className="pt-4 border-t border-gold-main/20">
                                                    <p className="text-purple-light/80 font-poppins text-xs text-center">
                                                        Posted {new Date(link.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </InteractiveCard>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Refresh Button */}
                <div className="text-center mt-16">
                    <button
                        onClick={fetchLiveLinks}
                        className="modern-refresh-button inline-flex items-center"
                    >
                        <RefreshCw size={20} className="mr-2" />
                        Refresh Games
                        <div className="modern-button-glow"></div>
                    </button>
                    <p className="text-purple-light/80 font-poppins text-sm mt-3">
                        Auto-refreshes every 5 minutes
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="glass-header-light border-t border-gold-main/10 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center space-y-2">
                        <p className="text-purple-light font-poppins">⚽ Enjoy the game! Links are automatically removed after 8 hours.</p>
                        <p className="text-purple-light/80 font-poppins text-sm">🔒 All external links open in new tabs for your safety.</p>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                :root { 
                    --purple-dark: #2c1b4b; 
                    --purple-mid: #4a2a6c; 
                    --purple-light: #8b7bb8; 
                    --gold-main: #ffdf80; 
                    --gold-dark: #e6b422; 
                }
                
                /* Font Helper Classes */
                .font-orbitron { font-family: 'Orbitron', sans-serif; }
                .font-inter { font-family: 'Inter', sans-serif; }
                .font-poppins { font-family: 'Poppins', sans-serif; }

                .modern-bg {
                    background-color: #0a0510;
                    background-image: linear-gradient(160deg, #0a0510 0%, #1a0f2e 40%, #1a0f2e 60%, #0a0510 100%);
                    position: relative;
                    overflow-x: hidden;
                    font-family: 'Poppins', sans-serif;
                }
                
                .modern-bg::after {
                    content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    width: 100vw; height: 100vh;
                    background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"%3E%3Cg fill-opacity="0.22"%3E%3Crect fill="%231a0f2e" width="800" height="800"/%3E%3Cg fill="%232c1b4b"%3E%3Ccircle cx="400" cy="400" r="100"/%3E%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
                    opacity: 0.025; pointer-events: none; z-index: -1;
                }

                .glass-header-light { 
                    background: rgba(10, 5, 16, 0.7); 
                    backdrop-filter: blur(15px); 
                    border: 1px solid rgba(255, 223, 128, 0.1); 
                }

                .modern-card-container { perspective: 2000px; }
                .modern-interactive-card { 
                    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); 
                    position: relative; 
                }
                
                .modern-reflection { 
                    position: absolute; inset: 0; 
                    background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.1) 0%, transparent 50%); 
                    opacity: 0; transition: opacity 0.4s ease; border-radius: 24px; pointer-events: none; 
                }
                .modern-card-container:hover .modern-reflection { opacity: 1; }

                .modern-stream-card {
                    background: linear-gradient(135deg, rgba(44, 27, 75, 0.4) 0%, rgba(30, 42, 90, 0.3) 50%, rgba(44, 27, 75, 0.4) 100%);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 223, 128, 0.1);
                    border-radius: 24px;
                    padding: 2rem;
                    height: 100%;
                    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                    position: relative;
                    overflow: hidden;
                }

                .modern-stream-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255, 223, 128, 0.05) 0%, transparent 50%, rgba(255, 223, 128, 0.05) 100%);
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    pointer-events: none;
                }

                .group:hover .modern-stream-card::before { opacity: 1; }
                .group:hover .modern-stream-card {
                    transform: translateY(-8px);
                    border-color: rgba(255, 223, 128, 0.3);
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 0 40px rgba(255, 223, 128, 0.1);
                }

                .modern-stream-button {
                    width: 100%;
                    background: linear-gradient(135deg, var(--gold-main) 0%, var(--gold-dark) 100%);
                    color: var(--purple-dark);
                    border: none;
                    border-radius: 12px;
                    padding: 0.75rem 1rem;
                    font-family: 'Inter', sans-serif;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
                    display: flex;
                    items-center: center;
                    justify-content: space-between;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(255, 223, 128, 0.2);
                }

                .modern-stream-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(255, 223, 128, 0.3);
                    background: linear-gradient(135deg, #fff8e7 0%, var(--gold-main) 100%);
                }

                .modern-stream-button:active {
                    transform: translateY(0px);
                }

                .modern-error-card, .modern-empty-state {
                    background: linear-gradient(135deg, rgba(44, 27, 75, 0.4) 0%, rgba(30, 42, 90, 0.3) 50%, rgba(44, 27, 75, 0.4) 100%);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 223, 128, 0.1);
                    border-radius: 24px;
                    padding: 2.5rem;
                }

                .modern-retry-button {
                    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 0.75rem 1.5rem;
                    font-family: 'Inter', sans-serif;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                }

                .modern-retry-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
                }

                .modern-refresh-button {
                    position: relative;
                    padding: 1rem 2rem;
                    background: linear-gradient(135deg, rgba(44, 27, 75, 0.6) 0%, rgba(30, 42, 90, 0.5) 100%);
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 223, 128, 0.2);
                    color: var(--gold-main);
                    border-radius: 16px;
                    font-family: 'Inter', sans-serif;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                    overflow: hidden;
                    letter-spacing: 0.025em;
                }

                .modern-refresh-button:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 223, 128, 0.4);
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2), 0 0 30px rgba(255, 223, 128, 0.1);
                }

                .modern-button-glow {
                    position: absolute;
                    inset: -2px;
                    background: linear-gradient(135deg, rgba(255, 223, 128, 0.3), rgba(230, 180, 34, 0.3));
                    border-radius: 18px;
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    z-index: -1;
                    filter: blur(6px);
                }

                .modern-refresh-button:hover .modern-button-glow {
                    opacity: 1;
                }

                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                ::-webkit-scrollbar { width: 12px; }
                ::-webkit-scrollbar-track { background: linear-gradient(to bottom, #1a0f2e, #0a0510); border-radius: 6px; }
                ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, var(--gold-main), var(--gold-dark)); border-radius: 6px; border: 2px solid #1a0f2e; }
                ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #fff8e7, var(--gold-main)); }
            `}</style>
        </div>
    );
};

export default ViewLinks;