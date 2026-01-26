import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Handyman, Search, LocationOn } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { Reservation } from '../services/api';

interface UpcomingReservationsProps {
  reservations: Reservation[];
}

/**
 * UpcomingReservations - Displays a list of upcoming reservations
 * Shows tool name, dates, status, and pickup location
 * Used on the Dashboard page
 */
export default function UpcomingReservations({
  reservations,
}: UpcomingReservationsProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'active':
        return 'info';
      case 'completed':
        return 'default';
      case 'cancelled':
      case 'declined':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get pickup location from tool owner
  const getPickupInfo = (reservation: Reservation): string | null => {
    const owner = reservation.tool?.owner;
    if (!owner) return null;

    const parts: string[] = [];
    if (owner.city) parts.push(owner.city);
    if (owner.state) parts.push(owner.state);

    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: { xs: 1.5, sm: 2 },
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            Upcoming Reservations
          </Typography>
          {reservations.length > 0 && (
            <Button
              size="small"
              onClick={() => navigate('/reservations')}
              sx={{ minHeight: 36 }}
            >
              View All
            </Button>
          )}
        </Box>

        {reservations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
            <Typography
              color="text.secondary"
              gutterBottom
              variant={isMobile ? 'body2' : 'body1'}
            >
              No upcoming reservations
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Search />}
              onClick={() => navigate('/browse')}
              sx={{ minHeight: 48 }}
            >
              Find Tools to Borrow
            </Button>
          </Box>
        ) : (
          <List disablePadding>
            {reservations.map((reservation, index) => {
              const pickupInfo = getPickupInfo(reservation);

              return (
                <Box key={reservation.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      px: 0,
                      py: { xs: 1, sm: 1.5 },
                      cursor: 'pointer',
                      minHeight: 48,
                      flexWrap: 'wrap',
                    }}
                    onClick={() => navigate(`/reservations/${reservation.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={reservation.tool?.photos?.[0]?.url}
                        variant="rounded"
                        sx={{
                          width: { xs: 48, sm: 56 },
                          height: { xs: 48, sm: 56 },
                        }}
                      >
                        <Handyman sx={{ fontSize: { xs: 24, sm: 28 } }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Typography
                            variant={isMobile ? 'body2' : 'body1'}
                            component="span"
                            sx={{
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: { xs: '150px', sm: '200px' },
                            }}
                          >
                            {reservation.tool?.name}
                          </Typography>
                          <Chip
                            label={reservation.status}
                            size="small"
                            color={getStatusColor(reservation.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'block' }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                            sx={{ display: 'block' }}
                          >
                            {format(parseISO(reservation.startDate), 'MMM d')} -{' '}
                            {format(
                              parseISO(reservation.endDate),
                              isMobile ? 'MMM d' : 'MMM d, yyyy'
                            )}
                          </Typography>
                          {pickupInfo && (
                            <Box
                              component="span"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mt: 0.5,
                              }}
                            >
                              <LocationOn
                                sx={{
                                  fontSize: 14,
                                  color: 'text.secondary',
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                component="span"
                              >
                                Pickup: {pickupInfo}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                      secondaryTypographyProps={{
                        component: 'div',
                      }}
                    />
                  </ListItem>
                </Box>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
