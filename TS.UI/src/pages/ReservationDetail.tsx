import { Box, Typography, Card, CardContent } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();

  // TODO: Fetch reservation details from API
  // TODO: Add status timeline
  // TODO: Add before/after photo upload

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reservation Details
      </Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            Reservation ID: {id}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Reservation details, status timeline, and photo upload will be displayed here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
