import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '@azure/msal-react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BrowseTools from './pages/BrowseTools';
import ToolDetail from './pages/ToolDetail';
import MyTools from './pages/MyTools';
import AddTool from './pages/AddTool';
import MyReservations from './pages/MyReservations';
import ReservationDetail from './pages/ReservationDetail';
import Circles from './pages/Circles';
import CircleDetail from './pages/CircleDetail';
import CreateCircle from './pages/CreateCircle';
import JoinCircle from './pages/JoinCircle';
import Profile from './pages/Profile';
import Login from './pages/Login';

const isE2ETest = import.meta.env.VITE_E2E_TEST === 'true';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();

  // Bypass auth check in E2E test mode
  if (isE2ETest || isAuthenticated) {
    return <>{children}</>;
  }

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="browse" element={<BrowseTools />} />
        <Route path="tools/:id" element={<ToolDetail />} />
        <Route path="my-tools" element={<MyTools />} />
        <Route path="my-tools/add" element={<AddTool />} />
        <Route path="my-tools/edit/:id" element={<AddTool />} />
        <Route path="reservations" element={<MyReservations />} />
        <Route path="reservations/:id" element={<ReservationDetail />} />
        <Route path="circles" element={<Circles />} />
        <Route path="circles/create" element={<CreateCircle />} />
        <Route path="circles/join" element={<JoinCircle />} />
        <Route path="circles/:id" element={<CircleDetail />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
