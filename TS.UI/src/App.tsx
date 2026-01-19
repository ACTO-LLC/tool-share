import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '@azure/msal-react';
import { Box, CircularProgress } from '@mui/material';
import Layout from './components/Layout';

// Lazy-loaded page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BrowseTools = lazy(() => import('./pages/BrowseTools'));
const ToolDetail = lazy(() => import('./pages/ToolDetail'));
const MyTools = lazy(() => import('./pages/MyTools'));
const AddTool = lazy(() => import('./pages/AddTool'));
const MyReservations = lazy(() => import('./pages/MyReservations'));
const ReservationDetail = lazy(() => import('./pages/ReservationDetail'));
const Circles = lazy(() => import('./pages/Circles'));
const CircleDetail = lazy(() => import('./pages/CircleDetail'));
const CreateCircle = lazy(() => import('./pages/CreateCircle'));
const JoinCircle = lazy(() => import('./pages/JoinCircle'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Login = lazy(() => import('./pages/Login'));

// Loading fallback component for Suspense
function PageLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

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
    <Suspense fallback={<PageLoader />}>
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
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
