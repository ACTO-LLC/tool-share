import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, Groups } from '@mui/icons-material';
import { circlesApi, ApiError } from '../services/api';

export default function CreateCircle() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Circle name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const circle = await circlesApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });

      // Navigate to the new circle
      navigate(`/circles/${circle.id}`);
    } catch (err) {
      console.error('Failed to create circle:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create circle. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/circles')} sx={{ mb: 2 }}>
        Back to Circles
      </Button>

      <Typography variant="h4" sx={{ mb: 3 }}>
        Create a New Circle
      </Typography>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Groups sx={{ fontSize: 48, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6">Start Sharing Tools</Typography>
              <Typography variant="body2" color="text.secondary">
                Create a circle to share tools with friends, family, or neighbors.
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
              label="Circle Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Neighborhood Tools, Work Friends"
              required
              sx={{ mb: 3 }}
              helperText="Choose a name that helps members identify the group"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this circle for? Who should join?"
              sx={{ mb: 3 }}
              helperText="Help potential members understand what this circle is about"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography>Public Circle</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isPublic
                      ? 'Anyone can request to join this circle'
                      : 'Members can only join via invite code'}
                  </Typography>
                </Box>
              }
              sx={{ mb: 3, alignItems: 'flex-start', ml: 0 }}
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
                disabled={loading || !name.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Creating...' : 'Create Circle'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
