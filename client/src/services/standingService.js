import axios from 'axios';
const API = 'http://localhost:5000/api';

export default {
  getOngoingCompetitions: () => axios.get(`${API}/standings/ongoing`),
  getStandings: (competitionId) => axios.get(`${API}/standings/${competitionId}`)
};