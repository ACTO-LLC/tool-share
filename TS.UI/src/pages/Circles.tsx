import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Add,
  GroupAdd,
  Groups,
  Person,
  AdminPanelSettings,
  Star,
} from '@mui/icons-material';
import { circlesApi, Circle } from '../services/api';

function getRoleIcon(role: 'member' | 'admin' | 'owner') {
  switch (role) {
    case 'owner':
      return <Star fontSize="small" />;
    case 'admin':
      return <AdminPanelSettings fontSize="small" />;
    default:
      return <Person fontSize="small" />;
  }
}

function getRoleColor(role: 'member' | 'admin' | 'owner') {
  switch (role) {
    case 'owner':
      return 'warning';
    case 'admin':
      return 'primary';
    default:
      return 'default';
  }
}

export default function Circles() {
  const navigate = useNavigate();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCircles();
  }, []);

  async function loadCircles() {
    try {
      setLoading(true);
      setError(null);
      const data = await circlesApi.list();
      setCircles(data);
    } catch (err) {
      console.error('Failed to load circles:', err);
      setError('Failed to load circles. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Circles</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<GroupAdd />}
            onClick={() => navigate('/circles/join')}
          >
            Join Circle
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/circles/create')}
          >
            Create Circle
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {circles.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Groups sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              You're not a member of any circles yet.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Create a circle to share tools with friends, or join an existing circle using an invite code.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<GroupAdd />}
                onClick={() => navigate('/circles/join')}
              >
                Join with Code
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/circles/create')}
              >
                Create Circle
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {circles.map((circle) => (
            <Grid item xs={12} sm={6} md={4} key={circle.id}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea
                  onClick={() => navigate(`/circles/${circle.id}`)}
                  sx={{ height: '100%' }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Groups />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div" noWrap>
                            {circle.name}
                          </Typography>
                          {circle.currentUserRole && (
                            <Chip
                              size="small"
                              icon={getRoleIcon(circle.currentUserRole)}
                              label={circle.currentUserRole.charAt(0).toUpperCase() + circle.currentUserRole.slice(1)}
                              color={getRoleColor(circle.currentUserRole)}
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {circle.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {circle.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
                          {Array.from({ length: Math.min(circle.memberCount || 1, 4) }).map((_, i) => (
                            <Avatar key={i} sx={{ width: 24, height: 24 }}>
                              <Person sx={{ fontSize: 16 }} />
                            </Avatar>
                          ))}
                        </AvatarGroup>
                        <Typography variant="body2" color="text.secondary">
                          {circle.memberCount || 1} {(circle.memberCount || 1) === 1 ? 'member' : 'members'}
                        </Typography>
                      </Box>
                      {circle.isPublic && (
                        <Chip size="small" label="Public" variant="outlined" />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
