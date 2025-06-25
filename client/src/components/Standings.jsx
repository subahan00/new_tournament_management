
import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useParams } from 'react-router-dom';
import standingService from '../services/standingService';
import io from 'socket.io-client';
import {
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  TrophyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Singleton socket connection
let socket = null;
const getSocket = () => {
  if (!socket) {
    socket = io(`${process.env.REACT_APP_BACKEND_URL}`, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

// Optimized StandingsTable component
const StandingsTable = memo(({ standings, title, showGroupHeader = false }) => {
  const safeStandings = Array.isArray(standings) ? standings : [];

 // Replace your existing processedStandings useMemo with this:

const processedStandings = useMemo(() => {
  if (!Array.isArray(safeStandings) || safeStandings.length === 0) {
    return [];
  }

  // First, add calculated fields to each standing
  const standingsWithCalculatedFields = safeStandings.map((standing) => ({
    ...standing,
    goalDifference: (standing.goalsFor || 0) - (standing.goalsAgainst || 0),
    isDeleted: standing.playerName?.startsWith('Deleted-')
  }));

  // Then sort by the proper criteria
  const sortedStandings = standingsWithCalculatedFields.sort((a, b) => {
    // 1. Sort by Points (descending)
    if (b.points !== a.points) {
      return (b.points || 0) - (a.points || 0);
    }
    
    // 2. If points are equal, sort by Goal Difference (descending)
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    
    // 3. If goal difference is equal, sort by Goals For (descending)
    if ((b.goalsFor || 0) !== (a.goalsFor || 0)) {
      return (b.goalsFor || 0) - (a.goalsFor || 0);
    }
    
    // 4. If still tied, sort alphabetically by player name
    const nameA = (a.playerName || 'Unknown').toLowerCase();
    const nameB = (b.playerName || 'Unknown').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Finally, add positions and other display fields based on sorted order
  return sortedStandings.map((standing, index) => ({
    ...standing,
    position: index + 1,
    isTopTwo: (index + 1) <= 2
  }));
}, [safeStandings]);

  return (
    <div className="mb-8">
      {showGroupHeader && title && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-900/40 to-blue-800/40 rounded-lg border border-blue-600/50">
          <h2 className="text-2xl font-bold text-blue-200 flex items-center">
            <UserGroupIcon className="h-6 w-6 mr-2" />
            {title}
          </h2>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl shadow-2xl border border-amber-600/40 bg-gradient-to-br from-zinc-950 to-zinc-800">
        <table className="min-w-full text-base lg:text-lg">
          <thead className="bg-amber-900/50 uppercase text-amber-200">
            <tr>
              {['#', 'Player', 'Played', 'Wins', 'Draws', 'Losses', 'GF', 'GA', 'GD', 'Points'].map((header) => (
                <th
                  key={header}
                  className="px-6 py-5 text-left font-bold tracking-wider border-b border-amber-800"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-amber-900/60">
            {processedStandings.map((standing, index) => (
              <tr
                key={standing._id || `${standing.player}-${index}`}
                className={`hover:bg-amber-900/30 transition-all duration-200 even:bg-zinc-900/40 text-amber-100 ${
                  standing.isTopTwo ? 'bg-gradient-to-r from-amber-900/20 to-transparent' : ''
                }`}
              >
                <td className="px-6 py-4 font-medium text-amber-300 flex items-center">
                  {standing.position}
                  {standing.position === 1 && <TrophyIcon className="h-5 w-5 ml-2 text-amber-400" />}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {standing.playerName ? (
                    standing.isDeleted ? (
                      <span className="text-red-400/90 flex items-center font-semibold">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-500" />
                        {standing.playerName.replace('Deleted-', '')}
                      </span>
                    ) : (
                      <span className="text-amber-100 font-semibold">{standing.playerName}</span>
                    )
                  ) : (
                    <span className="text-amber-500 flex items-center italic">
                      <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                      Unknown Player
                    </span>
                  )}
                </td>
                {['matchesPlayed', 'wins', 'draws', 'losses', 'goalsFor', 'goalsAgainst'].map((key) => (
                  <td key={key} className="px-6 py-4 text-center font-medium">
                    {standing[key] || 0}
                  </td>
                ))}
                <td className={`px-6 py-4 text-center font-bold ${standing.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
                </td>
                <td className="px-6 py-4 text-center font-extrabold text-amber-200 text-xl">
                  {standing.points || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {safeStandings.length === 0 && (
          <div className="p-10 text-center text-amber-600/80 text-xl font-medium">
            No standings available yet. Start playing matches to see the rankings!
          </div>
        )}
      </div>
    </div>
  );
});

StandingsTable.displayName = 'StandingsTable';

export default function Standings() {
  const { competitionId } = useParams();
  
  const [standingsData, setStandingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [competitionName, setCompetitionName] = useState('Competition');
  const [competitionType, setCompetitionType] = useState('LEAGUE');
  const [activeGroup, setActiveGroup] = useState(null);

  // Simplified data processing - backend now returns clean data
  const fetchStandings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await standingService.getStandings(competitionId);

      // Backend now returns consistent structure
      if (data.type === 'GROUP_STAGE' || data.competitionType === 'GROUP_STAGE') {
        setCompetitionType('GROUP_STAGE');
        setStandingsData(data.standings || data.groups || {});
        setCompetitionName(data.competitionName || 'Group Stage Competition');
        
        const groupKeys = Object.keys(data.standings || data.groups || {});
        if (groupKeys.length > 0 && !activeGroup) {
          setActiveGroup(groupKeys[0]);
        }
      } else {
        // League format
        setCompetitionType('LEAGUE');
        setStandingsData(data.standings || data || []);
        setCompetitionName(data.competitionName || 'League Competition');
      }
    } catch (err) {
      console.error('Failed to load standings:', err);
      setError('Failed to load standings data. Please try again.');
      setStandingsData(null);
    } finally {
      setLoading(false);
    }
  }, [competitionId, activeGroup]);

  // Memoized computations
  const availableGroups = useMemo(() => {
    return competitionType === 'GROUP_STAGE' && standingsData 
      ? Object.keys(standingsData).filter(key => Array.isArray(standingsData[key])).sort()
      : [];
  }, [competitionType, standingsData]);

  const tournamentStats = useMemo(() => {
    if (competitionType !== 'GROUP_STAGE' || !standingsData) return null;
    
    return {
      totalGroups: availableGroups.length,
      totalPlayers: availableGroups.reduce((total, group) => 
        total + (standingsData[group] ? standingsData[group].length : 0), 0
      ),
      activeGroups: availableGroups.filter(group => 
        standingsData[group] && standingsData[group].some(player => player.matchesPlayed > 0)
      ).length
    };
  }, [competitionType, standingsData, availableGroups]);

  const groupLeaders = useMemo(() => {
    if (competitionType !== 'GROUP_STAGE' || !standingsData || activeGroup !== 'all') return [];
    
    return availableGroups.map(groupName => {
      const groupStandings = standingsData[groupName] || [];
      const leader = groupStandings.length > 0 ? groupStandings[0] : null;
      return { groupName, leader };
    });
  }, [competitionType, standingsData, activeGroup, availableGroups]);

  // Optimized socket handlers
  const handleStandingsUpdate = useCallback((update) => {
    if (update.competitionId === competitionId) {
      // Backend sends clean, pre-processed data
      if (update.type === 'GROUP_STAGE' || update.competitionType === 'GROUP_STAGE') {
        setStandingsData(update.standings || update.groups || {});
      } else {
        setStandingsData(update.standings || update);
      }
    }
  }, [competitionId]);

  useEffect(() => {
    fetchStandings();

    const socketInstance = getSocket();
    socketInstance.on('standings_update', handleStandingsUpdate);

    return () => {
      socketInstance.off('standings_update', handleStandingsUpdate);
    };
  }, [fetchStandings, handleStandingsUpdate]);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-black min-h-screen text-amber-500">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-12 bg-amber-900/20 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-8 bg-amber-900/20 rounded"></div>
              <div className="h-64 bg-amber-900/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-black min-h-screen flex flex-col items-center justify-center text-center">
        <div className="text-red-500 text-2xl mb-6">
          <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-4 text-red-600" />
          <p className="font-bold">Oops! Something went wrong.</p>
          <p className="mt-2 text-lg">{error}</p>
        </div>
        <button
          onClick={fetchStandings}
          className="mt-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black px-6 py-3 rounded-lg font-bold text-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg"
        >
          Try Again
        </button>
      </div>
    );
  }
  return (
    <div className="p-6 bg-black min-h-screen text-amber-500 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-amber-700 pb-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 sm:mb-0 bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-lg text-center sm:text-left">
            {competitionName.toUpperCase()} STANDINGS
          </h1>
          <div className="flex items-center space-x-2">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              competitionType === 'GROUP_STAGE' 
                ? 'bg-blue-900/50 text-blue-200 border border-blue-600/50'
                : 'bg-amber-900/50 text-amber-200 border border-amber-600/50'
            }`}>
              {competitionType === 'GROUP_STAGE' ? 'Group Stage' : 'League'}
            </span>
          </div>
        </div>

        {/* Group Stage Navigation */}
        {competitionType === 'GROUP_STAGE' && availableGroups.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {availableGroups.map((groupName) => (
                <button
                  key={groupName}
                  onClick={() => setActiveGroup(groupName)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    activeGroup === groupName
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-blue-900/40 text-blue-200 hover:bg-blue-800/60 border border-blue-600/30'
                  }`}
                >
                  {groupName}
                </button>
              ))}
              {availableGroups.length > 1 && (
                <button
                  onClick={() => setActiveGroup('all')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    activeGroup === 'all'
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-blue-900/40 text-blue-200 hover:bg-blue-800/60 border border-blue-600/30'
                  }`}
                >
                  All Groups
                </button>
              )}
            </div>
          </div>
        )}

        {/* Standings Content */}
        {competitionType === 'LEAGUE' ? (
          <StandingsTable standings={standingsData} />
        ) : competitionType === 'GROUP_STAGE' && standingsData ? (
          activeGroup === 'all' ? (
            <div className="space-y-8">
              {availableGroups.map((groupName) => (
                <StandingsTable
                  key={groupName}
                  standings={standingsData[groupName] || []}
                  title={groupName}
                  showGroupHeader={true}
                />
              ))}
            </div>
          ) : activeGroup && standingsData[activeGroup] ? (
            <StandingsTable
              standings={standingsData[activeGroup] || []}
              title={activeGroup}
              showGroupHeader={true}
            />
          ) : (
            <div className="text-center p-10">
              <div className="text-amber-600/80 text-xl font-medium">
                No standings data available for {activeGroup || 'selected group'}.
              </div>
              <p className="text-amber-700 mt-2">
                Group matches need to be completed to generate standings.
              </p>
            </div>
          )
        ) : (
          <div className="text-center p-10">
            <div className="text-amber-600/80 text-xl font-medium">
              No standings data available yet.
            </div>
            <p className="text-amber-700 mt-2">
              {competitionType === 'GROUP_STAGE' 
                ? 'Group matches need to be completed to generate standings.'
                : 'League matches need to be completed to generate standings.'
              }
            </p>
          </div>
        )}

        {/* Tournament Summary - Only show when viewing all groups */}
        {competitionType === 'GROUP_STAGE' && tournamentStats && activeGroup === 'all' && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-xl border border-blue-600/30">
            <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center">
              <TrophyIcon className="h-6 w-6 mr-2" />
              Tournament Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-blue-600/20">
                <div className="text-2xl font-bold text-blue-300">{tournamentStats.totalGroups}</div>
                <div className="text-blue-500 text-sm">Total Groups</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-blue-600/20">
                <div className="text-2xl font-bold text-blue-300">{tournamentStats.totalPlayers}</div>
                <div className="text-blue-500 text-sm">Total Players</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-blue-600/20">
                <div className="text-2xl font-bold text-blue-300">{tournamentStats.activeGroups}</div>
                <div className="text-blue-500 text-sm">Active Groups</div>
              </div>
            </div>
          </div>
        )}

        {/* Group Leaders Summary */}
        {groupLeaders.length > 1 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-amber-900/20 to-amber-800/20 rounded-xl border border-amber-600/30">
            <h3 className="text-xl font-bold text-amber-200 mb-4 flex items-center">
              <TrophyIcon className="h-6 w-6 mr-2" />
              Group Leaders
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupLeaders.map(({ groupName, leader }) => (
                <div key={groupName} className="bg-zinc-900/50 p-4 rounded-lg border border-amber-600/20">
                  <div className="text-lg font-bold text-amber-300 mb-2">{groupName}</div>
                  {leader ? (
                    <div>
                      <div className="text-amber-100 font-semibold">{leader.playerName}</div>
                      <div className="text-sm text-amber-400">
                        {leader.points} pts • {leader.matchesPlayed} played
                      </div>
                    </div>
                  ) : (
                    <div className="text-amber-600 text-sm">No matches played</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
