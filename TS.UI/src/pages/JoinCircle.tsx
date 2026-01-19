import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, GroupAdd, CheckCircle } from '@mui/icons-material';
import { circlesApi, ApiError, Circle } from '../services/api';

export default function JoinCircle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Circle | null>(null);

  // Check for invite code in URL query params
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setInviteCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setError('Please enter an invite code');
      return;
    }

    if (code.length !== 8) {
      setError('Invite code must be 8 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const circle = await circlesApi.join(code);
      setSuccess(circle);
    } catch (err) {
      console.error('Failed to join circle:', err);
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('Invalid invite code. Please check and try again.');
        } else if (err.status === 400) {
          setError(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to join circle. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric characters, convert to uppercase
    const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (value.length <= 8) {
      setInviteCode(value);
    }
  };

  if (success) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/circles')} sx={{ mb: 2 }}>
          Back to Circles
        </Button>

        <Card sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
          <CardContent sx={{ py: 6 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 1 }}>
              Welcome to {success.name}!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              You've successfully joined the circle. You can now view shared tools and connect with other members.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="outlined" onClick={() => navigate('/circles')}>
                View All Circles
              </Button>
              <Button variant="contained" onClick={() => navigate(`/circles/${success.id}`)}>
                Go to Circle
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/circles')} sx={{ mb: 2 }}>
        Back to Circles
      </Button>

      <Typography variant="h4" sx={{ mb: 3 }}>
        Join a Circle
      </Typography>

      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <GroupAdd sx={{ fontSize: 48, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6">Enter Invite Code</Typography>
              <Typography variant="body2" color="text.secondary">
                Ask a circle admin for the 8-character invite code.
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Invite Code"
              value={inviteCode}
              onChange={handleCodeChange}
              placeholder="ABCD1234"
              required
              sx={{ mb: 3 }}
              inputProps={{
                maxLength: 8,
                style: {
                  textTransform: 'uppercase',
                  fontFamily: 'monospace',
                  fontSize: '1.5rem',
                  letterSpacing: '0.25em',
                  textAlign: 'center',
                },
              }}
              helperText={`${inviteCode.length}/8 characters`}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/circles')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || inviteCode.length !== 8}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Joining...' : 'Join Circle'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
        Don't have an invite code? Ask a friend who's already in a circle, or create your own circle.
      </Typography>
    </Box>
  );
}
