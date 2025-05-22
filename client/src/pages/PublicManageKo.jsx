import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import fixtureService from '../services/fixtureService';

const PublicManageKo = () => {
  const { competitionId } = useParams();
  const [fixtures, setFixtures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedFixtures, setGroupedFixtures] = useState({});

  useEffect(() => {
    const loadFixtures = async () => {
      try {
        const fixturesData = await fixtureService.fetchFixturesByCompetition(competitionId);
        const grouped = fixturesData.reduce((acc, fixture) => {
          const round = fixture.round;
          if (!acc[round]) acc[round] = [];
          acc[round].push(fixture);
          return acc;
        }, {});
        setGroupedFixtures(grouped);
        setFixtures(fixturesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadFixtures();
  }, [competitionId]);

  const sortedRounds = Object.keys(groupedFixtures).sort();

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black text-amber-500 flex items-center justify-center text-xl">
      Error: {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <Link 
            to="/public-ko" 
            className="px-3 py-1.5 border border-amber-500 text-amber-500 rounded-full text-xs hover:bg-amber-500/10 transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-lg font-bold text-amber-500 uppercase tracking-tight mx-auto">
            Tournament Bracket
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {sortedRounds.map((round) => (
            <div key={round} className="bg-gray-900 rounded p-2 border border-amber-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs text-amber-500 font-medium truncate">{round}</h3>
                <span className="text-[0.6rem] text-amber-500/60">
                  {groupedFixtures[round].length} matches
                </span>
              </div>
              
              {groupedFixtures[round].map((fixture) => (
                <div 
                  key={fixture._id.$oid}
                  className="group relative bg-black/20 rounded-sm p-1.5 mb-3 border border-amber-500/10 hover:border-amber-500 transition-all"
                >
                  <div className="flex items-center justify-between text-xs space-x-2">
                    {/* Home Player */}
                    <div className="flex items-center truncate">
                      <span className="text-amber-400 truncate">
                        {fixture.homePlayer?.name}
                      </span>
                      <span className="text-amber-500 ml-1 text-[0.7rem]">
                        ({fixture.homeScore ?? '-'})
                      </span>
                    </div>

                    {/* VS Separator */}
                    <span className="text-amber-500 mx-1 text-[0.6rem]">vs</span>

                    {/* Away Player */}
                    <div className="flex items-center truncate">
                      <span className="text-amber-400 truncate">
                        {fixture.awayPlayer?.name}
                      </span>
                      <span className="text-amber-500 ml-1 text-[0.7rem]">
                        ({fixture.awayScore ?? '-'})
                      </span>
                    </div>
                  </div>

                  {/* Status & Date */}
                  {/* <div className="absolute -top-2 -right-1 flex items-center space-x-1">
                    <span className="bg-amber-500 text-black px-1 text-[0.5rem] font-bold rounded">
                      {fixture.status}
                    </span>
                    <span className="text-[0.5rem] text-amber-500/60">
                      {new Date(fixture.matchDate.$date).toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric'
                      })}
                    </span>
                  </div> */}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicManageKo;