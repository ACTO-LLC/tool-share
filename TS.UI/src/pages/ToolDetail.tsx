import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  Avatar,
  Rating,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Skeleton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowBack,
  LocationOn,
  Schedule,
  CalendarMonth,
  Person,
  CheckCircle,
  Block,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, differenceInDays, format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toolsApi, reservationApi, Tool } from '../services/api';

// Fallback to mock data when API unavailable
import { mockTools, mockCurrentUser } from '../data/mockData';
import { Tool as MockTool } from '../types';

// Flag to enable/disable mock data fallback
const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export default function ToolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  // Dialog state
  const [reserveOpen, setReserveOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [note, setNote] = useState('');

  // Photo state
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Fetch tool data from API
  const {
    data: apiTool,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tool', id],
    queryFn: () => toolsApi.get(id!),
    enabled: !!id,
    retry: USE_MOCK_FALLBACK ? 1 : 3,
  });

  // Fallback to mock data
  const mockTool = USE_MOCK_FALLBACK
    ? (mockTools.find((t) => t.id === id) as MockTool | undefined)
    : undefined;

  const shouldUseMock = USE_MOCK_FALLBACK && (isError || !apiTool);
  const tool = shouldUseMock ? (mockTool as unknown as Tool) : apiTool;

  // Create reservation mutation
  const createReservation = useMutation({
    mutationFn: (data: { toolId: string; startDate: string; endDate: string; note?: string }) =>
      reservationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setReserveOpen(false);
      setStartDate(null);
      setEndDate(null);
      setNote('');
      setSnackbar({
        open: true,
        message: 'Reservation request sent! The owner will review your request.',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to create reservation. Please try again.',
        severity: 'error',
      });
    },
  });

  // Reset selected photo when tool changes
  useEffect(() => {
    setSelectedPhoto(0);
  }, [id]);

  // Validation
  const isOwnTool = tool?.ownerId === mockCurrentUser.id;
  const isAvailable = tool?.status === 'available';
  const minStartDate = addDays(new Date(), tool?.advanceNoticeDays || 1);
  const maxEndDate = startDate
    ? addDays(startDate, tool?.maxLoanDays || 14)
    : null;
  const loanDuration =
    startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;

  const handleReserveSubmit = () => {
    if (!startDate || !endDate || !id) return;

    createReservation.mutate({
      toolId: id,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      note: note || undefined,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2, minHeight: 48 }}
        >
          Back
        </Button>
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={isMobile ? 250 : 400} />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" width={60} height={60} />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" width="80%" height={48} />
            <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={150} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Not found state
  if (!tool) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2, minHeight: 48 }}
        >
          Back
        </Button>
        <Alert severity="error">
          Tool not found. It may have been removed or the link is incorrect.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/browse')}
          sx={{ mt: 2, minHeight: 48 }}
        >
          Browse Tools
        </Button>
      </Box>
    );
  }

  const photos = tool.photos || [];
  const primaryPhoto = photos[selectedPhoto]?.url;

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, minHeight: 48 }}
      >
        Back
      </Button>

      {/* Mock data warning */}
      {shouldUseMock && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing sample data. Connect to the API for live data.
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Photo Gallery */}
        <Grid item xs={12} md={6}>
          {/* Main Photo */}
          <Box
            sx={{
              height: { xs: 250, sm: 350, md: 400 },
              bgcolor: 'grey.200',
              borderRadius: 1,
              backgroundImage: primaryPhoto ? `url(${primaryPhoto})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!primaryPhoto && (
              <Typography color="text.secondary">No photo available</Typography>
            )}
          </Box>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mt: 1,
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': {
                  height: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'grey.400',
                  borderRadius: 3,
                },
              }}
            >
              {photos.map((photo, index) => (
                <Box
                  key={photo.id}
                  onClick={() => setSelectedPhoto(index)}
                  sx={{
                    width: { xs: 60, sm: 80 },
                    height: { xs: 60, sm: 80 },
                    flexShrink: 0,
                    bgcolor: 'grey.300',
                    borderRadius: 1,
                    backgroundImage: `url(${photo.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    border: selectedPhoto === index ? 3 : 0,
                    borderColor: 'primary.main',
                    opacity: selectedPhoto === index ? 1 : 0.7,
                    '&:hover': { opacity: 1 },
                    transition: 'opacity 0.2s',
                  }}
                />
              ))}
            </Box>
          )}
        </Grid>

        {/* Tool Info */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ flexGrow: 1, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              {tool.name}
            </Typography>
            <Chip
              icon={isAvailable ? <CheckCircle /> : <Block />}
              label={isAvailable ? 'Available' : 'Unavailable'}
              color={isAvailable ? 'success' : 'default'}
              sx={{ minHeight: { xs: 32, sm: 28 } }}
            />
          </Box>

          {/* Category & Brand */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={tool.category} size="small" />
            {tool.brand && (
              <Typography variant="body1" color="text.secondary" component="span" sx={{ alignSelf: 'center' }}>
                {tool.brand} {tool.model}
              </Typography>
            )}
          </Box>

          {/* Description */}
          {tool.description && (
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {tool.description}
            </Typography>
          )}

          {/* Loan Details */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 2 } }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Loan Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Advance Notice
                      </Typography>
                      <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        {tool.advanceNoticeDays} day{tool.advanceNoticeDays !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Max Loan
                      </Typography>
                      <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        {tool.maxLoanDays} days
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Owner Info */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 2 } }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Owner
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Avatar
                  src={tool.owner?.avatarUrl}
                  sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}
                >
                  {tool.owner?.displayName?.charAt(0)}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 120 }}>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {tool.owner?.displayName}
                  </Typography>
                  {tool.owner?.reputationScore !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Rating
                        value={tool.owner.reputationScore}
                        precision={0.1}
                        size="small"
                        readOnly
                      />
                      <Typography variant="body2" color="text.secondary">
                        ({tool.owner.reputationScore?.toFixed(1)})
                      </Typography>
                    </Box>
                  )}
                  {tool.owner?.city && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <LocationOn sx={{ fontSize: 16 }} color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {tool.owner.city}, {tool.owner.state}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Person />}
                  onClick={() => navigate(`/users/${tool.owner?.id || tool.ownerId}`)}
                  sx={{ minHeight: { xs: 40, sm: 36 } }}
                >
                  Profile
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {isOwnTool ? (
              <Button
                variant="contained"
                fullWidth={isMobile}
                onClick={() => navigate(`/my-tools/${id}/edit`)}
                sx={{ minHeight: 48 }}
              >
                Edit Tool
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth={isMobile}
                disabled={!isAvailable}
                onClick={() => setReserveOpen(true)}
                sx={{ minHeight: 48 }}
              >
                Request to Borrow
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Reserve Dialog */}
      <Dialog
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Request to Borrow</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select your preferred dates for borrowing "{tool.name}". The owner will
            review your request.
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    // Reset end date if it's now invalid
                    if (date && endDate && endDate < date) {
                      setEndDate(null);
                    }
                  }}
                  minDate={minStartDate}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: `Must request ${tool.advanceNoticeDays} day(s) in advance`,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate || minStartDate}
                  maxDate={maxEndDate || undefined}
                  disabled={!startDate}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: `Max loan period: ${tool.maxLoanDays} days`,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>

          {loanDuration > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Loan duration: {loanDuration} day{loanDuration !== 1 ? 's' : ''}
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Message to Owner (optional)"
            placeholder="Introduce yourself and explain what you'll use the tool for..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button onClick={() => setReserveOpen(false)} sx={{ minHeight: 48, width: { xs: '100%', sm: 'auto' } }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReserveSubmit}
            disabled={!startDate || !endDate || createReservation.isPending}
            sx={{ minHeight: 48, width: { xs: '100%', sm: 'auto' } }}
          >
            {createReservation.isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Send Request'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
