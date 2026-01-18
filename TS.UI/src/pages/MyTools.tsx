import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add } from '@mui/icons-material';

export default function MyTools() {
  const navigate = useNavigate();

  // TODO: Fetch user's tools from API

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Tools</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/my-tools/add')}
        >
          Add Tool
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            You haven't listed any tools yet.
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => navigate('/my-tools/add')}
          >
            Add Your First Tool
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
