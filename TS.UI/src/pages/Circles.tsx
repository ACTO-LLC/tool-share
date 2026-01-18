import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

export default function Circles() {
  // TODO: Fetch user's circles from API

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Circles</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Create Circle
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            You're not a member of any circles yet.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Create a circle or ask a friend for an invite code.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
