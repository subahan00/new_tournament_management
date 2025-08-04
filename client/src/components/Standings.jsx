import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import standingService from '../services/standingService';
import io from 'socket.io-client';

// Import icons from lucide-react
import { 
    Trophy, 
    Users, 
    AlertTriangle, 
    HelpCircle, 
    ChevronLeft, 
    Loader, 
    BarChart3, 
    Swords,
    Target,
    Crown,
    Award,
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

const InteractiveCard = ({ children, className = "", animationDelay = '0ms', as: Component = 'div' }) => {
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
    <Component ref={scrollRef} style={{ transitionDelay: animationDelay }} 
      className={`modern-card-container transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>
      <div ref={cardRef} className="h-full w-full modern-interactive-card">
        {children}
        {!isMobile && <div className="modern-reflection" />}
      </div>
    </Component>
  );
};

//=================================================================
// STATS SECTION COMPONENT
//=================================================================

const StatsSection = memo(({ standings, groupName = null, competitionType }) => {
  const stats = useMemo(() => {
    const safeStandings = Array.isArray(standings) ? standings : [];
    if (safeStandings.length === 0) return null;

    // Qualifying teams (top 4)
    const qualifying = safeStandings.slice(0, 4);
    
    // Top scorer
    const topScorer = safeStandings.reduce((prev, current) => 
      (current.goalsFor || 0) > (prev.goalsFor || 0) ? current : prev
    );

    // Best defense (least goals conceded)
    const bestDefense = safeStandings.reduce((prev, current) => 
      (current.goalsAgainst || 0) < (prev.goalsAgainst || 0) ? current : prev
    );

    // Best goal difference
    const bestGD = safeStandings.reduce((prev, current) => {
      const currentGD = (current.goalsFor || 0) - (current.goalsAgainst || 0);
      const prevGD = (prev.goalsFor || 0) - (prev.goalsAgainst || 0);
      return currentGD > prevGD ? current : prev;
    });

    return { qualifying, topScorer, bestDefense, bestGD };
  }, [standings]);

  if (!stats) return null;

  return (
    <InteractiveCard className="mb-8">
      <div className="modern-info-card p-6">
        <h3 className="modern-card-title text-xl mb-6 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 mr-3 text-gold-main/80" />
          {groupName ? `${groupName} Statistics` : 'Competition Statistics'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Qualifying Teams */}
          <div className="stats-card">
            <div className="flex items-center mb-3">
              <Crown className="w-5 h-5 text-gold-main mr-2" />
              <span className="stats-label">Qualifying</span>
            </div>
            <div className="space-y-2">
              {stats.qualifying.map((team, index) => (
                <div key={team._id || index} className="flex items-center text-sm">
                  <span className="w-6 h-6 rounded-full bg-gold-main/20 text-gold-main flex items-center justify-center text-xs mr-2">
                    {index + 1}
                  </span>
                  <span className="truncate">{team.playerName || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Scorer */}
          <div className="stats-card">
            <div className="flex items-center mb-3">
              <Target className="w-5 h-5 text-green-400 mr-2" />
              <span className="stats-label">Top Scorer</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{stats.topScorer.playerName || 'Unknown'}</div>
              <div className="text-2xl font-bold text-green-400">{stats.topScorer.goalsFor || 0}</div>
              <div className="text-xs text-purple-light">Goals</div>
            </div>
          </div>

          {/* Best Defense */}
          <div className="stats-card">
            <div className="flex items-center mb-3">
              <Award className="w-5 h-5 text-blue-400 mr-2" />
              <span className="stats-label">Best Defense</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{stats.bestDefense.playerName || 'Unknown'}</div>
              <div className="text-2xl font-bold text-blue-400">{stats.bestDefense.goalsAgainst || 0}</div>
              <div className="text-xs text-purple-light">Goals Against</div>
            </div>
          </div>

          {/* Best Goal Difference */}
          <div className="stats-card">
            <div className="flex items-center mb-3">
              <TrendingUp className="w-5 h-5 text-purple-400 mr-2" />
              <span className="stats-label">Best Form</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{stats.bestGD.playerName || 'Unknown'}</div>
              <div className="text-2xl font-bold text-purple-400">
                +{((stats.bestGD.goalsFor || 0) - (stats.bestGD.goalsAgainst || 0))}
              </div>
              <div className="text-xs text-purple-light">Goal Difference</div>
            </div>
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
});
StatsSection.displayName = 'StatsSection';

//=================================================================
// STANDINGS TABLE COMPONENT
//=================================================================

const StandingsTable = memo(({ standings, title = null, showGroupHeader = false, isLoading = false }) => {
  const safeStandings = Array.isArray(standings) ? standings : [];

  if (isLoading) {
    return (
      <div className="modern-info-card p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
        <Loader className="h-10 w-10 text-gold-main animate-spin" />
        <p className="modern-hero-subtitle text-base mt-3">Loading standings...</p>
      </div>
    );
  }

  return (
    <InteractiveCard className="group">
      <div className="modern-info-card p-0">
        {showGroupHeader && title && (
          <div className="p-4 border-b border-gold-main/10 w-full">
            <h2 className="modern-card-title text-2xl flex items-center justify-center sm:justify-start">
              <Users className="w-6 h-6 mr-3 text-gold-main/80" />
              {title}
            </h2>
          </div>
        )}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm">
            <thead className="font-medium uppercase">
              <tr>
                {['#', 'Player', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'].map((header) => (
                  <th key={header} className="px-3 py-3 text-left tracking-wider text-gold-main/70 border-b border-gold-main/10">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-main/10">
              {safeStandings.map((standing, index) => {
                const goalDifference = (standing.goalsFor || 0) - (standing.goalsAgainst || 0);
                const position = standing.position || (index + 1);

                return (
                  <tr key={standing._id || `${standing.player}-${index}`}
                      className={`transition-all duration-300 hover:bg-purple-dark/50 text-purple-light/90 
                        ${position <= 4 ? 'promotion-glow' : ''}`}>
                    <td className="px-3 py-3 font-bold text-gold-main text-base flex items-center">
                      {position}
                      {position === 1 && <Trophy className="h-4 w-4 ml-2 text-gold-main" />}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap font-medium max-w-[150px]">
                      {standing.playerName ? (
                        standing.playerName.startsWith('Deleted-') ? (
                          <span className="text-red-400 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            <span className="truncate">{standing.playerName.replace('Deleted-', '')}</span>
                          </span>
                        ) : (
                          <span className="text-white truncate">{standing.playerName}</span>
                        )
                      ) : (
                        <span className="text-purple-light/70 flex items-center italic">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          <span className="truncate">Unknown Player</span>
                        </span>
                      )}
                    </td>
                    {['matchesPlayed', 'wins', 'draws', 'losses', 'goalsFor', 'goalsAgainst'].map((key) => (
                      <td key={key} className="px-3 py-3 text-center">{standing[key] || 0}</td>
                    ))}
                    <td className={`px-3 py-3 text-center font-medium ${goalDifference > 0 ? 'text-green-400' : goalDifference < 0 ? 'text-red-400' : ''}`}>
                      {goalDifference > 0 ? `+${goalDifference}` : goalDifference}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-gold-main text-base">
                      {standing.points || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {safeStandings.length === 0 && (
             <div className="p-8 text-center">
                <p className="text-gold-main text-lg">No standings available yet.</p>
                <p className="text-purple-light mt-2">Matches need to be played to generate standings.</p>
             </div>
          )}
        </div>
      </div>
    </InteractiveCard>
  );
});
StandingsTable.displayName = 'StandingsTable';

//=================================================================
// MAIN STANDINGS COMPONENT
//=================================================================

// Initialize Socket.IO connection
const socket = io(`${process.env.REACT_APP_BACKEND_URL}`, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default function Standings() {
    const { competitionId } = useParams();
    const [state, setState] = useState({
        standingsData: null, 
        loading: true, 
        error: null, 
        competitionName: 'Competition',
        competitionType: 'LEAGUE', 
        activeGroup: null, 
        loadingGroups: new Set()
    });
    const socketListenersSet = useRef(false);

    // Memoized data processing
    const processedGroupData = useMemo(() => {
        if (state.competitionType !== 'GROUP_STAGE' || !state.standingsData) return { groups: [], groupData: {} };
        
        let groupData = {};
        if (typeof state.standingsData === 'object' && !Array.isArray(state.standingsData)) {
            groupData = state.standingsData;
        } else if (Array.isArray(state.standingsData)) {
            groupData = state.standingsData.reduce((acc, standing) => {
                const groupName = standing.group || 'Unknown Group';
                if (!acc[groupName]) acc[groupName] = [];
                acc[groupName].push(standing);
                return acc;
            }, {});
        }
        
        const groups = Object.keys(groupData).sort();
        const sortedGroupData = {};
        groups.forEach(groupName => {
            if (groupData[groupName]) {
                sortedGroupData[groupName] = [...groupData[groupName]].sort((a, b) => {
                    if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
                    const aGD = (a.goalsFor || 0) - (a.goalsAgainst || 0);
                    const bGD = (b.goalsFor || 0) - (b.goalsAgainst || 0);
                    if (bGD !== aGD) return bGD - aGD;
                    return (b.goalsFor || 0) - (a.goalsFor || 0);
                });
            }
        });
        
        return { groups, groupData: sortedGroupData };
    }, [state.standingsData, state.competitionType]);
  
    // Data fetching and socket logic
    const fetchStandings = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));
            const { data } = await standingService.getStandings(competitionId);
            if (!data) throw new Error('No data received');
            
            const updates = { loading: false, error: null };
            const isGroupData = data.competitionType === 'GROUP_STAGE' || 
                               (Array.isArray(data) && data.length > 0 && data[0]?.group) || 
                               (typeof data === 'object' && !Array.isArray(data) && 
                                Object.keys(data).some(k => k.toLowerCase().startsWith('group')));

            if (isGroupData) {
                updates.competitionType = 'GROUP_STAGE';
                updates.standingsData = data.standings || data.groups || data;
                updates.competitionName = data.competitionName || 'Group Stage Competition';
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
                error: 'Failed to load standings. Please try again.'
            }));
        }
    }, [competitionId]);

    const handleStandingsUpdate = useCallback((update) => {
        if (update.competitionId === competitionId) {
            setState(prev => {
                const newState = { ...prev };
                const isGroupData = update.competitionType === 'GROUP_STAGE' || update.type === 'GROUP_STAGE';
                
                if (isGroupData) {
                    newState.standingsData = update.standings || update.groups || update;
                    newState.competitionType = 'GROUP_STAGE';
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

    useEffect(() => {
        if (!socketListenersSet.current) {
            socket.on('standings_update', handleStandingsUpdate);
            socketListenersSet.current = true;
        }
        return () => {
            socket.off('standings_update', handleStandingsUpdate);
            socketListenersSet.current = false;
        };
    }, [handleStandingsUpdate]);

    useEffect(() => {
        fetchStandings();
    }, [fetchStandings]);

    // Loading state
    if (state.loading) {
        return (
            <div className="modern-bg min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-12 w-12 text-gold-main animate-spin mx-auto" />
                    <h1 className="modern-hero-subtitle text-xl mt-4">Loading standings...</h1>
                </div>
            </div>
        );
    }
    
    // Error state
    if (state.error) {
        return (
            <div className="modern-bg min-h-screen flex flex-col items-center justify-center text-center p-4">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                <h1 className="modern-hero-title text-3xl mt-4">Error Loading Standings</h1>
                <p className="modern-hero-subtitle mt-2">{state.error}</p>
                <button onClick={fetchStandings} className="modern-cta-button mt-6">
                    <span className="relative z-10">Try Again</span>
                </button>
            </div>
        );
    }

    // Get current group data for display
    const getCurrentGroupData = () => {
        if (state.competitionType === 'LEAGUE') {
            return state.standingsData;
        }
        
        if (state.activeGroup === 'all') {
            return null; // Will show all groups
        }
        
        // Fix: Use activeGroup correctly to get specific group data
        return processedGroupData.groupData[state.activeGroup] || [];
    };

    const currentGroupData = getCurrentGroupData();

    // Main component render
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

            <main className="flex-grow container mx-auto px-4 sm:px-6 py-20 md:py-28 relative z-10 max-w-6xl">
                <div className="text-center mb-10">
                    <h1 className="modern-hero-title" style={{fontSize: 'clamp(2rem, 5vw, 3.5rem)'}}>
                        {state.competitionName} <span className="modern-brand-accent">Standings</span>
                    </h1>
                    <div className="inline-flex items-center space-x-2 mt-3 glass-header-light px-3 py-2 rounded-full">
                        {state.competitionType === 'GROUP_STAGE' ? 
                          <Swords size={16} className="text-gold-main/80"/> : 
                          <BarChart3 size={16} className="text-gold-main/80"/>
                        }
                        <span className="font-medium text-purple-light text-sm tracking-wide">
                          {state.competitionType.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {state.competitionType === 'GROUP_STAGE' && processedGroupData.groups.length > 0 && (
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-2 justify-center">
                           {[...processedGroupData.groups, ...(processedGroupData.groups.length > 1 ? ['all'] : [])].map((groupName) => (
                                <button
                                    key={groupName}
                                    onClick={() => setState(prev => ({...prev, activeGroup: groupName}))}
                                    className={`group-nav-button ${state.activeGroup === groupName ? 'active' : ''}`}>
                                    {groupName === 'all' ? 'All Groups' : groupName}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Stats Section */}
                {state.competitionType === 'LEAGUE' && currentGroupData && (
                    <StatsSection standings={currentGroupData} competitionType={state.competitionType} />
                )}
                
                {state.competitionType === 'GROUP_STAGE' && state.activeGroup && state.activeGroup !== 'all' && currentGroupData && (
                    <StatsSection 
                        standings={currentGroupData} 
                        groupName={state.activeGroup} 
                        competitionType={state.competitionType} 
                    />
                )}
                
                {/* Standings Content */}
                {state.competitionType === 'LEAGUE' ? (
                    <StandingsTable standings={currentGroupData} />
                ) : state.competitionType === 'GROUP_STAGE' && state.standingsData ? (
                    state.activeGroup === 'all' ? (
                        <div className="space-y-10">
                            {processedGroupData.groups.map((groupName, index) => (
                                <div key={groupName}>
                                    <StatsSection 
                                        standings={processedGroupData.groupData[groupName] || []} 
                                        groupName={groupName} 
                                        competitionType={state.competitionType} 
                                    />
                                    <StandingsTable 
                                        standings={processedGroupData.groupData[groupName] || []}
                                        title={groupName} 
                                        showGroupHeader={true} 
                                        isLoading={state.loadingGroups.has(groupName)} 
                                    />
                                </div>
                            ))}
                        </div>
                    ) : state.activeGroup && currentGroupData ? (
                        <StandingsTable 
                            standings={currentGroupData}
                            title={state.activeGroup} 
                            showGroupHeader={true} 
                            isLoading={state.loadingGroups.has(state.activeGroup)} 
                        />
                    ) : (
                         <div className="text-center p-8">
                             <p className="text-gold-main text-xl">Select a Group</p>
                             <p className="text-purple-light mt-2">Choose a group to view its standings.</p>
                         </div>
                    )
                ) : (
                     <div className="text-center p-8">
                         <p className="text-gold-main text-xl">No Data Available</p>
                         <p className="text-purple-light mt-2">Competition has not started yet.</p>
                     </div>
                )}
            </main>
            
            {/* Updated Global Styles */}
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
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    text-align: center; 
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

                .promotion-glow { 
                    position: relative; 
                }
                
                .promotion-glow::before { 
                    content: ''; 
                    position: absolute; 
                    left: 0; top: 0; bottom: 0; 
                    width: 3px; 
                    background: linear-gradient(to bottom, transparent, var(--gold-main), transparent); 
                    box-shadow: 0 0 10px var(--gold-main); 
                    opacity: 0.6; 
                }
            
                .group-nav-button {
                    padding: 0.4rem 0.8rem;
                    font-weight: 500;
                    text-transform: capitalize;
                    border-radius: 6px;
                    border: 1px solid rgba(139, 123, 184, 0.25);
                    background: rgba(44, 27, 75, 0.3);
                    color: var(--purple-light);
                    transition: all 0.25s ease;
                    cursor: pointer;
                    font-size: 0.875rem;
                }
                
                .group-nav-button:hover {
                    background: rgba(139, 123, 184, 0.15);
                    border-color: var(--gold-main);
                    color: var(--gold-main);
                }
                
                .group-nav-button.active {
                    background: var(--gold-main);
                    color: var(--purple-dark);
                    border-color: var(--gold-dark);
                    transform: scale(1.03);
                    box-shadow: 0 0 15px rgba(255, 223, 128, 0.3);
                }
                
                .stats-card {
                    background: rgba(44, 27, 75, 0.2);
                    border: 1px solid rgba(255, 223, 128, 0.1);
                    border-radius: 12px;
                    padding: 1rem;
                    transition: all 0.3s ease;
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
                    
                    .group-nav-button {
                        padding: 0.35rem 0.7rem;
                        font-size: 0.8rem;
                    }
                }
                
                table {
                    border-collapse: separate;
                    border-spacing: 0;
                }
                
                table th:first-child {
                    border-top-left-radius: 8px;
                }
                
                table th:last-child {
                    border-top-right-radius: 8px;
                }
            `}</style>
        </div>
    );
}
