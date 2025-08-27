import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../services/api'; // Assuming you have a configured axios instance
import { Swords, Trophy, ArrowLeft, Loader2, AlertCircle, Users, Zap, Activity, CheckCircle, Clock } from 'lucide-react';

//================================================================================
// STYLED & THEMED COMPONENTS
//================================================================================

const AnimatedBackground = () => (
    <div className="fixed inset-0 -z-20 overflow-hidden">
        <div className="animated-gradient-bg"></div>
        <div className="particles">
            {[...Array(25)].map((_, i) => <div key={i} className="particle"></div>)}
        </div>
    </div>
);

const InteractiveCard = ({ children, className = "", onClick }) => {
    const cardRef = useRef(null);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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

    // Use a regular div that can be clicked, as Link navigation is handled by the parent
    return (
        <div className={`modern-card-container reveal-animation ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
            <div ref={cardRef} className="h-full w-full modern-interactive-card">
                {children}
                {!isMobile && <div className="modern-reflection" />}
            </div>
        </div>
    );
};


//================================================================================
// PAGE SPECIFIC COMPONENTS
//================================================================================

const StatCard = ({ icon: Icon, label, value, delay }) => (
    <div className="reveal-animation" style={{ animationDelay: delay }}>
        <div className="stat-card">
            <div className="stat-card-icon"><Icon size={24} /></div>
            <div className="ml-4">
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
            </div>
        </div>
    </div>
);

const LoadingState = () => (
    <div className="min-h-screen flex items-center justify-center text-center">
        <div>
            <Loader2 className="mx-auto h-16 w-16 text-gold-400 animate-spin" />
            <p className="mt-6 text-xl font-heading text-purple-200 tracking-wider">Loading Arenas...</p>
        </div>
    </div>
);

const ErrorState = ({ error, onRetry }) => (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
            <AlertCircle className="mx-auto h-16 w-16 text-red-400" />
            <p className="mt-6 text-xl font-heading text-red-300 tracking-wider">An Error Occurred</p>
            <p className="mt-2 text-purple-300 font-body">{error}</p>
            <button onClick={onRetry} className="modern-cta-button !px-8 !py-3 !text-base mt-8">
                <span className="relative z-10">Retry</span>
                <div className="modern-cta-glow"></div>
            </button>
        </div>
    </div>
);

//================================================================================
// MAIN CLAN WAR VIEW COMPONENT
//================================================================================

const ClanWarView = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const mockAxios = {
        get: (url) => new Promise(resolve => {
            console.log(`Mock GET request to: ${url}`);
            setTimeout(() => {
                const mockData = {
                    success: true,
                    data: [
                        { _id: '1', name: 'Season IV: Clash of Titans', status: 'ongoing', isCompleted: false, clansCount: 16, numberOfPlayers: 80, createdAt: new Date().toISOString(), totalFixtures: 15, completedFixtures: 8, progress: 53 },
                        { _id: '2', name: 'Winter Gauntlet 2025', status: 'completed', isCompleted: true, clansCount: 8, numberOfPlayers: 40, createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), totalFixtures: 7, completedFixtures: 7, progress: 100, winnerClan: { name: 'Solar Sentinels' } },
                        { _id: '3', name: 'The Ascension Tournament', status: 'upcoming', isCompleted: false, clansCount: 32, numberOfPlayers: 160, createdAt: new Date(Date.now() + 86400000 * 14).toISOString(), totalFixtures: 31, completedFixtures: 0, progress: 0 },
                    ]
                };
                resolve({ data: mockData });
            }, 1500);
        })
    };

    const api = axios; // Change to mockAxios to test

    const fetchCompetitions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/clan-wars');
            if (response.data.success) {
                setCompetitions(response.data.data);
            } else {
                setError('Failed to fetch competitions');
            }
        } catch (err) {
            setError('Error loading competitions');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const getStatusBadge = (status, isCompleted) => {
        if (isCompleted) {
            return <span className="status-badge completed">Completed</span>;
        }
        switch (status) {
            case 'upcoming': return <span className="status-badge upcoming">Upcoming</span>;
            case 'ongoing': return <span className="status-badge ongoing">Ongoing</span>;
            default: return <span className="status-badge unknown">Unknown</span>;
        }
    };

    const handleCompetitionClick = (competitionId) => {
        navigate(`/clan-wars/${competitionId}`);
    };

    if (loading) return <div className="modern-bg"><LoadingState /></div>;
    if (error) return <div className="modern-bg"><ErrorState error={error} onRetry={fetchCompetitions} /></div>;

    return (
        <div className="min-h-screen flex flex-col modern-bg text-white overflow-x-hidden">
            <Link to="/" className="back-to-home-button">
                <ArrowLeft size={16} /> Back to Home
            </Link>
            <Suspense fallback={<div className="fixed inset-0 bg-purple-950" />}><AnimatedBackground /></Suspense>
            
            <main className="flex-grow relative z-10 w-full pt-24 md:pt-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-12 text-center reveal-animation">
                        <h1 className="main-title">Clan War Arenas</h1>
                        <p className="main-subtitle">View all clan war competitions and their current status. Choose your battleground.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        <StatCard icon={Trophy} label="Total Arenas" value={competitions.length} delay="0.1s" />
                        <StatCard icon={Activity} label="Ongoing" value={competitions.filter(c => c.status === 'ongoing').length} delay="0.2s" />
                        <StatCard icon={CheckCircle} label="Completed" value={competitions.filter(c => c.isCompleted).length} delay="0.3s" />
                        <StatCard icon={Users} label="Total Clans" value={competitions.reduce((sum, c) => sum + (c.clansCount || 0), 0)} delay="0.4s" />
                    </div>

                    <div className="space-y-8">
                        {competitions.map((competition, index) => (
                            <InteractiveCard key={competition._id} onClick={() => handleCompetitionClick(competition._id)} className="reveal-animation" style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
                                <div className="competition-card">
                                    <div className="competition-card-glow"></div>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-4">
                                                <h3 className="competition-title">{competition.name}</h3>
                                                {getStatusBadge(competition.status, competition.isCompleted)}
                                            </div>
                                            <div className="mt-3 flex items-center flex-wrap gap-x-6 gap-y-2 text-sm text-purple-300">
                                                <div className="flex items-center"><Users size={14} className="mr-1.5 text-gold-400/70" /> {competition.clansCount} Clans</div>
                                                <div className="flex items-center"><Clock size={14} className="mr-1.5 text-gold-400/70" /> Started: {new Date(competition.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 w-full md:w-auto">
                                            {competition.winnerClan ? (
                                                <div className="winner-display">
                                                    <Trophy size={16} className="text-yellow-400" />
                                                    <span>Winner: {competition.winnerClan.name}</span>
                                                </div>
                                            ) : competition.totalFixtures > 0 && (
                                                <div className="w-full md:w-64">
                                                    <div className="flex justify-between text-xs font-semibold text-purple-200 mb-1">
                                                        <span>Progress</span>
                                                        <span>{competition.progress}%</span>
                                                    </div>
                                                    <div className="progress-bar-bg">
                                                        <div className="progress-bar-fg" style={{ width: `${competition.progress}%` }}></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </InteractiveCard>
                        ))}
                    </div>
                </div>
            </main>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Exo+2:wght@300;400;500;600;700&display=swap');
                
                :root { 
                    --purple-dark: #2c1b4b; 
                    --purple-mid: #4a2a6c; 
                    --purple-light: #8b7bb8; 
                    --gold-main: #ffdf80; 
                    --gold-dark: #e6b422; 
                    --font-title: 'Bebas Neue', cursive;
                    --font-body: 'Exo 2', sans-serif;
                }

                .font-title { font-family: var(--font-title); }
                .font-body { font-family: var(--font-body); }
                .modern-bg { background-color: #0a0510; position: relative; overflow-x: hidden; font-family: var(--font-body); }
                
                .animated-gradient-bg {
                    width: 100%; height: 100%; position: absolute; top: 0; left: 0;
                    background: linear-gradient(315deg, #0a0510, #1a0f2e, #2c1b4b, #1a0f2e, #0a0510);
                    background-size: 400% 400%; animation: gradient-animation 25s ease infinite;
                }
                @keyframes gradient-animation { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                
                .particles { position: absolute; inset: 0; z-index: 1; }
                .particle { position: absolute; background-color: var(--gold-main); border-radius: 50%; opacity: 0; animation: float 20s infinite linear; }
                @keyframes float { 0% { transform: translateY(100vh) scale(0); opacity: 0; } 1% { opacity: 0.3; } 90% { opacity: 0.3; } 100% { transform: translateY(-100vh) scale(1); opacity: 0; } }
                .particle:nth-child(1) { width: 3px; height: 3px; left: 5%; animation-delay: -2s; animation-duration: 22s; }
                .particle:nth-child(2) { width: 2px; height: 2px; left: 15%; animation-delay: -5s; animation-duration: 25s; }
                .particle:nth-child(3) { width: 4px; height: 4px; left: 25%; animation-delay: -8s; animation-duration: 18s; }
                .particle:nth-child(4) { width: 2px; height: 2px; left: 35%; animation-delay: -1s; animation-duration: 28s; }
                .particle:nth-child(5) { width: 3px; height: 3px; left: 45%; animation-delay: -12s; animation-duration: 21s; }
                
                .modern-cta-button { position: relative; padding: 1rem 2.5rem; background: linear-gradient(135deg, var(--gold-main) 0%, var(--gold-dark) 100%); color: var(--purple-dark); border: none; border-radius: 16px; font-family: var(--font-body); font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); overflow: hidden; box-shadow: 0 12px 40px rgba(255, 223, 128, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4); letter-spacing: 0.025em; }
                .modern-cta-button:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 60px rgba(255, 223, 128, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6); }
                .modern-cta-glow { position: absolute; inset: -2px; background: linear-gradient(135deg, rgba(255, 223, 128, 0.6), rgba(230, 180, 34, 0.6)); border-radius: 18px; opacity: 0; transition: opacity 0.4s ease; z-index: -1; filter: blur(8px); }
                .modern-cta-button:hover .modern-cta-glow { opacity: 1; }
                .modern-card-container { perspective: 2000px; }
                .modern-interactive-card { transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: relative; }
                .modern-reflection { position: absolute; inset: 0; background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.1) 0%, transparent 50%); opacity: 0; transition: opacity 0.4s ease; border-radius: 16px; pointer-events: none; }
                .modern-card-container:hover .modern-reflection { opacity: 1; }
                
                .reveal-animation {
                    opacity: 0;
                    transform: translateY(40px) scale(0.98);
                    animation: reveal 1s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards;
                }
                @keyframes reveal {
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .back-to-home-button {
                    position: fixed; top: 1.5rem; left: 1.5rem; z-index: 50;
                    display: inline-flex; align-items: center; gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    background: rgba(10, 5, 16, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 223, 128, 0.2);
                    border-radius: 9999px;
                    color: var(--purple-light);
                    font-family: var(--font-body);
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }
                .back-to-home-button:hover {
                    background: rgba(255, 223, 128, 0.1);
                    color: var(--gold-main);
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(255, 223, 128, 0.2);
                }

                .main-title { font-family: var(--font-title); font-size: clamp(3rem, 10vw, 6rem); letter-spacing: 0.1em; font-weight: 400; background: linear-gradient(135deg, #fff8e7 0%, var(--gold-main) 50%, var(--gold-dark) 100%); background-clip: text; -webkit-background-clip: text; color: transparent; margin-bottom: 1rem; line-height: 1.1; }
                .main-subtitle { font-size: clamp(1rem, 2.5vw, 1.25rem); color: var(--purple-light); font-weight: 400; line-height: 1.6; max-width: 42rem; margin: 0 auto 1.5rem; font-family: var(--font-body); }
                
                .stat-card { display: flex; align-items: center; background: linear-gradient(135deg, rgba(44, 27, 75, 0.2) 0%, rgba(30, 42, 90, 0.15) 100%); border: 1px solid rgba(255, 223, 128, 0.1); border-radius: 16px; padding: 1.5rem; }
                .stat-card-icon { flex-shrink: 0; width: 3rem; height: 3rem; display: flex; align-items: center; justify-content: center; background: rgba(255, 223, 128, 0.1); border-radius: 50%; color: var(--gold-main); }
                .stat-label { font-size: 0.875rem; color: var(--purple-light); font-weight: 500; }
                .stat-value { font-family: var(--font-title); font-size: 2rem; color: #fff; line-height: 1; letter-spacing: 0.05em; }

                .competition-card { background: linear-gradient(145deg, rgba(44, 27, 75, 0.6) 0%, rgba(30, 42, 90, 0.5) 100%); backdrop-filter: blur(25px); border: 1px solid rgba(255, 223, 128, 0.15); border-radius: 24px; padding: 1.5rem 2rem; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); transition: all 0.3s ease; }
                .modern-card-container:hover .competition-card { border-color: rgba(255, 223, 128, 0.4); transform: translateY(-5px); }
                .competition-card-glow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 24px; background: linear-gradient(120deg, transparent, rgba(255, 223, 128, 0.1), transparent 40%, transparent 60%, rgba(255, 223, 128, 0.1), transparent); background-size: 200% 100%; animation: featuredGlow 8s linear infinite; }
                @keyframes featuredGlow { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                
                .competition-title { font-family: var(--font-title); font-size: 2rem; letter-spacing: 0.05em; color: #fff; }
                
                .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-family: var(--font-body); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; }
                .status-badge.completed { background-color: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); color: #4ade80; }
                .status-badge.upcoming { background-color: rgba(96, 165, 250, 0.1); border: 1px solid rgba(96, 165, 250, 0.3); color: #60a5fa; }
                .status-badge.ongoing { background-color: rgba(250, 204, 21, 0.1); border: 1px solid rgba(250, 204, 21, 0.3); color: #facc15; }

                .winner-display { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(250, 204, 21, 0.1); border: 1px solid rgba(250, 204, 21, 0.3); border-radius: 9999px; font-weight: 600; color: #facc15; }
                .progress-bar-bg { background: rgba(10, 5, 16, 0.6); border-radius: 9999px; height: 0.5rem; overflow: hidden; border: 1px solid rgba(147, 112, 219, 0.1); }
                .progress-bar-fg { background: linear-gradient(90deg, var(--gold-dark) 0%, var(--gold-main) 100%); height: 100%; border-radius: 9999px; transition: width 0.5s ease; }

            `}</style>
        </div>
    );
};

export default ClanWarView;
