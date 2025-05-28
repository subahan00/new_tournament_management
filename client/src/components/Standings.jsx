import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import standingService from '../services/standingService';
import io from 'socket.io-client';
import {
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
const socket = io(`${process.env.REACT_APP_BACKEND_URL}`, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export default function Standings() {
  const { competitionId } = useParams();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const safeStandings = Array.isArray(standings) ? standings : [];
  const handleDownloadCSV = () => {
    const headers = ['Position,Player,Played,Wins,Draws,Losses,GF,GA,GD,Points'];
    const csvContent = safeStandings
      .map((standing, index) => {
        const playerName = standing.playerName?.replace('Deleted-', '') || 'Unknown Player';
        const gd = standing.goalsFor - standing.goalsAgainst;
        return `${index + 1},"${playerName}",${standing.matchesPlayed || 0},${standing.wins || 0},${standing.draws || 0},${standing.losses || 0},${standing.goalsFor || 0},${standing.goalsAgainst || 0},${gd},${standing.points || 0}`;
      })
      .join('\n');

    const blob = new Blob([headers + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `standings-${competitionId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const { data } = await standingService.getStandings(competitionId);
        setStandings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load standings:', err);
        setError('Failed to load standings data');
        setStandings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();

    const handleStandingsUpdate = (update) => {
      if (update.competitionId === competitionId) {
        setStandings(prev => Array.isArray(update.standings) ? update.standings : prev);
      }
    };

    socket.on('standings_update', handleStandingsUpdate);
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Realtime updates unavailable');
    });

    return () => {
      socket.off('standings_update');
      socket.off('connect_error');
    };
  }, [competitionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-yellow-400 text-xl animate-pulse">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading Premium Standings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-black min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl text-center">
          ⚠️ {error}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-400 transition-colors block mx-auto"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-black min-h-screen text-amber-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-amber-600 pb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
            LEAGUE STANDINGS
          </h1>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center space-x-2 bg-amber-600/30 hover:bg-amber-600/50 transition-all duration-300 px-4 py-2 rounded-lg border border-amber-500/50"
          >
            <ArrowDownTrayIcon className="h-5 w-5 text-amber-400" />
            <span className="text-amber-200 font-semibold">Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl shadow-2xl border border-amber-500/30 bg-gradient-to-br from-black to-zinc-900">
          <table className="min-w-full text-sm">
            <thead className="bg-amber-900/40 uppercase">
              <tr>
                {['#', 'Player', 'Played', 'Wins', 'Draws', 'Losses', 'GF', 'GA', 'GD', 'Points'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-left font-bold text-amber-300/90 tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-amber-800/50">
              {safeStandings.map((standing, index) => {
                const goalDifference = standing.goalsFor - standing.goalsAgainst;
                return (
                  <tr
                    key={standing._id || index}
                    className="hover:bg-amber-900/20 transition-all duration-150 even:bg-zinc-900/30"
                  >
                    <td className="px-6 py-4 font-medium text-amber-400">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {standing.playerName ? (
                        standing.playerName.startsWith('Deleted-') ? (
                          <span className="text-red-400/90 flex items-center">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                            {standing.playerName.replace('Deleted-', '')}
                          </span>
                        ) : (
                          <span className="text-amber-200">{standing.playerName}</span>
                        )
                      ) : (
                        <span className="text-amber-600 flex items-center">
                          <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
                          Unknown Player
                        </span>
                      )}
                    </td>
                    {['matchesPlayed', 'wins', 'draws', 'losses', 'goalsFor', 'goalsAgainst'].map((key) => (
                      <td
                        key={key}
                        className="px-6 py-4 text-amber-200/80 text-center"
                      >
                        {standing[key] || 0}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center font-semibold text-amber-400">
                      {goalDifference}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-amber-300">
                      {standing.points || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {safeStandings.length === 0 && (
            <div className="p-8 text-center text-amber-600/80">
              No standings available yet. Start playing matches to see rankings!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Keep existing loading and error states (styled to match new theme)
}
