import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Rating,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  IconButton,
  CircularProgress,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowBack,
  LocationOn,
  CalendarMonth,
  Timer,
  Handyman,
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toolsApi, reservationApi, Tool as ApiTool } from '../services/api';

// Mock data for fallback
import { mockTools, mockReservations, mockCurrentUser } from '../data/mockData';
import { Tool as MockTool, Reservation as MockReservation } from '../types';

// Flag to enable/disable mock data fallback
const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export default function ToolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [reservationNote, setReservationNote] = useState('');
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Fetch tool from API
  const {
    data: tool,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tool', id],
    queryFn: () => toolsApi.get(id!),
    enabled: !!id,
    retry: USE_MOCK_FALLBACK ? 1 : 3,
  });

  // Fetch reservations for this tool
  const { data: reservationsData } = useQuery({
    queryKey: ['reservations', 'tool', id],
    queryFn: () => reservationApi.list({ role: 'all' }),
    enabled: !!id,
    retry: USE_MOCK_FALLBACK ? 1 : 3,
  });

  // Create reservation mutation
  const createReservationMutation = useMutation({
    mutationFn: reservationApi.create,
    onSuccess: () => {
      setReservationSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setTimeout(() => {
        setReserveDialogOpen(false);
        setReservationSuccess(false);
        setReservationNote('');
        setSelectedDates({ start: null, end: null });
      }, 2000);
    },
  });

  // Handle mock data fallback
  const mockTool = useMemo(() => {
    if (!USE_MOCK_FALLBACK) return null;
    return mockTools.find((t: MockTool) => t.id === id) || null;
  }, [id]);

  const mockToolReservations = useMemo(() => {
    if (!USE_MOCK_FALLBACK) return [];
    return mockReservations.filter(
      (r: MockReservation) =>
        r.toolId === id && ['confirmed', 'active', 'pending'].includes(r.status)
    );
  }, [id]);

  // Determine which data to use
  const shouldUseMock = USE_MOCK_FALLBACK && (isError || !tool);
  const displayTool = shouldUseMock ? (mockTool as unknown as ApiTool) : tool;

  // Filter reservations for this tool
  const toolReservations = useMemo(() => {
    if (shouldUseMock) {
      return mockToolReservations;
    }
    if (!reservationsData?.items) return [];
    return reservationsData.items.filter(
      r => r.toolId === id && ['confirmed', 'active', 'pending'].includes(r.status)
    );
  }, [shouldUseMock, mockToolReservations, reservationsData, id]);

  // Color scheme for calendar events based on status
  const eventColors = {
    pending: { background: '#ff9800', border: '#f57c00', text: 'Pending' },     // Yellow/Orange
    confirmed: { background: '#2196f3', border: '#1976d2', text: 'Confirmed' }, // Blue
    active: { background: '#2196f3', border: '#1976d2', text: 'Active' },       // Blue
    unavailable: { background: '#9e9e9e', border: '#757575', text: 'Blocked' }, // Gray
  };

  // Convert reservations to calendar events with color coding
  const calendarEvents = useMemo(() => {
    const events = toolReservations.map((r) => {
      const colorScheme = eventColors[r.status as keyof typeof eventColors] || eventColors.confirmed;
      return {
        id: r.id,
        title: colorScheme.text,
        start: r.startDate,
        end: addDays(parseISO(r.endDate), 1).toISOString().split('T')[0], // FullCalendar end is exclusive
        backgroundColor: colorScheme.background,
        borderColor: colorScheme.border,
        textColor: '#ffffff',
      };
    });

    // Add owner's blocked dates if tool has them
    // Check if tool has blockedDates property (may be added via API extension)
    const toolWithBlocked = displayTool as ApiTool & { blockedDates?: Array<{ start: string; end: string }> };
    if (toolWithBlocked?.blockedDates && Array.isArray(toolWithBlocked.blockedDates)) {
      toolWithBlocked.blockedDates.forEach((blocked, index) => {
        events.push({
          id: `blocked-${index}`,
          title: 'Blocked',
          start: blocked.start,
          end: addDays(parseISO(blocked.end), 1).toISOString().split('T')[0],
          backgroundColor: eventColors.unavailable.background,
          borderColor: eventColors.unavailable.border,
          textColor: '#ffffff',
        });
      });
    }

    return events;
  }, [toolReservations, displayTool]);

  // TODO: Replace with actual current user check
  const isOwner = displayTool?.ownerId === mockCurrentUser.id;

  const handleDateSelect = (selectInfo: { start: Date; end: Date }) => {
    if (!displayTool) return;

    // End date from FullCalendar is exclusive, so subtract 1 day for display
    const endDate = addDays(selectInfo.end, -1);
    const days = differenceInDays(endDate, selectInfo.start) + 1;

    if (days > displayTool.maxLoanDays) {
      alert(`Maximum loan period is ${displayTool.maxLoanDays} days`);
      return;
    }

    setSelectedDates({ start: selectInfo.start, end: endDate });
    setReserveDialogOpen(true);
  };

  const handleReservationSubmit = () => {
    if (!id || !selectedDates.start || !selectedDates.end) return;

    if (shouldUseMock) {
      // Mock submission
      console.log('Reservation submitted (mock):', {
        toolId: id,
        startDate: selectedDates.start,
        endDate: selectedDates.end,
        note: reservationNote,
      });
      setReservationSuccess(true);
      setTimeout(() => {
        setReserveDialogOpen(false);
        setReservationSuccess(false);
        setReservationNote('');
      }, 2000);
    } else {
      // Real API call
      createReservationMutation.mutate({
        toolId: id,
        startDate: format(selectedDates.start, 'yyyy-MM-dd'),
        endDate: format(selectedDates.end, 'yyyy-MM-dd'),
        note: reservationNote || undefined,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Not found state
  if (!displayTool) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Handyman sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Tool not found
        </Typography>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  // Get photos array with primary first
  const photos = displayTool.photos?.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)) || [];
  const primaryPhoto = photos[selectedPhotoIndex]?.url || photos[0]?.url;

  return (
    <Box>
      {/* Mock Data Warning */}
      {shouldUseMock && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing sample data. Connect to the API for live data.
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">{displayTool.name}</Typography>
        <Chip
          label={displayTool.status}
          color={displayTool.status === 'available' ? 'success' : 'default'}
          sx={{ ml: 2 }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Tool Info */}
        <Grid item xs={12} md={5}>
          {/* Tool Image */}
          <Card sx={{ mb: 3 }}>
            <Box
              sx={{
                height: 300,
                bgcolor: 'grey.200',
                backgroundImage: primaryPhoto
                  ? `url(${primaryPhoto})`
                  : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!primaryPhoto && (
                <Handyman sx={{ fontSize: 80, color: 'grey.400' }} />
              )}
            </Box>
            {/* Photo thumbnails */}
            {photos.length > 1 && (
              <ImageList sx={{ m: 1 }} cols={5} rowHeight={60}>
                {photos.map((photo, index) => (
                  <ImageListItem
                    key={photo.id}
                    sx={{
                      cursor: 'pointer',
                      border: index === selectedPhotoIndex ? 2 : 0,
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                    onClick={() => setSelectedPhotoIndex(index)}
                  >
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      loading="lazy"
                      style={{ objectFit: 'cover', height: '100%' }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Card>

          {/* Tool Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Category
                  </Typography>
                  <Chip label={displayTool.category} size="small" sx={{ mt: 0.5 }} />
                </Grid>
                {displayTool.brand && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Brand
                    </Typography>
                    <Typography variant="body1">{displayTool.brand}</Typography>
                  </Grid>
                )}
                {displayTool.model && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Model
                    </Typography>
                    <Typography variant="body1">{displayTool.model}</Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Max Loan Period
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Timer fontSize="small" color="action" />
                    <Typography variant="body1">
                      {displayTool.maxLoanDays} days
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Advance Notice
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarMonth fontSize="small" color="action" />
                    <Typography variant="body1">
                      {displayTool.advanceNoticeDays} day{displayTool.advanceNoticeDays > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {displayTool.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1">{displayTool.description}</Typography>
                </>
              )}
            </CardContent>
          </Card>

          {/* Owner Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Owner
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 56, height: 56 }} src={displayTool.owner?.avatarUrl}>
                  {displayTool.owner?.displayName?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1">
                    {displayTool.owner?.displayName}
                  </Typography>
                  {displayTool.owner?.reputationScore && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating
                        value={displayTool.owner.reputationScore}
                        size="small"
                        precision={0.1}
                        readOnly
                      />
                      <Typography variant="body2" color="text.secondary">
                        ({displayTool.owner.reputationScore.toFixed(1)})
                      </Typography>
                    </Box>
                  )}
                  {displayTool.owner?.city && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: 'text.secondary',
                        mt: 0.5,
                      }}
                    >
                      <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2">
                        {displayTool.owner.city}, {displayTool.owner.state}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Calendar */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Availability Calendar
              </Typography>
              {isOwner ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This is your tool. You can manage reservations from the
                  Reservations page.
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Click and drag on the calendar to select dates for your reservation request.
                </Alert>
              )}
              {/* Calendar Legend */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: 0.5 }} />
                  <Typography variant="caption">Available</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', borderRadius: 0.5 }} />
                  <Typography variant="caption">Pending</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#2196f3', borderRadius: 0.5 }} />
                  <Typography variant="caption">Confirmed/Active</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#9e9e9e', borderRadius: 0.5 }} />
                  <Typography variant="caption">Blocked</Typography>
                </Box>
              </Box>
              <Box sx={{ '& .fc': { fontSize: '0.875rem' } }}>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  selectable={!isOwner && displayTool.status === 'available'}
                  select={handleDateSelect}
                  events={calendarEvents}
                  validRange={{
                    start: addDays(new Date(), displayTool.advanceNoticeDays),
                  }}
                  selectConstraint={{
                    start: addDays(new Date(), displayTool.advanceNoticeDays),
                  }}
                  selectOverlap={false}
                  height="auto"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: '',
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reservation Dialog */}
      <Dialog
        open={reserveDialogOpen}
        onClose={() => !reservationSuccess && !createReservationMutation.isPending && setReserveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Reservation</DialogTitle>
        <DialogContent>
          {reservationSuccess ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              Reservation request sent! The owner will review your request.
            </Alert>
          ) : (
            <>
              <Box sx={{ mb: 3, mt: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {displayTool.name}
                </Typography>
                <Typography color="text.secondary">
                  {selectedDates.start && selectedDates.end && (
                    <>
                      {format(selectedDates.start, 'MMMM d, yyyy')} -{' '}
                      {format(selectedDates.end, 'MMMM d, yyyy')}
                      <br />
                      <strong>
                        {differenceInDays(selectedDates.end, selectedDates.start) + 1}{' '}
                        day
                        {differenceInDays(selectedDates.end, selectedDates.start) > 0
                          ? 's'
                          : ''}
                      </strong>
                    </>
                  )}
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Note to owner (optional)"
                placeholder="Let the owner know what you'll be using this for..."
                value={reservationNote}
                onChange={(e) => setReservationNote(e.target.value)}
                disabled={createReservationMutation.isPending}
              />
              {createReservationMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Failed to create reservation. Please try again.
                </Alert>
              )}
              <Alert severity="warning" sx={{ mt: 2 }}>
                By requesting this tool, you agree to return it in the same
                condition and are responsible for any damages.
              </Alert>
            </>
          )}
        </DialogContent>
        {!reservationSuccess && (
          <DialogActions>
            <Button
              onClick={() => setReserveDialogOpen(false)}
              disabled={createReservationMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleReservationSubmit}
              disabled={createReservationMutation.isPending}
            >
              {createReservationMutation.isPending ? 'Submitting...' : 'Request Reservation'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}
