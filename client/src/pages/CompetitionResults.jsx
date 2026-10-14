import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Search, Check, X, Edit2, RotateCcw,
  Trophy, AlertTriangle, Inbox, Save, Loader, ChevronLeft, ChevronRight,
  Filter, CheckCircle2, Clock, BarChart3
} from 'lucide-react';
import fixtureService from '../services/fixtureService';
import { toast } from 'react-toastify';

// ============================================================
// STATUS HELPERS
// ============================================================
const STATUS_COLORS = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400', left: 'border-l-amber-500' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400', left: 'border-l-emerald-500' },
};

// ============================================================
// PROGRESS BAR
// ============================================================
const ProgressBanner = ({ completed, total }) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-gray-300">Overall Progress</span>
        </div>
        <span className="text-sm font-mono text-gray-400">
          {completed}/{total} completed ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ============================================================
// MATCHDAY TABS
// ============================================================
const MatchdayTabs = ({ matchdays, active, onChange }) => {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center gap-1 mb-6">
      <button onClick={() => scroll(-1)} className="shrink-0 p-1.5 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 scroll-smooth">
        {/* All tab */}
        <button
          onClick={() => onChange('all')}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            active === 'all'
              ? 'bg-white text-gray-900 shadow-lg shadow-white/10'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
          }`}
        >
          All
        </button>

        {matchdays.map(md => {
          const pending = md.fixtures.filter(f => f.status === 'pending').length;
          const allDone = pending === 0 && md.fixtures.length > 0;

          return (
            <button
              key={md.matchdayNumber}
              onClick={() => onChange(md.matchdayNumber)}
              className={`shrink-0 px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                active === md.matchdayNumber
                  ? 'bg-white text-gray-900 shadow-lg shadow-white/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              MD {md.matchdayNumber}
              {allDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : pending > 0 ? (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  active === md.matchdayNumber ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {pending}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <button onClick={() => scroll(1)} className="shrink-0 p-1.5 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ============================================================
// STATUS FILTER
// ============================================================
const StatusFilter = ({ active, onChange, counts }) => {
  const options = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'pending', label: 'Pending', icon: Clock, count: counts.pending },
    { key: 'completed', label: 'Done', icon: CheckCircle2, count: counts.completed },
  ];

  return (
    <div className="flex gap-1.5 p-1 rounded-xl bg-gray-900/50 border border-gray-800/50">
      {options.map(opt => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              active === opt.key
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {opt.label}
            <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${
              active === opt.key ? 'bg-gray-600 text-gray-200' : 'bg-gray-800/50 text-gray-600'
            }`}>
              {opt.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ============================================================
// FIXTURE ROW COMPONENT
// ============================================================
const FixtureRow = ({
  fixture,
  editScores,
  isEditingCompleted,
  onScoreChange,
  onSubmitSingle,
  onStartEdit,
  onCancelEdit,
  onRevertClick,
  submittingId,
}) => {
  const colors = STATUS_COLORS[fixture.status] || STATUS_COLORS.pending;
  const homeName = fixture.homePlayerName || fixture.homePlayer?.name || 'TBD';
  const awayName = fixture.awayPlayerName || fixture.awayPlayer?.name || 'TBD';
  const scores = editScores[fixture._id];
  const isPending = fixture.status === 'pending';
  const isEditing = isPending || isEditingCompleted;
  const isSubmitting = submittingId === fixture._id;

  const canSubmitRow = scores &&
    scores.home !== '' && scores.home !== undefined &&
    scores.away !== '' && scores.away !== undefined &&
    !isNaN(Number(scores.home)) && !isNaN(Number(scores.away)) &&
    Number(scores.home) >= 0 && Number(scores.away) >= 0;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canSubmitRow) {
      e.preventDefault();
      onSubmitSingle(fixture._id);
    }
  };

  return (
    <div className={`group flex items-center gap-3 px-4 py-3 border-l-[3px] rounded-lg transition-all duration-200 ${
      isEditing && scores ? `${colors.left} bg-gray-900/80 border border-gray-700/50` :
      `${colors.left} bg-gray-900/40 border border-gray-800/30 hover:bg-gray-900/60`
    }`}>
      {/* Status dot */}
      <div className="shrink-0">
        {fixture.status === 'completed' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <div className={`w-3 h-3 rounded-full ${colors.dot} opacity-60`} />
        )}
      </div>

      {/* Home player */}
      <div className="flex-1 min-w-0 text-right">
        <span className={`text-sm font-semibold truncate block ${
          fixture.status === 'completed' && fixture.result === 'home' ? 'text-amber-300' : 'text-gray-200'
        }`} title={homeName}>
          {homeName}
        </span>
      </div>

      {/* Score area */}
      <div className="shrink-0 flex items-center gap-1.5 min-w-[140px] justify-center">
        {isEditing ? (
          <>
            <input
              type="number"
              min="0"
              value={scores?.home ?? ''}
              onChange={(e) => onScoreChange(fixture._id, 'home', e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-12 h-9 text-center text-base font-bold bg-black/60 border border-gray-600 rounded-md focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 focus:outline-none transition-all text-white placeholder-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="-"
              tabIndex={0}
            />
            <span className="text-gray-600 font-bold text-sm">:</span>
            <input
              type="number"
              min="0"
              value={scores?.away ?? ''}
              onChange={(e) => onScoreChange(fixture._id, 'away', e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-12 h-9 text-center text-base font-bold bg-black/60 border border-gray-600 rounded-md focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 focus:outline-none transition-all text-white placeholder-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="-"
              tabIndex={0}
            />
          </>
        ) : (
          <div className="text-lg font-black text-white tracking-widest font-mono">
            {fixture.homeScore} <span className="text-gray-600">-</span> {fixture.awayScore}
          </div>
        )}
      </div>

      {/* Away player */}
      <div className="flex-1 min-w-0 text-left">
        <span className={`text-sm font-semibold truncate block ${
          fixture.status === 'completed' && fixture.result === 'away' ? 'text-amber-300' : 'text-gray-200'
        }`} title={awayName}>
          {awayName}
        </span>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1 min-w-[70px] justify-end">
        {isEditing && canSubmitRow && (
          <button
            onClick={() => onSubmitSingle(fixture._id)}
            disabled={isSubmitting}
            className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all disabled:opacity-50"
            title="Save result"
          >
            {isSubmitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
        )}

        {fixture.status === 'completed' && !isEditingCompleted && (
          <>
            <button
              onClick={() => onStartEdit(fixture)}
              className="p-1.5 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all opacity-0 group-hover:opacity-100"
              title="Edit score"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onRevertClick(fixture._id)}
              className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
              title="Revert to pending"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {isEditingCompleted && (
          <button
            onClick={() => onCancelEdit(fixture._id)}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-all"
            title="Cancel edit"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================
// CONFIRM MODAL
// ============================================================
const ConfirmModal = ({ isOpen, onConfirm, onCancel, type, count, submitting }) => {
  if (!isOpen) return null;

  const isRevert = type === 'revert';
  const isBulk = type === 'bulk';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
        <h3 className={`text-xl font-bold mb-2 ${isRevert ? 'text-red-400' : 'text-white'}`}>
          {isRevert ? 'Confirm Revert' : isBulk ? 'Confirm Batch Save' : 'Confirm Result'}
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          {isRevert
            ? 'Are you sure? Scores will be cleared and the match set back to pending.'
            : isBulk
              ? `Save ${count} result${count !== 1 ? 's' : ''}? This will update the standings immediately.`
              : 'Are you sure you want to update this result?'
          }
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={submitting}
            className={`flex-1 py-2.5 font-bold rounded-lg transition-colors disabled:opacity-50 ${
              isRevert ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-amber-500 hover:bg-amber-400 text-black'
            }`}
          >
            {submitting ? 'Processing...' : isRevert ? 'Yes, Revert' : 'Yes, Save'}
          </button>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-2.5 bg-gray-800 text-gray-300 font-bold rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CompetitionResults() {
  const { competitionId } = useParams();

  // Data state
  const [matchdaySchedule, setMatchdaySchedule] = useState([]);
  const [competitionName, setCompetitionName] = useState('Competition');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [activeMatchday, setActiveMatchday] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit state
  const [editScores, setEditScores] = useState({}); // { fixtureId: { home: '', away: '' } }
  const [editingCompleted, setEditingCompleted] = useState(new Set()); // IDs of completed fixtures being edited

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'revert'|'bulk', fixtureId?, count? }

  // ---- DATA FETCHING ----
  const fetchFixtures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fixtureService.getCompetitionFixtures(competitionId);
      const payload = res?.data || {};

      if (payload.matchdaySchedule) {
        setMatchdaySchedule(payload.matchdaySchedule);
        // Pre-populate edit scores for pending fixtures
        const initialScores = {};
        payload.matchdaySchedule.forEach(md => {
          md.fixtures.forEach(f => {
            if (f.status === 'pending') {
              initialScores[f._id] = { home: '', away: '' };
            }
          });
        });
        setEditScores(initialScores);
      }

      setCompetitionName(payload.competitionName || 'Competition');
    } catch (err) {
      console.error('Error fetching fixtures:', err);
      setError('Failed to load fixtures');
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    fetchFixtures();
  }, [fetchFixtures]);

  // ---- COMPUTED VALUES ----
  const totalFixtures = useMemo(() =>
    matchdaySchedule.reduce((sum, md) => sum + md.fixtures.length, 0),
    [matchdaySchedule]
  );

  const completedFixtures = useMemo(() =>
    matchdaySchedule.reduce((sum, md) => sum + md.fixtures.filter(f => f.status === 'completed').length, 0),
    [matchdaySchedule]
  );

  // Filter matchdays and fixtures
  const displayedMatchdays = useMemo(() => {
    let mds = [...matchdaySchedule];

    if (activeMatchday !== 'all') {
      mds = mds.filter(md => md.matchdayNumber === activeMatchday);
    }

    return mds.map(md => {
      let fixtures = [...md.fixtures];

      // Status filter
      if (statusFilter === 'pending') fixtures = fixtures.filter(f => f.status === 'pending');
      if (statusFilter === 'completed') fixtures = fixtures.filter(f => f.status === 'completed');

      // Search filter
      if (searchTerm.trim()) {
        const terms = searchTerm.toLowerCase().trim().split(/\s+/);
        fixtures = fixtures.filter(f => {
          const home = (f.homePlayerName || f.homePlayer?.name || '').toLowerCase();
          const away = (f.awayPlayerName || f.awayPlayer?.name || '').toLowerCase();
          if (terms.length === 1) return home.includes(terms[0]) || away.includes(terms[0]);
          return (home.includes(terms[0]) && away.includes(terms[1])) ||
                 (home.includes(terms[1]) && away.includes(terms[0]));
        });
      }

      // Sort: pending first
      fixtures.sort((a, b) => {
        const order = { pending: 0, completed: 1 };
        return (order[a.status] ?? 0) - (order[b.status] ?? 0);
      });

      return { ...md, fixtures };
    }).filter(md => md.fixtures.length > 0);
  }, [matchdaySchedule, activeMatchday, statusFilter, searchTerm]);

  // Status counts for the active matchday view
  const statusCounts = useMemo(() => {
    let mds = activeMatchday === 'all' ? matchdaySchedule : matchdaySchedule.filter(md => md.matchdayNumber === activeMatchday);
    let all = 0, pending = 0, completed = 0;
    mds.forEach(md => {
      md.fixtures.forEach(f => {
        all++;
        if (f.status === 'pending') pending++;
        else if (f.status === 'completed') completed++;
      });
    });
    return { all, pending, completed };
  }, [matchdaySchedule, activeMatchday]);

  // Pending batch updates (filled scores for pending or editing-completed fixtures)
  const pendingUpdates = useMemo(() => {
    return Object.entries(editScores)
      .filter(([id, scores]) => {
        if (!scores || scores.home === '' || scores.away === '' || scores.home === undefined || scores.away === undefined) return false;
        const h = Number(scores.home);
        const a = Number(scores.away);
        if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return false;

        // Check if fixture exists and is either pending or being edited
        let found = false;
        matchdaySchedule.forEach(md => {
          md.fixtures.forEach(f => {
            if (f._id === id) {
              if (f.status === 'pending' || editingCompleted.has(id)) {
                // Only include if scores actually changed from current
                if (f.status === 'completed' && f.homeScore === h && f.awayScore === a) return;
                found = true;
              }
            }
          });
        });
        return found;
      })
      .map(([fixtureId, scores]) => ({
        fixtureId,
        homeScore: Number(scores.home),
        awayScore: Number(scores.away)
      }));
  }, [editScores, matchdaySchedule, editingCompleted]);

  // ---- HANDLERS ----
  const handleScoreChange = useCallback((fixtureId, field, value) => {
    const parsed = value === '' ? '' : Math.max(0, parseInt(value) || 0);
    setEditScores(prev => ({
      ...prev,
      [fixtureId]: { ...(prev[fixtureId] || { home: '', away: '' }), [field]: parsed === '' ? '' : parsed }
    }));
  }, []);

  const handleSubmitSingle = useCallback(async (fixtureId) => {
    const scores = editScores[fixtureId];
    if (!scores || scores.home === '' || scores.away === '') return;

    const h = Number(scores.home);
    const a = Number(scores.away);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;

    try {
      setSubmittingId(fixtureId);
      const result = await fixtureService.updateFixtureResult(fixtureId, { homeScore: h, awayScore: a });
      const updated = result.data || result;

      // Update local state optimistically
      setMatchdaySchedule(prev => prev.map(md => ({
        ...md,
        fixtures: md.fixtures.map(f =>
          f._id === fixtureId ? { ...f, ...updated, status: 'completed' } : f
        )
      })));

      // Clean up edit state
      setEditScores(prev => {
        const next = { ...prev };
        delete next[fixtureId];
        return next;
      });
      setEditingCompleted(prev => {
        const next = new Set(prev);
        next.delete(fixtureId);
        return next;
      });

      toast.success('Result saved');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save result');
    } finally {
      setSubmittingId(null);
    }
  }, [editScores]);

  const handleBatchSubmit = useCallback(async () => {
    if (pendingUpdates.length === 0) return;

    try {
      setSubmitting(true);
      const result = await fixtureService.bulkUpdateResults(pendingUpdates);
      const updatedFixtures = result.data || [];

      // Build update map
      const updateMap = {};
      updatedFixtures.forEach(f => { updateMap[f._id] = f; });

      // Update local state
      setMatchdaySchedule(prev => prev.map(md => ({
        ...md,
        fixtures: md.fixtures.map(f => updateMap[f._id] ? { ...f, ...updateMap[f._id] } : f)
      })));

      // Clear edit state for submitted fixtures
      const submittedIds = new Set(pendingUpdates.map(u => u.fixtureId));
      setEditScores(prev => {
        const next = { ...prev };
        submittedIds.forEach(id => delete next[id]);
        return next;
      });
      setEditingCompleted(prev => {
        const next = new Set(prev);
        submittedIds.forEach(id => next.delete(id));
        return next;
      });

      toast.success(`${updatedFixtures.length} result${updatedFixtures.length !== 1 ? 's' : ''} saved`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Batch save failed');
    } finally {
      setSubmitting(false);
      setConfirmModal(null);
    }
  }, [pendingUpdates]);

  const handleStartEdit = useCallback((fixture) => {
    setEditingCompleted(prev => new Set(prev).add(fixture._id));
    setEditScores(prev => ({
      ...prev,
      [fixture._id]: { home: fixture.homeScore ?? '', away: fixture.awayScore ?? '' }
    }));
  }, []);

  const handleCancelEdit = useCallback((fixtureId) => {
    setEditingCompleted(prev => {
      const next = new Set(prev);
      next.delete(fixtureId);
      return next;
    });
    setEditScores(prev => {
      const next = { ...prev };
      delete next[fixtureId];
      return next;
    });
  }, []);

  const handleRevert = useCallback(async (fixtureId) => {
    try {
      setSubmitting(true);
      await fixtureService.revertFixtureResult(fixtureId);

      // Update local state
      setMatchdaySchedule(prev => prev.map(md => ({
        ...md,
        fixtures: md.fixtures.map(f =>
          f._id === fixtureId
            ? { ...f, homeScore: null, awayScore: null, status: 'pending', result: null, completedAt: null }
            : f
        )
      })));

      // Add pending edit slot
      setEditScores(prev => ({ ...prev, [fixtureId]: { home: '', away: '' } }));
      setEditingCompleted(prev => {
        const next = new Set(prev);
        next.delete(fixtureId);
        return next;
      });

      toast.success('Result reverted to pending');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to revert');
    } finally {
      setSubmitting(false);
      setConfirmModal(null);
    }
  }, []);

  // ---- RENDER ----
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Loading fixtures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center p-8 bg-red-900/20 border border-red-500/20 rounded-2xl">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={fetchFixtures} className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 bg-gradient-to-br from-gray-900 via-black to-[#0a0a0a]">
      <div className="container mx-auto px-4 py-6 max-w-5xl">

        {/* Nav */}
        <div className="mb-6">
          <Link to="/results" className="group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>

        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
              {competitionName}
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-9">Update match results</p>
        </header>

        {/* Progress */}
        <ProgressBanner completed={completedFixtures} total={totalFixtures} />

        {/* Matchday Tabs */}
        <MatchdayTabs
          matchdays={matchdaySchedule}
          active={activeMatchday}
          onChange={setActiveMatchday}
        />

        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-800/50 rounded-xl text-gray-200 placeholder-gray-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all text-sm"
            />
          </div>

          {/* Status filter */}
          <StatusFilter active={statusFilter} onChange={setStatusFilter} counts={statusCounts} />
        </div>

        {/* Fixture list */}
        {displayedMatchdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-800 rounded-2xl bg-gray-900/20">
            <Inbox className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-gray-400 font-medium">No fixtures found</p>
            <p className="text-gray-600 text-sm mt-1">
              {searchTerm ? 'Try adjusting your search' : 'No fixtures match the current filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {displayedMatchdays.map(md => (
              <div key={md.matchdayNumber}>
                {/* Matchday header */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-lg font-bold text-gray-100">Matchday {md.matchdayNumber}</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-700/50 to-transparent" />
                  <span className="text-xs text-gray-500 font-mono">
                    {md.fixtures.filter(f => f.status === 'completed').length}/{md.fixtures.length}
                  </span>
                </div>

                {/* Fixture rows */}
                <div className="space-y-1.5">
                  {md.fixtures.map(fixture => (
                    <FixtureRow
                      key={fixture._id}
                      fixture={fixture}
                      editScores={editScores}
                      isEditingCompleted={editingCompleted.has(fixture._id)}
                      onScoreChange={handleScoreChange}
                      onSubmitSingle={handleSubmitSingle}
                      onStartEdit={handleStartEdit}
                      onCancelEdit={handleCancelEdit}
                      onRevertClick={(id) => setConfirmModal({ type: 'revert', fixtureId: id })}
                      submittingId={submittingId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating batch save bar */}
        {pendingUpdates.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-center gap-3 px-5 py-3 bg-gray-900/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 text-amber-400">
                <Save className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {pendingUpdates.length} result{pendingUpdates.length !== 1 ? 's' : ''} ready
                </span>
              </div>
              <button
                onClick={() => setConfirmModal({ type: 'bulk', count: pendingUpdates.length })}
                disabled={submitting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
              >
                {submitting ? 'Saving...' : 'Save All'}
              </button>
            </div>
          </div>
        )}

        {/* Confirm modal */}
        <ConfirmModal
          isOpen={!!confirmModal}
          type={confirmModal?.type}
          count={confirmModal?.count}
          submitting={submitting}
          onConfirm={() => {
            if (confirmModal?.type === 'revert') {
              handleRevert(confirmModal.fixtureId);
            } else if (confirmModal?.type === 'bulk') {
              handleBatchSubmit();
            }
          }}
          onCancel={() => setConfirmModal(null)}
        />
      </div>
    </div>
  );
}