import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { History } from '@mui/icons-material';

/**
 * RecentActivity - Displays recent activity feed on the dashboard
 * Placeholder component for Phase 2
 * Will show notifications and activity updates
 */
export default function RecentActivity() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
        >
          Recent Activity
        </Typography>
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 3, sm: 4 },
            color: 'text.secondary',
          }}
        >
          <History
            sx={{
              fontSize: { xs: 40, sm: 48 },
              color: 'grey.400',
              mb: 1,
            }}
          />
          <Typography
            variant={isMobile ? 'body2' : 'body1'}
            color="text.secondary"
          >
            Activity feed coming soon
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
            Track tool requests, approvals, and more
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
