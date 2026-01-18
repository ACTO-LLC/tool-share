import { Box, Card, CardContent, Grid, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Build, CalendarMonth, Pending } from '@mui/icons-material';

export default function Dashboard() {
  const navigate = useNavigate();

  // TODO: Replace with actual data from API
  const stats = {
    toolsListed: 0,
    activeLoans: 0,
    pendingRequests: 0,
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome to Tool Share!
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Build sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h3">{stats.toolsListed}</Typography>
              <Typography color="text.secondary">Tools Listed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarMonth sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h3">{stats.activeLoans}</Typography>
              <Typography color="text.secondary">Active Loans</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Pending sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
              <Typography variant="h3">{stats.pendingRequests}</Typography>
              <Typography color="text.secondary">Pending Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={() => navigate('/my-tools/add')}>
                  Add Tool
                </Button>
                <Button variant="outlined" onClick={() => navigate('/browse')}>
                  Browse Tools
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Reservations
              </Typography>
              <Typography color="text.secondary">
                No upcoming reservations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
