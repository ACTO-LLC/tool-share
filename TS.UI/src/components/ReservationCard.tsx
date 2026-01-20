import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Avatar,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Handyman,
  CalendarMonth,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  PlayArrow,
  Email,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Reservation, ReservationStatus } from '../services/api';

interface ReservationCardProps {
  reservation: Reservation;
  isLender: boolean;
  onAction: (
    action: 'approve' | 'decline' | 'cancel' | 'pickup' | 'return',
    reservation: Reservation
  ) => void;
}

const getStatusColor = (status: ReservationStatus) => {
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

const getStatusIcon = (status: ReservationStatus) => {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return <CheckCircle fontSize="small" />;
    case 'pending':
      return <HourglassEmpty fontSize="small" />;
    case 'active':
      return <PlayArrow fontSize="small" />;
    case 'cancelled':
    case 'declined':
      return <Cancel fontSize="small" />;
    default:
      return null;
  }
};

export default function ReservationCard({
  reservation,
  isLender,
  onAction,
}: ReservationCardProps) {
  const navigate = useNavigate();

  const ownerEmail = reservation.tool?.owner?.email;

  return (
    <Card sx={{ mb: 2 }}>
      <CardActionArea
        onClick={() => navigate(`/reservations/${reservation.id}`)}
        sx={{ display: 'block' }}
      >
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
            }}
          >
            {/* Tool Photo */}
            <Avatar
              variant="rounded"
              src={reservation.tool?.photos?.[0]?.url}
              sx={{ width: 80, height: 80, flexShrink: 0 }}
            >
              <Handyman />
            </Avatar>

            {/* Main Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                  mb: 0.5,
                }}
              >
                <Typography variant="subtitle1" fontWeight="medium" noWrap>
                  {reservation.tool?.name || 'Unknown Tool'}
                </Typography>
                <Chip
                  label={reservation.status}
                  size="small"
                  color={getStatusColor(reservation.status)}
                  icon={getStatusIcon(reservation.status) || undefined}
                />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.secondary',
                  mb: 0.5,
                }}
              >
                <CalendarMonth fontSize="small" />
                <Typography variant="body2">
                  {format(parseISO(reservation.startDate), 'MMM d')} -{' '}
                  {format(parseISO(reservation.endDate), 'MMM d, yyyy')}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                {isLender
                  ? `Requested by ${reservation.borrower?.displayName || 'Unknown'}`
                  : `Owner: ${reservation.tool?.owner?.displayName || 'Unknown'}`}
              </Typography>

              {reservation.note && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: 'italic', mt: 0.5 }}
                  noWrap
                >
                  "{reservation.note}"
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>

      {/* Actions - outside CardActionArea to prevent navigation on click */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          px: 2,
          pb: 2,
          pt: 0,
        }}
      >
        {/* Owner/Lender actions */}
        {isLender && reservation.status === 'pending' && (
          <>
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                onAction('approve', reservation);
              }}
            >
              Approve
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onAction('decline', reservation);
              }}
            >
              Decline
            </Button>
          </>
        )}

        {/* Borrower actions */}
        {!isLender && reservation.status === 'confirmed' && (
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              onAction('pickup', reservation);
            }}
          >
            Confirm Pickup
          </Button>
        )}
        {!isLender && reservation.status === 'active' && (
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={(e) => {
              e.stopPropagation();
              onAction('return', reservation);
            }}
          >
            Confirm Return
          </Button>
        )}

        {/* Cancel - available for both when pending/confirmed */}
        {['pending', 'confirmed'].includes(reservation.status) && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onAction('cancel', reservation);
            }}
          >
            Cancel
          </Button>
        )}

        {/* Contact Owner - only for borrowers */}
        {!isLender && ownerEmail && (
          <Tooltip title={`Email ${reservation.tool?.owner?.displayName}`}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Email />}
              href={`mailto:${ownerEmail}?subject=Re: Tool Reservation - ${reservation.tool?.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              Contact Owner
            </Button>
          </Tooltip>
        )}

        <Button
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/reservations/${reservation.id}`);
          }}
        >
          Details
        </Button>
      </Box>
    </Card>
  );
}
