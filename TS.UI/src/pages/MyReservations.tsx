import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Handyman,
  CalendarMonth,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Search,
  PlayArrow,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import {
  mockCurrentUser,
  getReservationsByBorrower,
  getReservationsForOwner,
} from '../data/mockData';
import {
  reservationApi,
  Reservation,
  ReservationStatus,
  ApiError,
} from '../services/api';

// Check if we should use real API
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

export default function MyReservations() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'decline' | 'cancel' | 'pickup' | 'return' | null;
    reservation: Reservation | null;
  }>({ open: false, action: null, reservation: null });
  const [ownerNote, setOwnerNote] = useState('');

  const [borrowerReservations, setBorrowerReservations] = useState<Reservation[]>([]);
  const [lenderReservations, setLenderReservations] = useState<Reservation[]>([]);

  // Load reservations
  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_REAL_API) {
        // Fetch from real API
        const [borrowerData, lenderData] = await Promise.all([
          reservationApi.list({ role: 'borrower' }),
          reservationApi.list({ role: 'lender' }),
        ]);
        setBorrowerReservations(borrowerData.items);
        setLenderReservations(lenderData.items);
      } else {
        // Use mock data
        setBorrowerReservations(getReservationsByBorrower(mockCurrentUser.id));
        setLenderReservations(getReservationsForOwner(mockCurrentUser.id));
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
      setError('Failed to load reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

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

  const handleAction = (
    action: 'approve' | 'decline' | 'cancel' | 'pickup' | 'return',
    reservation: Reservation
  ) => {
    setActionDialog({ open: true, action, reservation });
    setOwnerNote('');
  };

  const handleConfirmAction = async () => {
    if (!actionDialog.reservation || !actionDialog.action) return;

    setActionLoading(true);
    try {
      const id = actionDialog.reservation.id;

      if (USE_REAL_API) {
        // Call real API
        switch (actionDialog.action) {
          case 'approve':
            await reservationApi.approve(id, ownerNote || undefined);
            break;
          case 'decline':
            await reservationApi.decline(id, ownerNote || 'No reason provided');
            break;
          case 'cancel':
            await reservationApi.cancel(id, ownerNote || undefined);
            break;
          case 'pickup':
            await reservationApi.pickup(id, ownerNote || undefined);
            break;
          case 'return':
            await reservationApi.return(id, ownerNote || undefined);
            break;
        }
      } else {
        // Mock: just log the action
        console.log('Action:', actionDialog.action, 'Reservation:', id, 'Note:', ownerNote);
      }

      setSnackbar({
        open: true,
        message: `Reservation ${actionDialog.action}d successfully!`,
        severity: 'success',
      });

      // Reload reservations to get updated data
      await loadReservations();
    } catch (err) {
      console.error('Action failed:', err);
      const message = err instanceof ApiError ? err.message : 'Action failed. Please try again.';
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
      setActionDialog({ open: false, action: null, reservation: null });
    }
  };

  // Memoize the reservation grouping
  const groupedBorrowerReservations = useMemo(() => {
    return {
      pending: borrowerReservations.filter((r) => r.status === 'pending'),
      active: borrowerReservations.filter((r) =>
        ['confirmed', 'active'].includes(r.status)
      ),
      past: borrowerReservations.filter((r) =>
        ['completed', 'cancelled', 'declined'].includes(r.status)
      ),
    };
  }, [borrowerReservations]);

  const groupedLenderReservations = useMemo(() => {
    return {
      pending: lenderReservations.filter((r) => r.status === 'pending'),
      active: lenderReservations.filter((r) =>
        ['confirmed', 'active'].includes(r.status)
      ),
      past: lenderReservations.filter((r) =>
        ['completed', 'cancelled', 'declined'].includes(r.status)
      ),
    };
  }, [lenderReservations]);

  const renderReservationList = (
    reservations: Reservation[],
    isLender: boolean
  ) => {
    if (reservations.length === 0) {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CalendarMonth sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {isLender
                ? 'No reservation requests yet'
                : "You haven't made any reservations yet"}
            </Typography>
            {!isLender && (
              <Button
                variant="outlined"
                startIcon={<Search />}
                onClick={() => navigate('/browse')}
                sx={{ mt: 2 }}
              >
                Browse Tools
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    const groups = isLender ? groupedLenderReservations : groupedBorrowerReservations;

    const renderGroup = (
      title: string,
      items: Reservation[],
      highlight?: boolean
    ) => {
      if (items.length === 0) return null;

      return (
        <Card sx={{ mb: 3, bgcolor: highlight ? 'warning.light' : undefined }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {title} ({items.length})
            </Typography>
            <List disablePadding>
              {items.map((reservation, index) => (
                <Box key={reservation.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      px: 0,
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 2,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={reservation.tool?.photos?.[0]?.url}
                        sx={{ width: 60, height: 60 }}
                      >
                        <Handyman />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      sx={{ flex: 1 }}
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
                            variant="subtitle1"
                            sx={{ cursor: 'pointer' }}
                            onClick={() =>
                              navigate(`/tools/${reservation.toolId}`)
                            }
                          >
                            {reservation.tool?.name}
                          </Typography>
                          <Chip
                            label={reservation.status}
                            size="small"
                            color={getStatusColor(reservation.status)}
                            icon={getStatusIcon(reservation.status) || undefined}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {format(parseISO(reservation.startDate), 'MMM d')} -{' '}
                            {format(parseISO(reservation.endDate), 'MMM d, yyyy')}
                          </Typography>
                          <br />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="span"
                          >
                            {isLender
                              ? `Requested by ${reservation.borrower?.displayName}`
                              : `Owner: ${reservation.tool?.owner?.displayName}`}
                          </Typography>
                          {reservation.note && (
                            <>
                              <br />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                component="span"
                                sx={{ fontStyle: 'italic' }}
                              >
                                "{reservation.note}"
                              </Typography>
                            </>
                          )}
                        </>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, flexWrap: 'wrap' }}>
                      {/* Owner actions */}
                      {isLender && reservation.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleAction('approve', reservation)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleAction('decline', reservation)}
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
                          onClick={() => handleAction('pickup', reservation)}
                        >
                          Confirm Pickup
                        </Button>
                      )}
                      {!isLender && reservation.status === 'active' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleAction('return', reservation)}
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
                          onClick={() => handleAction('cancel', reservation)}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          navigate(`/reservations/${reservation.id}`)
                        }
                      >
                        Details
                      </Button>
                    </Box>
                  </ListItem>
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>
      );
    };

    return (
      <>
        {renderGroup(
          isLender ? 'Pending Requests' : 'Pending Approval',
          groups.pending,
          true
        )}
        {renderGroup('Active & Upcoming', groups.active)}
        {renderGroup('Past', groups.past)}
      </>
    );
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Reservations
        </Typography>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 3 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={120} sx={{ mb: 2 }} />
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Reservations
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadReservations}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reservations
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Borrowing</span>
              {groupedBorrowerReservations.pending.length > 0 && (
                <Chip
                  label={groupedBorrowerReservations.pending.length}
                  size="small"
                  color="warning"
                />
              )}
            </Box>
          }
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Lending</span>
              {groupedLenderReservations.pending.length > 0 && (
                <Chip
                  label={groupedLenderReservations.pending.length}
                  size="small"
                  color="warning"
                />
              )}
            </Box>
          }
        />
      </Tabs>

      {tab === 0
        ? renderReservationList(borrowerReservations, false)
        : renderReservationList(lenderReservations, true)}

      {/* Action Dialog */}
      <Dialog
        open={actionDialog.open}
        onClose={() =>
          !actionLoading && setActionDialog({ open: false, action: null, reservation: null })
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
              You are approving the reservation for{' '}
              <strong>{actionDialog.reservation?.tool?.name}</strong> from{' '}
              {actionDialog.reservation?.startDate &&
                format(parseISO(actionDialog.reservation.startDate), 'MMM d')}{' '}
              to{' '}
              {actionDialog.reservation?.endDate &&
                format(parseISO(actionDialog.reservation.endDate), 'MMM d, yyyy')}
              .
            </Alert>
          )}
          {actionDialog.action === 'decline' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You are declining the reservation request. The borrower will be
              notified.
            </Alert>
          )}
          {actionDialog.action === 'cancel' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Are you sure you want to cancel this reservation? The other party will
              be notified.
            </Alert>
          )}
          {actionDialog.action === 'pickup' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Confirming pickup will mark this loan as active. Make sure you have
              physically received the tool.
            </Alert>
          )}
          {actionDialog.action === 'return' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Confirming return will mark this loan as completed. Make sure you have
              returned the tool to the owner.
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label={
              actionDialog.action === 'decline'
                ? 'Reason (required)'
                : 'Note (optional)'
            }
            value={ownerNote}
            onChange={(e) => setOwnerNote(e.target.value)}
            placeholder={
              actionDialog.action === 'approve'
                ? 'e.g., Pickup instructions, special notes...'
                : actionDialog.action === 'decline'
                  ? 'e.g., Already reserved, tool needs repair...'
                  : actionDialog.action === 'pickup'
                    ? 'e.g., Tool condition notes...'
                    : actionDialog.action === 'return'
                      ? 'e.g., Thanks for letting me borrow it!'
                      : 'Let the other party know why...'
            }
            disabled={actionLoading}
            required={actionDialog.action === 'decline'}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog({ open: false, action: null, reservation: null })
            }
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
            disabled={actionLoading || (actionDialog.action === 'decline' && !ownerNote.trim())}
            startIcon={actionLoading ? <CircularProgress size={16} /> : undefined}
          >
            {actionLoading
              ? 'Processing...'
              : actionDialog.action === 'approve'
                ? 'Approve'
                : actionDialog.action === 'decline'
                  ? 'Decline'
                  : actionDialog.action === 'cancel'
                    ? 'Cancel Reservation'
                    : actionDialog.action === 'pickup'
                      ? 'Confirm Pickup'
                      : 'Confirm Return'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
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
