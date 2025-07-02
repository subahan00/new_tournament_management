// client/src/pages/PublicManageKo.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import fixtureService from '../services/fixtureService';

const PublicManageKo = () => {
  const { competitionId } = useParams();
  const [competition, setCompetition] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [groupedFixtures, setGroupedFixtures] = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define round order with actual round names from data
  const roundOrder = [
    'Round of 64',
    'Round of 32',
    'Round of 16',
    'Quarter Finals',
    'Semi Finals',
    'Final'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch competition details
        const compData = await fixtureService.getCompetitionById(competitionId);
        setCompetition(compData);

        // Fetch fixtures
        const fixData = await fixtureService.fetchFixturesByCompetition(competitionId);
        setFixtures(fixData);

        // Group fixtures by round and generate TBD brackets
        const grouped = groupFixturesByRound(fixData);
        const groupedWithTBD = generateTBDBrackets(grouped);
        setGroupedFixtures(groupedWithTBD);

        // Calculate positions
        const calculatedPositions = calculateMatchPositions(groupedWithTBD);
        setPositions(calculatedPositions);
      } catch (err) {
        console.error('Error fetching tournament data:', err);
        setError(err.message || 'Failed to load tournament bracket');
      } finally {
        setLoading(false);
      }
    };

    if (competitionId) {
      fetchData();
    }
  }, [competitionId]);

  const groupFixturesByRound = (fixtures) => {
    const groups = {};

    // Group fixtures by round name
    fixtures.forEach(fixture => {
      if (!groups[fixture.round]) groups[fixture.round] = [];
      groups[fixture.round].push(fixture);
    });

    // Sort rounds according to predefined order
    return roundOrder
      .filter(round => groups[round])
      .map(round => ({
        name: round,
        matches: groups[round].sort((a, b) => a.matchNumber - b.matchNumber || 0)
      }));
  };

  const generateTBDBrackets = (groupedFixtures) => {
    if (groupedFixtures.length === 0) return [];

    const result = [...groupedFixtures];

    // Generate TBD brackets for missing rounds
    for (let i = 1; i < roundOrder.length; i++) {
      const currentRoundName = roundOrder[i];
      const prevRoundName = roundOrder[i - 1];

      // Find if current round exists
      const currentRoundExists = result.find(round => round.name === currentRoundName);
      const prevRoundExists = result.find(round => round.name === prevRoundName);

      if (!currentRoundExists && prevRoundExists) {
        const prevRound = prevRoundExists;
        const expectedMatches = Math.ceil(prevRound.matches.length / 2);

        if (expectedMatches > 0) {
          const tbdMatches = [];
          for (let j = 0; j < expectedMatches; j++) {
            tbdMatches.push({
              _id: `tbd-${currentRoundName}-${j}`,
              round: currentRoundName,
              matchNumber: j + 1,
              homePlayerName: 'TBD',
              awayPlayerName: 'TBD',
              homeScore: null,
              awayScore: null,
              status: 'pending',
              result: null,
              isTBD: true
            });
          }

          result.push({
            name: currentRoundName,
            matches: tbdMatches
          });
        }
      }
    }

    // Sort result by round order
    return result.sort((a, b) => {
      const aIndex = roundOrder.indexOf(a.name);
      const bIndex = roundOrder.indexOf(b.name);
      return aIndex - bIndex;
    });
  };

  const calculateMatchPositions = (rounds) => {
    const positions = {};
    const matchBoxWidth = 200;
    const matchBoxHeight = 70;
    const horizontalSpacing = 260;
    const verticalSpacing = 90;
    const startX = 50;
    const startY = 100;

    // Process each round
    rounds.forEach((round, roundIndex) => {
      round.matches.forEach((match, matchIndex) => {
        if (roundIndex === 0) {
          // First round positions
          positions[match._id] = {
            x: startX,
            y: startY + matchIndex * verticalSpacing
          };
        } else {
          // Subsequent rounds - position between parent matches
          const prevRound = rounds[roundIndex - 1];
          const parentMatch1 = prevRound.matches[2 * matchIndex];
          const parentMatch2 = prevRound.matches[2 * matchIndex + 1];

          let yPos;
          if (parentMatch1 && parentMatch2) {
            // Position between two parent matches
            yPos = (positions[parentMatch1._id].y + positions[parentMatch2._id].y) / 2;
          } else if (parentMatch1) {
            // Only one parent match (bye)
            yPos = positions[parentMatch1._id].y;
          } else {
            // Fallback position
            yPos = startY + matchIndex * verticalSpacing;
          }

          positions[match._id] = {
            x: startX + roundIndex * horizontalSpacing,
            y: yPos
          };
        }
      });
    });

    return positions;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Tournament Bracket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg border border-red-200">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h2 className="text-red-600 text-xl font-semibold mb-2">Error Loading Tournament</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4"> {/* Fixed background color */}
      {/* Header */}
      <header className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="px-6 py-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-2">
              {competition?.name || 'Knockout Tournament'}
            </h1>
            <div className="h-1 w-24 bg-gray-700 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Single Elimination Championship</p>
            <div className="mt-4 inline-flex items-center space-x-6 text-sm text-gray-400">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                {groupedFixtures.length} Rounds
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                {fixtures.length} Matches
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tournament Bracket */}
<div className="px-6 py-8 bg-gradient-to-br from-[#0a0f1c] via-[#0f172a] to-[#1e293b]">
        <TournamentBracket
          groupedFixtures={groupedFixtures}
          positions={positions}
        />
      </div>
    </div>
  );
};

