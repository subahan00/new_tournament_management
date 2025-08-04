import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Link, useParams } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import competitionService from '../services/competitionService';
// Import icons from lucide-react
import {
    CalendarDays,
    ChevronLeft,
    Clock,
    Loader,
    Search,
    Swords,
    Info,
} from 'lucide-react';

// Initialize Socket.IO connection
const socket = io(`${process.env.REACT_APP_BACKEND_URL}`);

//=================================================================
// UTILITY & HELPER COMPONENTS
//=================================================================

const useScrollAnimation = () => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (ref.current) { observer.observe(ref.current); }
    return () => { if (ref.current) { observer.unobserve(ref.current); } };
  }, []);
  return [ref, isInView];
};

const InteractiveCard = ({ children, className = "", animationDelay = '0ms', as: Component = 'div' }) => {
  const [scrollRef, isInView] = useScrollAnimation();
  return (
    <Component ref={scrollRef} style={{ transitionDelay: animationDelay }}
      className={`transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>
      <div className="h-full w-full modern-interactive-card">
        {children}
      </div>
    </Component>
  );
};

const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

const getStatusInfo = (status) => {
    switch (status) {
        case 'Live':
        case 'live':
            return { text: 'LIVE', className: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' };
        case 'Finished':
        case 'finished':
            return { text: 'Finished', className: 'bg-green-500/10 text-green-400 border-green-500/20' };
        default:
            return { text: 'Upcoming', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    }
};

//=================================================================
// FIXTURE CARD COMPONENT
//=================================================================

const FixtureCard = memo(({ fixture }) => {
    const statusInfo = getStatusInfo(fixture.status);
    const matchDate = new Date(fixture.matchDate);
    
    // As of August 4th, 2025, India (IST is GMT+5:30)
    const timeOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true };
    const dateOptions = { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' };

    return (
        <div className="fixture-card group">
            <div className="flex justify-between items-start text-xs mb-3">
                 <div className="flex items-center space-x-2 text-purple-light/80">
                    <CalendarDays size={14} />
                    <span>{matchDate.toLocaleDateString('en-IN', dateOptions)}</span>
                </div>
                <div className={`status-badge ${statusInfo.className}`}>
                    {statusInfo.text}
                </div>
            </div>

            <div className="flex items-center justify-between my-4">
                <span className="player-name">{fixture.homePlayerName || 'TBD'}</span>
                {fixture.status === 'Finished' ? (
                    <span className="score-display">{fixture.homeScore ?? '-'} : {fixture.awayScore ?? '-'}</span>
                ) : (
                    <span className="vs-text">vs</span>
                )}
                <span className="player-name">{fixture.awayPlayerName || 'TBD'}</span>
            </div>

            <div className="flex items-center justify-center text-xs text-purple-light/80 space-x-2 mt-3">
                <Clock size={14} />
                <span>{matchDate.toLocaleTimeString('en-IN', timeOptions)}</span>
            </div>
        </div>
    );
});
FixtureCard.displayName = 'FixtureCard';


//=================================================================
// MAIN COMPONENT
//=================================================================

export default function CompetitionFixtures() {
  const { competitionId } = useParams();
  const [fixturesByRound, setFixturesByRound] = useState({});
  const [competitionName, setCompetitionName] = useState('Competition');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

 const fetchFixtures = useCallback(async () => {
  try {
    setLoading(true);
    const res = await fixtureService.getCompetitionFixtures(competitionId);
    const payload = res?.data || {};
    const data = payload.data || [];

    // Try to get name from fixtures response first
    let name =
      payload.competitionName || 
      payload.competition?.name || 
      payload.competition_name;

    // If still missing, fetch competition details
    if (!name) {
      try {
        const compRes = await competitionService.getCompetition(competitionId);
        console.log('data',compRes);
        const compPayload = compRes?.data || {};
        name =
          compPayload.name ||
          compPayload.competitionName ||
          compPayload.competition?.name ||
          name; // fallback to whatever was before
      } catch (e) {
        console.warn("Failed to fetch competition metadata, using fallback name.", e);
      }
    }

    console.log("Fetched fixtures:", payload);

    const grouped = data.reduce((acc, fixture) => {
      const round = fixture.round || "1";
      if (!acc[round]) acc[round] = [];
      acc[round].push(fixture);
      return acc;
    }, {});

    for (const round in grouped) {
      grouped[round] = shuffleArray(grouped[round]);
    }

    setFixturesByRound(grouped);
    setCompetitionName(name || "Competition");
  } catch (err) {
    console.error(err);
    toast.error("Failed to load fixtures");
  } finally {
    setLoading(false);
  }
}, [competitionId]);

  
  useEffect(() => {
    fetchFixtures();

    const handleFixtureUpdate = (updatedFixture) => {
      setFixturesByRound(prev => {
        const newFixtures = { ...prev };
        for (const round in newFixtures) {
          const index = newFixtures[round].findIndex(f => f._id === updatedFixture._id);
          if (index !== -1) {
            newFixtures[round][index] = updatedFixture;
            return newFixtures;
          }
        }
        return newFixtures;
      });
    };
    
    const handlePlayerUpdate = ({ playerId, newName }) => {
        setFixturesByRound(prev => {
          const newFixtures = { ...prev };
          for (const round in newFixtures) {
            newFixtures[round] = newFixtures[round].map(f => ({
              ...f,
              homePlayerName: f.homePlayer === playerId ? newName : f.homePlayerName,
              awayPlayerName: f.awayPlayer === playerId ? newName : f.awayPlayerName,
            }));
          }
          return newFixtures;
        });
    };

    socket.on('fixtureUpdate', handleFixtureUpdate);
    socket.on('playerNameUpdate', handlePlayerUpdate);

    return () => {
      socket.off('fixtureUpdate', handleFixtureUpdate);
      socket.off('playerNameUpdate', handlePlayerUpdate);
    };
  }, [fetchFixtures]);

  const filteredFixtures = useMemo(() => {
    if (!searchTerm) return fixturesByRound;
    const term = searchTerm.toLowerCase();
    const filtered = {};
    Object.keys(fixturesByRound).forEach(round => {
      const matches = fixturesByRound[round].filter(f =>
        (f.homePlayerName || 'tbd').toLowerCase().includes(term) ||
        (f.awayPlayerName || 'tbd').toLowerCase().includes(term)
      );
      if (matches.length > 0) {
        filtered[round] = matches;
      }
    });
    return filtered;
  }, [fixturesByRound, searchTerm]);

  if (loading) {
    return (
      <div className="modern-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-gold-main animate-spin mx-auto" />
          <h1 className="modern-hero-subtitle text-xl mt-4">Loading Fixtures...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen modern-bg text-white overflow-x-hidden">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

        <header className="fixed top-0 left-0 w-full z-50 p-4">
            <Link to="/view" className="inline-flex items-center space-x-2 text-purple-300 hover:text-gold-main transition-colors duration-300 group glass-header-light p-2 rounded-lg">
                <ChevronLeft size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
                <span className="font-medium text-sm">Back to Dashboard</span>
            </Link>
        </header>

        <main className="flex-grow container mx-auto px-4 sm:px-6 py-20 md:py-28 relative z-10 max-w-7xl">
            <div className="text-center mb-10">
                <h1 className="modern-hero-title" style={{fontSize: 'clamp(2rem, 5vw, 3.5rem)'}}>
                    {competitionName} <span className="modern-brand-accent">Fixtures</span>
                </h1>
            </div>
            
            <InteractiveCard className="mb-12 max-w-2xl mx-auto">
                <div className="relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-light/60 pointer-events-none" size={20} />
                     <input
                         type="text"
                         placeholder="Search by player name..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="search-input w-full"
                     />
                </div>
            </InteractiveCard>

            <div className="space-y-12">
                {Object.keys(filteredFixtures).length === 0 ? (
                    <InteractiveCard>
                        <div className="text-center py-16 modern-info-card">
                            <Info className="h-12 w-12 text-gold-main/50 mx-auto mb-4" />
                            <p className="text-gold-main text-xl font-semibold">No Fixtures Found</p>
                            <p className="text-purple-light mt-2">
                                {searchTerm ? `No matches found for "${searchTerm}".` : 'There are no scheduled fixtures for this competition yet.'}
                            </p>
                        </div>
                    </InteractiveCard>
                ) : (
                    Object.keys(filteredFixtures).sort((a,b) => a - b).map(round => (
                        <InteractiveCard key={round} as="section">
                            <div className="modern-info-card p-6">
                                <h3 className="flex items-center text-2xl font-bold mb-6 text-gold-main font-space-grotesk">
                                    <Swords className="w-6 h-6 mr-3 text-gold-main/80" />
                                    Round {round}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {filteredFixtures[round].map(fixture => (
                                        <FixtureCard key={fixture._id} fixture={fixture} />
                                    ))}
                                </div>
                            </div>
                        </InteractiveCard>
                    ))
                )}
            </div>
        </main>
        
        {/* Global Styles */}
        <style jsx global>{`
            :root { 
                --purple-dark: #2c1b4b; 
                --purple-mid: #4a2a6c; 
                --purple-light: #8b7bb8; 
                --gold-main: #ffdf80; 
                --gold-dark: #e6b422; 
            }
            body { background-color: #0a0510; }
            * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
            .font-space-grotesk { font-family: 'Space Grotesk', sans-serif; }
            .modern-bg { background-color: #0a0510; background-image: linear-gradient(160deg, #0a0510 0%, #1a0f2e 40%, #1a0f2e 60%, #0a0510 100%); position: relative; overflow-x: hidden; }
            .modern-bg::after { content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100vh; background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"%3E%3Cg fill-opacity="0.15"%3E%3Crect fill="%231a0f2e" width="800" height="800"/%3E%3Cg fill="%232c1b4b"%3E%3Ccircle cx="400" cy="400" r="100"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E'); opacity: 0.02; pointer-events: none; z-index: -1; }
            ::-webkit-scrollbar { width: 10px; } 
            ::-webkit-scrollbar-track { background: linear-gradient(to bottom, #1a0f2e, #0a0510); } 
            ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, var(--gold-main), var(--gold-dark)); border-radius: 5px; border: 2px solid #1a0f2e; } 
            ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #fff8e7, var(--gold-main)); }
            .glass-header-light { background: rgba(10, 5, 16, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 223, 128, 0.15); }
            .modern-hero-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; background: linear-gradient(135deg, #fff8e7 0%, var(--gold-main) 25%, var(--gold-dark) 50%, var(--gold-main) 75%, #fff8e7 100%); background-clip: text; -webkit-background-clip: text; color: transparent; line-height: 1.1; letter-spacing: -0.02em; }
            .modern-brand-accent { background: linear-gradient(135deg, var(--purple-mid) 0%, var(--purple-light) 100%); background-clip: text; -webkit-background-clip: text; color: transparent; }
            .modern-hero-subtitle { font-size: clamp(0.9rem, 2vw, 1.1rem); color: var(--purple-light); font-weight: 400; line-height: 1.5; max-width: 40rem; margin: 0 auto; }
            .modern-info-card { background: linear-gradient(135deg, rgba(44, 27, 75, 0.4) 0%, rgba(30, 42, 90, 0.3) 50%, rgba(44, 27, 75, 0.4) 100%); backdrop-filter: blur(16px); border: 1px solid rgba(255, 223, 128, 0.1); border-radius: 16px; padding: 1.5rem; transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); position: relative; overflow: hidden; }
            .modern-interactive-card:hover .modern-info-card { border-color: rgba(255, 223, 128, 0.25); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }

            .search-input {
                background: rgba(44, 27, 75, 0.3);
                border: 1px solid rgba(139, 123, 184, 0.25);
                border-radius: 9999px;
                padding: 0.75rem 1rem 0.75rem 2.75rem;
                color: var(--purple-light);
                font-weight: 500;
                transition: all 0.3s ease;
                backdrop-filter: blur(8px);
            }
            .search-input::placeholder { color: var(--purple-light); opacity: 0.6; }
            .search-input:focus {
                outline: none;
                background: rgba(44, 27, 75, 0.5);
                border-color: var(--gold-main);
                box-shadow: 0 0 15px rgba(255, 223, 128, 0.2);
                color: white;
            }

            .fixture-card {
                background: rgba(10, 5, 16, 0.5);
                border: 1px solid rgba(255, 223, 128, 0.1);
                border-radius: 12px;
                padding: 1rem;
                transition: all 0.3s ease;
            }
            .fixture-card:hover {
                transform: translateY(-4px);
                border-color: rgba(255, 223, 128, 0.3);
                box-shadow: 0 8px 25px rgba(0,0,0, 0.2);
                background: rgba(10, 5, 16, 0.7);
            }
            .player-name {
                flex: 1;
                text-align: center;
                font-weight: 600;
                font-size: 1rem;
                color: #e2dcf7;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding: 0 0.25rem;
            }
            .score-display {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 1.75rem;
                font-weight: 700;
                color: var(--gold-main);
                margin: 0 1rem;
            }
            .vs-text {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 1rem;
                font-weight: 500;
                color: var(--purple-light);
                margin: 0 1rem;
            }
            .status-badge {
                font-size: 0.7rem;
                font-weight: 600;
                padding: 2px 8px;
                border-radius: 9999px;
                border: 1px solid;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
        `}</style>
    </div>
  );
}
