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
  Download,
  X,
} from 'lucide-react';
import html2canvas from 'html2canvas';

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
// ROBUST MATCHDAY GENERATOR (BUCKET & DISPENSE ALGORITHM)
//=================================================================

const generateMatchdaySchedule = (fixtures, competition) => {
  if (!fixtures || fixtures.length === 0) return [];

  // 1. HELPER: standardized ID getter
  const getId = (p) => {
    if (!p) return null;
    return typeof p === 'object' ? (p.$oid || p._id || p.id) : p;
  };

  // 2. PREPARE THE QUEUES
  // We create a map where Key = "PlayerA-PlayerB" and Value = [Fixture_R1, Fixture_R2, Fixture_R3]
  const fixtureQueue = new Map();
  const playerSet = new Set();

  fixtures.forEach(f => {
    const h = getId(f.homePlayer);
    const a = getId(f.awayPlayer);
    
    if (h && a) {
      playerSet.add(h);
      playerSet.add(a);
      
      // Create a sorted key ensuring A-B and B-A land in the same bucket
      const key = [h, a].sort().join('-');
      
      if (!fixtureQueue.has(key)) {
        fixtureQueue.set(key, []);
      }
      fixtureQueue.get(key).push(f);
    }
  });

  // 3. SORT THE QUEUES (CRITICAL STEP)
  // Ensure "Round 1" fixture is at index 0, "Round 2" at index 1, etc.
  fixtureQueue.forEach((matchList) => {
    matchList.sort((a, b) => {
      // Try to sort by the explicit "round" string ("Round 1" vs "Round 2")
      const rA = parseInt(a.round?.replace(/\D/g, '') || '0');
      const rB = parseInt(b.round?.replace(/\D/g, '') || '0');
      
      if (rA !== rB) return rA - rB;
      
      // Fallback: Sort by creation date if round info is missing
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  });

  // 4. SETUP PLAYERS FOR ROUND ROBIN
  // Use competition players if available to ensure correct order, otherwise derived set
  let players = [];
  if (competition && competition.players && competition.players.length > 0) {
     players = competition.players.map(getId).filter(id => playerSet.has(id));
  } else {
     players = Array.from(playerSet);
  }

  // Sort players alphabetically/numerically to ensure deterministic output every render
  players.sort(); 

  // Add dummy player for odd numbers
  if (players.length % 2 !== 0) {
    players.push(null); 
  }

  const N = players.length;
  const matchdaysPerRound = N - 1;
  const totalRoundsConfigured = competition?.rounds || 1;
  
  // 5. GENERATE THE SCHEDULE
  const allMatchdays = [];

  // Loop for R rounds (e.g., 3 times)
  for (let r = 0; r < totalRoundsConfigured; r++) {
    
    // Berger Table (Circle Method) Rotation Logic
    let rotatingPlayers = [...players];
    
    // Inside a single Round (e.g., Round 1), iterate N-1 matchdays
    for (let day = 0; day < matchdaysPerRound; day++) {
      const currentMatchdayFixtures = [];
      const globalMatchdayNum = (r * matchdaysPerRound) + (day + 1);

      const half = N / 2;
      
      for (let i = 0; i < half; i++) {
        const p1 = rotatingPlayers[i];
        const p2 = rotatingPlayers[N - 1 - i];

        // If this is a real pair (neither is null dummy)
        if (p1 && p2) {
          const key = [p1, p2].sort().join('-');
          const queue = fixtureQueue.get(key);

          if (queue && queue.length > 0) {
             // DISPENSE: Shift the top fixture from the queue
             // In Loop 1 (r=0), this grabs the Round 1 fixture.
             // In Loop 2 (r=1), this grabs the Round 2 fixture.
             const fixture = queue.shift();
             currentMatchdayFixtures.push(fixture);
          }
        }
      }

      // Only add the matchday if it has fixtures
      if (currentMatchdayFixtures.length > 0) {
        allMatchdays.push({
          matchdayNumber: globalMatchdayNum,
          roundLabel: `Round ${r + 1}`, // "Round 1", "Round 2", etc.
          fixtures: currentMatchdayFixtures
        });
      }

      // Rotate players: Keep index 0 fixed, rotate the rest
      // [0, 1, 2, 3] -> [0, 3, 1, 2]
      const fixed = rotatingPlayers[0];
      const moving = rotatingPlayers.slice(1);
      moving.unshift(moving.pop());
      rotatingPlayers = [fixed, ...moving];
    }
  }
  
  // 6. Handle Leftovers (Cleanup)
  // If any fixtures remain in queues (due to mismatched player counts or errors),
  // dump them into a final "Overflow" matchday so they aren't lost.
  const leftovers = [];
  fixtureQueue.forEach(queue => {
    if (queue.length > 0) leftovers.push(...queue);
  });
  
  if (leftovers.length > 0) {
    allMatchdays.push({
      matchdayNumber: 999,
      roundLabel: "Unscheduled / Overflow",
      fixtures: leftovers
    });
  }

  return allMatchdays;
};

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
// DOWNLOAD MODAL COMPONENT
//=================================================================

const DownloadModal = ({ isOpen, onClose, matchdaySchedule, competitionName, onGenerate }) => {
  const [fromMatchday, setFromMatchday] = useState(1);
  const [toMatchday, setToMatchday] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && matchdaySchedule.length > 0) {
      setFromMatchday(1);
      setToMatchday(Math.min(5, matchdaySchedule.length));
    }
  }, [isOpen, matchdaySchedule]);

  const isValidRange = useMemo(() => {
    if (fromMatchday > toMatchday) return false;
    const range = toMatchday - fromMatchday + 1;
    return range >= 1 && range <= 5;
  }, [fromMatchday, toMatchday]);

  const rangeCount = toMatchday - fromMatchday + 1;

  const handleGenerate = async () => {
    if (!isValidRange) {
      toast.error('Please select a valid range (max 5 matchdays)');
      return;
    }

    setIsGenerating(true);

    try {
      // Call parent function with selected range
      await onGenerate(fromMatchday, toMatchday);
      setIsGenerating(false);
      onClose();
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please try again.');
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}>
        {/* Modal Content */}
        <div className="download-modal" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Download className="text-gold-main" size={24} />
              <h2 className="text-2xl font-bold text-white font-space-grotesk">
                Download Fixtures
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-purple-light hover:text-gold-main transition-colors p-2 hover:bg-purple-dark/30 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-purple-light text-sm mb-6">
            Select a range of matchdays to download as a high-quality image (max 5 matchdays).
          </p>

          <div className="space-y-4 mb-6">
            {/* From Matchday */}
            <div>
              <label className="block text-sm font-medium text-purple-light mb-2">
                From Matchday
              </label>
              <select
                value={fromMatchday}
                onChange={(e) => setFromMatchday(Number(e.target.value))}
                className="modal-select"
              >
                {Array.from({ length: matchdaySchedule.length }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>Matchday {num}</option>
                ))}
              </select>
            </div>

            {/* To Matchday */}
            <div>
              <label className="block text-sm font-medium text-purple-light mb-2">
                To Matchday
              </label>
              <select
                value={toMatchday}
                onChange={(e) => setToMatchday(Number(e.target.value))}
                className="modal-select"
              >
                {Array.from({ length: matchdaySchedule.length }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>Matchday {num}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation Messages */}
          <div className="mb-6">
            {!isValidRange && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {fromMatchday > toMatchday
                  ? '⚠️ "From" matchday cannot be greater than "To" matchday'
                  : '⚠️ Maximum range is 5 matchdays'}
              </div>
            )}
            {isValidRange && (
              <div className="text-gold-main text-sm bg-gold-main/10 border border-gold-main/30 rounded-lg px-3 py-2">
                ✓ Ready to download {rangeCount} matchday{rangeCount > 1 ? 's' : ''} (MD {fromMatchday}–{toMatchday})
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 px-4 py-2.5 rounded-lg border border-purple-light/30 text-purple-light hover:bg-purple-dark/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!isValidRange || isGenerating}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold-dark to-gold-main text-purple-dark hover:shadow-lg hover:shadow-gold-main/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download Image</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

//=================================================================
// EXPORT CONTAINER COMPONENT (Hidden, for image generation)
//=================================================================

const ExportContainer = ({ matchdaySchedule, fromMatchday, toMatchday, competitionName }) => {
  // Get the correct slice of matchdays based on selection
  const selectedMatchdays = useMemo(() => {
    const start = fromMatchday - 1; // Convert to 0-based index
    const end = toMatchday; // slice is exclusive of end, so no need to add 1
    return matchdaySchedule.slice(start, end).map((data) => ({
      fixtures: data.fixtures,
      matchdayNumber: data.matchdayNumber
    }));
  }, [matchdaySchedule, fromMatchday, toMatchday]);

  // Calculate number of columns based on matchday count
  const numColumns = selectedMatchdays.length;
  const columnWidth = numColumns <= 2 ? '50%' : numColumns === 3 ? '33.333%' : numColumns === 4 ? '25%' : '20%';

  return (
    <div
      id="export-container"
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '1920px',
        backgroundColor: '#0a0510',
        backgroundImage: 'linear-gradient(160deg, #0a0510 0%, #1a0f2e 40%, #1a0f2e 60%, #0a0510 100%)',
        padding: '60px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '56px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #fff8e7 0%, #ffdf80 25%, #e6b422 50%, #ffdf80 75%, #fff8e7 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '16px',
            lineHeight: '1.1',
          }}
        >
          {competitionName} Fixtures
        </h1>
        <p
          style={{
            fontSize: '20px',
            color: '#8b7bb8',
            fontWeight: '400',
          }}
        >
          Matchdays {fromMatchday} – {toMatchday}
        </p>
      </div>

      {/* Matchdays - Horizontal Columns Layout */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {selectedMatchdays.map(({ fixtures, matchdayNumber }) => {
          const pendingCount = fixtures.filter(f => f.status === 'pending').length;
          const completedCount = fixtures.filter(f => f.status === 'completed').length;
          const liveCount = fixtures.filter(f => f.status === 'live').length;

          return (
            <div
              key={matchdayNumber}
              style={{
                flex: 1,
                background: 'rgba(10, 5, 16, 0.5)',
                border: '1px solid rgba(255, 223, 128, 0.1)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Matchday Header */}
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(44, 27, 75, 0.3)',
                  textAlign: 'center',
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#ffdf80',
                    margin: '0 0 8px 0',
                  }}
                >
                  MD {matchdayNumber}
                </h3>

                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {liveCount > 0 && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      {liveCount} LIVE
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#93c5fd',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      {pendingCount} PENDING
                    </span>
                  )}
                  {completedCount > 0 && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#86efac',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                      }}
                    >
                      {completedCount} DONE
                    </span>
                  )}
                </div>
              </div>

              {/* Fixtures - Vertical Stack within Column */}
              <div style={{ padding: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {fixtures.map((fixture) => {
                    const statusInfo = getStatusInfo(fixture.status);

                    return (
                      <div
                        key={fixture._id}
                        style={{
                          background: 'rgba(10, 5, 16, 0.5)',
                          border: '1px solid rgba(255, 223, 128, 0.1)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                        }}
                      >
                        {/* Status Badge */}
                        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'flex-start' }}>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: '600',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              border: '1px solid',
                              ...(statusInfo.className.includes('red') && {
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5',
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                              }),
                              ...(statusInfo.className.includes('green') && {
                                background: 'rgba(34, 197, 94, 0.1)',
                                color: '#86efac',
                                borderColor: 'rgba(34, 197, 94, 0.2)',
                              }),
                              ...(statusInfo.className.includes('blue') && {
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#93c5fd',
                                borderColor: 'rgba(59, 130, 246, 0.2)',
                              }),
                            }}
                          >
                            {statusInfo.text.toUpperCase()}
                          </span>
                        </div>

                        {/* Players - Horizontal Layout with wrapping */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            marginBottom: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* Home Player */}
                          <span
                            style={{
                              fontWeight: '600',
                              fontSize: '20px',
                              color: '#e2dcf7',
                              textAlign: 'center',
                              wordBreak: 'break-word',
                            }}
                          >
                            {fixture.homePlayerName || 'TBD'}
                          </span>

                          {/* VS or Score */}
                          <div style={{ flexShrink: 0 }}>
                            {fixture.status === 'completed' &&
                            fixture.homeScore !== null &&
                            fixture.awayScore !== null ? (
                              <span
                                style={{
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  fontSize: '15px',
                                  fontWeight: '700',
                                  color: '#ffdf80',
                                }}
                              >
                                {fixture.homeScore}:{fixture.awayScore}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: '#8b7bb8',
                                  opacity: 0.8,
                                }}
                              >
                                vs
                              </span>
                            )}
                          </div>

                          {/* Away Player */}
                          <span
                            style={{
                              fontWeight: '600',
                              fontSize: '20px',
                              color: '#e2dcf7',
                              textAlign: 'center',
                              wordBreak: 'break-word',
                            }}
                          >
                            {fixture.awayPlayerName || 'TBD'}
                          </span>
                        </div>

                        {/* Winner */}
                        {fixture.status === 'completed' && fixture.result && (
                          <div
                            style={{
                              paddingTop: '8px',
                              borderTop: '1px solid rgba(139, 123, 184, 0.1)',
                              textAlign: 'center',
                              fontSize: '10px',
                            }}
                          >
                            <span style={{ color: 'rgba(139, 123, 184, 0.6)', marginRight: '4px' }}>
                              Winner:
                            </span>
                            <span style={{ color: '#ffdf80', fontWeight: '600', wordBreak: 'break-word' }}>
                              {fixture.result === 'home'
                                ? fixture.homePlayerName
                                : fixture.result === 'away'
                                ? fixture.awayPlayerName
                                : 'Draw'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

//=================================================================
// MAIN COMPONENT
//=================================================================

export default function CompetitionFixtures() {
  const { competitionId } = useParams();
  const [fixtures, setFixtures] = useState([]);
  const [competitionData, setCompetitionData] = useState(null);
  const [competitionName, setCompetitionName] = useState('Competition');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [exportFromMatchday, setExportFromMatchday] = useState(1);
  const [exportToMatchday, setExportToMatchday] = useState(1);

  const handleGenerateImage = async (fromMatchday, toMatchday) => {
    // Update export state
    setExportFromMatchday(fromMatchday);
    setExportToMatchday(toMatchday);

    // Wait for state update and DOM render
    await new Promise(resolve => setTimeout(resolve, 100));

    const exportContainer = document.getElementById('export-container');
    if (!exportContainer) {
      throw new Error('Export container not found');
    }

    // Generate high-quality image
    const canvas = await html2canvas(exportContainer, {
      scale: 3, // 3x scale for crisp high-DPI output
      backgroundColor: '#0a0510',
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowWidth: 1920,
      windowHeight: exportContainer.scrollHeight,
    });

    // Convert to blob and download
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${competitionName.replace(/\s+/g, '_')}_MD${fromMatchday}-${toMatchday}_Fixtures.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);

          toast.success('Image downloaded successfully!');
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 'image/png');
    });
  };

  const fetchFixtures = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fixtureService.getCompetitionFixtures(competitionId);
      const payload = res?.data || {};
      const data = payload.data || [];

      let name = payload.competitionName || payload.competition?.name || payload.competition_name;
      let compData = null;

      try {
        const compRes = await competitionService.getCompetition(competitionId);
        compData = compRes?.data || {};
        name = compData.name || compData.competitionName || compData.competition?.name || name;
        setCompetitionData(compData);
      } catch (e) {
        console.warn("Failed to fetch competition metadata", e);
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

  const matchdaySchedule = useMemo(() => {
    // pass competitionData so we know how many rounds there are
    return generateMatchdaySchedule(fixtures, competitionData);
  }, [fixtures, competitionData]);

  const filteredMatchdays = useMemo(() => {
    const term = searchTerm.toLowerCase();

    // The generator now returns objects, not arrays
    const processedMatchdays = matchdaySchedule.map((md) => {
      const filtered = !term
        ? md.fixtures
        : md.fixtures.filter(f => {
          const homePlayerName = (f.homePlayerName || 'tbd').toLowerCase();
          const awayPlayerName = (f.awayPlayerName || 'tbd').toLowerCase();
          return homePlayerName.includes(term) || awayPlayerName.includes(term);
        });

      const sorted = filtered.sort((a, b) => {
        const aStatus = a.status === 'pending' ? 0 : a.status === 'live' ? 1 : 2;
        const bStatus = b.status === 'pending' ? 0 : b.status === 'live' ? 1 : 2;
        return aStatus - bStatus;
      });

      return {
        ...md, // keep roundLabel and matchdayNumber
        fixtures: sorted,
        pendingCount: sorted.filter(f => f.status === 'pending').length
      };
    }).filter(md => md.fixtures.length > 0);

    if (term) {
      return processedMatchdays.sort((a, b) => {
        if (b.pendingCount !== a.pendingCount) {
          return b.pendingCount - a.pendingCount;
        }
        return a.matchdayNumber - b.matchdayNumber;
      });
    }

    return processedMatchdays;
  }, [matchdaySchedule, searchTerm]);

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

        <div className="flex flex-col md:flex-row gap-4 mb-12 max-w-2xl mx-auto">
          <InteractiveCard className="flex-1">
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

          <InteractiveCard>
            <button
              onClick={() => setShowDownloadModal(true)}
              className="download-btn w-full md:w-auto"
              disabled={matchdaySchedule.length === 0}
            >
              <Download size={18} />
              <span>Download as Image</span>
            </button>
          </InteractiveCard>
        </div>

        <div className="space-y-4">
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
            filteredMatchdays.map((matchday, index) => {
              // Logic to show a Round Header if it changes
              const prevMatchday = filteredMatchdays[index - 1];
              const showRoundHeader = !prevMatchday || (prevMatchday.roundLabel !== matchday.roundLabel);

              return (
                <React.Fragment key={matchday.matchdayNumber}>
                  
                  {/* Visual Divider for Rounds */}
                  {showRoundHeader && matchday.roundLabel && (
                     <InteractiveCard className="py-6">
                       <div className="flex items-center justify-center">
                         <div className="h-[1px] bg-gradient-to-r from-transparent via-gold-main/40 to-transparent w-24 sm:w-48 mr-4"></div>
                         <h2 className="text-gold-main font-space-grotesk font-bold text-xl uppercase tracking-widest shadow-gold">
                           {matchday.roundLabel}
                         </h2>
                         <div className="h-[1px] bg-gradient-to-r from-transparent via-gold-main/40 to-transparent w-24 sm:w-48 ml-4"></div>
                       </div>
                     </InteractiveCard>
                  )}

                  <InteractiveCard>
                    <MatchdaySection
                      matchdayNumber={matchday.matchdayNumber}
                      fixtures={matchday.fixtures}
                    />
                  </InteractiveCard>
                </React.Fragment>
              );
            })
          )}
        </div>
      </main>

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        matchdaySchedule={matchdaySchedule}
        competitionName={competitionName}
        onGenerate={handleGenerateImage}
      />

      {/* Hidden Export Container */}
      {showDownloadModal && (
        <ExportContainer
          matchdaySchedule={matchdaySchedule}
          fromMatchday={exportFromMatchday}
          toMatchday={exportToMatchday}
          competitionName={competitionName}
        />
      )}

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
            .shadow-gold { text-shadow: 0 0 20px rgba(255, 223, 128, 0.4); }

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

            .download-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                background: linear-gradient(135deg, rgba(255, 223, 128, 0.15) 0%, rgba(230, 180, 34, 0.15) 100%);
                border: 1px solid rgba(255, 223, 128, 0.3);
                border-radius: 9999px;
                color: var(--gold-main);
                font-weight: 600;
                font-size: 0.875rem;
                transition: all 0.3s ease;
                backdrop-filter: blur(8px);
            }
            .download-btn:hover:not(:disabled) {
                background: linear-gradient(135deg, rgba(255, 223, 128, 0.25) 0%, rgba(230, 180, 34, 0.25) 100%);
                border-color: var(--gold-main);
                box-shadow: 0 0 20px rgba(255, 223, 128, 0.3);
                transform: translateY(-1px);
            }
            .download-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .download-modal {
                background: linear-gradient(135deg, rgba(10, 5, 16, 0.95) 0%, rgba(26, 15, 46, 0.95) 100%);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 223, 128, 0.2);
                border-radius: 16px;
                padding: 2rem;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            }

            .modal-select {
                width: 100%;
                background: rgba(44, 27, 75, 0.4);
                border: 1px solid rgba(139, 123, 184, 0.3);
                border-radius: 8px;
                padding: 0.75rem 1rem;
                color: white;
                font-weight: 500;
                font-size: 0.95rem;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            .modal-select:focus {
                outline: none;
                border-color: var(--gold-main);
                box-shadow: 0 0 10px rgba(255, 223, 128, 0.2);
            }
            .modal-select option {
                background: #1a0f2e;
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
        `}</style>
    </div>
  );
}
