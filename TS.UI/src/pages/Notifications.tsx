import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Chip,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Star,
  PlayArrow,
  Handyman,
  AccessTime,
  MarkEmailRead,
  FilterList,
  Refresh,
  NotificationsOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import {
  notificationApi,
  Notification,
  NotificationType,
  ApiError,
} from '../services/api';

// Check if we should use real API
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

// Mock notifications for development
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'mock-user-id',
    type: 'reservation_request',
    title: 'New Reservation Request',
    message: 'John Doe wants to borrow your DeWalt Drill from Jan 20 to Jan 25.',
    relatedId: 'mock-reservation-1',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'mock-user-id',
    type: 'reservation_approved',
    title: 'Reservation Approved',
    message: 'Jane Smith approved your request to borrow the Makita Circular Saw.',
    relatedId: 'mock-reservation-2',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    userId: 'mock-user-id',
    type: 'review_received',
    title: 'New Review Received',
    message: 'Bob Wilson left you a 5-star review.',
    relatedId: 'mock-reservation-3',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4',
    userId: 'mock-user-id',
    type: 'pickup_reminder',
    title: 'Pickup Reminder',
    message: 'Remember to pick up the Power Drill tomorrow!',
    relatedId: 'mock-reservation-4',
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '5',
    userId: 'mock-user-id',
    type: 'return_reminder',
    title: 'Return Reminder',
    message: 'The Circular Saw is due for return in 2 days.',
    relatedId: 'mock-reservation-5',
    isRead: false,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '6',
    userId: 'mock-user-id',
    type: 'loan_started',
    title: 'Loan Started',
    message: 'Your ladder has been picked up by Mike Johnson.',
    relatedId: 'mock-reservation-6',
    isRead: true,
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: '7',
    userId: 'mock-user-id',
    type: 'loan_completed',
    title: 'Loan Completed',
    message: 'Sarah Williams has returned your Angle Grinder.',
    relatedId: 'mock-reservation-7',
    isRead: true,
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: '8',
    userId: 'mock-user-id',
    type: 'reservation_declined',
    title: 'Reservation Declined',
    message: 'Tom Brown declined your request for the Table Saw.',
    relatedId: 'mock-reservation-8',
    isRead: true,
    createdAt: new Date(Date.now() - 518400000).toISOString(),
  },
];

// Notification type filter options
type FilterType = 'all' | 'requests' | 'approvals' | 'reminders' | 'reviews';

const ITEMS_PER_PAGE = 10;

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'reservation_request':
      return <HourglassEmpty color="warning" />;
    case 'reservation_approved':
      return <CheckCircle color="success" />;
    case 'reservation_declined':
      return <Cancel color="error" />;
    case 'reservation_cancelled':
      return <Cancel color="error" />;
    case 'pickup_reminder':
      return <AccessTime color="info" />;
    case 'return_reminder':
      return <AccessTime color="warning" />;
    case 'loan_started':
      return <PlayArrow color="info" />;
    case 'loan_completed':
      return <Handyman color="success" />;
    case 'review_received':
      return <Star color="primary" />;
    default:
      return <NotificationsIcon />;
  }
}

function formatNotificationTime(dateStr: string): string {
  const date = parseISO(dateStr);

  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  } else if (isYesterday(date)) {
    return 'Yesterday';
  }

  return format(date, 'MMM d, yyyy');
}

function getFilterTypes(filter: FilterType): NotificationType[] {
  switch (filter) {
    case 'requests':
      return ['reservation_request'];
    case 'approvals':
      return ['reservation_approved', 'reservation_declined', 'reservation_cancelled'];
    case 'reminders':
      return ['pickup_reminder', 'return_reminder', 'loan_started', 'loan_completed'];
    case 'reviews':
      return ['review_received'];
    default:
      return [];
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_REAL_API) {
        // Fetch a larger set of notifications for pagination
        const response = await notificationApi.list(100);
        setNotifications(response.items);
      } else {
        // Use mock data
        setNotifications(mockNotifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Filter notifications based on selected filter
  const filteredNotifications = useMemo(() => {
    if (filter === 'all') {
      return notifications;
    }
    const filterTypes = getFilterTypes(filter);
    return notifications.filter((n) => filterTypes.includes(n.type));
  }, [notifications, filter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNotifications, page]);

  // Unread count for current filter
  const unreadCount = useMemo(() => {
    return filteredNotifications.filter((n) => !n.isRead).length;
  }, [filteredNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        if (USE_REAL_API) {
          await notificationApi.markAsRead(notification.id);
        }
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // Navigate to related item
    if (notification.relatedId) {
      navigate(`/reservations/${notification.relatedId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      if (USE_REAL_API) {
        await notificationApi.markAllAsRead();
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleFilterChange = (_: React.SyntheticEvent, newValue: FilterType) => {
    setFilter(newValue);
    setPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4">Notifications</Typography>
        </Box>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 3 }} />
        <Card>
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Skeleton variant="rectangular" height={80} />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Notifications
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadNotifications}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4">Notifications</Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} unread`}
              color="primary"
              size="small"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadNotifications}>
              <Refresh />
            </IconButton>
          </Tooltip>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? 'Marking...' : 'Mark all as read'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={filter}
          onChange={handleFilterChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<FilterList />}
            iconPosition="start"
            label="All"
            value="all"
          />
          <Tab
            icon={<HourglassEmpty />}
            iconPosition="start"
            label="Requests"
            value="requests"
          />
          <Tab
            icon={<CheckCircle />}
            iconPosition="start"
            label="Approvals"
            value="approvals"
          />
          <Tab
            icon={<AccessTime />}
            iconPosition="start"
            label="Reminders"
            value="reminders"
          />
          <Tab
            icon={<Star />}
            iconPosition="start"
            label="Reviews"
            value="reviews"
          />
        </Tabs>
      </Card>

      {/* Notification List */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <NotificationsOff sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filter === 'all'
                  ? "You don't have any notifications yet."
                  : `No ${filter} notifications found.`}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {paginatedNotifications.map((notification, index) => (
                <Box key={notification.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      py: 2,
                      px: 3,
                      cursor: 'pointer',
                      borderLeft: notification.isRead ? 'none' : '4px solid',
                      borderColor: 'primary.main',
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 48 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
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
                            variant="subtitle1"
                            sx={{
                              fontWeight: notification.isRead ? 'normal' : 'bold',
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.isRead && (
                            <Chip
                              label="New"
                              size="small"
                              color="primary"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ mt: 0.5, display: 'block' }}
                          >
                            {formatNotificationTime(notification.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 2,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Card>

      {/* Summary */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {paginatedNotifications.length} of {filteredNotifications.length} notifications
        </Typography>
      </Box>
    </Box>
  );
}
