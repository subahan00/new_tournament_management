import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import standingService from '../services/standingService';
import {
  ChevronLeft,
  Loader,
  AlertTriangle,
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Shield,
  TrendingUp
} from 'lucide-react';

//=================================================================
// UTILITY COMPONENTS
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
    <div ref={scrollRef} style={{ transitionDelay: animationDelay }}
      className={`modern-card-container transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>
      <div ref={cardRef} className="h-full w-full modern-interactive-card">
        {children}
        {!isMobile && <div className="modern-reflection" />}
      </div>
    </div>
  );
};

//=================================================================
// STATS SUMMARY COMPONENT
//=================================================================

const StatsSummary = ({ fixtures, playerName }) => {
  const stats = React.useMemo(() => {
    const completed = fixtures.filter(f => f.status === 'completed');
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

    completed.forEach(fixture => {
      if (fixture.awayPlayer.name === 'BYE') {
        wins++;
        return;
      }

      const isHome = fixture.isHomePlayer;
      const playerScore = isHome ? fixture.homeScore : fixture.awayScore;
      const opponentScore = isHome ? fixture.awayScore : fixture.homeScore;

      goalsFor += playerScore || 0;
      goalsAgainst += opponentScore || 0;

      if (playerScore > opponentScore) wins++;
      else if (playerScore < opponentScore) losses++;
      else draws++;
    });

    return {
      played: completed.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst
    };
  }, [fixtures]);

  return (
    <InteractiveCard className="mb-8">
      <div className="modern-info-card p-6">
        <h3 className="modern-card-title text-xl mb-6 flex items-center justify-center">
          <Trophy className="w-6 h-6 mr-3 text-gold-main/80" />
          {playerName}'s Performance
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="stats-card">
            <div className="stats-label mb-2">Played</div>
            <div className="text-2xl font-bold text-white">{stats.played}</div>
          </div>

          <div className="stats-card">
            <div className="stats-label mb-2 text-green-400">Wins</div>
            <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
          </div>

          <div className="stats-card">
            <div className="stats-label mb-2 text-yellow-400">Draws</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.draws}</div>
          </div>

          <div className="stats-card">
            <div className="stats-label mb-2 text-red-400">Losses</div>
            <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
          </div>

          <div className="stats-card">
            <div className="stats-label mb-2 flex items-center justify-center">
              <Target className="w-4 h-4 mr-1" />
              GF
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.goalsFor}</div>
          </div>

          <div className="stats-card">
            <div className="stats-label mb-2 flex items-center justify-center">
              <Shield className="w-4 h-4 mr-1" />
              GA
            </div>
            <div className="text-2xl font-bold text-purple-400">{stats.goalsAgainst}</div>
          </div>

          <div className="stats-card">
            <div className="stats-label mb-2 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              GD
            </div>
            <div className={`text-2xl font-bold ${stats.goalDifference > 0 ? 'text-green-400' : stats.goalDifference < 0 ? 'text-red-400' : 'text-white'}`}>
              {stats.goalDifference > 0 ? `+${stats.goalDifference}` : stats.goalDifference}
            </div>
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
};

//=================================================================
// FIXTURE CARD COMPONENT
//=================================================================

const FixtureCard = ({ fixture, playerName }) => {
  const isHome = fixture.isHomePlayer;
  const isBye = fixture.awayPlayer.name === 'BYE';
  const opponent = isHome ? fixture.awayPlayer.name : fixture.homePlayer.name;
  const playerScore = isHome ? fixture.homeScore : fixture.awayScore;
  const opponentScore = isHome ? fixture.awayScore : fixture.homeScore;

  let resultClass = '';
  let resultText = '';
  let resultIcon = null;

  if (fixture.status === 'completed') {
    if (isBye) {
      resultClass = 'bg-green-500/20 border-green-500/30';
      resultText = 'BYE';
      resultIcon = <CheckCircle2 className="w-5 h-5 text-green-400" />;
    } else if (playerScore > opponentScore) {
      resultClass = 'bg-green-500/20 border-green-500/30';
      resultText = 'W';
      resultIcon = <CheckCircle2 className="w-5 h-5 text-green-400" />;
    } else if (playerScore < opponentScore) {
      resultClass = 'bg-red-500/20 border-red-500/30';
      resultText = 'L';
      resultIcon = <AlertTriangle className="w-5 h-5 text-red-400" />;
    } else {
      resultClass = 'bg-yellow-500/20 border-yellow-500/30';
      resultText = 'D';
      resultIcon = <Clock className="w-5 h-5 text-yellow-400" />;
    }
  } else {
    resultClass = 'bg-purple-500/20 border-purple-500/30';
    resultText = 'Pending';
    resultIcon = <Clock className="w-5 h-5 text-purple-400" />;
  }

  return (
    <InteractiveCard>
      <div className="modern-info-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gold-main/70" />
            <span className="text-sm text-purple-light">
              {fixture.round || 'Match'}
            </span>
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${resultClass}`}>
            {resultIcon}
            <span className="text-sm font-medium">{resultText}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Player */}
          <div className={`text-center ${isHome ? 'order-1' : 'order-3'}`}>
            <div className="text-lg font-bold text-gold-main mb-1">{playerName}</div>
            <div className="text-xs text-purple-light">{isHome ? 'Home' : 'Away'}</div>
            {fixture.status === 'completed' && (
              <div className="text-3xl font-bold text-white mt-2">
                {playerScore ?? '-'}
              </div>
            )}
          </div>

          {/* VS */}
          <div className="text-center order-2">
            <div className="text-purple-light text-sm font-medium">VS</div>
          </div>

          {/* Opponent */}
          <div className={`text-center ${isHome ? 'order-3' : 'order-1'}`}>
            <div className="text-lg font-bold text-white mb-1">
              {isBye ? <span className="text-purple-light italic">BYE</span> : opponent}
            </div>
            <div className="text-xs text-purple-light">{isHome ? 'Away' : 'Home'}</div>
            {fixture.status === 'completed' && !isBye && (
              <div className="text-3xl font-bold text-white mt-2">
                {opponentScore ?? '-'}
              </div>
            )}
          </div>
        </div>

        {fixture.matchDate && (
          <div className="mt-4 pt-4 border-t border-gold-main/10 text-center">
            <span className="text-xs text-purple-light">
              {new Date(fixture.matchDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        )}
      </div>
    </InteractiveCard>
  );
};

