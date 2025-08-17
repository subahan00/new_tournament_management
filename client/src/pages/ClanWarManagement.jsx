import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Trophy, Users, Calendar, ArrowLeft, CheckCircle, Edit3, Save, X, ChevronRight, Plus, Loader2 } from 'lucide-react';
import {
    getAllCompetitions,
    getClanWarFixtures,
    updateClanWarMatch,
    progressClanWarToNextRound
} from '../services/competitionService'; // Assuming service functions are in this path

// Helper component for a consistent loading spinner
const LoadingSpinner = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-gray-300">
        <Loader2 className="animate-spin text-amber-400 h-12 w-12 mb-4" />
        <p className="text-lg">{message}</p>
    </div>
);

// Helper for styled status/type tags
const InfoTag = ({ text, colorClass }) => (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${colorClass}`}>
        {text}
    </span>
);

//================================================================================
// Competition List Page Component
//================================================================================
const CompetitionList = ({ onSelectCompetition }) => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                setLoading(true);
                const data = await getAllCompetitions();
                setCompetitions(data.competitions || data || []);
            } catch (err) {
                setError('Failed to fetch competitions. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCompetitions();
    }, []);

    const getCompetitionTypeColor = (type) => {
        switch (type) {
            case 'CLAN_WAR': return 'bg-red-900/50 text-red-300 border border-red-500/30';
            case 'TOURNAMENT': return 'bg-blue-900/50 text-blue-300 border border-blue-500/30';
            case 'LEAGUE': return 'bg-green-900/50 text-green-300 border border-green-500/30';
            default: return 'bg-gray-700 text-gray-300';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
            case 'ongoing': return 'bg-green-900/50 text-green-300 border border-green-500/30';
            case 'completed': return 'bg-gray-700 text-gray-300';
            case 'upcoming': return 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30';
            default: return 'bg-gray-700 text-gray-300';
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading competitions..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 text-gray-200 font-sans">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <header className="mb-8 border-b border-amber-500/20 pb-6">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-amber-500 to-yellow-400 p-3 rounded-lg shadow-lg">
                            <Trophy className="text-slate-900" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-wider">Competition Hub</h1>
                            <p className="text-amber-400">Oversee all active and upcoming events.</p>
                        </div>
                    </div>
                </header>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-900/50 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertCircle className="text-red-400 mr-3" size={20} />
                            <span className="text-red-300">{error}</span>
                        </div>
                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-200 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Competitions Grid */}
                {competitions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {competitions.map((comp) => (
                            <div
                                key={comp.id || comp._id?.$oid}
                                onClick={() => onSelectCompetition(comp)}
                                className="bg-slate-800/50 rounded-xl shadow-lg border border-amber-500/10 hover:border-amber-500/40 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">{comp.name}</h3>
                                        <ChevronRight className="text-gray-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" size={24} />
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <InfoTag text={comp.type.replace('_', ' ')} colorClass={getCompetitionTypeColor(comp.type)} />
                                        <InfoTag text={comp.status} colorClass={getStatusColor(comp.status)} />
                                    </div>
                                    <p className="text-gray-400 text-sm">
                                        Round {comp.currentRound.index + 1} of {comp.rounds}
                                    </p>
                                </div>
                                <div className="bg-slate-900/40 rounded-b-xl px-6 py-3 border-t border-amber-500/10 flex justify-between items-center text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} />
                                        <span>{comp.numberOfClans} clans</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        <span>{new Date(comp.createdAt.$date || comp.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-800/40 rounded-xl">
                        <Trophy className="mx-auto text-gray-600 mb-4" size={56} />
                        <h3 className="text-xl font-semibold text-white">No Competitions Found</h3>
                        <p className="text-gray-500 mt-2">Check back later or create a new competition.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


//================================================================================
// Clan War Management Component
//================================================================================
const ClanWarManagement = ({ competition, onBack }) => {
    const [fixtures, setFixtures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingMatch, setEditingMatch] = useState(null); // { fixtureId, matchIndex }
    const [scores, setScores] = useState({ home: '', away: '' });
    const [showProgressDialog, setShowProgressDialog] = useState(false);
    const [progressLoading, setProgressLoading] = useState(false);
    
    const competitionId = useMemo(() => competition._id?.$oid || competition.id || competition._id, [competition]);
    
    const fetchFixtures = async () => {
        if (!competitionId) {
            setError("Competition ID is missing.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await getClanWarFixtures(competitionId);
            setFixtures(data || []);
        } catch (err) {
            setError('Failed to fetch clan war fixtures.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFixtures();
    }, [competitionId]);

    const canProgressToNext = useMemo(() => {
        if (!fixtures || fixtures.length === 0) return false;
        return fixtures.every(fixture =>
            fixture.individualMatches.every(match => match.status === 'completed')
        );
    }, [fixtures]);

    // Group fixtures by round
    const groupedFixtures = useMemo(() => {
        if (!fixtures) return {};
        return fixtures.reduce((acc, fixture) => {
            const roundName = `Round ${fixture.round}`;
            if (!acc[roundName]) {
                acc[roundName] = [];
            }
            acc[roundName].push(fixture);
            return acc;
        }, {});
    }, [fixtures]);


    const handleEditMatch = (fixtureId, matchIndex, match) => {
        setEditingMatch({ fixtureId, matchIndex });
        setScores({
            home: match.homeScore?.toString() || '0',
            away: match.awayScore?.toString() || '0'
        });
    };

    const handleCancelEdit = () => {
        setEditingMatch(null);
        setScores({ home: '', away: '' });
    };

    const handleSaveMatch = async () => {
        if (!editingMatch) return;
        try {
            await updateClanWarMatch(
                editingMatch.fixtureId,
                editingMatch.matchIndex,
                parseInt(scores.home, 10) || 0,
                parseInt(scores.away, 10) || 0
            );
            await fetchFixtures(); // Refresh data
            handleCancelEdit();
        } catch (err) {
            setError('Failed to update match result.');
            console.error(err);
        }
    };

    const handleProgressToNextRound = async () => {
        try {
            setProgressLoading(true);
            await progressClanWarToNextRound(competitionId);
            setShowProgressDialog(false);
            await fetchFixtures();
        } catch (err) {
            setError('Failed to progress to the next round.');
            console.error(err);
        } finally {
            setProgressLoading(false);
        }
    };

    const getMatchStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-300 bg-green-900/50';
            case 'pending': return 'text-yellow-300 bg-yellow-900/50';
            default: return 'text-gray-400 bg-gray-700/50';
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading fixtures..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 text-gray-200 font-sans">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <header className="mb-8 flex items-center justify-between border-b border-amber-500/20 pb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors">
                            <ArrowLeft size={22} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-wider">{competition.name}</h1>
                            <p className="text-amber-400">Clan War Management</p>
                        </div>
                    </div>
                </header>
                
                {/* Error Message */}
                {error && (
                     <div className="bg-red-900/50 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertCircle className="text-red-400 mr-3" size={20} />
                            <span className="text-red-300">{error}</span>
                        </div>
                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-200 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                )}
                
                {/* Progress to Next Round Banner */}
                {canProgressToNext && !competition.isCompleted && (
                    <div className="bg-green-900/50 border border-green-500/30 rounded-lg p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center">
                            <CheckCircle className="text-green-400 mr-3" size={24} />
                            <div>
                                <p className="font-semibold text-green-300">This round is complete!</p>
                                <p className="text-green-400 text-sm">You are ready to advance to the next stage.</p>
                            </div>
                        </div>
                        <button onClick={() => setShowProgressDialog(true)} className="bg-gradient-to-r from-green-600 to-teal-500 text-white font-bold px-6 py-2 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-transform w-full sm:w-auto">
                            Advance to Next Round
                        </button>
                    </div>
                )}
                
                {/* Fixtures grouped by round */}
                <div className="space-y-12">
                    {Object.entries(groupedFixtures).map(([roundName, roundFixtures]) => (
                        <section key={roundName}>
                            <h2 className="text-3xl font-bold text-amber-400 mb-6 border-l-4 border-amber-400 pl-4">{roundName}</h2>
                            <div className="space-y-6">
                                {roundFixtures.map((fixture) => (
                                    <div key={fixture.id || fixture._id} className="bg-slate-800/60 rounded-xl shadow-lg border border-amber-500/10">
                                        <header className="p-4 border-b border-amber-500/10 bg-slate-900/50 rounded-t-xl">
                                            <div className="flex items-center justify-center sm:justify-between flex-wrap gap-4">
                                                <span className="font-bold text-2xl text-blue-400">{fixture.homeClan?.name || 'N/A'}</span>
                                                <span className="text-gray-500 font-mono text-xl">VS</span>
                                                <span className="font-bold text-2xl text-red-400">{fixture.awayClan?.name || 'N/A'}</span>
                                            </div>
                                        </header>
                                        
                                        <div className="p-4 space-y-3">
                                            {fixture.individualMatches?.map((match, matchIndex) => (
                                                <div key={match._id || matchIndex} className="bg-slate-900/50 rounded-lg p-3 grid grid-cols-3 items-center gap-2">
                                                    <span className="font-medium text-right truncate">{match.homePlayer?.name || match.homePlayerName || 'Player 1'}</span>
                                                    
                                                    {editingMatch?.fixtureId === (fixture.id || fixture._id) && editingMatch?.matchIndex === matchIndex ? (
                                                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                            <input type="number" value={scores.home} onChange={(e) => setScores(p => ({ ...p, home: e.target.value }))} className="w-14 p-1 bg-slate-700 border border-amber-500/30 rounded text-center text-white" />
                                                            <span className="text-gray-500">-</span>
                                                            <input type="number" value={scores.away} onChange={(e) => setScores(p => ({ ...p, away: e.target.value }))} className="w-14 p-1 bg-slate-700 border border-amber-500/30 rounded text-center text-white" />
                                                            <button onClick={handleSaveMatch} className="text-green-400 p-1 hover:text-green-300"><Save size={18} /></button>
                                                            <button onClick={handleCancelEdit} className="text-red-400 p-1 hover:text-red-300"><X size={18} /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 sm:gap-4">
                                                            <span className="text-2xl font-bold text-white">{match.homeScore ?? '-'}</span>
                                                            <span className="text-gray-600">-</span>
                                                            <span className="text-2xl font-bold text-white">{match.awayScore ?? '-'}</span>
                                                            <button onClick={() => handleEditMatch(fixture.id || fixture._id, matchIndex, match)} className="text-gray-400 p-1 ml-2 hover:text-amber-400 transition-colors">
                                                                <Edit3 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium truncate">{match.awayPlayer?.name || match.awayPlayerName || 'Player 2'}</span>
                                                        <div className={`ml-auto text-xs px-2 py-0.5 rounded-md hidden md:block ${getMatchStatusColor(match.status)}`}>
                                                            {match.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {fixtures.length === 0 && !loading && (
                    <div className="text-center py-20 bg-slate-800/40 rounded-xl">
                        <Trophy className="mx-auto text-gray-600 mb-4" size={56} />
                        <h3 className="text-xl font-semibold text-white">No Fixtures Found</h3>
                        <p className="text-gray-500 mt-2">Fixtures for this competition will appear here once they are generated.</p>
                    </div>
                )}
            </div>

            {/* Progress Dialog Modal */}
            {showProgressDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-amber-500/20 shadow-2xl">
                        <h3 className="text-xl font-semibold text-white mb-2">Confirm Advancement</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to advance to the next round? This action cannot be undone.</p>
                        <div className="flex space-x-4">
                            <button onClick={() => setShowProgressDialog(false)} disabled={progressLoading} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white transition-colors">Cancel</button>
                            <button onClick={handleProgressToNextRound} disabled={progressLoading} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                                {progressLoading && <Loader2 className="animate-spin" size={18}/>}
                                {progressLoading ? 'Advancing...' : 'Confirm & Proceed'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


//================================================================================
// Main Component
//================================================================================
const CompetitionManagement = () => {
    const [selectedCompetition, setSelectedCompetition] = useState(null);

    const handleSelectCompetition = (competition) => {
        setSelectedCompetition(competition);
    };

    const handleBack = () => {
        setSelectedCompetition(null);
    };

    if (selectedCompetition) {
        return <ClanWarManagement competition={selectedCompetition} onBack={handleBack} />;
    }

    return <CompetitionList onSelectCompetition={handleSelectCompetition} />;
};

export default CompetitionManagement;