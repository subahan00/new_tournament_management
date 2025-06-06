import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import io from 'socket.io-client';

// Define the "Premium Black and Gold" color palette
const premiumColors = {
  background: '#0A0A0A',      // A very dark, near-black for the main background
  elementBackground: '#141414',// Slightly lighter black for cards/elements
  goldPrimary: '#D4AF37',     // A rich, classic gold (e.g., "Golden")
  goldSecondary: '#E0C05E',  // A slightly brighter/paler gold for hovers or highlights
  textPrimary: '#E0E0E0',      // A soft, off-white for primary text (less harsh than pure white)
  textSecondary: '#888888',    // A muted grey for less important text or subtle details
  goldTransparent: 'rgba(212, 175, 55, 0.2)', // Primary gold with transparency for borders/lines
  goldHoverTransparent: 'rgba(224, 192, 94, 0.4)', // Secondary gold with more transparency for hover
};

const socket = io(`${process.env.REACT_APP_BACKEND_URL}`);

const PublicManageKo = () => {
    const { competitionId } = useParams();
    const [fixtures, setFixtures] = useState([]);
    const [competitionName, setCompetitionName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [groupedFixtures, setGroupedFixtures] = useState({});

    const roundOrder = [
        'Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'
    ];

    useEffect(() => {
        const loadFixtures = async () => {
            setIsLoading(true);
            try {
                const fixturesData = await fixtureService.fetchFixturesByCompetition(competitionId);
                if (fixturesData.length > 0) {
                    setCompetitionName(fixturesData[0].competitionId?.name || 'Knockout Competition');
                }
                // Initial grouping
                const grouped = fixturesData.reduce((acc, fixture) => {
                    const round = fixture.round;
                    if (!acc[round]) acc[round] = [];
                    acc[round].push(fixture);
                    return acc;
                }, {});
                setGroupedFixtures(grouped);
                setFixtures(fixturesData); // Set fixtures after grouping
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadFixtures();

        socket.on('fixtureUpdate', (updatedFixture) => {
            setFixtures(prevFixtures => {
                const newFixtures = prevFixtures.map(f =>
                    f._id === updatedFixture._id ? updatedFixture : f
                );
                // Re-group fixtures when they update
                const regrouped = newFixtures.reduce((acc, fixture) => {
                    const round = fixture.round;
                    if (!acc[round]) acc[round] = [];
                    acc[round].push(fixture);
                    return acc;
                }, {});
                setGroupedFixtures(regrouped);
                return newFixtures;
            });
        });
        

        socket.on('playerNameUpdate', ({ playerId, newName }) => {
            setFixtures(prevFixtures => {
                const newFixtures = prevFixtures.map(f => ({
                    ...f,
                    homePlayerName: f.homePlayer === playerId ? newName : f.homePlayerName,
                    awayPlayerName: f.awayPlayer === playerId ? newName : f.awayPlayerName,
                }));
                 // Re-group fixtures when they update
                 const regrouped = newFixtures.reduce((acc, fixture) => {
                    const round = fixture.round;
                    if (!acc[round]) acc[round] = [];
                    acc[round].push(fixture);
                    return acc;
                }, {});
                setGroupedFixtures(regrouped);
                return newFixtures;
            });
        });

        return () => {
            socket.off('fixtureUpdate');
            socket.off('playerNameUpdate');
        };
    }, [competitionId]);

    // This useEffect for grouping is now partially redundant if grouping happens on fixture updates,
    // but can be kept for initial load or if fixtures state is set directly elsewhere.
    // Consider if it's still needed or if logic can be consolidated.
    useEffect(() => {
        const grouped = fixtures.reduce((acc, fixture) => {
            const round = fixture.round;
            if (!acc[round]) acc[round] = [];
            acc[round].push(fixture);
            return acc;
        }, {});
        setGroupedFixtures(grouped);
    }, [fixtures]);


    const sortedRounds = Object.keys(groupedFixtures).sort((a, b) =>
        roundOrder.indexOf(a) - roundOrder.indexOf(b)
    );

    const getPlayerName = (player, playerName) => {
        if (playerName) return playerName;
        if (typeof player === 'object' && player !== null) return player.name || 'TBD';
        return 'TBD';
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: premiumColors.background }}>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: premiumColors.goldPrimary, borderTopColor: 'transparent' }}></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center text-xl" style={{ backgroundColor: premiumColors.background, color: premiumColors.goldPrimary }}>
            Error: {error}
        </div>
    );

    return (
        <div className="min-h-screen p-4" style={{ backgroundColor: premiumColors.background, color: premiumColors.textPrimary }}>
            <style>
                {`
                body {
                  color: ${premiumColors.textPrimary};
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Example of a clean font */
                }
                .round-column:not(:last-child)::after { /* Vertical connector between rounds */
                    content: '';
                    position: absolute;
                    right: -2.5rem; /* Half of the increased gap (5rem / 2) */
                    top: 50%;
                    transform: translateY(-50%);
                    height: 70%; 
                    width: 1px; /* Thinner line */
                    background: linear-gradient(to bottom,
                        ${premiumColors.goldPrimary}1A 0%, /* Gold with low opacity */
                        ${premiumColors.goldPrimary}4D 50%, /* Gold with medium opacity */
                        ${premiumColors.goldPrimary}1A 100%);
                    z-index: 0;
                }

                .fixture-item::before { /* Horizontal connector from fixture to next round's vertical line */
                    content: '';
                    position: absolute;
                    right: -2.5rem; 
                    top: 50%;
                    transform: translateY(-50%);
                    width: 2.5rem; /* Length of the horizontal connector */
                    height: 1px; /* Thinner line */
                    background: ${premiumColors.goldPrimary}4D; /* Gold with medium opacity */
                    z-index: 0;
                }
                .round-column:last-child .fixture-item::before {
                    display: none;
                }

                /* Optional: lines connecting paired fixtures to a central point for the next match */
                /* This requires more complex logic or SVG for true bracket drawing */

                @media (max-width: 1024px) {
                    .round-column::after,
                    .fixture-item::before {
                        display: none;
                    }
                    .competition-title-main {
                        font-size: 2rem; /* Adjust title size for mobile */
                    }
                    .round-title {
                        font-size: 1.1rem;
                    }
                }

                .fixture-item:hover {
                  border-color: ${premiumColors.goldSecondary} !important;
                  box-shadow: 0 0 15px ${premiumColors.goldPrimary}33; /* Subtle glow on hover */
                }
                `}
            </style>

            <div className="max-w-full mx-auto">
                <div className="flex items-center mb-8"> {/* Increased bottom margin */}
                    <Link
                        to="/competitions"
                        className="px-3 py-1.5 border rounded-md text-xs transition-all duration-300 z-10"
                        style={{ 
                            borderColor: premiumColors.goldPrimary, 
                            color: premiumColors.goldPrimary,
                            backgroundColor: 'transparent' 
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = `${premiumColors.goldPrimary}20`; // Gold with low opacity
                            e.currentTarget.style.color = premiumColors.goldSecondary;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = premiumColors.goldPrimary;
                        }}
                    >
                        ← Back
                    </Link>
                    <div 
                        className="competition-title-main text-4xl md:text-5xl font-bold tracking-wider mx-auto text-center py-3" // Simplified, using font-bold
                        style={{ color: premiumColors.goldPrimary }}
                    >
                        {competitionName}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-x-20 gap-y-10 overflow-x-auto pb-6"> {/* Increased gap-x significantly */}
                    {sortedRounds.map((round) => (
                        <div
                            key={round}
                            className="relative round-column min-w-[280px] lg:min-w-[300px] flex-shrink-0"
                        >
                            <div 
                                className="sticky top-2 p-2 rounded-lg shadow-md" // Added subtle shadow
                                style={{ 
                                    backgroundColor: `${premiumColors.elementBackground}E6`, // Element bg with opacity for sticky header
                                    backdropFilter: 'blur(5px)', 
                                    zIndex: 10, 
                                    borderBottom: `1px solid ${premiumColors.goldPrimary}33` // Subtle gold underline for round header
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 
                                        className="round-title text-xl font-semibold uppercase tracking-wide" // Class for easier targeting
                                        style={{ color: premiumColors.goldPrimary }}
                                    >
                                        {round}
                                    </h3>
                                    <span className="text-xs" style={{ color: premiumColors.textSecondary }}>
                                        {groupedFixtures[round]?.length || 0} Matches {/* Added fallback for length */}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {(groupedFixtures[round] || []).map((fixture) => ( // Added fallback for fixtures array
                                        <div
                                            key={fixture._id}
                                            className="relative fixture-item p-3 rounded-lg transition-all duration-200"
                                            style={{ 
                                                backgroundColor: premiumColors.elementBackground,
                                                border: `1px solid ${premiumColors.goldTransparent}`,
                                                boxShadow: `0 1px 3px ${premiumColors.background}99` // Darker shadow for depth
                                            }}
                                        >
                                            <div className="relative flex flex-col space-y-1.5 text-sm z-10"> {/* Base text size slightly up */}
                                             
                                                
                                                {/* Player 1 */}
                                                <div className="flex justify-between items-center">
                                                    <span className="truncate font-medium" style={{ color: premiumColors.textPrimary, maxWidth: '75%' }}> {/* Max width for name */}
                                                        {getPlayerName(fixture.homePlayer, fixture.homePlayerName)}
                                                    </span>
                                                    <span 
                                                        className="font-bold px-2 py-0.5 rounded text-center min-w-[28px]"
                                                        style={{ backgroundColor: `${premiumColors.background}CC`, color: premiumColors.goldPrimary }}
                                                    >
                                                        {fixture.homeScore ?? '-'}
                                                    </span>
                                                </div>

                                                <div className="text-center text-[0.7rem] py-0.5" style={{ color: premiumColors.textSecondary }}>
                                                    vs
                                                </div>
                                                
                                                {/* Player 2 */}
                                                <div className="flex justify-between items-center">
                                                    <span className="truncate font-medium" style={{ color: premiumColors.textPrimary, maxWidth: '75%' }}>
                                                        {getPlayerName(fixture.awayPlayer, fixture.awayPlayerName)}
                                                    </span>
                                                    <span 
                                                        className="font-bold px-2 py-0.5 rounded text-center min-w-[28px]"
                                                        style={{ backgroundColor: `${premiumColors.background}CC`, color: premiumColors.goldPrimary }}
                                                    >
                                                        {fixture.awayScore ?? '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PublicManageKo;