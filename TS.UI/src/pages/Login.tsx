import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography, Container } from '@mui/material';
import { Build } from '@mui/icons-material';
import { useAuth, isMockAuth } from '../auth';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[Login] User is authenticated, redirecting to dashboard...');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    login();
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%', textAlign: 'center', p: 4 }}>
          <CardContent>
            <Build sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Tool Share
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Share tools with your friends and community
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              fullWidth
            >
              {isMockAuth ? 'Sign In (Dev Mode)' : 'Sign In'}
            </Button>
            {isMockAuth && (
              <Typography variant="caption" color="warning.main" sx={{ mt: 2, display: 'block' }}>
                Mock authentication enabled for local development
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
