import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  CircularProgress,
  Divider,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  PlayArrow,
  Handyman,
  Person,
  CalendarMonth,
  Notes,
  PhotoCamera,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import {
  reservationApi,
  Reservation,
  ReservationStatus,
  ApiError,
} from '../services/api';
import { mockReservations, mockCurrentUser } from '../data/mockData';

// Check if we should use real API
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

// Custom styled connector for the stepper
const ColoredStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.success.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.success.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.grey[300],
    borderRadius: 1,
  },
}));

// Status step definitions
const STATUS_STEPS = [
  { key: 'pending', label: 'Requested', icon: <HourglassEmpty /> },
  { key: 'confirmed', label: 'Approved', icon: <CheckCircle /> },
  { key: 'active', label: 'Picked Up', icon: <PlayArrow /> },
  { key: 'completed', label: 'Returned', icon: <CheckCircle /> },
];

function getActiveStep(status: ReservationStatus): number {
  switch (status) {
    case 'pending':
      return 0;
    case 'confirmed':
      return 1;
    case 'active':
      return 2;
    case 'completed':
      return 4; // Completed
    case 'cancelled':
    case 'declined':
      return -1; // Special state
    default:
      return 0;
  }
}

function getStatusColor(status: ReservationStatus) {
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
}

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'decline' | 'cancel' | 'pickup' | 'return' | null;
  }>({ open: false, action: null });
  const [actionNote, setActionNote] = useState('');

  // Determine user's role in this reservation
  const isOwner = reservation?.tool?.ownerId === mockCurrentUser.id;
  const isBorrower = reservation?.borrowerId === mockCurrentUser.id;

  const loadReservation = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      if (USE_REAL_API) {
        const data = await reservationApi.get(id);
        setReservation(data);
      } else {
        // Use mock data
        const mockReservation = mockReservations.find((r) => r.id === id);
        if (mockReservation) {
          setReservation(mockReservation);
        } else {
          setError('Reservation not found');
        }
      }
    } catch (err) {
      console.error('Failed to load reservation:', err);
      if (err instanceof ApiError && err.status === 404) {
        setError('Reservation not found');
      } else {
        setError('Failed to load reservation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReservation();
  }, [loadReservation]);

  const handleAction = (
    action: 'approve' | 'decline' | 'cancel' | 'pickup' | 'return'
  ) => {
    setActionDialog({ open: true, action });
    setActionNote('');
  };

  const handleConfirmAction = async () => {
    if (!reservation || !actionDialog.action) return;

    setActionLoading(true);
    try {
      if (USE_REAL_API) {
        switch (actionDialog.action) {
          case 'approve':
            await reservationApi.approve(reservation.id, actionNote || undefined);
            break;
          case 'decline':
            await reservationApi.decline(
              reservation.id,
              actionNote || 'No reason provided'
            );
            break;
          case 'cancel':
            await reservationApi.cancel(reservation.id, actionNote || undefined);
            break;
          case 'pickup':
            await reservationApi.pickup(reservation.id, actionNote || undefined);
            break;
          case 'return':
            await reservationApi.return(reservation.id, actionNote || undefined);
            break;
        }
      } else {
        console.log(
          'Action:',
          actionDialog.action,
          'Reservation:',
          reservation.id,
          'Note:',
          actionNote
        );
      }

      setSnackbar({
        open: true,
        message: `Reservation ${actionDialog.action}d successfully!`,
        severity: 'success',
      });

      // Reload reservation to get updated data
      await loadReservation();
    } catch (err) {
      console.error('Action failed:', err);
      const message =
        err instanceof ApiError ? err.message : 'Action failed. Please try again.';
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
      setActionDialog({ open: false, action: null });
    }
  };

  if (loading) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Skeleton variant="text" width={300} height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !reservation) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Reservation not found'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/reservations')}>
          Go to Reservations
        </Button>
      </Box>
    );
  }

  const activeStep = getActiveStep(reservation.status);
  const isCancelledOrDeclined = ['cancelled', 'declined'].includes(reservation.status);

  return (
    <Box>
      {/* Header */}
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back to Reservations
      </Button>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Reservation Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {reservation.id}
          </Typography>
        </Box>
        <Chip
          label={reservation.status.toUpperCase()}
          color={getStatusColor(reservation.status)}
          size="medium"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      {/* Status Timeline */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Status Timeline
          </Typography>

          {isCancelledOrDeclined ? (
            <Alert
              severity="error"
              icon={<Cancel />}
              sx={{ mb: 2 }}
            >
              This reservation was{' '}
              <strong>{reservation.status === 'cancelled' ? 'cancelled' : 'declined'}</strong>
              {reservation.ownerNote && (
                <>
                  : <em>"{reservation.ownerNote}"</em>
                </>
              )}
            </Alert>
          ) : (
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              connector={<ColoredStepConnector />}
              sx={{ mt: 2 }}
            >
              {STATUS_STEPS.map((step, index) => (
                <Step key={step.key} completed={index < activeStep}>
                  <StepLabel
                    icon={
                      <Avatar
                        sx={{
                          bgcolor:
                            index < activeStep
                              ? 'success.main'
                              : index === activeStep
                                ? 'primary.main'
                                : 'grey.300',
                          width: 40,
                          height: 40,
                        }}
                      >
                        {step.icon}
                      </Avatar>
                    }
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Main Details */}
        <Grid item xs={12} md={8}>
          {/* Tool Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Handyman /> Tool Information
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/tools/${reservation.toolId}`)}
              >
                <Avatar
                  variant="rounded"
                  src={reservation.tool?.photos?.[0]?.url}
                  sx={{ width: 80, height: 80 }}
                >
                  <Handyman />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {reservation.tool?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reservation.tool?.brand} {reservation.tool?.model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Category: {reservation.tool?.category}
                  </Typography>
                  {reservation.tool?.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {reservation.tool.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth /> Reservation Dates
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="h6">
                      {format(parseISO(reservation.startDate), 'MMM d, yyyy')}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      End Date
                    </Typography>
                    <Typography variant="h6">
                      {format(parseISO(reservation.endDate), 'MMM d, yyyy')}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              {reservation.pickupConfirmedAt && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Picked up: {format(parseISO(reservation.pickupConfirmedAt), 'MMM d, yyyy h:mm a')}
                </Typography>
              )}
              {reservation.returnConfirmedAt && (
                <Typography variant="body2" color="text.secondary">
                  Returned: {format(parseISO(reservation.returnConfirmedAt), 'MMM d, yyyy h:mm a')}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(reservation.note || reservation.ownerNote) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Notes /> Notes
                </Typography>
                {reservation.note && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Borrower's Note:
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                      "{reservation.note}"
                    </Typography>
                  </Box>
                )}
                {reservation.ownerNote && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Owner's Note:
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                      "{reservation.ownerNote}"
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Before/After Photos (placeholder) */}
          {reservation.status === 'active' || reservation.status === 'completed' ? (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhotoCamera /> Condition Photos
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Before (Pickup)
                      </Typography>
                      <Box
                        sx={{
                          height: 120,
                          bgcolor: 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                        }}
                      >
                        <Button startIcon={<PhotoCamera />} size="small">
                          Upload Photos
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        After (Return)
                      </Typography>
                      <Box
                        sx={{
                          height: 120,
                          bgcolor: 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                        }}
                      >
                        <Button
                          startIcon={<PhotoCamera />}
                          size="small"
                          disabled={reservation.status !== 'active'}
                        >
                          Upload Photos
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : null}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Participants */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person /> Participants
              </Typography>

              {/* Owner */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tool Owner
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Avatar src={reservation.tool?.owner?.avatarUrl} sx={{ width: 40, height: 40 }}>
                    {reservation.tool?.owner?.displayName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {reservation.tool?.owner?.displayName}
                      {isOwner && ' (You)'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {reservation.tool?.owner?.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Borrower */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Borrower
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Avatar src={reservation.borrower?.avatarUrl} sx={{ width: 40, height: 40 }}>
                    {reservation.borrower?.displayName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {reservation.borrower?.displayName}
                      {isBorrower && ' (You)'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {reservation.borrower?.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Owner actions */}
                {isOwner && reservation.status === 'pending' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={() => handleAction('approve')}
                    >
                      Approve Request
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => handleAction('decline')}
                    >
                      Decline Request
                    </Button>
                  </>
                )}

                {/* Borrower actions */}
                {isBorrower && reservation.status === 'confirmed' && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleAction('pickup')}
                  >
                    Confirm Pickup
                  </Button>
                )}
                {isBorrower && reservation.status === 'active' && (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={() => handleAction('return')}
                  >
                    Confirm Return
                  </Button>
                )}

                {/* Cancel - available for both when pending/confirmed */}
                {(isOwner || isBorrower) &&
                  ['pending', 'confirmed'].includes(reservation.status) && (
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => handleAction('cancel')}
                    >
                      Cancel Reservation
                    </Button>
                  )}

                {/* No actions available */}
                {!['pending', 'confirmed', 'active'].includes(reservation.status) && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    No actions available for this reservation.
                  </Typography>
                )}

                <Divider sx={{ my: 1 }} />

                <Button
                  variant="text"
                  fullWidth
                  onClick={() => navigate(`/tools/${reservation.toolId}`)}
                >
                  View Tool
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Dialog */}
      <Dialog
        open={actionDialog.open}
        onClose={() =>
          !actionLoading && setActionDialog({ open: false, action: null })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.action === 'approve' && 'Approve Reservation'}
          {actionDialog.action === 'decline' && 'Decline Reservation'}
          {actionDialog.action === 'cancel' && 'Cancel Reservation'}
          {actionDialog.action === 'pickup' && 'Confirm Tool Pickup'}
          {actionDialog.action === 'return' && 'Confirm Tool Return'}
        </DialogTitle>
        <DialogContent>
          {actionDialog.action === 'approve' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              You are approving this reservation. The borrower will be notified.
            </Alert>
          )}
          {actionDialog.action === 'decline' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You are declining this reservation. The borrower will be notified.
            </Alert>
          )}
          {actionDialog.action === 'cancel' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Are you sure you want to cancel this reservation?
            </Alert>
          )}
          {actionDialog.action === 'pickup' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Confirming pickup will mark this loan as active.
            </Alert>
          )}
          {actionDialog.action === 'return' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Confirming return will mark this loan as completed.
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label={
              actionDialog.action === 'decline' ? 'Reason (required)' : 'Note (optional)'
            }
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            disabled={actionLoading}
            required={actionDialog.action === 'decline'}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setActionDialog({ open: false, action: null })}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={
              actionDialog.action === 'approve' || actionDialog.action === 'return'
                ? 'success'
                : actionDialog.action === 'decline' || actionDialog.action === 'cancel'
                  ? 'error'
                  : 'primary'
            }
            onClick={handleConfirmAction}
            disabled={
              actionLoading ||
              (actionDialog.action === 'decline' && !actionNote.trim())
            }
            startIcon={actionLoading ? <CircularProgress size={16} /> : undefined}
          >
            {actionLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
