import React, { useState } from 'react';
import axios from 'axios';

const AdminWinnerForm = () => {
  const [formData, setFormData] = useState({
    competitionName: '',
    winnerName: '',
    season: '',
    date: new Date().toISOString().split('T')[0],
    prize: '',
    runnerUp: '',
    description: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.competitionName || !formData.winnerName || !formData.season || !formData.prize) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/result`, formData);
      setSuccess('Winner added successfully!');
      setFormData({
        competitionName: '',
        winnerName: '',
        season: '',
        date: new Date().toISOString().split('T')[0],
        prize: '',
        runnerUp: '',
        description: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800/50 border border-gold-700/30 rounded-xl p-6">
          <h2 className="text-3xl font-bold text-gold-300 mb-6">Add Competition Winner</h2>
          
          {error && <div className="mb-4 p-3 bg-red-900/30 text-red-400 rounded-lg">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-900/30 text-green-400 rounded-lg">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gold-400 mb-2">Competition Name *</label>
                <input
                  type="text"
                  name="competitionName"
                  value={formData.competitionName}
                  onChange={handleChange}
                  className="w-full bg-gray-700/30 border border-gold-700/30 rounded-lg px-4 py-2 text-gold-200 focus:border-gold-500/50 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gold-400 mb-2">Winner Name *</label>
                <input
                  type="text"
                  name="winnerName"
                  value={formData.winnerName}
                  onChange={handleChange}
                  className="w-full bg-gray-700/30 border border-gold-700/30 rounded-lg px-4 py-2 text-gold-200 focus:border-gold-500/50 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gold-400 mb-2">Season *</label>
                <input
                  type="text"
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  className="w-full bg-gray-700/30 border border-gold-700/30 rounded-lg px-4 py-2 text-gold-200 focus:border-gold-500/50 focus:outline-none"
                  placeholder="e.g., 2023-2024"
                  required
                />
              </div>

              <div>
                <label className="block text-gold-400 mb-2">Prize (USD) *</label>
                <input
                  type="number"
                  name="prize"
                  value={formData.prize}
                  onChange={handleChange}
                  className="w-full bg-gray-700/30 border border-gold-700/30 rounded-lg px-4 py-2 text-gold-200 focus:border-gold-500/50 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gold-400 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full bg-gray-700/30 border border-gold-700/30 rounded-lg px-4 py-2 text-gold-200 focus:border-gold-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gold-400 mb-2">Runner Up</label>
                <input
                  type="text"
                  name="runnerUp"
                  value={formData.runnerUp}
                  onChange={handleChange}
                  className="w-full bg-gray-700/30 border border-gold-700/30 rounded-lg px-4 py-2 text-gold-200 focus:border-gold-500/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gold-400 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-gray-700/30 border border-gold-700/30 rounded-lg px-4 py-2 text-gold-200 focus:border-gold-500/50 focus:outline-none h-32"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gold-700/30 hover:bg-gold-600/50 text-gold-200 py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Add Winner
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminWinnerForm;