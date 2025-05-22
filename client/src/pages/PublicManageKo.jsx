import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import fixtureService from '../services/fixtureService';

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

                // Extract competition name
                if (fixturesData.length > 0) {
                    setCompetitionName(fixturesData[0].competitionId?.name || 'Knockout Competition');
                }

                // Corrected reduce syntax
                const grouped = fixturesData.reduce((acc, fixture) => {
                    const round = fixture.round;
                    if (!acc[round]) acc[round] = [];
                    acc[round].push(fixture);  // Removed extra closing parenthesis
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

    const sortedRounds = Object.keys(groupedFixtures).sort((a, b) =>
        roundOrder.indexOf(a) - roundOrder.indexOf(b)
    );

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
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center mb-6">
                    <Link
                        to="/competitions"
                        className="px-4 py-2 border border-gold-600 text-gold-500 rounded-lg text-sm hover:bg-gold-600/10 transition-all duration-300"
                    >
                        ← Back
                    </Link>
                    <div className="text-6xl font-extrabold text-gold-500 uppercase tracking-[0.2em] mx-auto max-w-[90%] text-center py-5 shadow-2xl  via-gold-500 to-black rounded-2xl backdrop-blur-sm">
                        {competitionName}
                    </div>


                </div>

                <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4">
                    {sortedRounds.map((round) => (
                        <div
                            key={round}
                            className="min-w-[260px] lg:min-w-[300px] bg-zinc-800 rounded-lg p-3 border border-gold-500/20 shadow-lg"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-2xl font-semibold text-gold-500 uppercase tracking-wide truncate">
                                    {round}
                                </h3>
                                <span className="text-xs text-gold-500/60">
                                    {groupedFixtures[round].length}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {groupedFixtures[round].map((fixture) => (
                                    <div
                                        key={fixture._id.$oid}
                                        className="relative bg-zinc-700/20 rounded-md p-2 border border-gold-500/10 hover:border-gold-500 transition-all duration-150 group"
 >



                                        <div className="flex flex-col space-y-1 text-xs">
                                            <div className="absolute top-1 right-1 text-[0.55rem] text-gold-500/50 italic">
                                                {fixture.status}
                                            </div>
                                            <div className="flex justify-between items-center px-1 py-1">
                                                <div className="flex items-center">
                                                    <span className="text-gold-300 text-base leading-none truncate">
                                                        {fixture.homePlayer?.name}
                                                    </span>
                                                </div>
                                                <span className="text-gold-500 ml-2 font-medium">
                                                    {fixture.homeScore ?? '-'}
                                                </span>
                                            </div>

                                            <div className="text-center text-[0.6rem] text-gold-500/40 py-0.5">vs</div>

                                            <div className="flex justify-between items-center px-1 py-1">
                                                <span className="text-gold-300 text-base truncate">
                                                    {fixture.awayPlayer?.name}
                                                </span>
                                                <span className="text-gold-500 ml-2 font-medium">
                                                    {fixture.awayScore ?? '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PublicManageKo;