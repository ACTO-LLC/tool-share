import { Box, Typography, Card, CardContent } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function ToolDetail() {
  const { id } = useParams<{ id: string }>();

  // TODO: Fetch tool details from API
  // TODO: Add FullCalendar for availability
  // TODO: Add reservation request form

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tool Details
      </Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            Tool ID: {id}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Tool details and availability calendar will be displayed here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
