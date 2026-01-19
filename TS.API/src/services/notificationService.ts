/**
 * Notification Service
 * Handles creating and managing notifications for users
 */

import * as dabService from './dabService';

export type NotificationType =
  | 'reservation_request'      // New reservation request (to owner)
  | 'reservation_approved'     // Reservation approved (to borrower)
  | 'reservation_declined'     // Reservation declined (to borrower)
  | 'reservation_cancelled'    // Reservation cancelled
  | 'pickup_reminder'          // Reminder 1 day before pickup
  | 'return_reminder'          // Reminder 1 day before due
  | 'loan_started'             // Loan has started (pickup confirmed)
  | 'loan_completed'           // Loan completed (return confirmed)
  | 'review_received';         // New review received

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string; // Usually reservationId
}

/**
 * Create a notification for a user
 * This stores in the database and logs for now (email integration can be added later)
 */
export async function createNotification(
  data: NotificationData,
  authToken?: string
): Promise<void> {
  try {
    // Store notification in database
    await dabService.createNotification({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedId: data.relatedId,
    }, authToken);

    // Log for debugging/development
    console.log(`[NOTIFICATION] ${data.type} for user ${data.userId}: ${data.title}`);
    console.log(`  Message: ${data.message}`);
    if (data.relatedId) {
      console.log(`  Related ID: ${data.relatedId}`);
    }
  } catch (error) {
    // Log error but don't throw - notifications shouldn't break the main flow
    console.error('Failed to create notification:', error);
  }
}

/**
 * Send notification for new reservation request (to tool owner)
 */
export async function notifyReservationRequest(
  ownerId: string,
  borrowerName: string,
  toolName: string,
  reservationId: string,
  startDate: string,
  endDate: string,
  authToken?: string
): Promise<void> {
  await createNotification({
    userId: ownerId,
    type: 'reservation_request',
    title: 'New Reservation Request',
    message: `${borrowerName} wants to borrow your ${toolName} from ${startDate} to ${endDate}.`,
    relatedId: reservationId,
  }, authToken);
}

/**
 * Send notification when reservation is approved (to borrower)
 */
export async function notifyReservationApproved(
  borrowerId: string,
  ownerName: string,
  toolName: string,
  reservationId: string,
  startDate: string,
  authToken?: string
): Promise<void> {
  await createNotification({
    userId: borrowerId,
    type: 'reservation_approved',
    title: 'Reservation Approved',
    message: `${ownerName} approved your request to borrow ${toolName}. Pickup starts ${startDate}.`,
    relatedId: reservationId,
  }, authToken);
}

/**
 * Send notification when reservation is declined (to borrower)
 */
export async function notifyReservationDeclined(
  borrowerId: string,
  ownerName: string,
  toolName: string,
  reservationId: string,
  reason?: string,
  authToken?: string
): Promise<void> {
  const message = reason
    ? `${ownerName} declined your request to borrow ${toolName}. Reason: ${reason}`
    : `${ownerName} declined your request to borrow ${toolName}.`;

  await createNotification({
    userId: borrowerId,
    type: 'reservation_declined',
    title: 'Reservation Declined',
    message,
    relatedId: reservationId,
  }, authToken);
}

/**
 * Send notification when reservation is cancelled
 */
export async function notifyReservationCancelled(
  recipientId: string,
  cancellerName: string,
  toolName: string,
  reservationId: string,
  reason?: string,
  authToken?: string
): Promise<void> {
  const message = reason
    ? `${cancellerName} cancelled the reservation for ${toolName}. Reason: ${reason}`
    : `${cancellerName} cancelled the reservation for ${toolName}.`;

  await createNotification({
    userId: recipientId,
    type: 'reservation_cancelled',
    title: 'Reservation Cancelled',
    message,
    relatedId: reservationId,
  }, authToken);
}

/**
 * Send pickup reminder (1 day before)
 */
export async function notifyPickupReminder(
  userId: string,
  toolName: string,
  reservationId: string,
  pickupDate: string,
  authToken?: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'pickup_reminder',
    title: 'Pickup Reminder',
    message: `Reminder: You are scheduled to pick up ${toolName} tomorrow (${pickupDate}).`,
    relatedId: reservationId,
  }, authToken);
}

/**
 * Send return reminder (1 day before due)
 */
export async function notifyReturnReminder(
  userId: string,
  toolName: string,
  reservationId: string,
  dueDate: string,
  authToken?: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'return_reminder',
    title: 'Return Reminder',
    message: `Reminder: ${toolName} is due to be returned tomorrow (${dueDate}).`,
    relatedId: reservationId,
  }, authToken);
}

/**
 * Send notification when loan starts (pickup confirmed)
 */
export async function notifyLoanStarted(
  ownerId: string,
  borrowerName: string,
  toolName: string,
  reservationId: string,
  authToken?: string
): Promise<void> {
  await createNotification({
    userId: ownerId,
    type: 'loan_started',
    title: 'Tool Picked Up',
    message: `${borrowerName} has picked up your ${toolName}.`,
    relatedId: reservationId,
  }, authToken);
}

/**
 * Send notification when loan completes (return confirmed)
 */
export async function notifyLoanCompleted(
  ownerId: string,
  borrowerName: string,
  toolName: string,
  reservationId: string,
  authToken?: string
): Promise<void> {
  await createNotification({
    userId: ownerId,
    type: 'loan_completed',
    title: 'Tool Returned',
    message: `${borrowerName} has returned your ${toolName}. Please verify condition and leave a review.`,
    relatedId: reservationId,
  }, authToken);
}

/**
 * Send notification when a review is received
 */
export async function notifyReviewReceived(
  userId: string,
  reviewerName: string,
  rating: number,
  reservationId: string,
  authToken?: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'review_received',
    title: 'New Review Received',
    message: `${reviewerName} left you a ${rating}-star review.`,
    relatedId: reservationId,
  }, authToken);
}
