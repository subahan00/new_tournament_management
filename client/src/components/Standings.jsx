import { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import standingService from '../services/standingService';
import io from 'socket.io-client';
import {
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  TrophyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Initialize Socket.IO connection with reconnection logic
const socket = io(`${process.env.REACT_APP_BACKEND_URL}`, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Memoized StandingsTable component with virtualization for large datasets
const StandingsTable = memo(({ standings, title = null, showGroupHeader = false, isLoading = false }) => {
  const safeStandings = Array.isArray(standings) ? standings : [];

  if (isLoading) {
    return (
      <div className="mb-8">
        {showGroupHeader && title && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-900/40 to-blue-800/40 rounded-lg border border-blue-600/50">
            <div className="h-6 bg-blue-600/30 rounded animate-pulse"></div>
          </div>
        )}
        <div className="overflow-x-auto rounded-xl shadow-2xl border border-amber-600/40 bg-gradient-to-br from-zinc-950 to-zinc-800">
          <div className="p-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
            <p className="text-amber-600/80 mt-4">Loading standings...</p>
          </div>
        </div>
      </div>
    );
  }

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
                    <td key={key} className="px-6 py-4 text-center font-medium">
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
  
  // Consolidated state to reduce re-renders
  const [state, setState] = useState({
    standingsData: null,
    loading: true,
    error: null,
    competitionName: 'Competition',
    competitionType: 'LEAGUE',
    activeGroup: null,
    loadingGroups: new Set() // Track which groups are loading
  });

  // Cache refs to prevent unnecessary socket reconnections
  const socketListenersSet = useRef(false);
  const dataCache = useRef(new Map());

  // Memoized group processing - only process when needed
  const processedGroupData = useMemo(() => {
    if (state.competitionType !== 'GROUP_STAGE' || !state.standingsData) {
      return { groups: [], groupData: {} };
    }

    let groupData = {};
    let groups = [];

    if (Array.isArray(state.standingsData) && state.standingsData.length > 0 && state.standingsData[0].group) {
      // Process array format
      const grouped = state.standingsData.reduce((acc, standing) => {
        const groupName = standing.group;
        if (!acc[groupName]) {
          acc[groupName] = [];
        }
        acc[groupName].push(standing);
        return acc;
      }, {});

      groupData = grouped;
      groups = Object.keys(grouped).sort();
    } else if (typeof state.standingsData === 'object') {
      // Process object format
      groupData = state.standingsData;
      groups = Object.keys(state.standingsData).filter(key => 
        Array.isArray(state.standingsData[key])
      ).sort();
    }

    // Sort standings within each group only when accessed
    const sortedGroupData = {};
    groups.forEach(groupName => {
      if (groupData[groupName]) {
        sortedGroupData[groupName] = [...groupData[groupName]].sort((a, b) => {
          const pointsDiff = (b.points || 0) - (a.points || 0);
          if (pointsDiff !== 0) return pointsDiff;
          const aGD = (a.goalsFor || 0) - (a.goalsAgainst || 0);
          const bGD = (b.goalsFor || 0) - (b.goalsAgainst || 0);
          return bGD - aGD;
        });
      }
    });

    return { groups, groupData: sortedGroupData };
  }, [state.standingsData, state.competitionType]);

  // Lazy load specific group data
  const loadGroupData = useCallback(async (groupName) => {
    if (dataCache.current.has(groupName)) {
      return dataCache.current.get(groupName);
    }

    setState(prev => ({
      ...prev,
      loadingGroups: new Set([...prev.loadingGroups, groupName])
    }));

    try {
      // Simulate API call for specific group if needed
      // In your case, data might already be available
      const groupData = processedGroupData.groupData[groupName] || [];
      dataCache.current.set(groupName, groupData);
      
      setState(prev => {
        const newLoadingGroups = new Set(prev.loadingGroups);
        newLoadingGroups.delete(groupName);
        return {
          ...prev,
          loadingGroups: newLoadingGroups
        };
      });

      return groupData;
    } catch (error) {
      console.error(`Failed to load group ${groupName}:`, error);
      setState(prev => {
        const newLoadingGroups = new Set(prev.loadingGroups);
        newLoadingGroups.delete(groupName);
        return {
          ...prev,
          loadingGroups: newLoadingGroups
        };
      });
      return [];
    }
  }, [processedGroupData.groupData]);

  // Optimized data fetching with early returns
  const fetchStandings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data } = await standingService.getStandings(competitionId);

      // Early validation
      if (!data) {
        throw new Error('No data received');
      }

      // Simplified processing with batch state update
      const updates = {
        loading: false,
        error: null
      };

      if (data.competitionType === 'GROUP_STAGE' || (Array.isArray(data) && data.length > 0 && data[0].group)) {
        updates.competitionType = 'GROUP_STAGE';
        updates.standingsData = data.standings || data.groups || data;
        updates.competitionName = data.competitionName || 'Group Stage Competition';
        
        // Set first available group as active, but don't load all groups
        const firstGroup = Object.keys(updates.standingsData)[0];
        updates.activeGroup = firstGroup || null;
      } else {
        updates.competitionType = 'LEAGUE';
        updates.standingsData = data?.standings || data || [];
        updates.competitionName = data?.competitionName || 'League Competition';
      }

      setState(prev => ({ ...prev, ...updates }));

    } catch (err) {
      console.error('Failed to load standings:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load standings data. Please try again.',
        standingsData: null
      }));
    }
  }, [competitionId]);

  // Optimized tournament stats - only calculate when needed
  const tournamentStats = useMemo(() => {
    if (state.competitionType !== 'GROUP_STAGE' || !processedGroupData.groups.length) {
      return null;
    }
    
    return {
      totalGroups: processedGroupData.groups.length,
      totalPlayers: processedGroupData.groups.reduce((total, group) => 
        total + (processedGroupData.groupData[group]?.length || 0), 0
      ),
      activeGroups: processedGroupData.groups.filter(group => 
        processedGroupData.groupData[group]?.some(player => player.matchesPlayed > 0)
      ).length
    };
  }, [processedGroupData.groups, processedGroupData.groupData, state.competitionType]);

  // Memoized group leaders - only for 'all' view
  const groupLeaders = useMemo(() => {
    if (state.competitionType !== 'GROUP_STAGE' || state.activeGroup !== 'all' || !processedGroupData.groups.length) {
      return [];
    }
    
    return processedGroupData.groups.map(groupName => {
      const groupStandings = processedGroupData.groupData[groupName] || [];
      const leader = groupStandings.length > 0 ? groupStandings[0] : null;
      return { groupName, leader };
    });
  }, [state.competitionType, state.activeGroup, processedGroupData.groups, processedGroupData.groupData]);

  // Optimized socket handlers
  const handleStandingsUpdate = useCallback((update) => {
    if (update.competitionId === competitionId) {
      // Clear cache on updates
      dataCache.current.clear();
      
      setState(prev => {
        const newState = { ...prev };
        
        if (update.competitionType === 'GROUP_STAGE' || update.type === 'GROUP_STAGE') {
          newState.standingsData = update.standings || update.groups || update;
          newState.competitionType = 'GROUP_STAGE';
          
          // Keep current active group if it still exists
          const availableGroups = Object.keys(newState.standingsData);
          if (!availableGroups.includes(prev.activeGroup)) {
            newState.activeGroup = availableGroups[0] || null;
          }
        } else {
          newState.standingsData = Array.isArray(update.standings) ? update.standings : update;
          newState.competitionType = 'LEAGUE';
        }
        
        return newState;
      });
    }
  }, [competitionId]);

  const handleConnectError = useCallback((err) => {
    console.error('Socket connection error:', err);
    setState(prev => ({ 
      ...prev, 
      error: 'Real-time updates are currently unavailable.' 
    }));
  }, []);

  // Setup socket listeners only once
  useEffect(() => {
    if (!socketListenersSet.current) {
      socket.on('standings_update', handleStandingsUpdate);
      socket.on('connect_error', handleConnectError);
      socketListenersSet.current = true;
    }

    return () => {
      socket.off('standings_update', handleStandingsUpdate);
      socket.off('connect_error', handleConnectError);
      socketListenersSet.current = false;
    };
  }, [handleStandingsUpdate, handleConnectError]);

  // Fetch data on mount
  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  // Handle group selection with lazy loading
  const handleGroupSelect = useCallback(async (groupName) => {
    setState(prev => ({ ...prev, activeGroup: groupName }));
    
    if (groupName !== 'all' && !dataCache.current.has(groupName)) {
      await loadGroupData(groupName);
    }
  }, [loadGroupData]);

  // Loading state with skeleton
  if (state.loading) {
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

  if (state.error) {
    return (
      <div className="p-6 bg-black min-h-screen flex flex-col items-center justify-center text-center">
        <div className="text-red-500 text-2xl mb-6">
          <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-4 text-red-600" />
          <p className="font-bold">Oops! Something went wrong.</p>
          <p className="mt-2 text-lg">{state.error}</p>
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
            {state.competitionName.toUpperCase()} STANDINGS
          </h1>
          <div className="flex items-center space-x-2">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              state.competitionType === 'GROUP_STAGE' 
                ? 'bg-blue-900/50 text-blue-200 border border-blue-600/50'
                : 'bg-amber-900/50 text-amber-200 border border-amber-600/50'
            }`}>
              {state.competitionType === 'GROUP_STAGE' ? 'Group Stage' : 'League'}
            </span>
          </div>
        </div>

        {/* Group Stage Navigation */}
        {state.competitionType === 'GROUP_STAGE' && processedGroupData.groups.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {processedGroupData.groups.map((groupName) => (
                <button
                  key={groupName}
                  onClick={() => handleGroupSelect(groupName)}
                  disabled={state.loadingGroups.has(groupName)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 ${
                    state.activeGroup === groupName
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-blue-900/40 text-blue-200 hover:bg-blue-800/60 border border-blue-600/30'
                  }`}
                >
                  {state.loadingGroups.has(groupName) ? 'Loading...' : groupName}
                </button>
              ))}
              {processedGroupData.groups.length > 1 && (
                <button
                  onClick={() => handleGroupSelect('all')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    state.activeGroup === 'all'
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
        {state.competitionType === 'LEAGUE' ? (
          <StandingsTable standings={state.standingsData} />
        ) : state.competitionType === 'GROUP_STAGE' && state.standingsData ? (
          state.activeGroup === 'all' ? (
            <div className="space-y-8">
              {processedGroupData.groups.map((groupName) => (
                <StandingsTable
                  key={groupName}
                  standings={processedGroupData.groupData[groupName] || []}
                  title={groupName}
                  showGroupHeader={true}
                  isLoading={state.loadingGroups.has(groupName)}
                />
              ))}
            </div>
          ) : state.activeGroup && processedGroupData.groupData[state.activeGroup] ? (
            <StandingsTable
              standings={processedGroupData.groupData[state.activeGroup] || []}
              title={state.activeGroup}
              showGroupHeader={true}
              isLoading={state.loadingGroups.has(state.activeGroup)}
            />
          ) : (
            <div className="text-center p-10">
              <div className="text-amber-600/80 text-xl font-medium">
                Welcome to Group Stages {state.activeGroup || 'selected group'}.
              </div>
              <p className="text-amber-700 mt-2">
                Kindly Select Your Group
              </p>
            </div>
          )
        ) : (
          <div className="text-center p-10">
            <div className="text-amber-600/80 text-xl font-medium">
              No standings data available yet.
            </div>
            <p className="text-amber-700 mt-2">
              {state.competitionType === 'GROUP_STAGE' 
                ? 'Group matches need to be completed to generate standings.'
                : 'League matches need to be completed to generate standings.'
              }
            </p>
          </div>
        )}

        {/* Tournament Summary - Only show when viewing all groups */}
        {state.competitionType === 'GROUP_STAGE' && tournamentStats && state.activeGroup === 'all' && (
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
