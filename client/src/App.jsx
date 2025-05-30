import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import the pages
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CreatePlayerForm from './pages/CreatePlayerForm';

import FixtureManagement from './pages/CreateFixtures';
import ResultsEntry from './pages/ResultsEntry';
import WinnersArchive from './pages/WinnersArchive';
import Login from './pages/Login';
import Competitions from './pages/PublicCompetitions';
import CreateCompetition from './pages/CompetitionManagement'; // <-- Import the new page
  import ManageCompetitions from './pages/ManageCompetitions';
import ManageFixtures from './pages/ManageFixtures'; // <-- Import the new page
import CompetitionFixtures from './pages/CompetitionFixtures'; // <-- Import the new page
// <-- Import the new page
import CompetitionResults from './pages/CompetitionResults'; 
  import ManageStandings from './components/ManageStandings';
  import Standings from './components/Standings';// <-- Import the new page
import ApplicantList from './pages/ApplicationList';
import ManageKoResults from './pages/ManageKoResults';
import ResultKo from './pages/ResultKo';
  import PublicKo from './pages/PublicKo';
  import PublicManageKo from './pages/PublicManageKo';
  import UpdatePlayerName from './pages/updateCompetition';
  import AdminWinnerForm from './pages/AdminWinnerForm';
  import HallOfFame from './pages/HallOfFame';
  const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/applicant-list" element={<ApplicantList />} />
        <Route path="/admin/manage-players" element={<CreatePlayerForm />} />
        <Route path="/competitions" element={<Competitions />} />
      <Route path='/admin/update-competition' element={<UpdatePlayerName/>}/>
        <Route path="/fixtures" element={<FixtureManagement />} />
        <Route path ="/post-winner" element={<AdminWinnerForm/>}/>
        <Route path="/results" element={<ResultsEntry />} />
        <Route path="/winners" element={<WinnersArchive />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/create-competition" element={<CreateCompetition />} /> {/* <-- Add this */}
        <Route path="/admin/manage-competitions" element ={<ManageCompetitions/>}/>
      <Route path ="/hall-of-fame" element={<HallOfFame/>}/>
        <Route path="/admin/create-fixture" element={<FixtureManagement />} />
      <Route path="/admin/manage-fixtures" element={<ManageFixtures />} />
      <Route path="/fixtures/:competitionId" element={<CompetitionFixtures />} /> 
      <Route path ="/admin/post-result" element={<ResultsEntry/>}/>
      <Route path="/admin/results/:competitionId" element={<CompetitionResults />} />
        {/* Add any other routes you need */}
         <Route path="/standings" element={<ManageStandings />} />
        <Route path="/standings/:competitionId" element={<Standings />} />
        <Route path="/admin/manage-kos" element={<ManageKoResults />} />
        <Route path="/admin/manage-kos/:competitionId" element={<ResultKo />} />
        <Route path="/public-ko" element={<PublicKo />} />
  <Route path="/manage-ko/:competitionId" element={<PublicManageKo />} />
      </Routes>
    </Router>
  );
};

export default App;