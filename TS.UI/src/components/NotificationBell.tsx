import { useState, useEffect, useCallback } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Button,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Star,
  PlayArrow,
  Handyman,
  AccessTime,
  MarkEmailRead,
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
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: '3',
    userId: 'mock-user-id',
    type: 'review_received',
    title: 'New Review Received',
    message: 'Bob Wilson left you a 5-star review.',
    relatedId: 'mock-reservation-3',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
];

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

export default function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_REAL_API) {
        const response = await notificationApi.list(10);
        setNotifications(response.items);
        setUnreadCount(response.unreadCount);
      } else {
        // Use mock data
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
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

  // Load notifications periodically
  useEffect(() => {
    loadNotifications();

    // Poll for new notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    loadNotifications(); // Refresh when opening
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        if (USE_REAL_API) {
          await notificationApi.markAsRead(notification.id);
        }
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // Navigate to related item
    if (notification.relatedId) {
      // Most notifications relate to reservations
      navigate(`/reservations/${notification.relatedId}`);
    }

    handleClose();
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (USE_REAL_API) {
        await notificationApi.markAllAsRead();
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpen}
          sx={{ color: 'inherit', ml: 1 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? (
              <NotificationsActive />
            ) : (
              <NotificationsIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </Box>

        <Divider />

        {loading && notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                py: 1.5,
                px: 2,
                borderLeft: notification.isRead ? 'none' : '3px solid',
                borderColor: 'primary.main',
                bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {getNotificationIcon(notification.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                  >
                    {notification.title}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatNotificationTime(notification.createdAt)}
                    </Typography>
                  </Box>
                }
              />
            </MenuItem>
          ))
        )}

        {notifications.length > 0 && [
          <Divider key="view-all-divider" />,
          <Box key="view-all-box" sx={{ p: 1, textAlign: 'center' }}>
            <Button
              size="small"
              onClick={() => {
                navigate('/notifications');
                handleClose();
              }}
            >
              View all notifications
            </Button>
          </Box>,
        ]}
      </Menu>
    </>
  );
}
