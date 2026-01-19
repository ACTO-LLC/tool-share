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
import { mockTools, mockReservations, mockCurrentUser } from '../data/mockData';

export default function ToolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [reservationNote, setReservationNote] = useState('');
  const [reservationSuccess, setReservationSuccess] = useState(false);

  // Find the tool
  const tool = mockTools.find((t) => t.id === id);

  // Get existing reservations for this tool
  const toolReservations = useMemo(() => {
    return mockReservations.filter(
      (r) => r.toolId === id && ['confirmed', 'active', 'pending'].includes(r.status)
    );
  }, [id]);

  // Convert reservations to calendar events
  const calendarEvents = useMemo(() => {
    return toolReservations.map((r) => ({
      id: r.id,
      title: r.status === 'pending' ? 'Pending' : 'Reserved',
      start: r.startDate,
      end: addDays(parseISO(r.endDate), 1).toISOString().split('T')[0], // FullCalendar end is exclusive
      backgroundColor: r.status === 'pending' ? '#ff9800' : '#f44336',
      borderColor: r.status === 'pending' ? '#ff9800' : '#f44336',
    }));
  }, [toolReservations]);

  const isOwner = tool?.ownerId === mockCurrentUser.id;

  const handleDateSelect = (selectInfo: { start: Date; end: Date }) => {
    // End date from FullCalendar is exclusive, so subtract 1 day for display
    const endDate = addDays(selectInfo.end, -1);
    const days = differenceInDays(endDate, selectInfo.start) + 1;

    if (tool && days > tool.maxLoanDays) {
      alert(`Maximum loan period is ${tool.maxLoanDays} days`);
      return;
    }

    setSelectedDates({ start: selectInfo.start, end: endDate });
    setReserveDialogOpen(true);
  };

  const handleReservationSubmit = () => {
    // In a real app, this would call the API
    console.log('Reservation submitted:', {
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
  };

  if (!tool) {
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">{tool.name}</Typography>
        <Chip
          label={tool.status}
          color={tool.status === 'available' ? 'success' : 'default'}
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
                backgroundImage: tool.photos?.[0]?.url
                  ? `url(${tool.photos[0].url})`
                  : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!tool.photos?.[0]?.url && (
                <Handyman sx={{ fontSize: 80, color: 'grey.400' }} />
              )}
            </Box>
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
                  <Chip label={tool.category} size="small" sx={{ mt: 0.5 }} />
                </Grid>
                {tool.brand && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Brand
                    </Typography>
                    <Typography variant="body1">{tool.brand}</Typography>
                  </Grid>
                )}
                {tool.model && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Model
                    </Typography>
                    <Typography variant="body1">{tool.model}</Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Max Loan Period
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Timer fontSize="small" color="action" />
                    <Typography variant="body1">
                      {tool.maxLoanDays} days
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
                      {tool.advanceNoticeDays} day{tool.advanceNoticeDays > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {tool.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1">{tool.description}</Typography>
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
                <Avatar sx={{ width: 56, height: 56 }} src={tool.owner?.avatarUrl}>
                  {tool.owner?.displayName?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1">
                    {tool.owner?.displayName}
                  </Typography>
                  {tool.owner?.reputationScore && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating
                        value={tool.owner.reputationScore}
                        size="small"
                        precision={0.1}
                        readOnly
                      />
                      <Typography variant="body2" color="text.secondary">
                        ({tool.owner.reputationScore.toFixed(1)})
                      </Typography>
                    </Box>
                  )}
                  {tool.owner?.city && (
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
                        {tool.owner.city}, {tool.owner.state}
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
                  Select dates on the calendar to request a reservation. Red
                  dates are already reserved.
                </Alert>
              )}
              <Box sx={{ '& .fc': { fontSize: '0.875rem' } }}>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  selectable={!isOwner && tool.status === 'available'}
                  select={handleDateSelect}
                  events={calendarEvents}
                  validRange={{
                    start: addDays(new Date(), tool.advanceNoticeDays),
                  }}
                  selectConstraint={{
                    start: addDays(new Date(), tool.advanceNoticeDays),
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
        onClose={() => !reservationSuccess && setReserveDialogOpen(false)}
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
                  {tool.name}
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
              />
              <Alert severity="warning" sx={{ mt: 2 }}>
                By requesting this tool, you agree to return it in the same
                condition and are responsible for any damages.
              </Alert>
            </>
          )}
        </DialogContent>
        {!reservationSuccess && (
          <DialogActions>
            <Button onClick={() => setReserveDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleReservationSubmit}>
              Request Reservation
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}
