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

export default function Dashboard() {
  const navigate = useNavigate();

  // Get data for current user
  const myTools = getToolsByOwner(mockCurrentUser.id);
  const myBorrowedReservations = getReservationsByBorrower(mockCurrentUser.id);
  const pendingRequests = getPendingRequestsForOwner(mockCurrentUser.id);

  // Filter upcoming reservations (where I'm borrowing)
  const upcomingReservations = myBorrowedReservations
    .filter(
      (r) =>
        ['confirmed', 'pending'].includes(r.status) &&
        isAfter(parseISO(r.startDate), new Date())
    )
    .slice(0, 3);

  // Active loans (tools I'm currently borrowing)
  const activeLoans = myBorrowedReservations.filter(
    (r) => r.status === 'active'
  ).length;

  const stats = {
    toolsListed: myTools.length,
    activeLoans: activeLoans,
    pendingRequests: pendingRequests.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'active':
        return 'info';
      case 'completed':
        return 'default';
      case 'cancelled':
      case 'declined':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">
          Welcome back, {mockCurrentUser.displayName.split(' ')[0]}!
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => navigate('/my-tools')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Build sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h3">{stats.toolsListed}</Typography>
              <Typography color="text.secondary">Tools Listed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => navigate('/reservations')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarMonth
                sx={{ fontSize: 48, color: 'success.main', mb: 1 }}
              />
              <Typography variant="h3">{stats.activeLoans}</Typography>
              <Typography color="text.secondary">Active Loans</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': { boxShadow: 4 },
              bgcolor:
                stats.pendingRequests > 0 ? 'warning.light' : 'background.paper',
            }}
            onClick={() => navigate('/reservations')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Pending sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
              <Typography variant="h3">{stats.pendingRequests}</Typography>
              <Typography color="text.secondary">Pending Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/my-tools/add')}
                >
                  Add Tool
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Search />}
                  onClick={() => navigate('/browse')}
                >
                  Browse Tools
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Requests for My Tools */}
        {pendingRequests.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'warning.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending Requests
                </Typography>
                <List disablePadding>
                  {pendingRequests.slice(0, 3).map((reservation, index) => (
                    <Box key={reservation.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{ px: 0, cursor: 'pointer' }}
                        onClick={() =>
                          navigate(`/reservations/${reservation.id}`)
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'warning.main' }}>
                            <Handyman />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={reservation.tool?.name}
                          secondary={`${reservation.borrower?.displayName} - ${format(parseISO(reservation.startDate), 'MMM d')} to ${format(parseISO(reservation.endDate), 'MMM d')}`}
                        />
                        <Button size="small" variant="contained">
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
        <Grid item xs={12} md={pendingRequests.length > 0 ? 12 : 6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Reservations
              </Typography>
              {upcomingReservations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary" gutterBottom>
                    No upcoming reservations
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Search />}
                    onClick={() => navigate('/browse')}
                  >
                    Find Tools to Borrow
                  </Button>
                </Box>
              ) : (
                <List disablePadding>
                  {upcomingReservations.map((reservation, index) => (
                    <Box key={reservation.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{ px: 0, cursor: 'pointer' }}
                        onClick={() =>
                          navigate(`/reservations/${reservation.id}`)
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={reservation.tool?.photos?.[0]?.url}
                            variant="rounded"
                          >
                            <Handyman />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={reservation.tool?.name}
                          secondary={`${format(parseISO(reservation.startDate), 'MMM d')} - ${format(parseISO(reservation.endDate), 'MMM d, yyyy')}`}
                        />
                        <Chip
                          label={reservation.status}
                          size="small"
                          color={getStatusColor(reservation.status)}
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* My Tools Quick View */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">My Tools</Typography>
                <Button size="small" onClick={() => navigate('/my-tools')}>
                  View All
                </Button>
              </Box>
              {myTools.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary" gutterBottom>
                    You haven't listed any tools yet
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/my-tools/add')}
                  >
                    Add Your First Tool
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {myTools.slice(0, 4).map((tool) => (
                    <Grid item xs={6} sm={3} key={tool.id}>
                      <Card
                        variant="outlined"
                        sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
                        onClick={() => navigate(`/tools/${tool.id}`)}
                      >
                        <Box
                          sx={{
                            height: 100,
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
                            <Handyman sx={{ fontSize: 40, color: 'grey.400' }} />
                          )}
                        </Box>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" noWrap>
                            {tool.name}
                          </Typography>
                          <Chip
                            label={tool.status}
                            size="small"
                            color={
                              tool.status === 'available' ? 'success' : 'default'
                            }
                            sx={{ mt: 0.5 }}
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
