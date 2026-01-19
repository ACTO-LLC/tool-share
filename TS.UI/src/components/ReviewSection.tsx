import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Rating,
  TextField,
  Avatar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Star,
  RateReview,
  Person,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { Review, reservationApi, ApiError } from '../services/api';

// Check if we should use real API
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

interface ReviewSectionProps {
  reservationId: string;
  reservationStatus: string;
  currentUserId: string;
  isBorrower: boolean;
  isOwner: boolean;
  otherPartyId: string;
  otherPartyName: string;
  existingReviews: Review[];
  onReviewSubmitted: () => void;
}

export default function ReviewSection({
  reservationId,
  reservationStatus,
  currentUserId,
  isBorrower,
  // isOwner is available in props for future use
  otherPartyId,
  otherPartyName,
  existingReviews,
  onReviewSubmitted,
}: ReviewSectionProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if the current user has already submitted a review
  const userHasReviewed = existingReviews.some(
    (review) => review.reviewerId === currentUserId
  );

  // Can only review completed reservations
  const canReview = reservationStatus === 'completed' && !userHasReviewed;

  // Get the review left by the other party (if any)
  const otherPartyReview = existingReviews.find(
    (review) => review.reviewerId === otherPartyId
  );

  const handleSubmitReview = async () => {
    if (rating === null) {
      setError('Please select a rating.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (USE_REAL_API) {
        await reservationApi.submitReview(reservationId, rating, comment || undefined);
      } else {
        // Mock submit delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Mock review:', { reservationId, rating, comment });
      }

      setSuccess(true);
      setShowReviewForm(false);
      onReviewSubmitted();
    } catch (err) {
      console.error('Failed to submit review:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Only show for completed reservations
  if (reservationStatus !== 'completed') {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Star /> Reviews
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Review submitted successfully! Thank you for your feedback.
        </Alert>
      )}

      {/* Existing Reviews */}
      {existingReviews.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {existingReviews.map((review) => (
            <Card key={review.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar src={review.reviewer?.avatarUrl}>
                    {review.reviewer?.displayName?.[0] || <Person />}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2">
                        {review.reviewer?.displayName || 'Unknown'}
                      </Typography>
                      {review.reviewerId === currentUserId && (
                        <Chip label="You" size="small" variant="outlined" />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="caption" color="text.secondary">
                        {format(parseISO(review.createdAt), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                    {review.comment && (
                      <Typography variant="body2" color="text.secondary">
                        {review.comment}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Prompt to leave a review */}
      {canReview && !showReviewForm && (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: 'action.hover',
            borderStyle: 'dashed',
          }}
        >
          <RateReview sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            How was your experience?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isBorrower
              ? `Leave a review for ${otherPartyName} (the owner)`
              : `Leave a review for ${otherPartyName} (the borrower)`}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Star />}
            onClick={() => setShowReviewForm(true)}
          >
            Write a Review
          </Button>
        </Paper>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Rate your experience with {otherPartyName}
          </Typography>

          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select a rating
            </Typography>
            <Rating
              value={rating}
              onChange={(_, newValue) => setRating(newValue)}
              size="large"
              sx={{ fontSize: 40 }}
            />
            {rating && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Typography>
            )}
          </Box>

          <TextField
            fullWidth
            label="Comment (optional)"
            placeholder="Share your experience..."
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => {
                setShowReviewForm(false);
                setRating(null);
                setComment('');
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitReview}
              disabled={rating === null || submitting}
              startIcon={submitting ? <CircularProgress size={16} /> : <Star />}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* User has already reviewed */}
      {userHasReviewed && !otherPartyReview && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You have submitted your review. Waiting for {otherPartyName} to leave their review.
        </Alert>
      )}

      {/* No reviews yet message */}
      {existingReviews.length === 0 && !canReview && !showReviewForm && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No reviews yet for this reservation.
        </Typography>
      )}
    </Box>
  );
}

/**
 * Star Rating Display Component
 * For showing user ratings in other parts of the app
 */
export function StarRating({
  rating,
  totalReviews,
  size = 'medium',
  showCount = true,
}: {
  rating: number;
  totalReviews?: number;
  size?: 'small' | 'medium';
  showCount?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Rating
        value={rating}
        readOnly
        precision={0.1}
        size={size}
      />
      {showCount && totalReviews !== undefined && (
        <Typography variant={size === 'small' ? 'caption' : 'body2'} color="text.secondary">
          ({totalReviews})
        </Typography>
      )}
    </Box>
  );
}
