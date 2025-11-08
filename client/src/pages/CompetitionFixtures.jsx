import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Link, useParams } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import competitionService from '../services/competitionService';
import {
  ChevronLeft,
  Loader,
  Search,
  Swords,
  Info,
} from 'lucide-react'; // Removed ChevronRight

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

const getStatusInfo = (status) => {
  switch (status?.toLowerCase()) {
    case 'live':
      return { text: 'LIVE', className: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' };
    case 'completed':
    case 'finished':
      return { text: 'Finished', className: 'bg-green-500/10 text-green-400 border-green-500/20' };
    case 'pending':
    default:
      return { text: 'pending', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  }
};

//=================================================================
// ROUND-ROBIN MATCHDAY GENERATOR
//=================================================================


const generateMatchdaySchedule = (fixtures) => {
  if (!fixtures || fixtures.length === 0) return [];

  // Helper to get consistent player IDs
  const getPlayerId = (player) => {
    if (!player) return null;
    return typeof player === 'object' && player !== null ? player._id : player;
  };

  const playerIds = new Set();
  const fixtureMap = new Map();

  // 1. Process all fixtures into a lookup map and find all unique players
  for (const fixture of fixtures) {
    const homeId = getPlayerId(fixture.homePlayer);
    const awayId = getPlayerId(fixture.awayPlayer);

    if (!homeId || !awayId || homeId === awayId) continue;

    playerIds.add(homeId);
    playerIds.add(awayId);

    // Create a consistent key (smallerID-largerID) to handle (A vs B) and (B vs A)
    const key = [homeId, awayId].sort().join('-');

    // Only keep the first occurrence of each unique matchup
    if (!fixtureMap.has(key)) {
      fixtureMap.set(key, fixture);
    }
  }

  const players = Array.from(playerIds);
  let numPlayers = players.length;

  // 2. Handle odd number of players by adding a "dummy" player for byes
  // The algorithm requires an even number of participants.
  if (numPlayers % 2 !== 0) {
    players.push(null); // 'null' represents the "bye"
    numPlayers++;
  }

  // 3. Implement the Circle Method (Polygon Method) algorithm
  const matchdays = [];
  const numRounds = numPlayers - 1; // For 32 players, this is 31 rounds
  const halfSize = numPlayers / 2;   // For 32 players, this is 16 fixtures

  // Make a copy of the players array, remove the first player (who stays fixed)
  const rotatingPlayers = players.slice(1);

  for (let round = 0; round < numRounds; round++) {
    const currentMatchdayFixtures = [];
    
    // Pair the fixed player (players[0]) with the first player in the rotating list
    const p1 = players[0];
    const p2 = rotatingPlayers[0];

    if (p1 !== null && p2 !== null) {
      const key = [p1, p2].sort().join('-');
      const fixture = fixtureMap.get(key);
      if (fixture) {
        currentMatchdayFixtures.push(fixture);
      }
    }

    // Pair the rest of the players
    for (let i = 1; i < halfSize; i++) {
      const home = rotatingPlayers[i];
      const away = rotatingPlayers[rotatingPlayers.length - i];

      if (home !== null && away !== null) {
        const key = [home, away].sort().join('-');
        const fixture = fixtureMap.get(key);
        if (fixture) {
          currentMatchdayFixtures.push(fixture);
        }
      }
    }

    // Add the fully constructed matchday
    if (currentMatchdayFixtures.length > 0) {
      matchdays.push(currentMatchdayFixtures);
    }

    
    rotatingPlayers.unshift(rotatingPlayers.pop());
  }



  return matchdays;
};

//=================================================================
// PAGINATION COMPONENT - REMOVED
//=================================================================

//=================================================================
// PAGINATION INFO COMPONENT - REMOVED
//=================================================================

//=================================================================
// FIXTURE CARD COMPONENT
//=================================================================

const FixtureCard = memo(({ fixture }) => {
  const statusInfo = getStatusInfo(fixture.status);

  const renderMiddleSection = () => {
    if (fixture.status === 'completed' &&
      fixture.homeScore !== null &&
      fixture.awayScore !== null) {
      return (
        <span className="score-display">
          {fixture.homeScore} : {fixture.awayScore}
        </span>
      );
    }

    return <span className="vs-text">vs</span>;
  };

  return (
    <div className="fixture-card group">
      <div className="flex justify-between items-start mb-1.5">
        <div className={`status-badge ${statusInfo.className}`}>
          {statusInfo.text}
        </div>
      </div>

      <div className="flex items-center justify-between my-1.5">
        <span className="player-name text-right">{fixture.homePlayerName || 'TBD'}</span>
        {renderMiddleSection()}
        <span className="player-name text-left">{fixture.awayPlayerName || 'TBD'}</span>
      </div>

      {fixture.status === 'completed' && fixture.result && (
        <div className="mt-1.5 pt-1.5 border-t border-purple-light/10">
          <div className="text-center text-[10px] leading-tight">
            <span className="text-purple-light/60 mr-1">Winner:</span>
            <span className="text-gold-main font-medium">
              {fixture.result === 'home' ? fixture.homePlayerName :
                fixture.result === 'away' ? fixture.awayPlayerName :
                  'Draw'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
FixtureCard.displayName = 'FixtureCard';

//=================================================================
// MATCHDAY COMPONENT
//=================================================================

const MatchdaySection = memo(({ matchdayNumber, fixtures }) => {
  const pendingCount = fixtures.filter(f => f.status === 'pending').length;
  const completedCount = fixtures.filter(f => f.status === 'completed').length;
  const liveCount = fixtures.filter(f => f.status === 'live').length;

  return (
    <div className="matchday-container">
      <div className="matchday-header">
        <div className="flex items-center space-x-2">
          <Swords size={16} className="text-gold-main" />
          <h3 className="matchday-title">MD {matchdayNumber}</h3>
        </div>

        <div className="flex items-center space-x-2">
          <div className="matchday-stats">
            {liveCount > 0 && (
              <span className="stat-badge live">{liveCount} Live</span>
            )}
            {pendingCount > 0 && (
              <span className="stat-badge pending">{pendingCount} Pending</span>
            )}
            {completedCount > 0 && (
              <span className="stat-badge completed">{completedCount} Done</span>
            )}
          </div>
        </div>
      </div>

      <div className="matchday-content">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {fixtures.map((fixture) => (
            <FixtureCard key={fixture._id} fixture={fixture} />
          ))}
        </div>
      </div>
    </div>
  );
});
MatchdaySection.displayName = 'MatchdaySection';

//=================================================================
// MAIN COMPONENT
//=================================================================

export default function CompetitionFixtures() {
  const { competitionId } = useParams();
  const [fixtures, setFixtures] = useState([]);
  const [competitionName, setCompetitionName] = useState('Competition');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // REMOVED: currentPage and matchdaysPerPage state

  const fetchFixtures = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fixtureService.getCompetitionFixtures(competitionId);
      const payload = res?.data || {};
      const data = payload.data || [];

      let name = payload.competitionName || payload.competition?.name || payload.competition_name;

      if (!name) {
        try {
          const compRes = await competitionService.getCompetition(competitionId);
          const compPayload = compRes?.data || {};
          name = compPayload.name || compPayload.competitionName || compPayload.competition?.name || name;
        } catch (e) {
          console.warn("Failed to fetch competition metadata", e);
        }
      }

      setFixtures(data);
      setCompetitionName(name || "Competition");
    } catch (err) {
      console.error("Error fetching fixtures:", err);
      toast.error("Failed to load fixtures");
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    fetchFixtures();

    const handleFixtureUpdate = (updatedFixture) => {
      setFixtures(prev => {
        const newFixtures = [...prev];
        const index = newFixtures.findIndex(f => f._id === updatedFixture._id);
        if (index !== -1) {
          newFixtures[index] = updatedFixture;
        }
        return newFixtures;
      });
      
    };

    const handlePlayerUpdate = ({ playerId, newName }) => {
      setFixtures(prev => {
        return prev.map(f => ({
          ...f,
          homePlayerName: f.homePlayer === playerId ? newName : f.homePlayerName,
          awayPlayerName: f.awayPlayer === playerId ? newName : f.awayPlayerName,
        }));
      });
    };

    socket.on('fixtureUpdate', handleFixtureUpdate);
    socket.on('playerNameUpdate', handlePlayerUpdate);

    return () => {
      socket.off('fixtureUpdate', handleFixtureUpdate);
      socket.off('playerNameUpdate', handlePlayerUpdate);
    };
  }, [fetchFixtures]);

  // Generate matchday schedule
  const matchdaySchedule = useMemo(() => {
    return generateMatchdaySchedule(fixtures);
  }, [fixtures]);

  // Filter matchdays based on search
  const filteredMatchdays = useMemo(() => {
    const term = searchTerm.toLowerCase();

    // Map through all matchdays and filter/sort fixtures
    const processedMatchdays = matchdaySchedule.map((matchdayFixtures, index) => {
      // Filter fixtures based on search term
      const filtered = !term
        ? matchdayFixtures
        : matchdayFixtures.filter(f => {
          const homePlayerName = (f.homePlayerName || 'tbd').toLowerCase();
          const awayPlayerName = (f.awayPlayerName || 'tbd').toLowerCase();
          return homePlayerName.includes(term) || awayPlayerName.includes(term);
        });

      // Sort fixtures within matchday: pending first, then live, then completed
      const sorted = filtered.sort((a, b) => {
        const aStatus = a.status === 'pending' ? 0 : a.status === 'live' ? 1 : 2;
        const bStatus = b.status === 'pending' ? 0 : b.status === 'live' ? 1 : 2;
        return aStatus - bStatus;
      });

      return {
        matchdayNumber: index + 1,
        fixtures: sorted,
        pendingCount: sorted.filter(f => f.status === 'pending').length
      };
    }).filter(md => md.fixtures.length > 0);

    // When searching, sort matchdays by pending count (most pending first)
    if (term) {
      return processedMatchdays.sort((a, b) => {
        // First, sort by number of pending fixtures (descending)
        if (b.pendingCount !== a.pendingCount) {
          return b.pendingCount - a.pendingCount;
        }
        // If same pending count, maintain original matchday order
        return a.matchdayNumber - b.matchdayNumber;
      });
    }

    // When not searching, keep original matchday order
    return processedMatchdays;
  }, [matchdaySchedule, searchTerm]);

  // REMOVED: paginatedMatchdays memo
  // REMOVED: useEffect to reset page on search
  // REMOVED: handlePageChange function

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

  const totalFixtures = fixtures.length;

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
          <h1 className="modern-hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            {competitionName} <span className="modern-brand-accent">Fixtures</span>
          </h1>
          {totalFixtures > 0 && (
            <p className="modern-hero-subtitle mt-4">
              {matchdaySchedule.length} matchdays • {totalFixtures} total fixtures
            </p>
          )}
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

        {/* REMOVED: PaginationInfo component call */}

        <div className="space-y-4">
          {/* MODIFIED: Check filteredMatchdays.length */}
          {filteredMatchdays.length === 0 ? (
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
            // MODIFIED: Map over filteredMatchdays directly
            filteredMatchdays.map((matchday) => (
              <InteractiveCard key={matchday.matchdayNumber}>
                <MatchdaySection
                  matchdayNumber={matchday.matchdayNumber}
                  fixtures={matchday.fixtures}
                />
              </InteractiveCard>
            ))
          )}
        </div>

        {/* REMOVED: PaginationControls component call */}
      </main>

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

            .matchday-container {
                background: rgba(10, 5, 16, 0.5);
                border: 1px solid rgba(255, 223, 128, 0.1);
                border-radius: 12px;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            .matchday-container:hover {
                border-color: rgba(255, 223, 128, 0.25);
            }

            .matchday-header {
                padding: 0.6rem 1rem;
                background: rgba(44, 27, 75, 0.3);
                backdrop-filter: blur(8px);
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.3s ease;
            }
            .matchday-header:hover {
                background: rgba(44, 27, 75, 0.5);
            }

            .matchday-title {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 1rem;
                font-weight: 700;
                color: var(--gold-main);
            }

            .matchday-stats {
                display: flex;
                gap: 0.35rem;
            }

            .stat-badge {
                font-size: 0.65rem;
                font-weight: 600;
                padding: 0.15rem 0.5rem;
                border-radius: 9999px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .stat-badge.live {
                background: rgba(239, 68, 68, 0.2);
                color: #fca5a5;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            .stat-badge.pending {
                background: rgba(59, 130, 246, 0.2);
                color: #93c5fd;
                border: 1px solid rgba(59, 130, 246, 0.3);
            }
            .stat-badge.completed {
                background: rgba(34, 197, 94, 0.2);
                color: #86efac;
                border: 1px solid rgba(34, 197, 94, 0.3);
            }

            .matchday-content {
                padding: 0.75rem;
                animation: slideDown 0.3s ease-out;
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .fixture-card {
                background: rgba(10, 5, 16, 0.5);
                border: 1px solid rgba(255, 223, 128, 0.1);
                border-radius: 8px;
                padding: 0.5rem 0.75rem;
                transition: all 0.3s ease;
            }
            .fixture-card:hover {
                transform: translateY(-2px);
                border-color: rgba(255, 223, 128, 0.3);
                box-shadow: 0 4px 15px rgba(0,0,0, 0.2);
                background: rgba(10, 5, 16, 0.7);
            }
            .player-name {
                flex: 1;
                font-weight: 500;
                font-size: 0.875rem;
                color: #e2dcf7;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .score-display {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 1.1rem;
                font-weight: 700;
                color: var(--gold-main);
                margin: 0 0.75rem;
            }
            .vs-text {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 0.8rem;
                font-weight: 500;
                color: var(--purple-light);
                margin: 0 0.75rem;
                opacity: 0.6;
            }
            .status-badge {
                font-size: 0.6rem;
                font-weight: 600;
                padding: 1px 6px;
                border-radius: 9999px;
                border: 1px solid;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            /* REMOVED: All .pagination-btn and .pagination-ellipsis styles */
            
        `}</style>
    </div>
  );
}