import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Rating,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { userProfileApi } from '../services/api';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userProfileApi.getPublicProfile(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          User not found
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  const location = [user.city, user.state].filter(Boolean).join(', ');

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 800, mx: 'auto' }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      {/* Profile Card */}
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: 3,
            }}
          >
            {/* Avatar */}
            <Avatar
              src={user.avatarUrl}
              alt={user.displayName}
              sx={{
                width: 120,
                height: 120,
                fontSize: '3rem',
                bgcolor: 'primary.main',
              }}
            >
              {user.displayName?.charAt(0).toUpperCase()}
            </Avatar>

            {/* User Info */}
            <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography variant="h4" gutterBottom>
                {user.displayName}
              </Typography>

              {/* Location */}
              {location && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'center', sm: 'flex-start' },
                    gap: 0.5,
                    mb: 1,
                    color: 'text.secondary',
                  }}
                >
                  <LocationIcon fontSize="small" />
                  <Typography variant="body2">{location}</Typography>
                </Box>
              )}

              {/* Reputation */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  gap: 1,
                  mb: 2,
                }}
              >
                <Rating
                  value={user.reputationScore}
                  precision={0.1}
                  readOnly
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {user.reputationScore.toFixed(1)} rating
                </Typography>
              </Box>

              {/* Member Since */}
              <Chip
                icon={<StarIcon />}
                label={`Member since ${new Date(user.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Bio */}
          {user.bio && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  About
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {user.bio}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
