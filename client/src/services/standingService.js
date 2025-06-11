import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default {
  getOngoingCompetitions: () => axios.get(`${API}/standings/ongoing`),
  getStandings: (competitionId) => axios.get(`${API}/standings/${competitionId}`),
  getCompetition: (competitionId) => axios.get(`${API}/competitions/${competitionId}`) // ✅ added
};
