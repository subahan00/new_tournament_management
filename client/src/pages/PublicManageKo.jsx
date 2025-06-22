import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import io from 'socket.io-client';

// Initialize socket connection
const socket = io(`${process.env.REACT_APP_BACKEND_URL}`);

// --- Helper Components for Cleaner JSX ---

const Loader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gold-500"></div>
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div className="min-h-screen bg-black flex items-center justify-center text-xl text-red-500">
    Error: {message}
  </div>
);

const EmptyRound = () => (
  <div className="text-center py-8 text-gray-500 italic">
    No fixtures scheduled
  </div>
);

const MainHeader = ({ competitionName }) => (
  <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-md border-b border-gold-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <Link
          to="/"
          className="text-gold-400 hover:text-white transition-colors duration-300"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-500">
          {competitionName}
        </h1>
        <div className="w-6"></div> {/* Spacer */}
      </div>
    </div>
  </header>
);

// --- Main Component ---

const PublicManageKo = () => {
  const { competitionId } = useParams();
  const [fixtures, setFixtures] = useState([]);
  const [competitionName, setCompetitionName] = useState('Knockout Competition');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to consistently get player ID
  const getPlayerId = (player) => {
    return player && typeof player === 'object' 
      ? player._id 
      : player;
  };

  useEffect(() => {
    const loadFixtures = async () => {
      setIsLoading(true);
      try {
        const fixturesData = await fixtureService.fetchFixturesByCompetition(competitionId);
        if (fixturesData.length > 0) {
          const compName = fixturesData[0].competitionId?.name ||
                          'Knockout Competition';
          setCompetitionName(compName);
        }
        setFixtures(fixturesData);
      } catch (err) {
        setError(err.message || 'Failed to load fixtures');
      } finally {
        setIsLoading(false);
      }
    };

    loadFixtures();

    const handleFixtureUpdate = (updatedFixture) => {
      setFixtures(prev => prev.map(f => (f._id === updatedFixture._id ? updatedFixture : f)));
    };

    const handlePlayerNameUpdate = ({ playerId, newName }) => {
      setFixtures(prev =>
        prev.map(f => {
          const homeId = getPlayerId(f.homePlayer);
          const awayId = getPlayerId(f.awayPlayer);
          
          return {
            ...f,
            homePlayerName: homeId === playerId ? newName : f.homePlayerName,
            awayPlayerName: awayId === playerId ? newName : f.awayPlayerName,
          };
        })
      );
    };

    socket.on('fixtureUpdate', handleFixtureUpdate);
    socket.on('playerNameUpdate', handlePlayerNameUpdate);

    return () => {
      socket.off('fixtureUpdate', handleFixtureUpdate);
      socket.off('playerNameUpdate', handlePlayerNameUpdate);
    };
  }, [competitionId]);

  // Define the correct round order
  const ROUND_ORDER = [
    'Round of 64',
    'Round of 32',
    'Round of 16',
    'Quarter-Final',
    'Semi-Final',
    'Final'
  ];

  // Create a mapping of normalized names to display names
  const normalizeRoundName = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .replace(/finals?$/, 'final') // Handles "Final" and "Finals"
      .replace('quarterfinals', 'quarterfinal') // Specific fix for quarter
      .replace('semifinals', 'semifinal'); // Specific fix for semi
  };

  // Group fixtures by normalized round names
  const { groupedFixtures, roundMapping } = useMemo(() => {
    const mapping = {};
    const groups = {};
    
    ROUND_ORDER.forEach(round => {
      const normalized = normalizeRoundName(round);
      groups[normalized] = [];
      mapping[normalized] = round;
    });
    
    fixtures.forEach(fixture => {
      const normalized = normalizeRoundName(fixture.round);
      
      if (!groups[normalized]) {
        groups[normalized] = [];
      }
      
      groups[normalized].push(fixture);
      
      // Map normalized name back to display name
      if (!mapping[normalized]) {
        mapping[normalized] = fixture.round;
      }
    });
    
    return {
      groupedFixtures: groups,
      roundMapping: mapping
    };
  }, [fixtures]);

  // Get display name for a round
  const getDisplayRoundName = (normalizedRound) => {
    return roundMapping[normalizedRound] || normalizedRound;
  };

  const getPlayerName = (player, playerName) => {
    if (playerName) return playerName;
    if (typeof player === 'object' && player !== null) return player.name;
    return 'TBD';
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-300 font-sans">
      <MainHeader competitionName={competitionName} />

      <main className="p-4 md:p-6">
        <div className="flex overflow-x-auto space-x-6 lg:space-x-8 pb-4 custom-scrollbar">
          {ROUND_ORDER.map((round) => {
            const normalized = normalizeRoundName(round);
            const displayRound = getDisplayRoundName(normalized);
            const roundFixtures = groupedFixtures[normalized] || [];
            
            return (
              <div key={normalized} className="round-column flex-shrink-0 w-72 md:w-80">
                <div className="round-header p-3 rounded-t-lg bg-gray-900/50 border-b-2 border-gold-700">
                  <h3 className="text-lg font-semibold text-center text-gold-400 tracking-wide uppercase">
                    {displayRound}
                  </h3>
                </div>
                <div className="space-y-3 p-3 bg-black/20 rounded-b-lg">
                  {roundFixtures.length > 0 
                    ? roundFixtures.map((fixture, index) => (
                      <div
                        key={fixture._id}
                        className={`fixture-item relative p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-gold-600/70 transition-all duration-300 shadow-md hover:shadow-gold-900/50 ${index % 2 === 0 ? 'top-fixture' : 'bottom-fixture'}`}
                      >
                        <div className="flex justify-between items-center space-x-2">
                          <span className="truncate text-sm font-medium text-gray-200">
                            {getPlayerName(fixture.homePlayer, fixture.homePlayerName)}
                          </span>
                          <span className="flex-shrink-0 text-base font-bold w-8 h-8 flex items-center justify-center rounded-md bg-black/50 text-gold-300 border border-gray-600">
                            {fixture.homeScore ?? '-'}
                          </span>
                        </div>
                        <div className="text-center text-xs text-gray-500 my-1">vs</div>
                        <div className="flex justify-between items-center space-x-2">
                          <span className="truncate text-sm font-medium text-gray-200">
                            {getPlayerName(fixture.awayPlayer, fixture.awayPlayerName)}
                          </span>
                          <span className="flex-shrink-0 text-base font-bold w-8 h-8 flex items-center justify-center rounded-md bg-black/50 text-gold-300 border border-gray-600">
                            {fixture.awayScore ?? '-'}
                          </span>
                        </div>
                      </div>
                    ))
                    : <EmptyRound />
                  }
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <style>
        {`
          /* Custom scrollbar for better aesthetics */
          .custom-scrollbar::-webkit-scrollbar {
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #111;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #b8860b; /* Darker gold */
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #daa520; /* Lighter gold */
          }

          /* Bracket Connectors - Desktop Only */
          @media (min-width: 768px) {
            .round-column {
              position: relative;
            }
            
            /* Horizontal connector between rounds */
            .round-column:not(:last-child) .fixture-item::after {
              content: '';
              position: absolute;
              right: -24px;
              top: 50%;
              height: 1px;
              width: 24px;
              background: rgba(218, 165, 32, 0.3);
              z-index: -1;
            }
            
            /* Vertical connector for top fixture */
            .top-fixture::before {
              content: '';
              position: absolute;
              right: -24px;
              top: 50%;
              height: 50%;
              width: 1px;
              background: rgba(218, 165, 32, 0.3);
              transform: translateY(-100%);
              z-index: -1;
            }
            
            /* Vertical connector for bottom fixture */
            .bottom-fixture::before {
              content: '';
              position: absolute;
              right: -24px;
              top: 50%;
              height: 50%;
              width: 1px;
              background: rgba(218, 165, 32, 0.3);
              z-index: -1;
            }
            
            /* Remove connector for last column */
            .round-column:last-child .fixture-item::after,
            .round-column:last-child .fixture-item::before {
              display: none;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PublicManageKo;
