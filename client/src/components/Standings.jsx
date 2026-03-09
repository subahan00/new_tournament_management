import React, { useState, useEffect, useMemo, memo, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import standingService from '../services/standingService';

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
  TrendingUp,
  Download,
  ImageIcon,
  Check
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
// IMAGE DOWNLOAD UTILITY
//=================================================================

/**
 * Draws a standings table onto a canvas and triggers a PNG download.
 * Works for both LEAGUE and GROUP_STAGE competitions.
 *
 * @param {object} options
 * @param {string} options.competitionName
 * @param {string} options.competitionType  - 'LEAGUE' | 'GROUP_STAGE'
 * @param {object} options.groupData        - { [groupName]: standing[] }  (GROUP_STAGE only)
 * @param {Array}  options.leagueStandings  - standing[]                   (LEAGUE only)
 * @param {string} [options.activeGroup]    - currently selected group or 'all'
 */
const downloadStandingsAsImage = async ({
  competitionName,
  competitionType,
  groupData = {},
  leagueStandings = [],
  activeGroup = 'all',
}) => {
  // ── Determine which groups/standings to render ──────────────────────────
  let sections = []; // [{ title: string|null, rows: standing[] }]

  if (competitionType === 'LEAGUE') {
    sections = [{ title: null, rows: leagueStandings }];
  } else if (competitionType === 'GROUP_STAGE') {
    if (activeGroup === 'all') {
      sections = Object.keys(groupData)
        .sort()
        .map(g => ({ title: g, rows: groupData[g] || [] }));
    } else {
      sections = [{ title: activeGroup, rows: groupData[activeGroup] || [] }];
    }
  }

  if (sections.length === 0 || sections.every(s => s.rows.length === 0)) return;

  // ── Layout constants ─────────────────────────────────────────────────────
  const COLS = ['#', 'Player', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'];
  const COL_WIDTHS = [42, 220, 48, 48, 48, 48, 52, 52, 52, 52]; // px
  const PADDING_H = 32;
  const HEADER_H = 80;    // competition name banner
  const GROUP_TITLE_H = 44;
  const TABLE_HEADER_H = 38;
  const ROW_H = 40;
  const GAP_BETWEEN = 36;
  const FOOTER_H = 36;

  const totalWidth = COL_WIDTHS.reduce((a, b) => a + b, 0) + PADDING_H * 2;

  // Calculate total canvas height
  let totalHeight = HEADER_H + PADDING_H;
  sections.forEach((sec, i) => {
    if (sec.title) totalHeight += GROUP_TITLE_H;
    totalHeight += TABLE_HEADER_H + sec.rows.length * ROW_H;
    if (i < sections.length - 1) totalHeight += GAP_BETWEEN;
  });
  totalHeight += PADDING_H + FOOTER_H;

  // ── Create canvas ────────────────────────────────────────────────────────
  const dpr = window.devicePixelRatio || 2;
  const canvas = document.createElement('canvas');
  canvas.width = totalWidth * dpr;
  canvas.height = totalHeight * dpr;
  canvas.style.width = `${totalWidth}px`;
  canvas.style.height = `${totalHeight}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const hex2rgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const colX = (colIndex) => {
    let x = PADDING_H;
    for (let i = 0; i < colIndex; i++) x += COL_WIDTHS[i];
    return x;
  };

  // ── Background ───────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
  bgGrad.addColorStop(0, '#0a0510');
  bgGrad.addColorStop(0.45, '#1a0f2e');
  bgGrad.addColorStop(1, '#0a0510');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Subtle grid dots
  ctx.fillStyle = 'rgba(139,123,184,0.06)';
  for (let gx = 0; gx < totalWidth; gx += 28) {
    for (let gy = 0; gy < totalHeight; gy += 28) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Header banner ────────────────────────────────────────────────────────
  const headerGrad = ctx.createLinearGradient(0, 0, totalWidth, 0);
  headerGrad.addColorStop(0, 'rgba(44,27,75,0)');
  headerGrad.addColorStop(0.3, 'rgba(44,27,75,0.7)');
  headerGrad.addColorStop(0.7, 'rgba(44,27,75,0.7)');
  headerGrad.addColorStop(1, 'rgba(44,27,75,0)');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, totalWidth, HEADER_H);

  // Gold accent line under header
  const lineGrad = ctx.createLinearGradient(0, 0, totalWidth, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.2, '#ffdf80');
  lineGrad.addColorStop(0.8, '#ffdf80');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, HEADER_H - 1);
  ctx.lineTo(totalWidth, HEADER_H - 1);
  ctx.stroke();

  // Trophy icon area (simple circle glow)
  ctx.save();
  const glow = ctx.createRadialGradient(totalWidth / 2, HEADER_H / 2, 0, totalWidth / 2, HEADER_H / 2, 50);
  glow.addColorStop(0, 'rgba(255,223,128,0.12)');
  glow.addColorStop(1, 'rgba(255,223,128,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, totalWidth, HEADER_H);
  ctx.restore();

  // Competition name
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titleGrad = ctx.createLinearGradient(totalWidth * 0.2, 0, totalWidth * 0.8, 0);
  titleGrad.addColorStop(0, '#fff8e7');
  titleGrad.addColorStop(0.4, '#ffdf80');
  titleGrad.addColorStop(0.6, '#e6b422');
  titleGrad.addColorStop(1, '#fff8e7');
  ctx.fillStyle = titleGrad;
  ctx.font = 'bold 26px "Segoe UI", sans-serif';
  ctx.fillText(`${competitionName} — Standings`, totalWidth / 2, HEADER_H / 2 - 4);

  // Competition type badge
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(139,123,184,0.9)';
  ctx.fillText(competitionType.replace('_', ' '), totalWidth / 2, HEADER_H / 2 + 16);

  // ── Render each section ──────────────────────────────────────────────────
  let curY = HEADER_H + PADDING_H;

  sections.forEach((sec, secIdx) => {
    // Group title
    if (sec.title) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffdf80';
      ctx.fillText(`⚔  ${sec.title}`, PADDING_H, curY + GROUP_TITLE_H / 2 - 2);

      // Underline
      ctx.strokeStyle = 'rgba(255,223,128,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING_H, curY + GROUP_TITLE_H - 1);
      ctx.lineTo(totalWidth - PADDING_H, curY + GROUP_TITLE_H - 1);
      ctx.stroke();

      curY += GROUP_TITLE_H;
    }

    // Table header row
    const thBg = ctx.createLinearGradient(0, curY, 0, curY + TABLE_HEADER_H);
    thBg.addColorStop(0, 'rgba(44,27,75,0.6)');
    thBg.addColorStop(1, 'rgba(44,27,75,0.3)');
    ctx.fillStyle = thBg;
    // Rounded top corners for first section
    ctx.beginPath();
    if (secIdx === 0 || sec.title) {
      ctx.roundRect(PADDING_H - 8, curY, totalWidth - PADDING_H * 2 + 16, TABLE_HEADER_H, [8, 8, 0, 0]);
    } else {
      ctx.rect(PADDING_H - 8, curY, totalWidth - PADDING_H * 2 + 16, TABLE_HEADER_H);
    }
    ctx.fill();

    ctx.textBaseline = 'middle';
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,223,128,0.7)';

    COLS.forEach((col, ci) => {
      const x = colX(ci);
      ctx.textAlign = ci <= 1 ? 'left' : 'center';
      const cellCx = ci <= 1 ? x + 6 : x + COL_WIDTHS[ci] / 2;
      ctx.fillText(col.toUpperCase(), cellCx, curY + TABLE_HEADER_H / 2);
    });

    curY += TABLE_HEADER_H;

    // Data rows
    sec.rows.forEach((row, rowIdx) => {
      const rowBg = rowIdx % 2 === 0 ? 'rgba(44,27,75,0.15)' : 'rgba(30,15,60,0.1)';
      const isPromotion = rowIdx < 4;

      ctx.fillStyle = rowBg;
      const isLastRow = rowIdx === sec.rows.length - 1;
      ctx.beginPath();
      if (isLastRow) {
        ctx.roundRect(PADDING_H - 8, curY, totalWidth - PADDING_H * 2 + 16, ROW_H, [0, 0, 8, 8]);
      } else {
        ctx.rect(PADDING_H - 8, curY, totalWidth - PADDING_H * 2 + 16, ROW_H);
      }
      ctx.fill();

      // Promotion indicator (gold left bar)
      if (isPromotion) {
        const barGrad = ctx.createLinearGradient(0, curY, 0, curY + ROW_H);
        barGrad.addColorStop(0, 'transparent');
        barGrad.addColorStop(0.5, '#ffdf80');
        barGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = barGrad;
        ctx.fillRect(PADDING_H - 8, curY, 3, ROW_H);
      }

      // Divider
      ctx.strokeStyle = 'rgba(255,223,128,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING_H - 8, curY + ROW_H);
      ctx.lineTo(totalWidth - PADDING_H + 8, curY + ROW_H);
      ctx.stroke();

      const GD = (row.goalsFor || 0) - (row.goalsAgainst || 0);
      const cellValues = [
        rowIdx + 1,
        row.playerName || 'Unknown',
        row.matchesPlayed || 0,
        row.wins || 0,
        row.draws || 0,
        row.losses || 0,
        row.goalsFor || 0,
        row.goalsAgainst || 0,
        GD > 0 ? `+${GD}` : GD,
        row.points || 0,
      ];

      cellValues.forEach((val, ci) => {
        const x = colX(ci);
        ctx.textAlign = ci <= 1 ? 'left' : 'center';
        const cellCx = ci <= 1 ? x + 6 : x + COL_WIDTHS[ci] / 2;
        ctx.textBaseline = 'middle';

        // Colour coding
        if (ci === 0) {
          ctx.fillStyle = '#ffdf80';
          ctx.font = 'bold 13px "Segoe UI", sans-serif';
        } else if (ci === 1) {
          ctx.fillStyle = row.playerName?.startsWith('Deleted-') ? '#f87171' : '#ffffff';
          ctx.font = '500 13px "Segoe UI", sans-serif';
        } else if (ci === 8) {
          // GD colour
          ctx.fillStyle = GD > 0 ? '#4ade80' : GD < 0 ? '#f87171' : 'rgba(139,123,184,0.8)';
          ctx.font = '500 13px "Segoe UI", sans-serif';
        } else if (ci === 9) {
          // Points
          ctx.fillStyle = '#ffdf80';
          ctx.font = 'bold 14px "Segoe UI", sans-serif';
        } else {
          ctx.fillStyle = 'rgba(139,123,184,0.85)';
          ctx.font = '13px "Segoe UI", sans-serif';
        }

        // Truncate player name
        let displayVal = String(val);
        if (ci === 1 && displayVal.startsWith('Deleted-')) {
          displayVal = displayVal.replace('Deleted-', '');
        }
        if (ci === 1) {
          // Measure & truncate
          let measured = ctx.measureText(displayVal).width;
          while (measured > COL_WIDTHS[1] - 12 && displayVal.length > 3) {
            displayVal = displayVal.slice(0, -1);
            measured = ctx.measureText(displayVal + '…').width;
          }
          if (displayVal !== String(val).replace('Deleted-', '')) displayVal += '…';
        }

        ctx.fillText(displayVal, cellCx, curY + ROW_H / 2);
      });

      curY += ROW_H;
    });

    if (secIdx < sections.length - 1) curY += GAP_BETWEEN;
  });

  // ── Footer ───────────────────────────────────────────────────────────────
  curY += PADDING_H / 2;
  ctx.strokeStyle = 'rgba(255,223,128,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING_H, curY);
  ctx.lineTo(totalWidth - PADDING_H, curY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(139,123,184,0.5)';
  ctx.fillText(
    `Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    totalWidth / 2,
    curY + FOOTER_H / 2
  );

  // ── Trigger download ─────────────────────────────────────────────────────
  const link = document.createElement('a');
  const slug = competitionName.toLowerCase().replace(/\s+/g, '-');
  const groupSlug = competitionType === 'GROUP_STAGE' && activeGroup !== 'all'
    ? `-${activeGroup.toLowerCase().replace(/\s+/g, '-')}`
    : '';
  link.download = `standings-${slug}${groupSlug}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

//=================================================================
// DOWNLOAD BUTTON COMPONENT
//=================================================================

const DownloadButton = ({ onClick, isDownloading }) => (
  <button
    onClick={onClick}
    disabled={isDownloading}
    className={`download-btn ${isDownloading ? 'downloading' : ''}`}
    title="Download standings as image"
  >
    {isDownloading ? (
      <>
        <Loader className="w-4 h-4 animate-spin" />
        <span>Generating…</span>
      </>
    ) : (
      <>
        <ImageIcon className="w-4 h-4" />
        <span>Save as Image</span>
        <Download className="w-3.5 h-3.5 opacity-60" />
      </>
    )}
  </button>
);

//=================================================================
// STATS SECTION COMPONENT
//=================================================================

const StatsSection = memo(({ standings, groupName = null }) => {
  const stats = useMemo(() => {
    const safeStandings = Array.isArray(standings) ? standings : [];
    if (safeStandings.length === 0) return null;

    const teamsWithMatches = safeStandings.filter(team => (team.matchesPlayed || 0) > 0);
    if (teamsWithMatches.length === 0) return null;

    const qualifying = safeStandings.slice(0, 4);

    const topScorer = teamsWithMatches.reduce((prev, current) => {
      const currentAvg = (current.goalsFor || 0) / (current.matchesPlayed || 1);
      const prevAvg = (prev.goalsFor || 0) / (prev.matchesPlayed || 1);
      return currentAvg > prevAvg ? current : prev;
    });

    const bestDefense = teamsWithMatches.reduce((prev, current) => {
      const currentAvg = (current.goalsAgainst || 0) / (current.matchesPlayed || 1);
      const prevAvg = (prev.goalsAgainst || 0) / (prev.matchesPlayed || 1);
      return currentAvg < prevAvg ? current : prev;
    });

    const bestGD = teamsWithMatches.reduce((prev, current) => {
      const currentGD = ((current.goalsFor || 0) - (current.goalsAgainst || 0)) / (current.matchesPlayed || 1);
      const prevGD = ((prev.goalsFor || 0) - (prev.goalsAgainst || 0)) / (prev.matchesPlayed || 1);
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
          <div className="stats-card">
            <div className="flex items-center mb-3">
              <Crown className="w-5 h-5 text-gold-main mr-2" />
              <span className="stats-label">Qualifying</span>
            </div>
            <div className="space-y-2">
              {stats.qualifying.map((team, index) => (
                <div key={team.player || index} className="flex items-center text-sm">
                  <span className="w-6 h-6 rounded-full bg-gold-main/20 text-gold-main flex items-center justify-center text-xs mr-2">
                    {index + 1}
                  </span>
                  <span className="truncate">{team.playerName || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </div>

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
  const { competitionId } = useParams();
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
                const position = index + 1;

                return (
                  <tr key={standing.player || `standing-${index}`}
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
                          <Link
                            to={`/player-fixtures/${competitionId}/${standing.player}`}
                            className="text-white truncate hover:text-gold-main transition-colors duration-200 flex items-center group/player"
                          >
                            <span className="truncate">{standing.playerName}</span>
                            <svg
                              className="w-4 h-4 ml-1 opacity-0 group-hover/player:opacity-100 transition-opacity duration-200"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
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

export default function Standings() {
  const { competitionId } = useParams();
  const [state, setState] = useState({
    standingsData: null,
    loading: true,
    error: null,
    competitionName: 'Competition',
    competitionType: 'LEAGUE',
    activeGroup: 'all'   // ← default to 'all' so GROUP_STAGE shows immediately
  });
  const [isDownloading, setIsDownloading] = useState(false);

  // Sort standings properly with goal difference
  const sortStandings = (standings) => {
    return [...standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aGD = (a.goalsFor || 0) - (a.goalsAgainst || 0);
      const bGD = (b.goalsFor || 0) - (b.goalsAgainst || 0);
      if (bGD !== aGD) return bGD - aGD;
      return (b.goalsFor || 0) - (a.goalsFor || 0);
    });
  };

  // Memoized data processing
  const processedGroupData = useMemo(() => {
    if (state.competitionType !== 'GROUP_STAGE' || !state.standingsData) {
      return { groups: [], groupData: {} };
    }

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
        sortedGroupData[groupName] = sortStandings(groupData[groupName]);
      }
    });

    return { groups, groupData: sortedGroupData };
  }, [state.standingsData, state.competitionType]);

  // Data fetching
  const fetchStandings = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data } = await standingService.getStandings(competitionId);
      console.log('data-', data);

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
        // ✅ FIX: always default to 'all' so the table renders on first load
        updates.activeGroup = 'all';
      } else {
        updates.competitionType = 'LEAGUE';
        updates.standingsData = sortStandings(data?.standings || data || []);
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
  };

  useEffect(() => {
    fetchStandings();
  }, [competitionId]);

  // ── Download handler ───────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      await downloadStandingsAsImage({
        competitionName: state.competitionName,
        competitionType: state.competitionType,
        groupData: processedGroupData.groupData,
        leagueStandings: Array.isArray(state.standingsData) ? state.standingsData : [],
        activeGroup: state.activeGroup,
      });
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      // Keep spinner briefly so user sees feedback
      setTimeout(() => setIsDownloading(false), 600);
    }
  }, [state, processedGroupData]);

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
    if (state.competitionType === 'LEAGUE') return state.standingsData;
    if (state.activeGroup === 'all') return null;
    return processedGroupData.groupData[state.activeGroup] || [];
  };

  const currentGroupData = getCurrentGroupData();

  // Check if there's any data to download
  const hasData = state.competitionType === 'LEAGUE'
    ? Array.isArray(state.standingsData) && state.standingsData.length > 0
    : processedGroupData.groups.length > 0;

  return (
    <div className="min-h-screen modern-bg text-white overflow-x-hidden">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header className="fixed top-0 left-0 w-full z-50 p-4 flex items-center justify-between">
        <Link to="/view" className="inline-flex items-center space-x-2 text-purple-300 hover:text-gold-main transition-colors duration-300 group glass-header-light p-2 rounded-lg">
          <ChevronLeft size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="font-medium text-sm">Back to Dashboard</span>
        </Link>

        {/* Download button in header — always visible */}
        {hasData && (
          <DownloadButton onClick={handleDownload} isDownloading={isDownloading} />
        )}
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-20 md:py-28 relative z-10 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="modern-hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            {state.competitionName} <span className="modern-brand-accent">Standings</span>
          </h1>
          <div className="inline-flex items-center space-x-2 mt-3 glass-header-light px-3 py-2 rounded-full">
            {state.competitionType === 'GROUP_STAGE' ?
              <Swords size={16} className="text-gold-main/80" /> :
              <BarChart3 size={16} className="text-gold-main/80" />
            }
            <span className="font-medium text-purple-light text-sm tracking-wide">
              {state.competitionType.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Group navigation */}
        {state.competitionType === 'GROUP_STAGE' && processedGroupData.groups.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {/* 'All Groups' button first */}
              {processedGroupData.groups.length > 1 && (
                <button
                  key="all"
                  onClick={() => setState(prev => ({ ...prev, activeGroup: 'all' }))}
                  className={`group-nav-button ${state.activeGroup === 'all' ? 'active' : ''}`}>
                  All Groups
                </button>
              )}
              {processedGroupData.groups.map((groupName) => (
                <button
                  key={groupName}
                  onClick={() => setState(prev => ({ ...prev, activeGroup: groupName }))}
                  className={`group-nav-button ${state.activeGroup === groupName ? 'active' : ''}`}>
                  {groupName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Section */}
        {state.competitionType === 'LEAGUE' && currentGroupData && (
          <StatsSection standings={currentGroupData} />
        )}

        {state.competitionType === 'GROUP_STAGE' && state.activeGroup && state.activeGroup !== 'all' && currentGroupData && (
          <StatsSection
            standings={currentGroupData}
            groupName={state.activeGroup}
          />
        )}

        {/* Standings Content */}
        {state.competitionType === 'LEAGUE' ? (
          <StandingsTable standings={currentGroupData} />
        ) : state.competitionType === 'GROUP_STAGE' && state.standingsData ? (
          state.activeGroup === 'all' ? (
            <div className="space-y-10">
              {processedGroupData.groups.map((groupName) => (
                <div key={groupName}>
                  <StatsSection
                    standings={processedGroupData.groupData[groupName] || []}
                    groupName={groupName}
                  />
                  <StandingsTable
                    standings={processedGroupData.groupData[groupName] || []}
                    title={groupName}
                    showGroupHeader={true}
                  />
                </div>
              ))}
            </div>
          ) : state.activeGroup && currentGroupData ? (
            <StandingsTable
              standings={currentGroupData}
              title={state.activeGroup}
              showGroupHeader={true}
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

        {/* Floating download button (bottom-right, secondary) */}
        {hasData && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="fab-download"
              title="Download standings as image"
            >
              {isDownloading
                ? <Loader className="w-5 h-5 animate-spin" />
                : <Download className="w-5 h-5" />
              }
            </button>
          </div>
        )}
      </main>

      {/* Global Styles */}
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

                /* ── Download button (header) ── */
                .download-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.45rem 1rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 223, 128, 0.35);
                    background: rgba(10, 5, 16, 0.65);
                    backdrop-filter: blur(12px);
                    color: var(--gold-main);
                    cursor: pointer;
                    transition: all 0.25s ease;
                    white-space: nowrap;
                }

                .download-btn:hover:not(:disabled) {
                    background: rgba(255, 223, 128, 0.12);
                    border-color: var(--gold-main);
                    box-shadow: 0 0 16px rgba(255, 223, 128, 0.18);
                    transform: translateY(-1px);
                }

                .download-btn.downloading,
                .download-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* ── FAB download (floating) ── */
                .fab-download {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: 1px solid rgba(255, 223, 128, 0.3);
                    background: rgba(10, 5, 16, 0.85);
                    backdrop-filter: blur(12px);
                    color: var(--gold-main);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                }

                .fab-download:hover:not(:disabled) {
                    background: rgba(255, 223, 128, 0.15);
                    border-color: var(--gold-main);
                    box-shadow: 0 0 20px rgba(255, 223, 128, 0.25), 0 4px 20px rgba(0,0,0,0.4);
                    transform: scale(1.08);
                }

                .fab-download:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
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

                    .download-btn span {
                        display: none;
                    }

                    .download-btn {
                        padding: 0.45rem 0.6rem;
                        gap: 0;
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