//=================================================================
// MAIN COMPONENT
//=================================================================

export default function PlayerFixtures() {
  const { competitionId, playerId } = useParams();
  const [state, setState] = useState({
    loading: true,
    error: null,
    competition: null,
    player: null,
    fixtures: []
  });

  useEffect(() => {
    const fetchPlayerFixtures = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const { data } = await standingService.getPlayerFixtures(competitionId, playerId);
        console.log("dataeeeeeeee",data);

        setState({
          loading: false,
          error: null,
          competition: data.competition,
          player: data.player,
          fixtures: data.fixtures
        });
      } catch (error) {
        console.error('Failed to load player fixtures:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load player fixtures. Please try again.'
        }));
      }
    };

    fetchPlayerFixtures();
  }, [competitionId, playerId]);

  // Loading state
  if (state.loading) {
    return (
      <div className="modern-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-gold-main animate-spin mx-auto" />
          <h1 className="modern-hero-subtitle text-xl mt-4">Loading fixtures...</h1>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="modern-bg min-h-screen flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <h1 className="modern-hero-title text-3xl mt-4">Error Loading Fixtures</h1>
        <p className="modern-hero-subtitle mt-2">{state.error}</p>
        <Link to={`/standings/${competitionId}`} className="modern-cta-button mt-6">
          <span className="relative z-10">Back to Standings</span>
        </Link>
      </div>
    );
  }

  const { competition, player, fixtures } = state;
  console.log("fixtures",fixtures);
  const sortedFixtures = [...fixtures].sort((a, b) => {
    const aTime = new Date(a.lastUpdated || a.lastUpdated).getTime();
    const bTime = new Date(b.lastUpdated || b.lastUpdated).getTime();
    return aTime - bTime; // oldest first, latest last
  });

  return (
    <div className="min-h-screen modern-bg text-white overflow-x-hidden">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header className="fixed top-0 left-0 w-full z-50 p-4">
        <Link
          to={`/standings/${competitionId}`}
          className="inline-flex items-center space-x-2 text-purple-300 hover:text-gold-main transition-colors duration-300 group glass-header-light p-2 rounded-lg"
        >
          <ChevronLeft size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="font-medium text-sm">Back to Standings</span>
        </Link>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-20 md:py-28 relative z-10 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="modern-hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            <span className="modern-brand-accent">{player?.name}</span> Fixtures
          </h1>
          <p className="modern-hero-subtitle mt-3">
            {competition?.name}
          </p>
        </div>

        {/* Stats Summary */}
        {fixtures.length > 0 && (
          <StatsSummary fixtures={fixtures} playerName={player?.name} />
        )}

        {/* Fixtures List */}
        {fixtures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedFixtures.map((fixture) => (
              <FixtureCard
                key={fixture._id}
                fixture={fixture}
                playerName={player?.name}
              />
            ))}


          </div>
        ) : (
          <InteractiveCard>
            <div className="modern-info-card p-8 text-center">
              <Calendar className="w-12 h-12 text-gold-main/50 mx-auto mb-4" />
              <p className="text-gold-main text-xl">No Fixtures Available</p>
              <p className="text-purple-light mt-2">
                This player has no fixtures scheduled in this competition yet.
              </p>
            </div>
          </InteractiveCard>
        )}
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
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .modern-bg { 
          background-color: #0a0510; 
          background-image: linear-gradient(160deg, #0a0510 0%, #1a0f2e 40%, #1a0f2e 60%, #0a0510 100%); 
          position: relative; 
          overflow-x: hidden; 
        }
        
        .modern-bg::after { 
          content: ''; 
          position: fixed; 
          top: 0; left: 0; right: 0; bottom: 0; 
          width: 100vw; height: 100vh; 
          background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"%3E%3Cg fill-opacity="0.15"%3E%3Crect fill="%231a0f2e" width="800" height="800"/%3E%3Cg fill="%232c1b4b"%3E%3Ccircle cx="400" cy="400" r="100"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E'); 
          opacity: 0.02; 
          pointer-events: none; 
          z-index: -1; 
        }
        
        ::-webkit-scrollbar { width: 10px; } 
        ::-webkit-scrollbar-track { background: linear-gradient(to bottom, #1a0f2e, #0a0510); } 
        ::-webkit-scrollbar-thumb { 
          background: linear-gradient(to bottom, var(--gold-main), var(--gold-dark)); 
          border-radius: 5px; 
          border: 2px solid #1a0f2e; 
        } 
        ::-webkit-scrollbar-thumb:hover { 
          background: linear-gradient(to bottom, #fff8e7, var(--gold-main)); 
        }
        
        .glass-header-light { 
          background: rgba(10, 5, 16, 0.6); 
          backdrop-filter: blur(12px); 
          border: 1px solid rgba(255, 223, 128, 0.15); 
        }
        
        .modern-hero-title { 
          font-family: 'Space Grotesk', sans-serif; 
          font-weight: 700; 
          background: linear-gradient(135deg, #fff8e7 0%, var(--gold-main) 25%, var(--gold-dark) 50%, var(--gold-main) 75%, #fff8e7 100%); 
          background-clip: text; 
          -webkit-background-clip: text; 
          color: transparent; 
          line-height: 1.1; 
          letter-spacing: -0.02em; 
        }
        
        .modern-brand-accent { 
          background: linear-gradient(135deg, var(--purple-mid) 0%, var(--purple-light) 100%); 
          background-clip: text; 
          -webkit-background-clip: text; 
          color: transparent; 
        }
        
        .modern-hero-subtitle { 
          font-size: clamp(0.9rem, 2vw, 1.1rem); 
          color: var(--purple-light); 
          font-weight: 400; 
          line-height: 1.5; 
          max-width: 40rem; 
          margin: 0 auto; 
        }
        
        .modern-cta-button { 
          position: relative; 
          display: inline-block; 
          padding: 0.6rem 1.5rem; 
          background: linear-gradient(135deg, var(--gold-main) 0%, var(--gold-dark) 100%); 
          color: var(--purple-dark); 
          border-radius: 8px; 
          font-weight: 600; 
          cursor: pointer; 
          transition: all 0.3s; 
          overflow: hidden; 
          box-shadow: 0 6px 20px rgba(255, 223, 128, 0.2); 
          text-decoration: none; 
          border: none; 
        }
        
        .modern-cta-button:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 25px rgba(255, 223, 128, 0.3); 
        }
        
        .modern-card-container { 
          perspective: 1500px; 
        }
        
        .modern-interactive-card { 
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); 
          position: relative; 
        }
        
        .modern-reflection { 
          position: absolute; 
          inset: 0; 
          background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.08) 0%, transparent 50%); 
          opacity: 0; 
          transition: opacity 0.3s ease; 
          border-radius: 16px; 
          pointer-events: none; 
        }
        
        .modern-card-container:hover .modern-reflection { 
          opacity: 1; 
        }
        
        .modern-info-card { 
          background: linear-gradient(135deg, rgba(44, 27, 75, 0.4) 0%, rgba(30, 42, 90, 0.3) 50%, rgba(44, 27, 75, 0.4) 100%); 
          backdrop-filter: blur(16px); 
          border: 1px solid rgba(255, 223, 128, 0.1); 
          border-radius: 16px; 
          padding: 1.5rem; 
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); 
          position: relative; 
          overflow: hidden; 
        }
        
        .modern-card-container:hover .modern-info-card { 
          border-color: rgba(255, 223, 128, 0.25); 
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25); 
        }

        .modern-card-title { 
          font-family: 'Space Grotesk', sans-serif; 
          font-size: 1.5rem; 
          font-weight: 600; 
          color: var(--gold-main); 
          margin-bottom: 0; 
          line-height: 1.3; 
        }

        .stats-card {
          background: rgba(44, 27, 75, 0.2);
          border: 1px solid rgba(255, 223, 128, 0.1);
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.3s ease;
          text-align: center;
        }
        
        .stats-card:hover {
          background: rgba(44, 27, 75, 0.3);
          border-color: rgba(255, 223, 128, 0.2);
          transform: translateY(-2px);
        }
        
        .stats-label {
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--purple-light);
        }
        
        @media (max-width: 768px) {
          .modern-info-card {
            padding: 1rem;
          }
          
          .modern-card-title {
            font-size: 1.25rem;
          }
          
          .stats-card {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}