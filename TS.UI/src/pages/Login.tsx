import { Box, Button, Card, CardContent, Typography, Container } from '@mui/material';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/auth';
import { Build } from '@mui/icons-material';

export default function Login() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
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
              Sign In
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
