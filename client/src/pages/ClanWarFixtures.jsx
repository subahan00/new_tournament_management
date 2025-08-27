import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../services/api'; // Assuming you have a configured axios instance
import { Swords, ShieldCheck, Star, Trophy, ArrowLeft, Loader2, AlertCircle, Users, Zap } from 'lucide-react';

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

const InteractiveCard = ({ children, className = "" }) => {
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

    return (
        <div className={`modern-card-container reveal-animation ${className}`}>
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

const ClanPointsSummary = ({ clanPoints, fixturesAvailable }) => {
    if (fixturesAvailable && Object.keys(clanPoints).length === 0) {
        return (
            <div className="reveal-animation" style={{ animationDelay: '0.2s' }}>
                <h2 className="round-title !text-4xl mb-6">Total Clan Points</h2>
                <div className="max-w-4xl mx-auto">
                    <div className="clan-points-row-empty">
                        <p>Points will be calculated as clan matches are completed.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (Object.keys(clanPoints).length === 0) {
        return null;
    }

    const sortedClans = Object.entries(clanPoints).sort(([, a], [, b]) => b.points - a.points);

    return (
        <div className="reveal-animation" style={{ animationDelay: '0.2s' }}>
            <h2 className="round-title !text-4xl mb-6">Total Clan Points</h2>
            <div className="max-w-4xl mx-auto space-y-3">
                {sortedClans.map(([clanName, data], index) => (
                    <div key={clanName} className="clan-points-row">
                        <div className="flex items-center">
                            <span className="rank">{index + 1}</span>
                            <span className="clan-name-summary">{clanName}</span>
                        </div>
                        <div className="flex items-center">
                             <div className="stats">
                                <span className="stat-win">W: {data.wins}</span>
                                <span className="stat-draw">D: {data.draws}</span>
                                <span className="stat-loss">L: {data.losses}</span>
                            </div>
                            <span className="total-points">{data.points} PTS</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const PointsSystem = () => (
    <InteractiveCard className="reveal-animation" style={{ animationDelay: '0.4s' }}>
        <div className="modern-info-card !p-8">
            <div className="modern-card-icon-wrapper !mb-6"><ShieldCheck size={48} className="modern-card-icon" /></div>
            <h2 className="modern-card-title">Points System</h2>
            <p className="modern-card-desc mb-6">Each victory brings your clan closer to glory. Here's how points are forged in the arena:</p>
            <div className="grid grid-cols-3 gap-4 text-center w-full max-w-md">
                <div className="point-item">
                    <p className="point-value win">+3</p>
                    <p className="point-label">WIN</p>
                </div>
                <div className="point-item">
                    <p className="point-value draw">+1</p>
                    <p className="point-label">DRAW</p>
                </div>
                <div className="point-item">
                    <p className="point-value loss">+0</p>
                    <p className="point-label">LOSS</p>
                </div>
            </div>
        </div>
    </InteractiveCard>
);

const LoadingState = () => (
    <div className="min-h-screen flex items-center justify-center text-center">
        <div>
            <Loader2 className="mx-auto h-16 w-16 text-gold-400 animate-spin" />
            <p className="mt-6 text-xl font-heading text-purple-200 tracking-wider">Loading Tournament Data...</p>
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
// MAIN CLAN WAR FIXTURES COMPONENT
//================================================================================

const ClanWarFixtures = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeRound, setActiveRound] = useState(null);

    const mockAxios = {
        get: (url) => new Promise(resolve => {
            console.log(`Mock GET request to: ${url}`);
            setTimeout(() => {
                const mockData = {
                    success: true,
                    data: {
                        name: "Clash of Titans: Season IV",
                        description: "The ultimate test of skill and strategy. Only one clan will emerge victorious.",
                        status: "Ongoing",
                        totalClans: 16,
                        fixtures: {
                            "Round 1": [
                               { _id: "fixture4", homeClan: { name: "Void Walkers" }, awayClan: { name: "Nightstalkers" }, status: "upcoming", individualMatches: [] },
                               { _id: "fixture5", homeClan: { name: "Solar Sentinels" }, awayClan: { name: "Star Strikers" }, status: "upcoming", individualMatches: [] },
                            ],
                            "Semi-Finals": [
                               { _id: "fixture2", homeClan: { name: "Void Walkers" }, awayClan: { name: "Iron Brigade" }, status: "completed", result: "home", individualMatches: [] },
                               { _id: "fixture3", homeClan: { name: "Solar Sentinels" }, awayClan: { name: "Crimson Guard" }, status: "completed", result: "home", individualMatches: [] },
                            ],
                            "Grand Final": [{
                                _id: "fixture1",
                                homeClan: { name: "Void Walkers" },
                                awayClan: { name: "Solar Sentinels" },
                                status: "completed",
                                result: "home",
                                individualMatches: [
                                    { homePlayer: { name: "Shadow" }, awayPlayer: { name: "Lux" }, homeScore: 2, awayScore: 1, result: "home", status: "completed" },
                                    { homePlayer: { name: "Reaper" }, awayPlayer: { name: "Astra" }, homeScore: 1, awayScore: 1, result: "draw", status: "completed" },
                                    { homePlayer: { name: "Ghost" }, awayPlayer: { name: "Nova" }, homeScore: 0, awayScore: 3, result: "away", status: "completed" },
                                ]
                            }],
                        }
                    }
                };
                resolve({ data: mockData });
            }, 1500);
        })
    };
    
    const api = axios; // Change to mockAxios to test with mock data
    
    const fetchTournamentData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/clan-wars/${id}`);
            if (response.data.success) {
                setData(response.data.data);
            } else {
                setError('Failed to fetch tournament data');
            }
        } catch (err) {
            setError('Error loading tournament data. The battleground is quiet for now.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournamentData();
    }, [id]);

    const sortedRounds = useMemo(() => {
        if (!data?.fixtures) return [];
        const getRoundValue = (roundName) => {
            const lower = roundName.toLowerCase();
            if (lower.includes('final')) return 100;
            if (lower.includes('semi')) return 99;
            if (lower.includes('quarter')) return 98;
            const match = lower.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
        };
        return Object.keys(data.fixtures).sort((a, b) => getRoundValue(a) - getRoundValue(b));
    }, [data]);

    useEffect(() => {
        if (!activeRound && sortedRounds.length > 0) {
            setActiveRound(sortedRounds[0]);
        }
    }, [sortedRounds, activeRound]);

    const clanPoints = useMemo(() => {
        const points = {};
        if (!data?.fixtures) return points;

        const allFixtures = Object.values(data.fixtures).flat();
        const completedFixtures = allFixtures.filter(f => f.status === 'completed');

        const initializeClan = (clanName) => {
            if (!points[clanName]) {
                points[clanName] = { points: 0, wins: 0, draws: 0, losses: 0 };
            }
        };

        completedFixtures.forEach(fixture => {
            const homeClanName = fixture.homeClan?.name;
            const awayClanName = fixture.awayClan?.name;
            if (!homeClanName || !awayClanName) return;

            initializeClan(homeClanName);
            initializeClan(awayClanName);

            if (fixture.result === 'home') {
                points[homeClanName].points += 3;
                points[homeClanName].wins += 1;
                points[awayClanName].losses += 1;
            } else if (fixture.result === 'away') {
                points[awayClanName].points += 3;
                points[awayClanName].wins += 1;
                points[homeClanName].losses += 1;
            } else if (fixture.result === 'draw') {
                points[homeClanName].points += 1;
                points[homeClanName].draws += 1;
                points[awayClanName].points += 1;
                points[awayClanName].draws += 1;
            }
        });
        
        return points;
    }, [data]);

    const calculateLiveFixturePoints = (individualMatches) => {
        if (!individualMatches || individualMatches.length === 0) {
            return { home: 0, away: 0 };
        }

        return individualMatches.reduce((acc, match) => {
            if (match.status !== 'completed') return acc;
            if (match.result === 'home') acc.home += 3;
            else if (match.result === 'away') acc.away += 3;
            else if (match.result === 'draw') {
                acc.home += 1;
                acc.away += 1;
            }
            return acc;
        }, { home: 0, away: 0 });
    };

    const getResultIcon = (result, isHome = true) => {
        if (!result) return null;
        if (result === 'draw') return <span className="font-bold text-yellow-400" title="Draw">D</span>;
        const isWinner = (isHome && result === 'home') || (!isHome && result === 'away');
        return isWinner ? <span className="font-bold text-green-400" title="Win">W</span> : <span className="font-bold text-red-400" title="Loss">L</span>;
    };

    const renderIndividualMatches = (individualMatches) => (
        <div className="mt-6 pt-6 border-t border-purple-400/10 space-y-3">
            <h5 className="font-heading font-semibold text-gold-300 text-center text-lg mb-4">Match Breakdowns</h5>
            {individualMatches.map((match, index) => (
                <div key={index} className="individual-match-row">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="text-sm font-medium text-purple-200 truncate">{match.homePlayer?.name || match.homePlayerName || 'TBD'}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3 px-2 text-sm">
                        {match.status === 'completed' ? (
                            <>
                                {getResultIcon(match.result, true)}
                                <span className="font-mono text-gold-200">{match.homeScore}</span>
                                <span className="text-purple-400/50">-</span>
                                <span className="font-mono text-gold-200">{match.awayScore}</span>
                                {getResultIcon(match.result, false)}
                            </>
                        ) : <span className="text-purple-400 font-mono text-xs">vs</span>}
                    </div>
                    <div className="flex items-center space-x-2 flex-1 justify-end min-w-0">
                        <span className="text-sm font-medium text-purple-200 truncate text-right">{match.awayPlayer?.name || match.awayPlayerName || 'TBD'}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderFixtureCard = (fixture) => {
        const getStatusBadge = () => {
            if (fixture.status === 'completed') return <span className="status-badge completed">Completed</span>;
            if (fixture.status === 'upcoming') return <span className="status-badge upcoming">Upcoming</span>;
            return <span className="status-badge ongoing">Ongoing</span>;
        };

        const livePoints = calculateLiveFixturePoints(fixture.individualMatches);

        return (
            <InteractiveCard key={fixture._id}>
                <div className="fixture-card">
                    <div className="fixture-card-glow"></div>
                    <div className="flex items-center justify-between mb-4">{getStatusBadge()}</div>
                    <div className="grid grid-cols-3 items-center text-center">
                        <div className="flex flex-col items-center">
                            <span className="clan-name">{fixture.homeClan?.name || 'TBD'}</span>
                            {fixture.status === 'completed' && <div className="mt-2 text-lg">{getResultIcon(fixture.result, true)}</div>}
                        </div>
                        <div className="flex flex-col items-center">
                            {fixture.status === 'completed' ? (
                                <div className="clan-score">{fixture.homeClanPoints} : {fixture.awayClanPoints}</div>
                            ) : fixture.status === 'upcoming' ? (
                                <div className="vs-separator"><Swords size={32} className="text-purple-400/50" /></div>
                            ) : (
                                <div className="clan-score">{livePoints.home} : {livePoints.away}</div>
                            )}
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="clan-name">{fixture.awayClan?.name || 'TBD'}</span>
                            {fixture.status === 'completed' && <div className="mt-2 text-lg">{getResultIcon(fixture.result, false)}</div>}
                        </div>
                    </div>
                    {fixture.individualMatches && fixture.individualMatches.length > 0 && renderIndividualMatches(fixture.individualMatches)}
                </div>
            </InteractiveCard>
        );
    };

    const renderFixturesByRound = () => {
        if (!data?.fixtures || !activeRound || !data.fixtures[activeRound]) {
            return (
                <InteractiveCard>
                    <div className="modern-info-card text-center">
                        <Trophy size={48} className="modern-card-icon" />
                        <h2 className="modern-card-title">Awaiting Challengers</h2>
                        <p className="modern-card-desc">Fixtures for this round have not been announced yet.</p>
                    </div>
                </InteractiveCard>
            );
        }
        
        const fixturesForActiveRound = data.fixtures[activeRound];

        return (
            <div className="space-y-6">
                {fixturesForActiveRound.map(fixture => renderFixtureCard(fixture))}
            </div>
        );
    };

    if (loading) return <div className="modern-bg"><LoadingState /></div>;
    if (error) return <div className="modern-bg"><ErrorState error={error} onRetry={fetchTournamentData} /></div>;
    if (!data) return <div className="modern-bg"><ErrorState error="No tournament data found." onRetry={fetchTournamentData} /></div>;

    return (
        <div className="min-h-screen flex flex-col modern-bg text-white overflow-x-hidden">
            <Link to="/clan-wars" className="back-to-home-button">
                <ArrowLeft size={16} /> Back to Arenas
            </Link>
            <Suspense fallback={<div className="fixed inset-0 bg-purple-950" />}><AnimatedBackground /></Suspense>
            
            <main className="flex-grow relative z-10 w-full pt-24 md:pt-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-12 text-center reveal-animation">
                        <h1 className="main-title">{data.name || 'Clan War Tournament'}</h1>
                        <p className="main-subtitle">{data.description}</p>
                        <div className="mt-6 flex flex-wrap gap-4 justify-center">
                            <span className="header-badge"><Trophy size={16} />{data.status || 'Active'}</span>
                            <span className="header-badge"><Users size={16} />{data.totalClans} Clans</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 mb-16">
                        <div className="xl:col-span-2">
                            <ClanPointsSummary clanPoints={clanPoints} fixturesAvailable={data?.fixtures && Object.keys(data.fixtures).length > 0} />
                        </div>
                        <div className="xl:col-span-1">
                             <PointsSystem />
                        </div>
                    </div>
                    
                    <div className="reveal-animation" style={{ animationDelay: '0.6s' }}>
                        <h2 className="round-title !text-4xl mb-8">Fixtures</h2>
                        <div className="flex justify-center flex-wrap gap-3 mb-10">
                            {sortedRounds.map(roundName => (
                                <button
                                    key={roundName}
                                    onClick={() => setActiveRound(roundName)}
                                    className={`round-button ${activeRound === roundName ? 'active' : ''}`}
                                >
                                    {roundName}
                                </button>
                            ))}
                        </div>
                        {renderFixturesByRound()}
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
                .modern-reflection { position: absolute; inset: 0; background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.1) 0%, transparent 50%); opacity: 0; transition: opacity 0.4s ease; border-radius: 24px; pointer-events: none; }
                .modern-card-container:hover .modern-reflection { opacity: 1; }
                .modern-info-card { background: linear-gradient(135deg, rgba(44, 27, 75, 0.4) 0%, rgba(30, 42, 90, 0.3) 50%, rgba(44, 27, 75, 0.4) 100%); backdrop-filter: blur(20px); border: 1px solid rgba(255, 223, 128, 0.1); border-radius: 24px; padding: 2.5rem; height: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: relative; overflow: hidden; }
                .modern-card-icon-wrapper { position: relative; margin-bottom: 2rem; }
                .modern-card-icon { color: var(--gold-main); transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); filter: drop-shadow(0 0 20px rgba(255, 223, 128, 0.4)); }
                .modern-card-title { font-family: var(--font-title); font-size: 2.5rem; color: var(--gold-main); margin-bottom: 1.5rem; line-height: 1.2; letter-spacing: 0.1em; }
                .modern-card-desc { color: var(--purple-light); line-height: 1.6; margin-bottom: 2rem; flex-grow: 1; font-size: 1rem; font-family: var(--font-body); font-weight: 400; }
                
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
                .header-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(44, 27, 75, 0.5); border: 1px solid rgba(255, 223, 128, 0.15); border-radius: 9999px; font-family: var(--font-body); font-size: 0.875rem; font-weight: 500; color: var(--purple-light); }
                .header-badge svg { color: var(--gold-main); }
                
                .clan-points-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: linear-gradient(135deg, rgba(44, 27, 75, 0.2) 0%, rgba(30, 42, 90, 0.15) 100%); border: 1px solid rgba(255, 223, 128, 0.1); border-radius: 12px; }
                .clan-points-row-empty { padding: 2rem 1.5rem; background: linear-gradient(135deg, rgba(44, 27, 75, 0.2) 0%, rgba(30, 42, 90, 0.15) 100%); border: 1px solid rgba(255, 223, 128, 0.1); border-radius: 12px; text-align: center; color: var(--purple-light); font-style: italic; }
                .rank { font-family: var(--font-title); font-size: 1.5rem; color: var(--gold-main); width: 2.5rem; text-align: center; }
                .clan-name-summary { font-family: var(--font-body); font-weight: 600; font-size: 1.1rem; color: #fff; margin-left: 1rem; }
                .stats { display: flex; gap: 1rem; font-size: 0.8rem; font-weight: 500; color: var(--purple-light); }
                .stat-win { color: #4ade80; }
                .stat-draw { color: #facc15; }
                .stat-loss { color: #f87171; }
                .total-points { font-family: var(--font-title); font-size: 1.75rem; color: var(--gold-main); margin-left: 2rem; letter-spacing: 0.05em; }

                .point-item { background: rgba(10, 5, 16, 0.5); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255, 223, 128, 0.1); }
                .point-value { font-family: var(--font-title); font-weight: 400; font-size: 2.5rem; margin-bottom: 0.25rem; }
                .point-value.win { color: #4ade80; }
                .point-value.draw { color: #facc15; }
                .point-value.loss { color: #f87171; }
                .point-label { font-family: var(--font-body); font-weight: 700; font-size: 0.75rem; letter-spacing: 0.1em; color: var(--purple-light); }

                .round-title { font-family: var(--font-title); font-size: 3.5rem; letter-spacing: 0.1em; font-weight: 400; text-align: center; margin-bottom: 2rem; background: linear-gradient(135deg, var(--gold-main) 0%, #fff8e7 100%); background-clip: text; -webkit-background-clip: text; color: transparent; }
                
                .round-button {
                    font-family: var(--font-body); font-weight: 600; font-size: 0.875rem; letter-spacing: 0.05em;
                    padding: 0.6rem 1.5rem; border-radius: 9999px;
                    background: transparent; border: 1px solid rgba(147, 112, 219, 0.3);
                    color: var(--purple-light);
                    transition: all 0.3s ease;
                }
                .round-button:hover {
                    background: rgba(147, 112, 219, 0.2);
                    border-color: rgba(147, 112, 219, 0.5);
                    color: #fff;
                }
                .round-button.active {
                    background: var(--gold-main);
                    border-color: var(--gold-main);
                    color: var(--purple-dark);
                    box-shadow: 0 0 20px rgba(255, 223, 128, 0.4);
                }

                .fixture-card { background: linear-gradient(145deg, rgba(44, 27, 75, 0.6) 0%, rgba(30, 42, 90, 0.5) 100%); backdrop-filter: blur(25px); border: 1px solid rgba(255, 223, 128, 0.15); border-radius: 24px; padding: 2rem; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
                .fixture-card-glow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 24px; background: linear-gradient(120deg, transparent, rgba(255, 223, 128, 0.1), transparent 40%, transparent 60%, rgba(255, 223, 128, 0.1), transparent); background-size: 200% 100%; animation: featuredGlow 8s linear infinite; }
                @keyframes featuredGlow { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                
                .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-family: var(--font-body); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; }
                .status-badge.completed { background-color: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); color: #4ade80; }
                .status-badge.upcoming { background-color: rgba(96, 165, 250, 0.1); border: 1px solid rgba(96, 165, 250, 0.3); color: #60a5fa; }
                .status-badge.ongoing { background-color: rgba(250, 204, 21, 0.1); border: 1px solid rgba(250, 204, 21, 0.3); color: #facc15; }

                .clan-name { font-family: var(--font-title); font-weight: 400; font-size: 2rem; letter-spacing: 0.05em; color: #fff; text-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
                .clan-score { font-family: var(--font-title); font-weight: 400; font-size: 4rem; color: var(--gold-main); text-shadow: 0 0 20px rgba(255, 223, 128, 0.5); letter-spacing: 0.05em; }
                .vs-separator { padding: 1rem; border-radius: 50%; background: rgba(10, 5, 16, 0.5); border: 1px solid rgba(255, 223, 128, 0.1); }
                
                .individual-match-row { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(10, 5, 16, 0.6); border-radius: 12px; border: 1px solid rgba(147, 112, 219, 0.1); }

                @media (max-width: 768px) {
                    .clan-name { font-size: 1.25rem; }
                    .clan-score { font-size: 2.5rem; }
                    .round-title { font-size: 2.5rem; }
                    .main-title { font-size: 3.5rem; }
                    .clan-name-summary { font-size: 1rem; }
                    .total-points { font-size: 1.25rem; margin-left: 1rem; }
                    .stats { display: none; }
                }
            `}</style>
        </div>
    );
};

export default ClanWarFixtures;
