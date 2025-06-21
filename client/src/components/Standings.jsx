import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import standingService from '../services/standingService';
import io from 'socket.io-client';
import {
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

// Initialize Socket.IO connection with reconnection logic
const socket = io(`${process.env.REACT_APP_BACKEND_URL}`, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default function Standings() {
  // Extract competitionId from URL parameters
  const { competitionId } = useParams();

  // State variables for standings data, loading status, error messages, and potential general messages
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [competitionName, setCompetitionName] = useState('Competition'); // State for competition name

  // Ensure standings is always an array for safe mapping
  const safeStandings = Array.isArray(standings) ? standings : [];
  // useEffect hook for data fetching and real-time updates
  useEffect(() => {
    // Function to fetch standings data from the API
    const fetchStandings = async () => {
      try {
        const { data } = await standingService.getStandings(competitionId);
        // Assuming the API also returns competition details, including name
        if (data && data.standings) {
          setStandings(Array.isArray(data.standings) ? data.standings : []);
          setCompetitionName(data.competitionName || 'Competition'); // Set competition name
        } else {
          setStandings(Array.isArray(data) ? data : []); // Fallback if data structure is different
          setCompetitionName('League'); // Default name if not provided
        }
      } catch (err) {
        console.error('Failed to load standings:', err);
        setError('Failed to load standings data. Please try again.');
        setStandings([]); // Clear standings on error
      } finally {
        setLoading(false); // Set loading to false regardless of success or failure
      }
    };

    fetchStandings(); // Initial fetch

    // Socket.IO event handler for real-time standings updates
    const handleStandingsUpdate = (update) => {
      if (update.competitionId === competitionId) {
        setStandings(prev => Array.isArray(update.standings) ? update.standings : prev);
      }
    };

    // Socket.IO event handler for connection errors
    const handleConnectError = (err) => {
      console.error('Socket connection error:', err);
      setError('Real-time updates are currently unavailable.');
    };

    // Subscribe to socket events
    socket.on('standings_update', handleStandingsUpdate);
    socket.on('connect_error', handleConnectError);

    // Cleanup function: unsubscribe from socket events on component unmount
    return () => {
      socket.off('standings_update', handleStandingsUpdate);
      socket.off('connect_error', handleConnectError);
    };
  }, [competitionId]); // Re-run effect if competitionId changes

  // Loading state UI
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-yellow-400 text-xl">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-semibold text-2xl">Loading Premium Standings...</span>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="p-6 bg-black min-h-screen flex flex-col items-center justify-center text-center">
        <div className="text-red-500 text-2xl mb-6">
          <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-4 text-red-600" />
          <p className="font-bold">Oops! Something went wrong.</p>
          <p className="mt-2 text-lg">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black px-6 py-3 rounded-lg font-bold text-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Main Standings UI
  return (
    <div className="p-6 bg-black min-h-screen text-amber-500 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Title and Export Button Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-amber-700 pb-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 sm:mb-0 bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-lg text-center sm:text-left">
            {competitionName.toUpperCase()} STANDINGS
          </h1> 
          
        </div>

        {/* Standings Table Section */}
        <div className="overflow-x-auto rounded-xl shadow-2xl border border-amber-600/40 bg-gradient-to-br from-zinc-950 to-zinc-800">
          <table className="min-w-full text-base lg:text-lg">
            <thead className="bg-amber-900/50 uppercase text-amber-200">
              <tr>
                {['#', 'Player', 'Played', 'Wins', 'Draws', 'Losses', 'GF', 'GA', 'GD', 'Points'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-5 text-left font-bold tracking-wider border-b border-amber-800"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-amber-900/60">
              {safeStandings.map((standing, index) => {
                const goalDifference = (standing.goalsFor || 0) - (standing.goalsAgainst || 0);
                return (
                  <tr
                    key={standing._id || index}
                    className="hover:bg-amber-900/30 transition-all duration-200 even:bg-zinc-900/40 text-amber-100"
                  >
                    <td className="px-6 py-4 font-medium text-amber-300">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {standing.playerName ? (
                        standing.playerName.startsWith('Deleted-') ? (
                          <span className="text-red-400/90 flex items-center font-semibold">
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-500" />
                            {standing.playerName.replace('Deleted-', '')}
                          </span>
                        ) : (
                          <span className="text-amber-100 font-semibold">{standing.playerName}</span>
                        )
                      ) : (
                        <span className="text-amber-500 flex items-center italic">
                          <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                          Unknown Player
                        </span>
                      )}
                    </td>
                    {['matchesPlayed', 'wins', 'draws', 'losses', 'goalsFor', 'goalsAgainst'].map((key) => (
                      <td
                        key={key}
                        className="px-6 py-4 text-center font-medium"
                      >
                        {standing[key] || 0}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center font-bold text-amber-300">
                      {goalDifference}
                    </td>
                    <td className="px-6 py-4 text-center font-extrabold text-amber-200 text-xl">
                      {standing.points || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* No standings data message */}
          {safeStandings.length === 0 && (
            <div className="p-10 text-center text-amber-600/80 text-xl font-medium">
              No standings available yet. Start playing matches to see the rankings!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}