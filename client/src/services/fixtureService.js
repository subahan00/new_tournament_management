import axios from 'axios';
const API = 'http://localhost:5000/api';

export default {
  // Fixture Creation
  createFixtures: (competitionId) => {
    return axios.post(`${API}/fixtures/create/${competitionId}`);
  },

  // Competition Fetching
  getOngoingCompetitions: () => {
    return axios.get(`${API}/fixtures/ongoing`);
  },

  getUpcomingLeagueCompetitions: () => {
    return axios.get(`${API}/competitions/league/upcoming`);
  },

  // Fixture Management
  getCompetitionFixtures: (competitionId) => {
    return axios.get(`${API}/fixtures/${competitionId}/fixtures`);
  },

  updateFixture: (fixtureId, updateData) => {
    return axios.patch(`${API}/fixtures/${fixtureId}`, updateData);
  },
  updateFixtureResult: (fixtureId, { homeScore, awayScore }) => {
    return axios.patch(`${API}/fixtures/${fixtureId}/result`, {
      homeScore: Number(homeScore),
      awayScore: Number(awayScore)
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },
  // Advanced Methods
  generateRoundRobinFixtures: (competitionId) => {
    return axios.post(`${API}/fixtures/generate/round-robin/${competitionId}`);
  },

  deleteFixtures: (competitionId) => {
    return axios.delete(`${API}/fixtures/${competitionId}`);
  }
};