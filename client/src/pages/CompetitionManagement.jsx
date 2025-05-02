import React from 'react';

const CompetitionCard = ({ competition }) => {
  if (!competition) return null;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg p-5 hover:scale-105 transition-transform duration-300 ease-in-out">
      <h2 className="text-2xl font-bold mb-2">{competition.name}</h2>
      <p className="text-sm text-gray-200 mb-1">
        <span className="font-semibold">Type:</span> {competition.type}
      </p>
      <p className="text-sm text-gray-200 mb-1">
        <span className="font-semibold">Players:</span> {competition.totalPlayers}
      </p>
      <p className="text-sm text-gray-200 mb-1">
        <span className="font-semibold">Status:</span>{' '}
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs ${
            competition.status === 'upcoming'
              ? 'bg-yellow-500'
              : competition.status === 'ongoing'
              ? 'bg-green-500'
              : 'bg-gray-500'
          }`}
        >
          {competition.status}
        </span>
      </p>
      {competition.createdAt && (
        <p className="text-xs mt-2 text-gray-300 italic">
          Created on: {new Date(competition.createdAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default CompetitionCard;
