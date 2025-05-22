import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CompetitionCard = ({ competition }) => {
  const isKnockout = competition.type === 'KO_REGULAR';
  const isLeague = competition.type === 'LEAGUE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.03 }}
      className="relative bg-black/50 border-2 border-yellow-500 rounded-xl overflow-hidden shadow-lg hover:shadow-yellow-500/30 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/40 to-black/50 pointer-events-none z-0"></div>

      <div className="relative z-10 p-6">
        <h3 className="text-2xl font-bold text-yellow-400 mb-3 font-serif border-b border-yellow-500/30 pb-2">
          {competition.name}
        </h3>

        <div className="flex items-center mb-4 gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isKnockout ? 'bg-red-900/50 text-yellow-300' : 
            isLeague ? 'bg-blue-900/50 text-yellow-300' : 'bg-purple-900/50 text-yellow-300'
          }`}>
            {competition.type.replace('_', ' ')}
          </span>
          <span className="text-yellow-500/80 text-sm">
            {new Date(competition.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Tournament Information Section */}
        <div className="mb-6 space-y-4">
          {isKnockout && (
            <div className="space-y-2">
              <div className="flex items-center text-yellow-300 gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <path d="M15 9H9v6h6V9z"/>
                </svg>
                <h4 className="font-semibold">Knockout Tournament Rules</h4>
              </div>
              <ul className="list-disc pl-5 text-yellow-200/90 text-sm space-y-1">
                <li>Single elimination format</li>
                <li>Matches decided in single legs</li>
                <li>Draws resolved with extra time & penalties</li>
                <li>Progress to next round on victory</li>
              </ul>
            </div>
          )}

          {isLeague && (
            <div className="space-y-2">
              <div className="flex items-center text-yellow-300 gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                  <path d="M7 7h4v4H7zm6 0h4v4h-4zm-6 6h4v4H7zm6 0h4v4h-4z"/>
                </svg>
                <h4 className="font-semibold">League Tournament Rules</h4>
              </div>
              <ul className="list-disc pl-5 text-yellow-200/90 text-sm space-y-1">
                <li>Round-robin format</li>
                <li>3 points for a win, 1 for draw</li>
                <li>Top teams qualify for finals</li>
                <li>Tiebreakers: Goal difference → Goals scored</li>
              </ul>
            </div>
          )}
        </div>

        {/* Stats & Navigation Section */}
        <div className="flex justify-between items-center border-t border-yellow-500/20 pt-4">
          <div className="text-yellow-300/80 text-sm flex items-center gap-4">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
              <span>{competition.players?.length || 0} Teams</span>
            </div>
            
            {isKnockout && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <path d="M15 9H9v6h6V9z"/>
                </svg>
                <span>{competition.matchesCompleted || 0} Matches Played</span>
              </div>
            )}
          </div>

          <Link 
            to={isKnockout ? `/manage-ko/${competition._id}` : `/standings/${competition._id}`}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isKnockout 
                ? 'bg-yellow-600/80 text-black hover:bg-yellow-500'
                : 'bg-blue-600/80 text-white hover:bg-blue-500'
            }`}
          >
            {isKnockout ? 'View Bracket' : 'View Standings'}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default CompetitionCard;