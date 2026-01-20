import { Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import EventList from './pages/EventList.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import SeatMapPage from './pages/SeatMapPage.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';

const App = () => {
  return (
    <div className="min-h-screen bg-hero-gradient">
      <Navbar />
      <Routes>
        <Route path="/" element={<EventList />} />
        <Route path="/events/:id" element={<SeatMapPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