const TournamentBracket = ({ groupedFixtures, positions }) => {
  // Calculate SVG dimensions
  const matchBoxWidth = 200;
  const matchBoxHeight = 70;
  const horizontalSpacing = 260;
  const verticalSpacing = 90;
  const startX = 50;

  // Calculate total dimensions
  const totalRounds = groupedFixtures.length;
  const maxMatches = Math.max(...groupedFixtures.map(round => round.matches.length));

  const totalWidth = startX + (totalRounds - 1) * horizontalSpacing + matchBoxWidth + 80;
  const totalHeight = 120 + maxMatches * verticalSpacing;

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 overflow-auto">
      <svg
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="bracket-svg"
      >
        {/* Background Pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          </pattern>
          <linearGradient id="roundGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4B5563" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          <linearGradient id="tbdGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4B5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Render connecting lines first */}
        {groupedFixtures.map((round, roundIndex) => {
          if (roundIndex === 0) return null; // Skip first round

          return round.matches.map((match, matchIndex) => {
            const parentMatches = groupedFixtures[roundIndex - 1].matches;
            const parent1 = parentMatches[2 * matchIndex];
            const parent2 = parentMatches[2 * matchIndex + 1];

            const paths = [];

            if (parent1 && positions[parent1._id] && positions[match._id]) {
              paths.push(
                <BracketConnector
                  key={`${parent1._id}-to-${match._id}`}
                  start={positions[parent1._id]}
                  end={positions[match._id]}
                  matchBoxWidth={matchBoxWidth}
                  matchBoxHeight={matchBoxHeight}
                />
              );
            }

            if (parent2 && positions[parent2._id] && positions[match._id]) {
              paths.push(
                <BracketConnector
                  key={`${parent2._id}-to-${match._id}`}
                  start={positions[parent2._id]}
                  end={positions[match._id]}
                  matchBoxWidth={matchBoxWidth}
                  matchBoxHeight={matchBoxHeight}
                />
              );
            }

            return paths;
          });
        })}

        {/* Render match boxes */}
        {groupedFixtures.map(round => (
          <g key={round.name}>
            {/* Round Title */}
            <RoundTitle
              title={round.name}
              x={positions[round.matches[0]?._id]?.x || 0}
              y={60}
            />

            {round.matches.map(match => (
              <MatchCard
                key={match._id}
                match={match}
                position={positions[match._id]}
                width={matchBoxWidth}
                height={matchBoxHeight}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
};

const RoundTitle = ({ title, x, y }) => (
  <g>
    <rect
      x={x - 10}
      y={y - 20}
      width={220}
      height={30}
      rx="15"
      fill="url(#roundGradient)"
      opacity="0.9"
    />
    <text 
      x={x + 100} 
      y={y - 2}
      fill="#E5E7EB"
      fontSize="13"
      fontWeight="600"
      textAnchor="middle"
      className="select-none"
    >
      {title}
    </text>
  </g>
);

const BracketConnector = ({ start, end, matchBoxWidth, matchBoxHeight }) => {
  if (!start || !end) return null;

  // Calculate connection points
  const startX = start.x + matchBoxWidth;
  const startY = start.y + matchBoxHeight / 2;
  const endX = end.x;
  const endY = end.y + matchBoxHeight / 2;

  // Calculate intermediate points for the connector path
  const midX1 = startX + 40;
  const midX2 = endX - 40;

  return (
    <path
      d={`M ${startX} ${startY} 
         C ${midX1} ${startY}, ${midX2} ${endY}, ${endX} ${endY}`}
      stroke="#9CA3AF"
      strokeWidth="2"
      fill="none"
      className="connector-path"
      opacity="0.5"
    />
  );
};

const MatchCard = ({ match, position, width, height }) => {
  if (!position) return null;

  // Determine winner styling
  const homeWinner = match.result === "home";
  const awayWinner = match.result === "away";
  const isCompleted = match.status === "completed";
  const isTBD = match.isTBD;
return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      <rect
        width={width}
        height={height}
        rx="6"
        fill={isTBD ? "url(#tbdGradient)" : "url(#matchGradient)"}
        stroke={isTBD ? "#4B5563" : (isCompleted ? "#10B981" : "#4B5563")}
        strokeWidth="2"
        className="match-box"
      />
      
      {/* Home Player */}
      <PlayerRow
        x={12}
        y={25}
        name={match.homePlayerName || "TBD"}
        score={match.homeScore}
        isWinner={homeWinner}
        isTBD={isTBD}
        width={width}
      />
      
      {/* Divider */}
      <line 
        x1={8} 
        y1={height / 2} 
        x2={width - 8} 
        y2={height / 2} 
        stroke="#4B5563" 
        strokeWidth="1"
      />

      {/* Away Player */}
      <PlayerRow
        x={12}
        y={50}
        name={match.awayPlayerName || "TBD"}
        score={match.awayScore}
        isWinner={awayWinner}
        isTBD={isTBD}
        width={width}
      />

      {/* Match status indicator */}
      {isCompleted && !isTBD && (
        <circle
          cx={width - 12}
          cy={12}
          r={4}
          fill="#10B981"
        />
      )}

      {/* TBD indicator */}
      {isTBD && (
        <circle
          cx={width - 12}
          cy={12}
          r={4}
          fill="#9CA3AF"
        />
      )}

      {/* Match number */}
      {match.matchNumber && (
        <text
          x={8}
          y={12}
          fill="#9CA3AF"
          fontSize="9"
          fontWeight="500"
        >
          #{match.matchNumber}
        </text>
      )}
    </g>
  );
};

const PlayerRow = ({ x, y, name, score, isWinner, isTBD, width }) => (
  <g>
    <text 
      x={x} 
      y={y} 
      fill={isTBD ? "#9CA3AF" : (isWinner ? "#10B981" : "#E5E7EB")} 
      fontSize="12" 
      fontWeight={isWinner && !isTBD ? "600" : "500"}
      className="select-none"
      textAnchor="start"
    >
      {name}
    </text>
    {score !== null && !isTBD && (
      <text 
        x={width - 15} 
        y={y} 
        fill={isWinner ? "#10B981" : "#E5E7EB"} 
        fontSize="12"
        fontWeight="600"
        textAnchor="end"
        className="select-none"
      >
        {score}
      </text>
    )}
  </g>
);

export default PublicManageKo;
