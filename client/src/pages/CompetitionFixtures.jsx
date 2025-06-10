import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const socket = io(`${process.env.REACT_APP_BACKEND_URL}`);

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export default function CompetitionFixtures() {
  const { competitionId } = useParams();
  const [fixturesByRound, setFixturesByRound] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const groupAndShuffleFixturesByRound = (fixtures) => {
      const grouped = fixtures.reduce((acc, fixture) => {
        const { round } = fixture;
        if (!acc[round]) {
          acc[round] = [];
        }
        acc[round].push(fixture);
        return acc;
      }, {});

      for (const round in grouped) {
        grouped[round] = shuffleArray(grouped[round]);
      }
      return grouped;
    };

    const fetchFixtures = async () => {
      try {
        const res = await fixtureService.getCompetitionFixtures(competitionId);
        const groupedAndShuffledFixtures = groupAndShuffleFixturesByRound(res.data.data);
        setFixturesByRound(groupedAndShuffledFixtures);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load fixtures');
      } finally {
        setLoading(false);
      }
    };

    fetchFixtures();

    socket.on('fixtureUpdate', (updatedFixture) => {
      setFixturesByRound(prev => {
        const newFixturesByRound = { ...prev };
        for (const round in newFixturesByRound) {
          const index = newFixturesByRound[round].findIndex(f => f._id === updatedFixture._id);
          if (index !== -1) {
            newFixturesByRound[round][index] = updatedFixture;
            break;
          }
        }
        return newFixturesByRound;
      });
    });

    socket.on('playerNameUpdate', ({ playerId, newName }) => {
      setFixturesByRound(prev => {
        const newFixturesByRound = { ...prev };
        for (const round in newFixturesByRound) {
          newFixturesByRound[round] = newFixturesByRound[round].map(f => ({
            ...f,
            homePlayerName: f.homePlayer === playerId ? newName : f.homePlayerName,
            awayPlayerName: f.awayPlayer === playerId ? newName : f.awayPlayerName
          }));
        }
        return newFixturesByRound;
      });
    });

    return () => {
      socket.off('fixtureUpdate');
      socket.off('playerNameUpdate');
    };
  }, [competitionId]);

  const filteredFixtures = useMemo(() => {
    if (!searchTerm) return fixturesByRound;
    
    const term = searchTerm.toLowerCase();
    const filtered = {};
    
    Object.keys(fixturesByRound).forEach(round => {
      filtered[round] = fixturesByRound[round].filter(fixture => {
        const homeName = (fixture.homePlayerName || fixture.homePlayer?.name || 'TBD').toLowerCase();
        const awayName = (fixture.awayPlayerName || fixture.awayPlayer?.name || 'TBD').toLowerCase();
        return homeName.includes(term) || awayName.includes(term);
      });
    });
    
    return filtered;
  }, [fixturesByRound, searchTerm]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-black via-gray-900 to-black min-h-screen flex items-center justify-center font-cinzel text-gold text-xl">
        <div className="animate-pulse">
          <span className="text-3xl text-gold">⚽</span> Loading Fixtures...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black min-h-screen p-4 sm:p-6 md:p-10 font-cinzel">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 uppercase tracking-wider">
            <span className="text-gold bg-clip-text bg-gradient-to-r from-gold via-yellow-300 to-gold text-transparent">
              Fixtures
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-gold to-yellow-600 mx-auto mb-8 rounded-full"></div>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/30 backdrop-blur-sm border-2 border-gold/30 rounded-full py-3 px-6 text-gold placeholder-gold/70 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all duration-300 shadow-lg shadow-gold/10"
            />
            <span className="absolute right-4 top-3.5 text-gold">
              🔍
            </span>
          </div>
        </div>

        <div className="space-y-12">
          {Object.keys(filteredFixtures).length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gold text-xl mb-2">No fixtures found</div>
              <div className="text-gold/70 text-sm">
                {searchTerm ? `No matches for "${searchTerm}"` : 'No fixtures scheduled'}
              </div>
            </div>
          ) : (
            Object.keys(filteredFixtures).map(round => (
              <div 
                key={round} 
                className="bg-gradient-to-br from-black/70 to-gray-900/50 border border-gold/20 rounded-xl p-6 shadow-2xl shadow-gold/10 backdrop-blur-sm transition-all duration-500 hover:border-gold/50 hover:shadow-gold/20"
              >
                <h3 className="text-xl md:text-2xl font-bold mb-6 pb-3 border-b border-gold/30 flex items-center">
                  <span className="bg-gold text-black py-1 px-4 rounded-full mr-3 text-sm">Round</span>
                  <span className="text-gold capitalize">{round}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredFixtures[round].map(fixture => (
                    <div 
                      key={fixture._id} 
                      className="bg-gradient-to-br from-black/60 to-gray-900/40 border border-gold/10 rounded-xl p-5 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:shadow-gold/20 hover:border-gold/50 group"
                    >
                      <div className="flex justify-between items-center text-lg mb-4">
                        <div className="text-white font-medium text-center flex-1 truncate px-2">
                          {fixture.homePlayerName || fixture.homePlayer?.name || 'TBD'}
                        </div>
                        <div className="mx-2 flex flex-col items-center">
                          <span className="text-xs text-gold/80">VS</span>
                          <span className="text-xs text-gold/50 mt-1">
                            {new Date(fixture.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-white font-medium text-center flex-1 truncate px-2">
                          {fixture.awayPlayerName || fixture.awayPlayer?.name || 'TBD'}
                        </div>
                      </div>
                      
                      <div className="flex justify-center mt-3">
                        <div className="text-xs text-gold/60 bg-black/30 py-1 px-3 rounded-full border border-gold/10">
                          {new Date(fixture.matchDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}