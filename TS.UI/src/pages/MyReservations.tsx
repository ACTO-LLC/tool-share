import { useState, useMemo } from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Handyman,
  CalendarMonth,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Search,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import {
  mockCurrentUser,
  getReservationsByBorrower,
  getReservationsForOwner,
} from '../data/mockData';
import { Reservation, ReservationStatus } from '../types';

export default function MyReservations() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'decline' | 'cancel' | null;
    reservation: Reservation | null;
  }>({ open: false, action: null, reservation: null });
  const [ownerNote, setOwnerNote] = useState('');

  // Get reservations where I'm the borrower
  const borrowerReservations = useMemo(
    () => getReservationsByBorrower(mockCurrentUser.id),
    []
  );

  // Get reservations for tools I own
  const lenderReservations = useMemo(
    () => getReservationsForOwner(mockCurrentUser.id),
    []
  );

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
      case 'cancelled':
      case 'declined':
        return <Cancel fontSize="small" />;
      default:
        return null;
    }
  };

  const handleAction = (
    action: 'approve' | 'decline' | 'cancel',
    reservation: Reservation
  ) => {
    setActionDialog({ open: true, action, reservation });
    setOwnerNote('');
  };

  const handleConfirmAction = () => {
    // In a real app, this would call the API
    console.log('Action:', actionDialog.action, 'Reservation:', actionDialog.reservation?.id, 'Note:', ownerNote);
    setActionDialog({ open: false, action: null, reservation: null });
  };

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

    // Group by status
    const pending = reservations.filter((r) => r.status === 'pending');
    const active = reservations.filter((r) =>
      ['confirmed', 'active'].includes(r.status)
    );
    const past = reservations.filter((r) =>
      ['completed', 'cancelled', 'declined'].includes(r.status)
    );

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
                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
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
                      {!isLender &&
                        ['pending', 'confirmed'].includes(reservation.status) && (
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
          pending,
          true
        )}
        {renderGroup('Active & Upcoming', active)}
        {renderGroup('Past', past)}
      </>
    );
  };

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
              {borrowerReservations.filter((r) => r.status === 'pending')
                .length > 0 && (
                <Chip
                  label={
                    borrowerReservations.filter((r) => r.status === 'pending')
                      .length
                  }
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
              {lenderReservations.filter((r) => r.status === 'pending').length >
                0 && (
                <Chip
                  label={
                    lenderReservations.filter((r) => r.status === 'pending')
                      .length
                  }
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
          setActionDialog({ open: false, action: null, reservation: null })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.action === 'approve' && 'Approve Reservation'}
          {actionDialog.action === 'decline' && 'Decline Reservation'}
          {actionDialog.action === 'cancel' && 'Cancel Reservation'}
        </DialogTitle>
        <DialogContent>
          {actionDialog.action === 'approve' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              You are approving the reservation for{' '}
              <strong>{actionDialog.reservation?.tool?.name}</strong> from{' '}
              {format(
                parseISO(actionDialog.reservation?.startDate || ''),
                'MMM d'
              )}{' '}
              to{' '}
              {format(
                parseISO(actionDialog.reservation?.endDate || ''),
                'MMM d, yyyy'
              )}
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
              Are you sure you want to cancel this reservation? The owner will
              be notified.
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label={actionDialog.action === 'cancel' ? 'Reason (optional)' : 'Note to borrower (optional)'}
            value={ownerNote}
            onChange={(e) => setOwnerNote(e.target.value)}
            placeholder={
              actionDialog.action === 'approve'
                ? 'e.g., Pickup instructions, special notes...'
                : actionDialog.action === 'decline'
                  ? 'e.g., Already reserved, tool needs repair...'
                  : 'Let the owner know why you are cancelling...'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setActionDialog({ open: false, action: null, reservation: null })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={
              actionDialog.action === 'approve'
                ? 'success'
                : actionDialog.action === 'decline'
                  ? 'error'
                  : 'error'
            }
            onClick={handleConfirmAction}
          >
            {actionDialog.action === 'approve' && 'Approve'}
            {actionDialog.action === 'decline' && 'Decline'}
            {actionDialog.action === 'cancel' && 'Cancel Reservation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
