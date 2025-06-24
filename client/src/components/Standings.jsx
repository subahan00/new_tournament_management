import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import standingService from '../services/standingService';
import io from 'socket.io-client';
import {
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  ArrowDownTrayIcon,
  TrophyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Initialize Socket.IO connection with reconnection logic
const socket = io(`${process.env.REACT_APP_BACKEND_URL}`, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default function Standings() {
  // Extract competitionId from URL parameters
  const { competitionId } = useParams();

  // State variables for standings data, loading status, error messages, and potential general messages
  const [standingsData, setStandingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [competitionName, setCompetitionName] = useState('Competition');
  const [competitionType, setCompetitionType] = useState('LEAGUE'); // Track competition type
  const [activeGroup, setActiveGroup] = useState(null); // For group stage navigation

  // useEffect hook for data fetching and real-time updates
  useEffect(() => {
    // Function to fetch standings data from the API
     const fetchStandings = async () => {
      try {
        const { data } = await standingService.getStandings(competitionId);
        console.log('Fetched standings data:', data);

        // Handle different response formats
        if (data && data.competitionType === 'GROUP_STAGE') {
          // New format: competition type explicitly provided
          setCompetitionType('GROUP_STAGE');
          setStandingsData(data.standings || data.groups || {});
          setCompetitionName(data.competitionName || 'Group Stage Competition');
          // Set first group as active by default
          const groupKeys = Object.keys(data.standings || data.groups || {});
          setActiveGroup(groupKeys.length > 0 ? groupKeys[0] : null);
        }
        // ADD THIS NEW CONDITION - Check if data is an array with group properties
        else if (Array.isArray(data) && data.length > 0 && data[0].group) {
          // This is your current data format - array of standings with group property
          setCompetitionType('GROUP_STAGE');

          // Group the array data by group name
          const groupedData = data.reduce((acc, standing) => {
            const groupName = standing.group;
            if (!acc[groupName]) {
              acc[groupName] = [];
            }
            acc[groupName].push(standing);
            return acc;
          }, {});

          // Sort each group by points (descending), then by goal difference
          Object.keys(groupedData).forEach(groupName => {
            groupedData[groupName].sort((a, b) => {
              const pointsDiff = (b.points || 0) - (a.points || 0);
              if (pointsDiff !== 0) return pointsDiff;

              const aGD = (a.goalsFor || 0) - (a.goalsAgainst || 0);
              const bGD = (b.goalsFor || 0) - (b.goalsAgainst || 0);
              return bGD - aGD;
            });
          });

          setStandingsData(groupedData);
          setCompetitionName('Group Stage Competition');
          // Set first group as active by default
          const groupKeys = Object.keys(groupedData);
          setActiveGroup(groupKeys.length > 0 ? groupKeys[0] : null);
        }
        else if (data && typeof data === 'object' && !Array.isArray(data) && !data.standings) {
          // Object with group keys (direct group standings format)
          const hasGroupKeys = Object.keys(data).some(key =>
            key.startsWith('Group') || key.includes('Group')
          );

          if (hasGroupKeys) {
            setCompetitionType('GROUP_STAGE');
            setStandingsData(data);
            setCompetitionName('Group Stage Competition');
            const firstGroup = Object.keys(data)[0];
            setActiveGroup(firstGroup);
          } else {
            // Regular league format
            setCompetitionType('LEAGUE');
            setStandingsData(data.standings || []);
            setCompetitionName(data.competitionName || 'League Competition');
          }
        } else if (data && data.standings) {
          // League competition with nested standings
          setCompetitionType('LEAGUE');
          setStandingsData(Array.isArray(data.standings) ? data.standings : []);
          setCompetitionName(data.competitionName || 'League Competition');
        } else {
          // Direct array of standings (legacy format) - only if no group property
          setCompetitionType('LEAGUE');
          setStandingsData(Array.isArray(data) ? data : []);
          setCompetitionName('League Competition');
        }
      } catch (err) {
        console.error('Failed to load standings:', err);
        setError('Failed to load standings data. Please try again.');
        setStandingsData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings(); // Initial fetch

    // Socket.IO event handler for real-time standings updates
    const handleStandingsUpdate = (update) => {
      if (update.competitionId === competitionId) {
        if (update.competitionType === 'GROUP_STAGE' || update.type === 'GROUP_STAGE') {
          setStandingsData(update.standings || update.groups || update);
          // Only set active group if it's not already set
          setActiveGroup(prevActiveGroup => {
            if (!prevActiveGroup && Object.keys(update.standings || update.groups || update).length > 0) {
              return Object.keys(update.standings || update.groups || update)[0];
            }
            return prevActiveGroup;
          });
        } else {
          setStandingsData(Array.isArray(update.standings) ? update.standings : update);
        }
      }
    };

    // Socket.IO event handler for connection errors
    const handleConnectError = (err) => {
      console.error('Socket connection error:', err);
      setError('Real-time updates are currently unavailable.');
    };

    // Subscribe to socket events
    socket.on('standings_update', handleStandingsUpdate);
    socket.on('connect_error', handleConnectError);

    // Cleanup function: unsubscribe from socket events on component unmount
    return () => {
      socket.off('standings_update', handleStandingsUpdate);
      socket.off('connect_error', handleConnectError);
    };
    // **** CHANGE HERE: REMOVED activeGroup from the dependency array ****
  }, [competitionId]);

  // Component for rendering a single standings table
  const StandingsTable = ({ standings, title = null, showGroupHeader = false }) => {
    const safeStandings = Array.isArray(standings) ? standings : [];
    console.log('Rendering standings for:', title || 'League', safeStandings);
    
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
              {safeStandings.map((standing, index) => {
                const goalDifference = (standing.goalsFor || 0) - (standing.goalsAgainst || 0);
                const position = standing.position || (index + 1);
                
                return (
                  <tr
                    key={standing._id || `${standing.player}-${index}`}
                    className={`hover:bg-amber-900/30 transition-all duration-200 even:bg-zinc-900/40 text-amber-100 ${
                      position <= 2 ? 'bg-gradient-to-r from-amber-900/20 to-transparent' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-amber-300 flex items-center">
                      {position}
                      {position === 1 && <TrophyIcon className="h-5 w-5 ml-2 text-amber-400" />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {standing.playerName ? (
                        standing.playerName.startsWith('Deleted-') ? (
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
                      <td
                        key={key}
                        className="px-6 py-4 text-center font-medium"
                      >
                        {standing[key] || 0}
                      </td>
                    ))}
                    <td className={`px-6 py-4 text-center font-bold ${goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {goalDifference > 0 ? `+${goalDifference}` : goalDifference}
                    </td>
                    <td className="px-6 py-4 text-center font-extrabold text-amber-200 text-xl">
                      {standing.points || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* No standings data message */}
          {safeStandings.length === 0 && (
            <div className="p-10 text-center text-amber-600/80 text-xl font-medium">
              No standings available yet. Start playing matches to see the rankings!
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-yellow-400 text-xl">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-semibold text-2xl">Loading Premium Standings...</span>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="p-6 bg-black min-h-screen flex flex-col items-center justify-center text-center">
        <div className="text-red-500 text-2xl mb-6">
          <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-4 text-red-600" />
          <p className="font-bold">Oops! Something went wrong.</p>
          <p className="mt-2 text-lg">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black px-6 py-3 rounded-lg font-bold text-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Get available groups for GROUP_STAGE
  const availableGroups = competitionType === 'GROUP_STAGE' && standingsData 
    ? Object.keys(standingsData).filter(key => Array.isArray(standingsData[key]))
    : [];

  // Main Standings UI
  return (
    <div className="p-6 bg-black min-h-screen text-amber-500 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-amber-700 pb-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 sm:mb-0 bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-lg text-center sm:text-left">
            {competitionName.toUpperCase()} STANDINGS
          </h1>
          
          {/* Competition Type Badge */}
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
              {availableGroups
                .sort((a, b) => a.localeCompare(b)) // Sort groups alphabetically
                .map((groupName) => (
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
          // League Standings
          <StandingsTable standings={standingsData} />
        ) : competitionType === 'GROUP_STAGE' && standingsData ? (
          // Group Stage Standings
          activeGroup === 'all' ? (
            // Show all groups
            <div className="space-y-8">
              {availableGroups
                .sort((a, b) => a.localeCompare(b))
                .map((groupName) => (
                  <StandingsTable
                    key={groupName}
                    standings={standingsData[groupName] || []}
                    title={groupName}
                    showGroupHeader={true}
                  />
                ))
              }
            </div>
          ) : activeGroup && standingsData[activeGroup] ? (
            // Show single group
            <StandingsTable
              standings={standingsData[activeGroup] || []}
              title={activeGroup}
              showGroupHeader={true}
            />
          ) : (
            // No active group or no data for active group
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
          // No data available
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

        {/* Summary for Group Stage */}
        {competitionType === 'GROUP_STAGE' && standingsData && activeGroup === 'all' && availableGroups.length > 0 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-xl border border-blue-600/30">
            <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center">
              <TrophyIcon className="h-6 w-6 mr-2" />
              Tournament Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-blue-600/20">
                <div className="text-2xl font-bold text-blue-300">
                  {availableGroups.length}
                </div>
                <div className="text-blue-500 text-sm">Total Groups</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-blue-600/20">
                <div className="text-2xl font-bold text-blue-300">
                  {availableGroups.reduce((total, group) => 
                    total + (standingsData[group] ? standingsData[group].length : 0), 0
                  )}
                </div>
                <div className="text-blue-500 text-sm">Total Players</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-blue-600/20">
                <div className="text-2xl font-bold text-blue-300">
                  {availableGroups.filter(group => 
                    standingsData[group] && standingsData[group].some(player => player.matchesPlayed > 0)
                  ).length}
                </div>
                <div className="text-blue-500 text-sm">Active Groups</div>
              </div>
            </div>
          </div>
        )}

        {/* Group Leaders Summary (when viewing all groups) */}
        {competitionType === 'GROUP_STAGE' && standingsData && activeGroup === 'all' && availableGroups.length > 1 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-amber-900/20 to-amber-800/20 rounded-xl border border-amber-600/30">
            <h3 className="text-xl font-bold text-amber-200 mb-4 flex items-center">
              <TrophyIcon className="h-6 w-6 mr-2" />
              Group Leaders
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableGroups
                .sort((a, b) => a.localeCompare(b))
                .map((groupName) => {
                  const groupStandings = standingsData[groupName] || [];
                  const leader = groupStandings.length > 0 ? groupStandings[0] : null;
                  
                  return (
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
                  );
                })
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
