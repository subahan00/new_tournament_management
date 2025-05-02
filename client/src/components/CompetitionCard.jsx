import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CompetitionCard = ({ competition }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.03 }}
      className="relative bg-black/50 border-2 border-yellow-500 rounded-xl overflow-hidden shadow-lg hover:shadow-yellow-500/30 transition-all duration-300"
    >
      {/* Diagonal translucent gradient overlay with more transparency */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/40 to-black/50 pointer-events-none z-0"></div>

      <div className="relative z-10 p-6">
        <h3 className="text-2xl font-bold text-yellow-400 mb-3 font-serif">
          {competition.name}
        </h3>

        <div className="flex items-center mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            competition.type === 'knockout' ? 'bg-red-900 text-yellow-300' : 
            competition.type === 'league' ? 'bg-blue-900 text-yellow-300' : 'bg-purple-900 text-yellow-300'
          }`}>
            {competition.type.toUpperCase()}
          </span>
        </div>

        <div className="flex justify-between items-center mb-6 text-yellow-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            <span>{competition.players?.length || 0} Players</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
            </svg>
            <span>{new Date(competition.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <Link 
          to={`/competitions/${competition._id}`}
          className="block w-full bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-700 hover:to-yellow-900 text-black font-bold py-2 px-4 rounded-lg text-center transition-all duration-300 transform hover:scale-105"
        >
          View Tournament
        </Link>
      </div>
    </motion.div>
  );
};

export default CompetitionCard;
