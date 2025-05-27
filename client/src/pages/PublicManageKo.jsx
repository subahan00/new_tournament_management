import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import fixtureService from '../services/fixtureService';
import io from 'socket.io-client';

const socket = io(`${process.env.REACT_APP_BACKEND_URL}`); // Add your backend URL

const PublicManageKo = () => {
    const { competitionId } = useParams();
    const [fixtures, setFixtures] = useState([]);
    const [competitionName, setCompetitionName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [groupedFixtures, setGroupedFixtures] = useState({});

    const roundOrder = [
        'Round of 32',
        'Round of 16',
        'Quarter-Final',
        'Semi-Final',
        'Final'
    ];

    useEffect(() => {
        const loadFixtures = async () => {
            try {
                const fixturesData = await fixtureService.fetchFixturesByCompetition(competitionId);

                if (fixturesData.length > 0) {
                    setCompetitionName(fixturesData[0].competitionId?.name || 'Knockout Competition');
                }

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

        // Add socket listener for real-time updates
        socket.on('fixtureUpdate', (updatedFixture) => {
            setFixtures(prev => prev.map(f => 
                f._id === updatedFixture._id ? updatedFixture : f
            ));
        });

        socket.on('playerNameUpdate', ({ playerId, newName }) => {
            setFixtures(prev => prev.map(f => ({
                ...f,
                homePlayerName: f.homePlayer === playerId ? newName : f.homePlayerName,
                awayPlayerName: f.awayPlayer === playerId ? newName : f.awayPlayerName,
            })));
        });

        return () => {
            socket.off('fixtureUpdate');
            socket.off('playerNameUpdate');
        };
    }, [competitionId]);

    // Group fixtures whenever they change
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
        console.log('getPlayerName called with:', player, playerName);
        if (playerName) return playerName;
        if (typeof player === 'object') return player.name || 'Unknown Player';
        return 'Unknown Player';
    };

    if (isLoading) return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-zinc-900 text-gold-500 flex items-center justify-center text-xl">
            Error: {error}
        </div>
    );

   return (
        <div className="min-h-screen bg-zinc-900 p-4">
            <style>
                {`
                .round-column:not(:last-child)::after {
                    content: '';
                    position: absolute;
                    right: -2rem;
                    top: 50%;
                    transform: translateY(-50%);
                    height: 80%;
                    width: 2px;
                    background: linear-gradient(to bottom, 
                        rgba(212, 175, 55, 0.3) 0%,
                        rgba(212, 175, 55, 0.15) 50%,
                        rgba(212, 175, 55, 0.3) 100%);
                    z-index: 0;
                }

                .fixture-item::after {
                    content: '';
                    position: absolute;
                    right: -2rem;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 2rem;
                    height: 2px;
                    background: linear-gradient(to right, 
                        rgba(212, 175, 55, 0.3) 0%,
                        rgba(212, 175, 55, 0.15) 50%,
                        rgba(212, 175, 55, 0.3) 100%);
                    z-index: 1;
                }

                @media (max-width: 1024px) {
                    .round-column::after,
                    .fixture-item::after {
                        display: none;
                    }
                }
                `}
            </style>

            <div className="max-w-7xl mx-auto">
                <div className="flex items-center mb-6">
                    <Link
                        to="/competitions"
                        className="px-4 py-2 border border-gold-600 text-gold-500 rounded-lg text-sm hover:bg-gold-600/10 transition-all duration-300 z-10"
                    >
                        ← Back
                    </Link>
                    <div className="text-4xl md:text-6xl font-extrabold text-gold-500 uppercase tracking-[0.2em] mx-auto max-w-[90%] text-center py-5 bg-gradient-to-r from-gold-500/10 to-transparent rounded-2xl backdrop-blur-sm">
                        {competitionName}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 overflow-x-auto pb-4">
                    {sortedRounds.map((round, roundIndex) => (
                        <div
                            key={round}
                            className="relative round-column min-w-[260px] lg:min-w-[320px]"
                        >
                            <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 p-2 rounded-lg border border-gold-500/20 shadow-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xl font-semibold text-gold-500 uppercase tracking-wide truncate bg-gradient-to-r from-gold-500/20 to-transparent px-3 py-1 rounded">
                                        {round}
                                    </h3>
                                    <span className="text-xs text-gold-500/60">
                                        {groupedFixtures[round].length}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {groupedFixtures[round].map((fixture, fixtureIndex) => (
                                        <div
                                            key={fixture._id}
                                            className="relative fixture-item bg-gradient-to-br from-zinc-800/50 to-zinc-700/20 rounded-lg p-3 border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300 group shadow-lg hover:shadow-xl shadow-zinc-900/50"
                                        >
                                            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-gold-500/5 via-transparent to-transparent" />
                                            <div className="relative flex flex-col space-y-1 text-xs z-10">
                                                <div className="absolute top-2 right-2 text-[0.6rem] text-gold-500/50 italic">
                                                    {fixture.status}
                                                </div>
                                                <div className="flex justify-between items-center px-1 py-1">
                                                    <div className="flex items-center">
                                                        <span className="text-gold-300 text-base leading-none truncate font-medium">
                                                            {getPlayerName(fixture.homePlayer, fixture.homePlayerName)}
                                                        </span>
                                                    </div>
                                                    <span className="text-gold-500 ml-2 font-medium bg-zinc-800/50 px-2 py-1 rounded">
                                                        {fixture.homeScore ?? '-'}
                                                    </span>
                                                </div>

                                                <div className="text-center text-[0.65rem] text-gold-500/40 py-0.5 italic">
                                                    vs
                                                </div>

                                                <div className="flex justify-between items-center px-1 py-1">
                                                    <span className="text-gold-300 text-base truncate font-medium">
                                                        {getPlayerName(fixture.awayPlayer, fixture.awayPlayerName)}
                                                    </span>
                                                    <span className="text-gold-500 ml-2 font-medium bg-zinc-800/50 px-2 py-1 rounded">
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