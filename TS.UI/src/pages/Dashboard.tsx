import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Build,
  CalendarMonth,
  Pending,
  Add,
  Search,
  Handyman,
} from '@mui/icons-material';
import { format, parseISO, isAfter } from 'date-fns';
import {
  mockCurrentUser,
  getToolsByOwner,
  getReservationsByBorrower,
  getPendingRequestsForOwner,
} from '../data/mockData';
import { reservationApi, Reservation, DashboardStats } from '../services/api';
import { Tool } from '../types';
import StatCard from '../components/StatCard';
import UpcomingReservations from '../components/UpcomingReservations';
import RecentActivity from '../components/RecentActivity';
import { DashboardSkeleton } from '../components/LoadingSkeletons';

// Check if we should use real API
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    toolsListed: 0,
    activeLoans: 0,
    pendingRequests: 0,
  });
  const [upcomingReservations, setUpcomingReservations] = useState<
    Reservation[]
  >([]);
  const [pendingRequests, setPendingRequests] = useState<Reservation[]>([]);
  const [myTools, setMyTools] = useState<Tool[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      try {
        if (USE_REAL_API) {
          // Fetch from real API
          const [statsData, reservationsData] = await Promise.all([
            reservationApi.getDashboardStats(),
            reservationApi.list({ role: 'all' }),
          ]);

          setStats(statsData);

          // Filter upcoming reservations (where user is borrowing)
          const now = new Date();
          const upcoming = reservationsData.items
            .filter(
              (r) =>
                ['confirmed', 'pending'].includes(r.status) &&
                isAfter(parseISO(r.startDate), now)
            )
            .slice(0, 3);
          setUpcomingReservations(upcoming);

          // Filter pending requests (for user's tools)
          const pending = reservationsData.items
            .filter((r) => r.status === 'pending')
            .slice(0, 3);
          setPendingRequests(pending);

          // TODO: Fetch tools from real API when available
          setMyTools([]);
        } else {
          // Use mock data
          const mockTools = getToolsByOwner(mockCurrentUser.id);
          const mockBorrowedReservations = getReservationsByBorrower(
            mockCurrentUser.id
          );
          const mockPendingRequests = getPendingRequestsForOwner(
            mockCurrentUser.id
          );

          // Filter upcoming reservations (where user is borrowing)
          const upcoming = mockBorrowedReservations
            .filter(
              (r) =>
                ['confirmed', 'pending'].includes(r.status) &&
                isAfter(parseISO(r.startDate), new Date())
            )
            .slice(0, 3);

          // Active loans (tools currently borrowed)
          const activeLoans = mockBorrowedReservations.filter(
            (r) => r.status === 'active'
          ).length;

          setStats({
            toolsListed: mockTools.length,
            activeLoans: activeLoans,
            pendingRequests: mockPendingRequests.length,
          });
          setUpcomingReservations(upcoming);
          setPendingRequests(mockPendingRequests);
          setMyTools(mockTools);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ minHeight: 48 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: { xs: 8, sm: 0 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 2, sm: 3 },
        }}
      >
        <Typography variant={isMobile ? 'h5' : 'h4'}>
          Welcome back, {mockCurrentUser.displayName.split(' ')[0]}!
        </Typography>
      </Box>

      {/* Stats Cards - Always 3 columns */}
      <Grid
        container
        spacing={{ xs: 1, sm: 3 }}
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        <Grid item xs={4}>
          <StatCard
            icon={Build}
            value={stats.toolsListed}
            label="Tools Listed"
            iconColor="primary.main"
            onClick={() => navigate('/my-tools')}
          />
        </Grid>
        <Grid item xs={4}>
          <StatCard
            icon={CalendarMonth}
            value={stats.activeLoans}
            label="Active Loans"
            iconColor="success.main"
            onClick={() => navigate('/reservations')}
          />
        </Grid>
        <Grid item xs={4}>
          <StatCard
            icon={Pending}
            value={stats.pendingRequests}
            label="Pending"
            iconColor="warning.main"
            backgroundColor={
              stats.pendingRequests > 0 ? 'warning.light' : undefined
            }
            onClick={() => navigate('/reservations')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 1.5, sm: 3 }}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Quick Actions
              </Typography>
              <Box
                sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}
              >
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/my-tools/add')}
                  sx={{ minHeight: 48, flex: { xs: 1, sm: 'none' } }}
                >
                  Add Tool
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Search />}
                  onClick={() => navigate('/browse')}
                  sx={{ minHeight: 48, flex: { xs: 1, sm: 'none' } }}
                >
                  Browse Tools
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity (Phase 2 placeholder) */}
        <Grid item xs={12} md={6}>
          <RecentActivity />
        </Grid>

        {/* Pending Requests for My Tools */}
        {pendingRequests.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'warning.light' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  Pending Requests
                </Typography>
                <List disablePadding>
                  {pendingRequests.slice(0, 3).map((reservation, index) => (
                    <Box key={reservation.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{
                          px: 0,
                          py: { xs: 1, sm: 1.5 },
                          cursor: 'pointer',
                          minHeight: 48,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                        tabIndex={0}
                        role="button"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/reservations/${reservation.id}`);
                          }
                        }}
                        onClick={() =>
                          navigate(`/reservations/${reservation.id}`)
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: 'warning.main',
                              width: { xs: 36, sm: 40 },
                              height: { xs: 36, sm: 40 },
                            }}
                          >
                            <Handyman sx={{ fontSize: { xs: 20, sm: 24 } }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={reservation.tool?.name}
                          secondary={
                            isMobile
                              ? `${format(parseISO(reservation.startDate), 'MMM d')}`
                              : `${reservation.borrower?.displayName || 'Unknown User'} - ${format(parseISO(reservation.startDate), 'MMM d')} to ${format(parseISO(reservation.endDate), 'MMM d')}`
                          }
                          primaryTypographyProps={{
                            variant: isMobile ? 'body2' : 'body1',
                            noWrap: true,
                          }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          sx={{
                            minHeight: 36,
                            minWidth: { xs: 60, sm: 80 },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/reservations/${reservation.id}`);
                          }}
                        >
                          Review
                        </Button>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Upcoming Reservations */}
        <Grid item xs={12} md={pendingRequests.length > 0 ? 6 : 12}>
          <UpcomingReservations reservations={upcomingReservations} />
        </Grid>

        {/* My Tools Quick View */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: { xs: 1.5, sm: 2 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  My Tools
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/my-tools')}
                  sx={{ minHeight: 36 }}
                >
                  View All
                </Button>
              </Box>
              {myTools.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                  <Typography
                    color="text.secondary"
                    gutterBottom
                    variant={isMobile ? 'body2' : 'body1'}
                  >
                    You haven't listed any tools yet
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/my-tools/add')}
                    sx={{ minHeight: 48 }}
                  >
                    Add Your First Tool
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  {myTools.slice(0, 4).map((tool) => (
                    <Grid item xs={6} sm={3} key={tool.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 2 },
                          '&:active': { transform: 'scale(0.98)' },
                        }}
                        onClick={() => navigate(`/tools/${tool.id}`)}
                      >
                        <Box
                          sx={{
                            height: { xs: 80, sm: 100 },
                            bgcolor: 'grey.200',
                            backgroundImage: tool.photos?.[0]?.url
                              ? `url(${tool.photos[0].url})`
                              : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {!tool.photos?.[0]?.url && (
                            <Handyman
                              sx={{
                                fontSize: { xs: 32, sm: 40 },
                                color: 'grey.400',
                              }}
                            />
                          )}
                        </Box>
                        <CardContent
                          sx={{
                            p: { xs: 1, sm: 1.5 },
                            '&:last-child': { pb: { xs: 1, sm: 1.5 } },
                          }}
                        >
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            {tool.name}
                          </Typography>
                          <Chip
                            label={tool.status}
                            size="small"
                            color={
                              tool.status === 'available' ? 'success' : 'default'
                            }
                            sx={{ mt: 0.5, height: { xs: 20, sm: 24 } }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
