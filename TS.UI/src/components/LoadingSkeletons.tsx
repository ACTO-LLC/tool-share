import { Box, Card, CardContent, Grid, Skeleton } from '@mui/material';

/**
 * Skeleton for a tool card in grid view
 */
export function ToolCardSkeleton() {
  return (
    <Card>
      <Skeleton variant="rectangular" height={180} animation="wave" />
      <CardContent>
        <Skeleton variant="text" width="70%" height={28} />
        <Skeleton variant="text" width="50%" height={20} />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Skeleton variant="rounded" width={60} height={24} />
          <Skeleton variant="rounded" width={80} height={24} />
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton grid for tool listings
 */
export function ToolGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <ToolCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Skeleton for a reservation item in list view
 */
export function ReservationItemSkeleton() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
      <Skeleton variant="rounded" width={60} height={60} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="40%" height={20} />
        <Skeleton variant="text" width="30%" height={18} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </Box>
    </Box>
  );
}

/**
 * Skeleton list for reservation listings
 */
export function ReservationListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
        {Array.from({ length: count }).map((_, index) => (
          <Box key={index}>
            {index > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
            <ReservationItemSkeleton />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for a notification item
 */
export function NotificationItemSkeleton() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 2, px: 3 }}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="50%" height={24} />
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="25%" height={16} />
      </Box>
    </Box>
  );
}

/**
 * Skeleton list for notifications
 */
export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        {Array.from({ length: count }).map((_, index) => (
          <Box key={index}>
            {index > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
            <NotificationItemSkeleton />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for dashboard stat cards
 */
export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent sx={{ textAlign: 'center' }}>
        <Skeleton variant="circular" width={48} height={48} sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" width={60} height={48} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" width={100} height={24} sx={{ mx: 'auto' }} />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for dashboard layout
 */
export function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={300} height={48} sx={{ mb: 3 }} />
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} sm={4} key={i}>
            <StatCardSkeleton />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={80} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={80} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={80} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * Skeleton for tool detail page
 */
export function ToolDetailSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" width={80} height={60} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Skeleton variant="text" width="80%" height={40} />
          <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
            <Skeleton variant="rounded" width={80} height={24} />
            <Skeleton variant="rounded" width={100} height={24} />
          </Box>
          <Skeleton variant="text" width="100%" height={100} />
          <Skeleton variant="text" width="40%" height={24} sx={{ mt: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box>
              <Skeleton variant="text" width={150} height={24} />
              <Skeleton variant="text" width={100} height={20} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * Skeleton for profile page
 */
export function ProfileSkeleton() {
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Skeleton variant="circular" width={100} height={100} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width={200} height={40} />
              <Skeleton variant="text" width={150} height={24} />
              <Skeleton variant="text" width={180} height={24} />
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

/**
 * Skeleton for circle detail page
 */
export function CircleDetailSkeleton() {
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="100%" height={60} sx={{ mt: 1 }} />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Skeleton variant="rounded" width={100} height={32} />
            <Skeleton variant="rounded" width={120} height={32} />
          </Box>
        </CardContent>
      </Card>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width={100} height={28} sx={{ mb: 2 }} />
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={20} />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width={100} height={28} sx={{ mb: 2 }} />
              <ToolGridSkeleton count={2} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
