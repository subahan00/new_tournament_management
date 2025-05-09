import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import the pages
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import PlayerManagement from './pages/PlayerManagement';
import CompetitionManagement from './pages/CompetitionManagement';
import FixtureManagement from './pages/CreateFixtures';
import LiveStandings from './pages/LiveStandings';
import ResultsEntry from './pages/ResultsEntry';
import WinnersArchive from './pages/WinnersArchive';
import Login from './pages/Login';
import Competitions from './pages/PublicCompetitions';
import CreateCompetition from './pages/CompetitionManagement'; // <-- Import the new page
  import ManageCompetitions from './pages/ManageCompetitions';
import ManageFixtures from './pages/ManageFixtures'; // <-- Import the new page
import CompetitionFixtures from './pages/CompetitionFixtures'; // <-- Import the new page
// <-- Import the new page
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/players" element={<PlayerManagement />} />
        <Route path="/competitions" element={<Competitions />} />

        <Route path="/fixtures" element={<FixtureManagement />} />
        <Route path="/standings" element={<LiveStandings />} />
        <Route path="/results" element={<ResultsEntry />} />
        <Route path="/winners" element={<WinnersArchive />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/create-competition" element={<CreateCompetition />} /> {/* <-- Add this */}
        <Route path="/admin/manage-competitions" element ={<ManageCompetitions/>}/>
        <Route path="/admin/create-fixture" element={<FixtureManagement />} />
      <Route path="/admin/manage-fixtures" element={<ManageFixtures />} />
      <Route path="/fixtures/:competitionId" element={<CompetitionFixtures />} /> 
        {/* Add any other routes you need */}
      </Routes>
    </Router>
  );
};

export default App;