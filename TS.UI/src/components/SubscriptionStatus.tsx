import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  useSubscriptionStatus,
  useCreateCheckout,
  useGetPortal,
  getSubscriptionStatusLabel,
  getSubscriptionStatusColor,
} from '../hooks/useSubscription';

interface SubscriptionStatusProps {
  showCard?: boolean;
}

export default function SubscriptionStatus({ showCard = true }: SubscriptionStatusProps) {
  const { data: subscription, isLoading, error } = useSubscriptionStatus();
  const createCheckout = useCreateCheckout();
  const getPortal = useGetPortal();

  const handleSubscribe = () => {
    createCheckout.mutate();
  };

  const handleManageSubscription = () => {
    getPortal.mutate();
  };

  // Loading state
  if (isLoading) {
    return showCard ? (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={150} height={32} />
          <Skeleton variant="text" width={200} height={24} />
          <Skeleton variant="rectangular" width={150} height={36} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    ) : (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="text" width={100} />
      </Box>
    );
  }

  // Error state
  if (error || !subscription) {
    return showCard ? (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load subscription status. Please refresh the page.
          </Alert>
        </CardContent>
      </Card>
    ) : null;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Inline chip view (for profile header)
  if (!showCard) {
    return (
      <Chip
        label={getSubscriptionStatusLabel(subscription.status)}
        color={getSubscriptionStatusColor(subscription.status)}
        size="small"
        icon={
          subscription.status === 'active' ? (
            <CheckCircleIcon />
          ) : subscription.isInGracePeriod ? (
            <WarningIcon />
          ) : undefined
        }
      />
    );
  }

  // Full card view
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Subscription
          </Typography>
          <Chip
            label={getSubscriptionStatusLabel(subscription.status)}
            color={getSubscriptionStatusColor(subscription.status)}
            icon={
              subscription.status === 'active' ? (
                <CheckCircleIcon />
              ) : subscription.isInGracePeriod ? (
                <WarningIcon />
              ) : undefined
            }
          />
        </Box>

        {/* Grace period warning */}
        {subscription.isInGracePeriod && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Your subscription has ended but you have a 7-day grace period to renew.
            {subscription.subscriptionEndsAt && (
              <> Access will be restricted after the grace period.</>
            )}
          </Alert>
        )}

        {/* Past due warning */}
        {subscription.status === 'past_due' && !subscription.isInGracePeriod && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Your payment is past due. Please update your payment method to continue using Tool Share.
          </Alert>
        )}

        {/* Cancelled warning */}
        {subscription.status === 'cancelled' && subscription.canAccessFeatures && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Your subscription has been cancelled. You can continue using Tool Share until{' '}
            {formatDate(subscription.subscriptionEndsAt)}.
          </Alert>
        )}

        {/* Access blocked warning */}
        {!subscription.canAccessFeatures && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Your subscription has expired. Please subscribe to continue using Tool Share.
          </Alert>
        )}

        {/* Subscription details */}
        {subscription.status === 'trial' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              You are currently on a free trial. Subscribe to unlock all features!
            </Typography>
          </Box>
        )}

        {subscription.status === 'active' && subscription.subscriptionEndsAt && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Next billing date: {formatDate(subscription.subscriptionEndsAt)}
            </Typography>
          </Box>
        )}

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {(subscription.status === 'trial' || subscription.status === 'none' || !subscription.canAccessFeatures) && (
            <Button
              variant="contained"
              color="primary"
              startIcon={createCheckout.isPending ? <CircularProgress size={20} color="inherit" /> : <CreditCardIcon />}
              onClick={handleSubscribe}
              disabled={createCheckout.isPending}
            >
              {createCheckout.isPending ? 'Loading...' : 'Subscribe Now'}
            </Button>
          )}

          {subscription.stripeCustomerId && subscription.status !== 'none' && (
            <Button
              variant={subscription.status === 'trial' ? 'outlined' : 'contained'}
              startIcon={getPortal.isPending ? <CircularProgress size={20} /> : <CreditCardIcon />}
              onClick={handleManageSubscription}
              disabled={getPortal.isPending}
            >
              {getPortal.isPending ? 'Loading...' : 'Manage Subscription'}
            </Button>
          )}
        </Box>

        {/* Error messages */}
        {createCheckout.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to create checkout session. Please try again.
          </Alert>
        )}
        {getPortal.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to open subscription portal. Please try again.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
