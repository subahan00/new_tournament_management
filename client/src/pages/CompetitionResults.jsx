import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Search, Edit2, AlertTriangle, Inbox,
    Check, X, ListChecks, Save, Calendar, Clock, Trophy,
    RotateCcw
} from 'lucide-react';
import fixtureService from '../services/fixtureService';

// --- Sub-Component: Status Badge ---
const StatusBadge = ({ status }) => {
    const styles = {
        completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        ongoing: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.pending}`}>
            {status}
        </span>
    );
};

// --- Sub-Component: Fixture Card ---
const FixtureCard = ({
    fixture,
    isBulkMode,
    bulkScores,
    onBulkChange,
    onEditClick,
    onRevertClick,
    editingId,
    tempScores,
    onTempScoreChange,
    onSubmitSingle,
    onCancelSingle
}) => {
    const isEditingSingle = editingId === fixture._id;
    const homeName = fixture.homePlayer?.name || fixture.homePlayerName || 'TBD';
    const awayName = fixture.awayPlayer?.name || fixture.awayPlayerName || 'TBD';

    // Helper to render score input
    const ScoreInput = ({ value, onChange, placeholder }) => (
        <input
            type="number"
            min="0"
            value={value}
            onChange={onChange}
            className="w-16 h-12 text-center text-xl font-bold bg-black/50 border border-gray-700 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none transition-all text-white placeholder-gray-600"
            placeholder={placeholder}
        />
    );

    return (
        <div className={`relative group overflow-hidden bg-gray-900/40 backdrop-blur-md border rounded-xl transition-all duration-300 
      ${isEditingSingle || (isBulkMode && bulkScores[fixture._id])
                ? 'border-amber-500/50 bg-gray-900/60 shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)]'
                : 'border-white/5 hover:border-white/10 hover:bg-gray-800/60'
            }`}
        >
            {/* Date Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{fixture.matchDate ? new Date(fixture.matchDate).toLocaleDateString() : 'Date TBD'}</span>
                </div>
                <StatusBadge status={fixture.status} />
            </div>

            <div className="p-5">
                <div className="flex items-center justify-between gap-4">

                    {/* Home Player */}
                    <div className="flex-1 text-right flex flex-col items-end">
                        <span className="text-sm font-bold text-gray-200 truncate max-w-[120px] md:max-w-full" title={homeName}>
                            {homeName}
                        </span>
                        <span className="text-[10px] text-gray-500 tracking-wider font-mono">HOME</span>
                    </div>

                    {/* Center: Score or VS */}
                    <div className="shrink-0 flex flex-col items-center justify-center min-w-[100px]">
                        {isBulkMode ? (
                            <div className="flex items-center gap-2">
                                <ScoreInput
                                    value={bulkScores[fixture._id]?.home ?? ''}
                                    onChange={(e) => onBulkChange(fixture._id, 'home', e.target.value)}
                                    placeholder="-"
                                />
                                <span className="text-gray-600 font-bold">:</span>
                                <ScoreInput
                                    value={bulkScores[fixture._id]?.away ?? ''}
                                    onChange={(e) => onBulkChange(fixture._id, 'away', e.target.value)}
                                    placeholder="-"
                                />
                            </div>
                        ) : isEditingSingle ? (
                            <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-200">
                                <div className="flex items-center gap-2">
                                    <ScoreInput
                                        value={tempScores.home}
                                        onChange={(e) => onTempScoreChange('home', e.target.value)}
                                    />
                                    <span className="text-gray-600 font-bold">:</span>
                                    <ScoreInput
                                        value={tempScores.away}
                                        onChange={(e) => onTempScoreChange('away', e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <button onClick={() => onSubmitSingle(fixture._id)} className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500 hover:text-black transition-colors">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={onCancelSingle} className="p-1.5 bg-gray-700/50 text-gray-400 rounded hover:bg-gray-700 hover:text-white transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // --- CLEANED UP DISPLAY SECTION ---
                            <div className="text-center group-hover:scale-110 transition-transform duration-300">
                                {fixture.status === 'completed' ? (
                                    <div className="text-3xl font-black text-white tracking-widest font-mono">
                                        {fixture.homeScore} <span className="text-gray-600">-</span> {fixture.awayScore}
                                    </div>
                                ) : (
                                    <span className="text-2xl font-black text-gray-700 font-mono">VS</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Away Player */}
                    <div className="flex-1 text-left flex flex-col items-start">
                        <span className="text-sm font-bold text-gray-200 truncate max-w-[120px] md:max-w-full" title={awayName}>
                            {awayName}
                        </span>
                        <span className="text-[10px] text-gray-500 tracking-wider font-mono">AWAY</span>
                    </div>
                </div>

                {/* --- FOOTER ACTION BAR (Edit & Revert) --- */}
                {!isBulkMode && !isEditingSingle && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {/* Edit Button */}
                        <button
                            onClick={() => onEditClick(fixture)}
                            className="flex items-center gap-2 text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors"
                        >
                            <Edit2 className="w-3 h-3" />
                            {fixture.status === 'completed' ? 'Edit Score' : 'Enter Result'}
                        </button>

                        {/* Revert Button - NOW VISIBLE HERE */}
                        {fixture.status === 'completed' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRevertClick(fixture._id);
                                }}
                                className="flex items-center gap-2 text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Revert
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Component ---
export default function CompetitionResults() {
    const { competitionId } = useParams();

    // State
    const [fixtures, setFixtures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Single Edit State
    const [editingFixtureId, setEditingFixtureId] = useState(null);
    const [singleScores, setSingleScores] = useState({ home: 0, away: 0 });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingSubmission, setPendingSubmission] = useState(null);
    const [modalAction, setModalAction] = useState('update'); // 'update' | 'revert'

    // Bulk Edit State
    const [isBulkEditMode, setIsBulkEditMode] = useState(false);
    const [bulkScores, setBulkScores] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const fixturesPerPage = 9;

    // --- Effects ---
    useEffect(() => {
        fetchFixtures();
    }, [competitionId]);

    const fetchFixtures = async () => {
        try {
            setLoading(true);
            const response = await fixtureService.getCompetitionFixtures(competitionId);
            // Assuming your API returns { data: [...] } structure
            const data = response?.data?.data || response?.data || [];
            
            // Handle if data is nested or flat depending on your backend
            if (Array.isArray(data)) {
                 setFixtures(data);
            } else if (response?.data?.matchdaySchedule) {
                 // Flatten if using the schedule format
                 setFixtures(response.data.matchdaySchedule.flatMap(md => md.fixtures));
            } else {
                 setFixtures([]);
            }

        } catch (err) {
            console.error(err);
            setError('Failed to load fixtures.');
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers: Single Edit ---
    const handleEditClick = (fixture) => {
        setEditingFixtureId(fixture._id);
        setSingleScores({
            home: fixture.homeScore ?? 0,
            away: fixture.awayScore ?? 0
        });
    };

    const handleRevertClick = (fixtureId) => {
        setPendingSubmission(fixtureId);
        setModalAction('revert');
        setShowConfirmModal(true);
    };

    const handleSingleScoreChange = (field, value) => {
        setSingleScores(prev => ({ ...prev, [field]: value }));
    };

    const handleSingleSubmitRequest = (fixtureId) => {
        if (isNaN(Number(singleScores.home)) || isNaN(Number(singleScores.away))) return;
        setPendingSubmission(fixtureId);
        setModalAction('update');
        setShowConfirmModal(true);
    };

    const confirmSingleSubmission = async () => {
        if (!pendingSubmission) return;
        try {
            setSubmitting(true);
            let payload;
            
            if (modalAction === 'revert') {
                payload = {
                    homeScore: null,
                    awayScore: null,
                    status: 'pending'
                };
            } else {
                payload = {
                    homeScore: Number(singleScores.home),
                    awayScore: Number(singleScores.away)
                };
            }
            console.log('payload',payload);
            await fixtureService.updateFixtureResult(pendingSubmission, payload);
            await fetchFixtures();
            setEditingFixtureId(null);
            setShowConfirmModal(false);
        } catch (err) {
            setError(err.message || 'Update failed');
        } finally {
            setSubmitting(false);
            setPendingSubmission(null);
        }
    };

    // --- Handlers: Bulk Edit ---
    const toggleBulkMode = () => {
        if (!isBulkEditMode) {
            setEditingFixtureId(null);
            const initial = fixtures.reduce((acc, f) => {
                acc[f._id] = { home: f.homeScore ?? '', away: f.awayScore ?? '' };
                return acc;
            }, {});
            setBulkScores(initial);
        }
        setIsBulkEditMode(!isBulkEditMode);
    };

    const handleBulkChange = (id, field, value) => {
        setBulkScores(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value === '' ? '' : Math.max(0, parseInt(value)) }
        }));
    };

    const saveBulkChanges = async () => {
        setSubmitting(true);
        try {
            const updates = [];
            Object.entries(bulkScores).forEach(([id, scores]) => {
                const original = fixtures.find(f => f._id === id);
                if (!original) return;

                const h = scores.home === '' ? null : Number(scores.home);
                const a = scores.away === '' ? null : Number(scores.away);

                if (h !== original.homeScore || a !== original.awayScore) {
                    if (h !== null && a !== null) {
                        updates.push(fixtureService.updateFixtureResult(id, { homeScore: h, awayScore: a }));
                    }
                }
            });

            if (updates.length > 0) {
                await Promise.all(updates);
                await fetchFixtures();
            }
            setIsBulkEditMode(false);
        } catch (err) {
            setError('Bulk update failed.');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Filtering & Sorting Logic ---
    const filteredFixtures = useMemo(() => {
        let result = [...fixtures];

        if (searchTerm.trim()) {
            const terms = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
            result = result.filter(f => {
                const h = (f.homePlayer?.name || f.homePlayerName || '').toLowerCase();
                const a = (f.awayPlayer?.name || f.awayPlayerName || '').toLowerCase();
                if (terms.length === 1) {
                    return h.includes(terms[0]) || a.includes(terms[0]);
                }
                if (terms.length >= 2) {
                    const [t1, t2] = terms;
                    return (h.includes(t1) && a.includes(t2)) || (h.includes(t2) && a.includes(t1));
                }
                return false;
            });
        }

        result.sort((a, b) => {
            if (searchTerm.trim()) {
                const aNotUpdated = a.homeScore == null || a.awayScore == null;
                const bNotUpdated = b.homeScore == null || b.awayScore == null;
                if (aNotUpdated !== bNotUpdated) return aNotUpdated ? -1 : 1;
            }
            const statusOrder = { ongoing: 0, pending: 1, completed: 2 };
            const scoreA = statusOrder[a.status] ?? 1;
            const scoreB = statusOrder[b.status] ?? 1;
            return scoreA - scoreB;
        });

        return result;
    }, [fixtures, searchTerm]);

    const groupedData = useMemo(() => {
        return filteredFixtures.reduce((groups, f) => {
            const round = f.round || 'Unscheduled';
            if (!groups[round]) groups[round] = [];
            groups[round].push(f);
            return groups;
        }, {});
    }, [filteredFixtures]);

    const sortedMatchdays = Object.keys(groupedData).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 999;
        const numB = parseInt(b.replace(/\D/g, '')) || 999;
        return numA - numB;
    });

    const totalPages = Math.ceil(sortedMatchdays.length / fixturesPerPage);
    const currentMatchdays = sortedMatchdays.slice((currentPage - 1) * fixturesPerPage, currentPage * fixturesPerPage);

    // --- Render ---
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans bg-gradient-to-br from-gray-900 via-black to-[#0a0a0a]">
            <div className="container mx-auto px-4 py-8 max-w-7xl">

                {/* Navigation */}
                <div className="mb-8">
                    <Link to="/admin/dashboard" className="group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Back to Dashboard</span>
                    </Link>
                </div>

                {/* Header */}
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-600 tracking-tight">
                            RESULT CENTER
                        </h1>
                        <p className="text-gray-500 mt-2 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            Manage outcomes and update match scores
                        </p>
                    </div>
                </header>

                {/* Sticky Controls Bar */}
                <div className="sticky top-4 z-40 mb-10">
                    <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl shadow-black/50 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-grow group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by player name..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-12 pr-4 py-3 bg-black/40 border border-transparent rounded-xl text-gray-100 placeholder-gray-600 focus:bg-black/60 focus:border-amber-500/50 focus:outline-none transition-all"
                            />
                        </div>

                        <div className="flex gap-2">
                            {isBulkEditMode ? (
                                <>
                                    <button
                                        onClick={saveBulkChanges}
                                        disabled={submitting}
                                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        <span className="hidden sm:inline">Save All</span>
                                    </button>
                                    <button
                                        onClick={toggleBulkMode}
                                        className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors border border-white/5"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={toggleBulkMode}
                                    className="flex items-center gap-2 px-6 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/10"
                                >
                                    <ListChecks className="w-5 h-5" />
                                    <span className="hidden sm:inline">Bulk Edit</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-amber-500/50">
                        <Clock className="w-12 h-12 animate-spin mb-4" />
                        <p className="text-sm font-mono uppercase tracking-widest">Loading Fixtures</p>
                    </div>
                ) : error ? (
                    <div className="p-6 bg-red-900/20 border border-red-500/20 rounded-xl text-red-400 text-center flex flex-col items-center">
                        <AlertTriangle className="w-10 h-10 mb-2" />
                        {error}
                    </div>
                ) : filteredFixtures.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-600 border border-dashed border-gray-800 rounded-2xl bg-gray-900/20">
                        <Inbox className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium text-gray-400">No fixtures found</p>
                        {searchTerm && <p className="text-sm">Try adjusting your search criteria</p>}
                    </div>
                ) : (
                    <div className="space-y-12">
                        {currentMatchdays.map(round => (
                            <div key={round} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-100 uppercase tracking-wider">{round}</h2>
                                    <div className="h-px flex-grow bg-gradient-to-r from-amber-500/50 to-transparent"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groupedData[round].map(fixture => (
                                        <FixtureCard
                                            key={fixture._id}
                                            fixture={fixture}
                                            isBulkMode={isBulkEditMode}
                                            bulkScores={bulkScores}
                                            onBulkChange={handleBulkChange}
                                            onEditClick={handleEditClick}
                                            onRevertClick={handleRevertClick}
                                            editingId={editingFixtureId}
                                            tempScores={singleScores}
                                            onTempScoreChange={handleSingleScoreChange}
                                            onSubmitSingle={handleSingleSubmitRequest}
                                            onCancelSingle={() => setEditingFixtureId(null)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="mt-16 flex justify-center gap-2">
                        <button
                            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-gray-500 font-mono">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Modal for Single Edit/Revert Confirmation */}
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
                            <h3 className={`text-xl font-bold mb-2 ${modalAction === 'revert' ? 'text-red-400' : 'text-white'}`}>
                                {modalAction === 'revert' ? 'Confirm Revert' : 'Confirm Result'}
                            </h3>
                            <p className="text-gray-400 text-sm mb-6">
                                {modalAction === 'revert'
                                    ? "Are you sure you want to revert this match? The scores will be cleared and status set to pending."
                                    : "Are you sure you want to update this fixture? This will reflect on the leaderboard immediately."
                                }
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={confirmSingleSubmission}
                                    disabled={submitting}
                                    className={`flex-1 py-2.5 font-bold rounded-lg transition-colors ${modalAction === 'revert'
                                            ? 'bg-red-500 hover:bg-red-400 text-white'
                                            : 'bg-amber-500 hover:bg-amber-400 text-black'
                                        }`}
                                >
                                    {submitting
                                        ? 'Processing...'
                                        : (modalAction === 'revert' ? 'Yes, Revert' : 'Yes, Update')
                                    }
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-gray-800 text-gray-300 font-bold rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}