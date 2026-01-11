  import React, { useState, useEffect, useMemo, useCallback } from 'react';
  import {
    Trophy, Users, Calendar, Activity,
    Swords, Shield, LayoutGrid, Medal,
    BarChart3, Eye, Edit, Sparkles, ChevronRight,
    TrendingUp, Clock, Grid3x3, ArrowLeft // Added ArrowLeft import
  } from 'lucide-react';
  import { Link } from 'react-router-dom';
  import competitionService from '../services/fixtureService';

  // ==================== CONFIGURATION ====================

  const COMPETITION_TYPES = {
    KO_REGULAR: {
      label: 'Knockout Cup',
      icon: Swords,
      theme: {
        gradient: 'from-red-500 to-rose-600',
        glow: 'rgba(239, 68, 68, 0.15)',
        accent: 'bg-red-500/10 text-red-400 border-red-500/20',
        ring: 'ring-red-500/20'
      }
    },
    LEAGUE: {
      label: 'League',
      icon: Trophy,
      theme: {
        gradient: 'from-blue-500 to-indigo-600',
        glow: 'rgba(59, 130, 246, 0.15)',
        accent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        ring: 'ring-blue-500/20'
      }
    },
    GROUP_STAGE: {
      label: 'Group Stage',
      icon: LayoutGrid,
      theme: {
        gradient: 'from-purple-500 to-fuchsia-600',
        glow: 'rgba(168, 85, 247, 0.15)',
        accent: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        ring: 'ring-purple-500/20'
      }
    },
    CLAN_WAR: {
      label: 'Clan War',
      icon: Shield,
      theme: {
        gradient: 'from-amber-500 to-orange-600',
        glow: 'rgba(245, 158, 11, 0.15)',
        accent: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        ring: 'ring-amber-500/20'
      }
    },
    DEFAULT: {
      label: 'Tournament',
      icon: Activity,
      theme: {
        gradient: 'from-gray-600 to-gray-700',
        glow: 'rgba(107, 114, 128, 0.15)',
        accent: 'bg-gray-600/10 text-gray-400 border-gray-600/20',
        ring: 'ring-gray-500/20'
      }
    }
  };

  const FILTER_OPTIONS = ['ALL', 'KO_REGULAR', 'LEAGUE', 'GROUP_STAGE', 'CLAN_WAR'];

  // ==================== UTILITIES ====================

  const getCompetitionConfig = (type) => COMPETITION_TYPES[type] || COMPETITION_TYPES.DEFAULT;

  const calculateProgress = (currentRound, totalRounds) => {
    const current = currentRound?.index || 0;
    const total = totalRounds || 1;
    return Math.min((current / total) * 100, 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // ==================== COMPONENTS ====================

  const StatsCard = React.memo(({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-700/30">
      <div className="p-2 rounded-lg bg-gray-700/50">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-200 truncate">{value}</p>
      </div>
    </div>
  ));

  StatsCard.displayName = 'StatsCard';

  const StatusBadge = React.memo(({ status }) => (
    <div className="flex items-center gap-2">
      {status === 'ongoing' ? (
        <>
          <div className="relative flex items-center">
            <div className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <div className="relative w-2 h-2 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-gray-600 rounded-full" />
          <span className="text-xs font-medium text-gray-500">Inactive</span>
        </>
      )}
    </div>
  ));

  StatusBadge.displayName = 'StatusBadge';

  const CompetitionCard = React.memo(({ competition }) => {
    const config = useMemo(() => getCompetitionConfig(competition.type), [competition.type]);
    const Icon = config.icon;
    const progress = useMemo(() =>
      calculateProgress(competition.currentRound, competition.totalRounds || competition.rounds),
      [competition.currentRound, competition.totalRounds, competition.rounds]
    );

   const routes = useMemo(() => ({
  updateResult: competition.type === 'KO_REGULAR'
    ? `/admin/manage-kos/${competition._id}`
    : competition.type === 'CLAN_WAR'
      ? `/admin/clan-war-management`
      : `/admin/results/${competition._id}`,

  viewFixtures: competition.type === 'KO_REGULAR'
    ? `/manage-ko/${competition._id}`
    : competition.type === 'CLAN_WAR'
      ? `/clan-wars/${competition._id}`
      : `/fixtures/${competition._id}`,

  viewStandings: `/standings/${competition._id}`,
  hasStandings: competition.type === 'LEAGUE' || competition.type === 'GROUP_STAGE'
}), [competition.type, competition._id]);


    const participantCount = competition.type === 'CLAN_WAR'
      ? `${competition.numberOfClans} Clans`
      : `${competition.numberOfPlayers} Players`;

    return (
      <article className="group relative h-full">
        {/* Glow effect */}
        <div
          className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"
          style={{ background: `radial-gradient(circle at center, ${config.theme.glow}, transparent 70%)` }}
        />

        <div className="relative h-full flex flex-col bg-gradient-to-br from-gray-900/90 via-gray-900/95 to-black rounded-2xl border border-gray-800/50 overflow-hidden transition-all duration-300 hover:border-gray-700/50">

          {/* Header Section */}
          <div className="relative p-5 pb-4 border-b border-gray-800/50">
            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${config.theme.gradient}`} />

            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`p-3 rounded-xl ${config.theme.accent} backdrop-blur-sm border ring-1 ${config.theme.ring} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-lg font-bold text-white truncate mb-2 group-hover:text-gray-100 transition-colors" title={competition.name}>
                    {competition.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg ${config.theme.accent} border`}>
                      {config.label}
                    </span>
                    <StatusBadge status={competition.status} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="p-5 space-y-3 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <StatsCard
                icon={Users}
                label="Participants"
                value={participantCount}
              />
              <StatsCard
                icon={Calendar}
                label="Created"
                value={formatDate(competition.createdAt)}
              />
            </div>

            {/* Progress Section */}
            <div className="p-4 rounded-xl bg-gray-800/20 border border-gray-800/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-300">Progress</span>
                </div>
                <span className="text-xs font-mono text-gray-500">
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="relative h-2 bg-gray-800/80 rounded-full overflow-hidden mb-2">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${config.theme.gradient} rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Round {competition.currentRound?.index || 0}
                </span>
                <span className="text-gray-500">
                  of {competition.totalRounds || competition.rounds}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="p-5 pt-0 space-y-2">
            <Link
              to={routes.updateResult}
              className={`group/btn flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r ${config.theme.gradient} text-white font-semibold text-sm hover:shadow-xl transition-all duration-200 hover:shadow-black/40 active:scale-[0.98]`}
            >
              <Edit className="w-4 h-4" />
              <span>Update Results</span>
              <ChevronRight className="w-4 h-4 ml-auto group-hover/btn:translate-x-1 transition-transform" />
            </Link>

            <div className={`grid ${routes.hasStandings ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
              <Link
                to={routes.viewFixtures}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-gray-300 text-sm font-medium hover:bg-gray-700/50 hover:border-gray-600/50 hover:text-white transition-all duration-200 active:scale-[0.98]"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </Link>

              {routes.hasStandings && (
                <Link
                  to={routes.viewStandings}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-gray-300 text-sm font-medium hover:bg-gray-700/50 hover:border-gray-600/50 hover:text-white transition-all duration-200 active:scale-[0.98]"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Standings</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  });

  CompetitionCard.displayName = 'CompetitionCard';

  const FilterButton = React.memo(({ type, isActive, count, onClick }) => {
    const label = type === 'ALL' ? 'All Events' : type.replace(/_/g, ' ');

    return (
      <button
        onClick={onClick}
        className={`group relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${isActive
            ? 'bg-white text-gray-900 shadow-lg shadow-white/10'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
      >
        <span className="flex items-center gap-2">
          {label}
          {count > 0 && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-gray-900/20 text-gray-900' : 'bg-gray-700/50 text-gray-500'
              }`}>
              {count}
            </span>
          )}
        </span>
      </button>
    );
  });

  FilterButton.displayName = 'FilterButton';

  const EmptyState = React.memo(({ filter }) => (
    <div className="col-span-full">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-gray-800/10 to-gray-900/10 rounded-3xl blur-2xl" />
        <div className="relative flex flex-col items-center justify-center py-24 bg-gray-900/20 backdrop-blur-sm rounded-2xl border border-dashed border-gray-800/50">
          <div className="inline-flex p-6 rounded-2xl bg-gray-800/30 mb-6">
            <Medal className="w-20 h-20 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-300 mb-3">No Competitions Found</h3>
          <p className="text-gray-500 max-w-md text-center px-4">
            {filter === 'ALL'
              ? 'Create your first competition to get started with managing results'
              : `No ${filter.replace(/_/g, ' ').toLowerCase()} competitions are currently available`}
          </p>
        </div>
      </div>
    </div>
  ));

  EmptyState.displayName = 'EmptyState';

  const LoadingSpinner = React.memo(() => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping">
          <div className="h-20 w-20 rounded-full bg-white/5" />
        </div>
        <div className="relative h-20 w-20 rounded-full border-4 border-gray-900 border-t-white/40 animate-spin" />
      </div>
    </div>
  ));

  LoadingSpinner.displayName = 'LoadingSpinner';

  // ==================== MAIN COMPONENT ====================

  export default function ManageResultsPage() {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
      let mounted = true;

      const fetchCompetitions = async () => {
        try {
          setLoading(true);
          const response = await competitionService.getOngoingCompetitions();
          if (mounted) {
            setCompetitions(response.data.data || []);
          }
        } catch (err) {
          console.error("Failed to load competitions:", err);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      fetchCompetitions();
      return () => { mounted = false; };
    }, []);

    const filteredCompetitions = useMemo(() =>
      filter === 'ALL'
        ? competitions
        : competitions.filter(comp => comp.type === filter),
      [competitions, filter]
    );

    const filterCounts = useMemo(() => {
      const counts = { ALL: competitions.length };
      FILTER_OPTIONS.slice(1).forEach(type => {
        counts[type] = competitions.filter(c => c.type === type).length;
      });
      return counts;
    }, [competitions]);

    const handleFilterChange = useCallback((newFilter) => {
      setFilter(newFilter);
    }, []);

    if (loading) {
      return <LoadingSpinner />;
    }

    return (
      <div className="min-h-screen bg-black text-gray-100">
        {/* Background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/[0.02] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/[0.02] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-4xl font-black text-white">
                    Manage Results
                  </h1>
                </div>
                <p className="text-gray-500 ml-14">
                  Update scores, advance rounds, and track competition progress
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Back to Dashboard Button - NEW ADDITION */}
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 group"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>

                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-800/50">
                  <Grid3x3 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400">
                    {filteredCompetitions.length} {filteredCompetitions.length === 1 ? 'Competition' : 'Competitions'}
                  </span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-gray-900/50 backdrop-blur-xl border border-gray-800/50">
              {FILTER_OPTIONS.map((type) => (
                <FilterButton
                  key={type}
                  type={type}
                  isActive={filter === type}
                  count={filterCounts[type] || 0}
                  onClick={() => handleFilterChange(type)}
                />
              ))}
            </div>
          </header>

          {/* Competition Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 auto-rows-fr">
            {filteredCompetitions.length > 0 ? (
              filteredCompetitions.map((comp) => (
                <CompetitionCard key={comp._id} competition={comp} />
              ))
            ) : (
              <EmptyState filter={filter} />
            )}
          </div>
        </div>
      </div>
    );
  }