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

  const roundOrder = useMemo(() => ['Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'], []);

  useEffect(() => {
    const loadFixtures = async () => {
      setIsLoading(true);
      try {
        const fixturesData = await fixtureService.fetchFixturesByCompetition(competitionId);
        if (fixturesData.length > 0) {
          setCompetitionName(fixturesData[0].competitionId?.name || 'Knockout Competition');
        }
        setFixtures(fixturesData);
      } catch (err) {
        setError(err.message);
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
        prev.map(f => ({
          ...f,
          homePlayerName: f.homePlayer === playerId ? newName : f.homePlayerName,
          awayPlayerName: f.awayPlayer === playerId ? newName : f.awayPlayerName,
        }))
      );
    };

    socket.on('fixtureUpdate', handleFixtureUpdate);
    socket.on('playerNameUpdate', handlePlayerNameUpdate);

    return () => {
      socket.off('fixtureUpdate', handleFixtureUpdate);
      socket.off('playerNameUpdate', handlePlayerNameUpdate);
    };
  }, [competitionId]);

  const groupedFixtures = useMemo(() => {
    return fixtures.reduce((acc, fixture) => {
      const round = fixture.round;
      if (!acc[round]) acc[round] = [];
      acc[round].push(fixture);
      return acc;
    }, {});
  }, [fixtures]);

  const sortedRounds = useMemo(() => {
    return Object.keys(groupedFixtures).sort((a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b));
  }, [groupedFixtures, roundOrder]);

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
          {sortedRounds.map((round) => (
            <div key={round} className="round-column flex-shrink-0 w-72 md:w-80">
              <div className="round-header p-3 rounded-t-lg bg-gray-900/50 border-b-2 border-gold-700">
                <h3 className="text-lg font-semibold text-center text-gold-400 tracking-wide uppercase">
                  {round}
                </h3>
              </div>
              <div className="space-y-3 p-3 bg-black/20 rounded-b-lg">
                {(groupedFixtures[round] || []).map((fixture) => (
                  <div
                    key={fixture._id}
                    className="fixture-item relative p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-gold-600/70 transition-all duration-300 shadow-md hover:shadow-gold-900/50"
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
                ))}
              </div>
            </div>
          ))}
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
          @media (min-width: 1024px) {
            .round-column {
              position: relative;
            }
            .fixture-item:not(:only-child)::after {
              content: '';
              position: absolute;
              left: 50%;
              bottom: -0.75rem; /* 12px */
              transform: translateX(-50%);
              width: 1px;
              height: 0.75rem; /* 12px */
              background-color: rgba(218, 165, 32, 0.3); /* gold-alpha */
            }

            .fixture-item::before {
              content: '';
              position: absolute;
              right: -1.5rem; /* half of space-x-8 */
              top: 50%;
              transform: translateY(-50%);
              width: 1rem; /* Adjust length of the horizontal line */
              height: 1px;
              background-color: rgba(218, 165, 32, 0.3); /* gold-alpha */
            }
            
            .round-column:last-child .fixture-item::before {
                display: none;
            }
            
            /* Logic for connecting to the next round bracket */
            .fixture-item:nth-child(odd)::before {
                top: calc(50% + 2.5rem); /* Adjust based on fixture height */
                border-top: 1px solid rgba(218, 165, 32, 0.3);
                border-right: 1px solid rgba(218, 165, 32, 0.3);
                border-top-right-radius: 0.5rem;
                height: calc(100% + 0.75rem); /* space-y-3 */
            }

            .fixture-item:nth-child(even)::before {
                top: calc(50% - 2.5rem);
                border-bottom: 1px solid rgba(218, 165, 32, 0.3);
                border-right: 1px solid rgba(218, 165, 32, 0.3);
                border-bottom-right-radius: 0.5rem;
                height: calc(100% + 0.75rem);
            }
          }
        `}
      </style>
    </div>
  );
};

export default PublicManageKo;