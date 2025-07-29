import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Import all pages
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CreatePlayerForm from './pages/CreatePlayerForm';
import FixtureManagement from './pages/CreateFixtures';
import ResultsEntry from './pages/ResultsEntry';
// import WinnersArchive from './pages/WinnersArchive';
import Login from './pages/Login';
import Competitions from './pages/PublicCompetitions';
import CreateCompetition from './pages/CompetitionManagement';
import ManageCompetitions from './pages/ManageCompetitions';
import ManageFixtures from './pages/ManageFixtures';
import CompetitionFixtures from './pages/CompetitionFixtures';
import CompetitionResults from './pages/CompetitionResults';
import ManageStandings from './components/ManageStandings';
import Standings from './components/Standings';
import ApplicantList from './pages/ApplicationList';
import ManageKoResults from './pages/ManageKoResults';
import ResultKo from './pages/ResultKo';
import PublicKo from './pages/PublicKo';
import PublicManageKo from './pages/PublicManageKo';
import UpdatePlayerName from './pages/updateCompetition';
import AdminWinnerForm from './pages/AdminWinnerForm';
import HallOfFame from './pages/HallOfFame';
import ViewPage from './pages/ViewPage';
import AdminUploadPage from './pages/AdminUploadPage';
import PublicWallpaperPage from './pages/PublicWallpaperPage';
import { AuthProvider } from './contexts/AuthContext';
import DeleteWallpaper from './pages/deleteWallpaper';
import TrophyCabinet from './pages/TrophyCabinet';
import TrophyManagement from './pages/TrophyManagement';
import ScrollToTop from './components/ScrollToTop';
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/hall-of-fame" element={<HallOfFame />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/fixtures" element={<FixtureManagement />} />
          <Route path="/fixtures/:competitionId" element={<CompetitionFixtures />} />
          <Route path="/standings" element={<ManageStandings />} />
          <Route path="/standings/:competitionId" element={<Standings />} />
          <Route path="/public-ko" element={<PublicKo />} />
          <Route path="/wallpaper" element={<PublicWallpaperPage />} />
          <Route path="/view" element={<ViewPage />} />
          <Route path="/manage-ko/:competitionId" element={<PublicManageKo />} />
          <Route path="/delete-wallpaper" element={<DeleteWallpaper />} />
          <Route path="/trophy-cabinet" element={<TrophyCabinet />} />
          {/* Admin protected routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/trophy-management" 
            element={
              <ProtectedRoute adminOnly>
                <TrophyManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/manage-players" 
            element={
              <ProtectedRoute adminOnly>
                <CreatePlayerForm />
              </ProtectedRoute>
            } 
          />
          
          {/* Mapped admin routes */}
          {[
            { path: "/admin/create-competition", component: <CreateCompetition /> },
            { path: "/admin/manage-competitions", component: <ManageCompetitions /> },
            { path: "/admin/create-fixture", component: <FixtureManagement /> },
            { path: "/admin/manage-fixtures", component: <ManageFixtures /> },
            { path: "/admin/results/:competitionId", component: <CompetitionResults /> },
            { path: "/admin/manage-kos", component: <ManageKoResults /> },
            { path: "/admin/manage-kos/:competitionId", component: <ResultKo /> },
            { path: "/upload-wallpaper", component: <AdminUploadPage /> },
            { path: "/admin/applicant-list", component: <ApplicantList /> },
            { path: "/post-winner", component: <AdminWinnerForm /> },
            { path: "/results", component: <ResultsEntry /> },
            { path: "/admin/update-competition", component: <UpdatePlayerName /> }
          ].map((route, index) => (
            <Route 
              key={index}
              path={route.path}
              element={
                <ProtectedRoute adminOnly>
                  {route.component}
                </ProtectedRoute>
              }
            />
          ))}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
