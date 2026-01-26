import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  CircularProgress,
  Snackbar,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  CalendarMonth,
  Search,
  FilterList,
} from '@mui/icons-material';
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
import ReservationCard from '../components/ReservationCard';
import { compareAsc, parseISO } from 'date-fns';

// Check if we should use real API
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

// Status filter options
type StatusFilter = 'all' | ReservationStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MyReservations() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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
    console.log('[MyReservations] loadReservations called, USE_REAL_API:', USE_REAL_API);
    setLoading(true);
    setError(null);

    try {
      if (USE_REAL_API) {
        // Fetch from real API
        console.log('[MyReservations] Fetching from real API...');
        const [borrowerData, lenderData] = await Promise.all([
          reservationApi.list({ role: 'borrower' }),
          reservationApi.list({ role: 'lender' }),
        ]);
        console.log('[MyReservations] Borrower reservations:', borrowerData);
        console.log('[MyReservations] Lender reservations:', lenderData);
        setBorrowerReservations(borrowerData.items);
        setLenderReservations(lenderData.items);
      } else {
        // Use mock data
        console.log('[MyReservations] Using mock data');
        setBorrowerReservations(getReservationsByBorrower(mockCurrentUser.id));
        setLenderReservations(getReservationsForOwner(mockCurrentUser.id));
      }
    } catch (err) {
      console.error('[MyReservations] Failed to load reservations:', err);
      setError('Failed to load reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleAction = (
    action: 'approve' | 'decline' | 'cancel' | 'pickup' | 'return',
    reservation: Reservation
  ) => {
    setActionDialog({ open: true, action, reservation });
    setOwnerNote('');
  };

  const handleConfirmAction = async () => {
    if (!actionDialog.reservation || !actionDialog.action) return;

    console.log('[MyReservations] handleConfirmAction called:', {
      action: actionDialog.action,
      reservationId: actionDialog.reservation.id,
      useRealApi: USE_REAL_API,
      note: ownerNote,
    });

    setActionLoading(true);
    try {
      const id = actionDialog.reservation.id;

      if (USE_REAL_API) {
        // Call real API
        console.log('[MyReservations] Calling real API for action:', actionDialog.action);
        switch (actionDialog.action) {
          case 'approve':
            const approveResult = await reservationApi.approve(id, ownerNote || undefined);
            console.log('[MyReservations] Approve result:', approveResult);
            break;
          case 'decline':
            const declineResult = await reservationApi.decline(id, ownerNote || 'No reason provided');
            console.log('[MyReservations] Decline result:', declineResult);
            break;
          case 'cancel':
            const cancelResult = await reservationApi.cancel(id, ownerNote || undefined);
            console.log('[MyReservations] Cancel result:', cancelResult);
            break;
          case 'pickup':
            const pickupResult = await reservationApi.pickup(id, ownerNote || undefined);
            console.log('[MyReservations] Pickup result:', pickupResult);
            break;
          case 'return':
            const returnResult = await reservationApi.return(id, ownerNote || undefined);
            console.log('[MyReservations] Return result:', returnResult);
            break;
        }
      } else {
        // Mock: just log the action
        console.log('[MyReservations] Mock mode - action not sent to API:', actionDialog.action, 'Reservation:', id, 'Note:', ownerNote);
      }

      setSnackbar({
        open: true,
        message: `Reservation ${actionDialog.action}d successfully!`,
        severity: 'success',
      });

      // Reload reservations to get updated data
      console.log('[MyReservations] Action succeeded, reloading reservations...');
      await loadReservations();
    } catch (err) {
      console.error('[MyReservations] Action failed:', err);
      const message = err instanceof ApiError ? err.message : 'Action failed. Please try again.';
      console.error('[MyReservations] Error message:', message);
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

  // Filter and sort reservations
  const filteredBorrowerReservations = useMemo(() => {
    let filtered = borrowerReservations;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Sort by start date (upcoming first)
    return [...filtered].sort((a, b) =>
      compareAsc(parseISO(a.startDate), parseISO(b.startDate))
    );
  }, [borrowerReservations, statusFilter]);

  const filteredLenderReservations = useMemo(() => {
    let filtered = lenderReservations;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Sort by start date (upcoming first)
    return [...filtered].sort((a, b) =>
      compareAsc(parseISO(a.startDate), parseISO(b.startDate))
    );
  }, [lenderReservations, statusFilter]);

  // Get counts per status for the current tab
  const statusCounts = useMemo(() => {
    const reservations = tab === 0 ? borrowerReservations : lenderReservations;
    const counts: Record<StatusFilter, number> = {
      all: reservations.length,
      pending: 0,
      confirmed: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      declined: 0,
    };

    reservations.forEach((r) => {
      if (counts[r.status] !== undefined) {
        counts[r.status]++;
      }
    });

    return counts;
  }, [borrowerReservations, lenderReservations, tab]);

  // Pending counts for tab badges
  const borrowerPendingCount = useMemo(
    () => borrowerReservations.filter((r) => r.status === 'pending').length,
    [borrowerReservations]
  );

  const lenderPendingCount = useMemo(
    () => lenderReservations.filter((r) => r.status === 'pending').length,
    [lenderReservations]
  );

  const renderEmptyState = (isLender: boolean) => {
    const filterLabel = STATUS_FILTERS.find((f) => f.value === statusFilter)?.label || statusFilter;

    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <CalendarMonth sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {statusFilter === 'all'
              ? isLender
                ? 'No reservation requests yet'
                : "You haven't made any reservations yet"
              : `No ${filterLabel.toLowerCase()} reservations`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {statusFilter === 'all'
              ? isLender
                ? 'When someone requests to borrow your tools, they will appear here.'
                : 'Browse available tools and make a reservation to get started.'
              : `You don't have any reservations with "${filterLabel.toLowerCase()}" status.`}
          </Typography>
          {!isLender && statusFilter === 'all' && (
            <Button
              variant="outlined"
              startIcon={<Search />}
              onClick={() => navigate('/browse')}
            >
              Browse Tools
            </Button>
          )}
          {statusFilter !== 'all' && (
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setStatusFilter('all')}
            >
              Show All Reservations
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderReservationList = (reservations: Reservation[], isLender: boolean) => {
    if (reservations.length === 0) {
      return renderEmptyState(isLender);
    }

    return (
      <Box>
        {reservations.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            isLender={isLender}
            onAction={handleAction}
          />
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Reservations
        </Typography>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={40} sx={{ mb: 3 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={140} sx={{ mb: 2, borderRadius: 1 }} />
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

      {/* Borrowing/Lending Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setStatusFilter('all'); // Reset filter when switching tabs
        }}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Borrowing</span>
              {borrowerPendingCount > 0 && (
                <Chip
                  label={borrowerPendingCount}
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
              {lenderPendingCount > 0 && (
                <Chip
                  label={lenderPendingCount}
                  size="small"
                  color="warning"
                />
              )}
            </Box>
          }
        />
      </Tabs>

      {/* Status Filter Chips */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          mb: 3,
          flexWrap: 'wrap',
          gap: 1,
          '& > *': { mb: { xs: 1, sm: 0 } },
        }}
      >
        {STATUS_FILTERS.map((filter) => {
          const count = statusCounts[filter.value];
          const isSelected = statusFilter === filter.value;

          return (
            <Chip
              key={filter.value}
              label={`${filter.label}${count > 0 ? ` (${count})` : ''}`}
              onClick={() => setStatusFilter(filter.value)}
              color={isSelected ? 'primary' : 'default'}
              variant={isSelected ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
          );
        })}
      </Stack>

      {/* Reservation List */}
      {tab === 0
        ? renderReservationList(filteredBorrowerReservations, false)
        : renderReservationList(filteredLenderReservations, true)}

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
              <strong>{actionDialog.reservation?.tool?.name}</strong>.
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
