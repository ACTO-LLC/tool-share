import { Box, Typography, Card, CardContent, Tabs, Tab } from '@mui/material';
import { useState } from 'react';

export default function MyReservations() {
  const [tab, setTab] = useState(0);

  // TODO: Fetch reservations from API

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Reservations
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="As Borrower" />
        <Tab label="As Lender" />
      </Tabs>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            {tab === 0
              ? "You haven't made any reservations yet."
              : "No one has requested your tools yet."}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
