
import React, { useState, useEffect } from 'react';
import { getWinners, handleApiError } from '../services/winnerService';
import { Trophy, User, Medal, Star, ChevronRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

const TrophyCabinet = () => {
  const [winners, setWinners] = useState([]);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getWinners();
      setWinners(response.data || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredWinners = winners.filter(winner =>
    winner.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedWinners = filteredWinners.sort((a, b) => {
    return b.totalTrophies - a.totalTrophies || a.name.localeCompare(b.name);
  });

  const handleWinnerClick = (winner) => {
    setSelectedWinner(winner);
  };

  const handleBackClick = () => {
    setSelectedWinner(null);
  };

  const getTrophyIcon = (timesWon) => {
    if (timesWon >= 5) return <Star className="w-5 h-5 text-yellow-500" />;
    if (timesWon >= 3) return <Medal className="w-5 h-5 text-orange-500" />;
    return <Trophy className="w-5 h-5 text-gray-600" />;
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Medal className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-orange-600" />;
    return <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-600">
      {index + 1}
    </div>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading trophy cabinet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchWinners}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {!selectedWinner ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Trophy className="w-12 h-12 text-yellow-500 mr-3" />
                <h1 className="text-4xl font-bold text-gray-800">Trophy Cabinet</h1>
              </div>
              <p className="text-gray-600 text-lg">Celebrating our champions and their achievements</p>
            </div>

            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Winners List */}
            {sortedWinners.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2">
                  {searchTerm ? 'No players found' : 'No champions yet'}
                </h3>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search terms' : 'Be the first to add a champion!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedWinners.map((winner, index) => (
                  <div
                    key={winner._id}
                    onClick={() => handleWinnerClick(winner)}
                    className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {getRankIcon(index)}
                        <h3 className="text-xl font-semibold text-gray-800 ml-3">{winner.name}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
                        <span className="text-2xl font-bold text-blue-600">{winner.totalTrophies}</span>
                        <span className="text-gray-500 ml-1">
                          {winner.totalTrophies === 1 ? 'trophy' : 'trophies'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{winner.trophies.length} competition{winner.trophies.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Selected Winner Detail View */
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button
                onClick={handleBackClick}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Trophy Cabinet
              </button>
              
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{selectedWinner.name}</h1>
                  <div className="flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                    <span className="text-3xl font-bold text-blue-600">{selectedWinner.totalTrophies}</span>
                    <span className="text-gray-500 ml-2">
                      {selectedWinner.totalTrophies === 1 ? 'trophy' : 'trophies'} total
                    </span>
                  </div>
                </div>

                {selectedWinner.trophies.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No trophies yet</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Competitions Won</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedWinner.trophies
                        .sort((a, b) => b.timesWon - a.timesWon || a.competition.localeCompare(b.competition))
                        .map((trophy, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {getTrophyIcon(trophy.timesWon)}
                                <div className="ml-3">
                                  <h3 className="font-semibold text-gray-800">{trophy.competition}</h3>
                                  <p className="text-sm text-gray-600">
                                    {trophy.timesWon} {trophy.timesWon === 1 ? 'time' : 'times'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-blue-600">{trophy.timesWon}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrophyCabinet;
