import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import fixtureService from '../services/fixtureService';

export default function CompetitionResults() {
  const { competitionId } = useParams();
  const [fixtures, setFixtures] = useState([]);
  const [editingFixture, setEditingFixture] = useState(null);
  const [scores, setScores] = useState({ home: 0, away: 0 });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const fetchFixtures = async () => {
      const { data } = await fixtureService.getCompetitionFixtures(competitionId);
      setFixtures(data);
    };
    fetchFixtures();
  }, [competitionId]);
const handleResultSubmit = async (fixtureId) => {
  try {
    setError(null);
    setSubmitting(true);

    const response = await fixtureService.updateFixtureResult(fixtureId, {
      homeScore: scores.home,
      awayScore: scores.away
    });

    // Refresh data
    const { data } = await fixtureService.getCompetitionFixtures(competitionId);
    setFixtures(data);
    setEditingFixture(null);

  } catch (err) {
    console.error('Update failed:', {
      error: err,
      response: err.response?.data
    });
    
    setError(
      err.response?.data?.error || 
      err.response?.data?.message || 
      'Failed to save result. Please try again.'
    );
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Match Results</h1>
      
      <div className="space-y-4">
        {fixtures.map(fixture => (
          <div key={fixture._id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{fixture.homePlayer.name}</span>
              <span className="mx-4">vs</span>
              <span className="font-medium">{fixture.awayPlayer.name}</span>
            </div>
            
            {fixture.status === 'completed' ? (
              <div className="text-center py-2 bg-gray-100 rounded">
                <span className="font-bold">{fixture.homeScore}</span>
                <span className="mx-2">-</span>
                <span className="font-bold">{fixture.awayScore}</span>
                <span className="ml-4 text-sm capitalize">
                  ({fixture.result})
                </span>
              </div>
            ) : editingFixture === fixture._id ? (
              <div className="flex items-center justify-center space-x-4 py-2">
                <input
                  type="number"
                  value={scores.home}
                  onChange={(e) => setScores({...scores, home: e.target.value})}
                  className="w-16 text-center border rounded p-1"
                />
                <span>:</span>
                <input
                  type="number"
                  value={scores.away}
                  onChange={(e) => setScores({...scores, away: e.target.value})}
                  className="w-16 text-center border rounded p-1"
                />
                <button
                  onClick={() => handleResultSubmit(fixture._id)}
                  className="ml-4 bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Submit
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingFixture(fixture._id);
                  setScores({ home: 0, away: 0 });
                }}
                className="w-full bg-green-500 text-white py-1 rounded"
              >
                Add Result
              </button>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              {new Date(fixture.matchDate).toLocaleDateString()} • {fixture.round}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}