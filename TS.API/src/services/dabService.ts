import axios, { AxiosError } from 'axios';
import { config } from '../config/env';

/**
 * Data API Builder Service
 * Handles GraphQL interactions with Azure Data API Builder
 */

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

interface Reservation {
  id: string;
  toolId: string;
  borrowerId: string;
  status: string;
  startDate: string;
  endDate: string;
  note?: string;
  ownerNote?: string;
  pickupConfirmedAt?: string;
  returnConfirmedAt?: string;
  createdAt: string;
  updatedAt?: string;
  tool?: Tool;
  borrower?: User;
}

interface Tool {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  status: string;
  advanceNoticeDays: number;
  maxLoanDays: number;
  createdAt: string;
  owner?: User;
  photos?: ToolPhoto[];
}

interface ToolPhoto {
  id: string;
  toolId: string;
  url: string;
  isPrimary: boolean;
  uploadedAt: string;
}

interface User {
  id: string;
  externalId: string;
  displayName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  reputationScore: number;
  notifyEmail?: boolean;
  subscriptionStatus?: string;
  subscriptionEndsAt?: string;
  stripeCustomerId?: string;
  tosAcceptedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

async function executeGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  authToken?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await axios.post<GraphQLResponse<T>>(
      config.DAB_GRAPHQL_URL,
      { query, variables },
      { headers }
    );

    if (response.data.errors && response.data.errors.length > 0) {
      const errorMessages = response.data.errors.map(e => e.message).join(', ');
      throw new Error(`GraphQL Error: ${errorMessages}`);
    }

    if (!response.data.data) {
      throw new Error('No data returned from GraphQL');
    }

    return response.data.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('DAB request failed:', error.response?.data || error.message);
      throw new Error(`DAB request failed: ${error.message}`);
    }
    throw error;
  }
}

// User operations
export async function getUserByExternalId(externalId: string, authToken?: string): Promise<User | null> {
  const query = `
    query GetUserByExternalId($filter: UserFilterInput) {
      users(filter: $filter) {
        items {
          id
          externalId
          displayName
          email
          phone
          avatarUrl
          bio
          streetAddress
          city
          state
          zipCode
          reputationScore
          notifyEmail
          subscriptionStatus
          subscriptionEndsAt
          stripeCustomerId
          tosAcceptedAt
          createdAt
          updatedAt
        }
      }
    }
  `;

  const result = await executeGraphQL<{ users: { items: User[] } }>(
    query,
    { filter: { externalId: { eq: externalId } } },
    authToken
  );

  return result.users.items[0] || null;
}

/**
 * Get user by internal ID
 */
export async function getUserById(id: string, authToken?: string): Promise<User | null> {
  const query = `
    query GetUser($id: UUID!) {
      user_by_pk(id: $id) {
        id
        externalId
        displayName
        email
        phone
        avatarUrl
        bio
        streetAddress
        city
        state
        zipCode
        reputationScore
        notifyEmail
        subscriptionStatus
        subscriptionEndsAt
        stripeCustomerId
        tosAcceptedAt
        createdAt
        updatedAt
      }
    }
  `;

  const result = await executeGraphQL<{ user_by_pk: User | null }>(
    query,
    { id },
    authToken
  );

  return result.user_by_pk;
}

/**
 * Create a new user (used during first login / user sync)
 */
export async function createUser(
  data: {
    externalId: string;
    displayName: string;
    email: string;
  },
  authToken?: string
): Promise<User> {
  const query = `
    mutation CreateUser($item: CreateUserInput!) {
      createUser(item: $item) {
        id
        externalId
        displayName
        email
        phone
        avatarUrl
        bio
        streetAddress
        city
        state
        zipCode
        reputationScore
        notifyEmail
        subscriptionStatus
        createdAt
      }
    }
  `;

  const result = await executeGraphQL<{ createUser: User }>(
    query,
    {
      item: {
        id: crypto.randomUUID(),
        externalId: data.externalId,
        displayName: data.displayName,
        email: data.email,
        reputationScore: 0,
        notifyEmail: true,
        subscriptionStatus: 'trial',
        createdAt: new Date().toISOString(),
      },
    },
    authToken
  );

  return result.createUser;
}

/**
 * Update user profile
 */
export async function updateUser(
  id: string,
  data: {
    displayName?: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    notifyEmail?: boolean;
  },
  authToken?: string
): Promise<User> {
  const query = `
    mutation UpdateUser($id: UUID!, $item: UpdateUserInput!) {
      updateUser(id: $id, item: $item) {
        id
        externalId
        displayName
        email
        phone
        avatarUrl
        bio
        streetAddress
        city
        state
        zipCode
        reputationScore
        notifyEmail
        subscriptionStatus
        subscriptionEndsAt
        createdAt
        updatedAt
      }
    }
  `;

  const result = await executeGraphQL<{ updateUser: User }>(
    query,
    {
      id,
      item: {
        ...data,
        updatedAt: new Date().toISOString(),
      },
    },
    authToken
  );

  return result.updateUser;
}

/**
 * Get or create user by external ID (Azure AD B2C object ID)
 * This handles the user sync flow on first login
 */
export async function getOrCreateUser(
  externalId: string,
  defaultData: {
    displayName: string;
    email: string;
  },
  authToken?: string
): Promise<User> {
  // First try to find existing user
  let user = await getUserByExternalId(externalId, authToken);

  if (!user) {
    // Create new user
    user = await createUser(
      {
        externalId,
        displayName: defaultData.displayName,
        email: defaultData.email,
      },
      authToken
    );
  }

  return user;
}

// Tool operations
export async function getToolById(toolId: string, authToken?: string): Promise<Tool | null> {
  const query = `
    query GetTool($id: UUID!) {
      tool_by_pk(id: $id) {
        id
        ownerId
        name
        description
        category
        brand
        model
        status
        advanceNoticeDays
        maxLoanDays
        createdAt
        owner {
          id
          externalId
          displayName
          email
          avatarUrl
          reputationScore
        }
        photos {
          items {
            id
            toolId
            url
            isPrimary
            uploadedAt
          }
        }
      }
    }
  `;

  const result = await executeGraphQL<{ tool_by_pk: Tool | null }>(
    query,
    { id: toolId },
    authToken
  );

  return result.tool_by_pk;
}

// Reservation operations
export async function getReservationById(reservationId: string, authToken?: string): Promise<Reservation | null> {
  const query = `
    query GetReservation($id: UUID!) {
      reservation_by_pk(id: $id) {
        id
        toolId
        borrowerId
        status
        startDate
        endDate
        note
        ownerNote
        pickupConfirmedAt
        returnConfirmedAt
        createdAt
        updatedAt
        tool {
          id
          ownerId
          name
          description
          category
          brand
          model
          status
          owner {
            id
            externalId
            displayName
            email
            avatarUrl
          }
          photos {
            items {
              id
              url
              isPrimary
            }
          }
        }
        borrower {
          id
          externalId
          displayName
          email
          avatarUrl
          reputationScore
        }
      }
    }
  `;

  const result = await executeGraphQL<{ reservation_by_pk: Reservation | null }>(
    query,
    { id: reservationId },
    authToken
  );

  return result.reservation_by_pk;
}

export async function getReservationsByBorrower(borrowerId: string, authToken?: string): Promise<Reservation[]> {
  const query = `
    query GetReservationsByBorrower($filter: ReservationFilterInput) {
      reservations(filter: $filter, orderBy: { startDate: DESC }) {
        items {
          id
          toolId
          borrowerId
          status
          startDate
          endDate
          note
          ownerNote
          createdAt
          tool {
            id
            ownerId
            name
            category
            status
            owner {
              id
              displayName
              avatarUrl
            }
            photos {
              items {
                id
                url
                isPrimary
              }
            }
          }
        }
      }
    }
  `;

  const result = await executeGraphQL<{ reservations: { items: Reservation[] } }>(
    query,
    { filter: { borrowerId: { eq: borrowerId } } },
    authToken
  );

  return result.reservations.items;
}

export async function getReservationsForOwner(ownerId: string, authToken?: string): Promise<Reservation[]> {
  // First get all tools for this owner, then get their reservations
  const query = `
    query GetReservationsForOwner($filter: ToolFilterInput) {
      tools(filter: $filter) {
        items {
          id
          name
          reservations {
            items {
              id
              toolId
              borrowerId
              status
              startDate
              endDate
              note
              ownerNote
              createdAt
              borrower {
                id
                displayName
                email
                avatarUrl
              }
            }
          }
        }
      }
    }
  `;

  const result = await executeGraphQL<{ tools: { items: Array<Tool & { reservations: { items: Reservation[] } }> } }>(
    query,
    { filter: { ownerId: { eq: ownerId } } },
    authToken
  );

  // Flatten reservations from all tools
  const reservations: Reservation[] = [];
  for (const tool of result.tools.items) {
    for (const reservation of tool.reservations?.items || []) {
      reservations.push({
        ...reservation,
        tool: { ...tool, reservations: undefined } as Tool,
      });
    }
  }

  // Sort by start date descending
  return reservations.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function checkDateConflicts(
  toolId: string,
  startDate: string,
  endDate: string,
  excludeReservationId?: string,
  authToken?: string
): Promise<boolean> {
  // Get all reservations for this tool that could conflict
  // A conflict exists if the new dates overlap with an existing confirmed or active reservation
  const query = `
    query CheckConflicts($filter: ReservationFilterInput) {
      reservations(filter: $filter) {
        items {
          id
          startDate
          endDate
          status
        }
      }
    }
  `;

  const result = await executeGraphQL<{ reservations: { items: Reservation[] } }>(
    query,
    {
      filter: {
        toolId: { eq: toolId },
        status: { in: ['pending', 'confirmed', 'active'] }
      }
    },
    authToken
  );

  const newStart = new Date(startDate);
  const newEnd = new Date(endDate);

  for (const reservation of result.reservations.items) {
    // Skip the reservation we're excluding (for updates)
    if (excludeReservationId && reservation.id === excludeReservationId) {
      continue;
    }

    const existingStart = new Date(reservation.startDate);
    const existingEnd = new Date(reservation.endDate);

    // Check for overlap: new reservation starts before existing ends AND new reservation ends after existing starts
    if (newStart <= existingEnd && newEnd >= existingStart) {
      return true; // Conflict found
    }
  }

  return false; // No conflicts
}

export async function createReservation(
  data: {
    toolId: string;
    borrowerId: string;
    startDate: string;
    endDate: string;
    note?: string;
  },
  authToken?: string
): Promise<Reservation> {
  const query = `
    mutation CreateReservation($item: CreateReservationInput!) {
      createReservation(item: $item) {
        id
        toolId
        borrowerId
        status
        startDate
        endDate
        note
        createdAt
      }
    }
  `;

  const result = await executeGraphQL<{ createReservation: Reservation }>(
    query,
    {
      item: {
        id: crypto.randomUUID(),
        toolId: data.toolId,
        borrowerId: data.borrowerId,
        status: 'pending',
        startDate: data.startDate,
        endDate: data.endDate,
        note: data.note || null,
        createdAt: new Date().toISOString(),
      },
    },
    authToken
  );

  return result.createReservation;
}

export async function updateReservation(
  id: string,
  data: {
    status?: string;
    ownerNote?: string;
    pickupConfirmedAt?: string;
    returnConfirmedAt?: string;
  },
  authToken?: string
): Promise<Reservation> {
  const query = `
    mutation UpdateReservation($id: UUID!, $item: UpdateReservationInput!) {
      updateReservation(id: $id, item: $item) {
        id
        toolId
        borrowerId
        status
        startDate
        endDate
        note
        ownerNote
        pickupConfirmedAt
        returnConfirmedAt
        createdAt
        updatedAt
      }
    }
  `;

  const result = await executeGraphQL<{ updateReservation: Reservation }>(
    query,
    {
      id,
      item: {
        ...data,
        updatedAt: new Date().toISOString(),
      },
    },
    authToken
  );

  return result.updateReservation;
}

// ============================================================================
// Loan Photo operations
// ============================================================================

interface LoanPhoto {
  id: string;
  reservationId: string;
  type: 'before' | 'after';
  url: string;
  uploadedBy: string;
  notes?: string;
  uploadedAt: string;
}

export async function createLoanPhoto(
  data: {
    reservationId: string;
    type: 'before' | 'after';
    url: string;
    uploadedBy: string;
    notes?: string;
  },
  authToken?: string
): Promise<LoanPhoto> {
  const query = `
    mutation CreateLoanPhoto($item: CreateLoanPhotoInput!) {
      createLoanPhoto(item: $item) {
        id
        reservationId
        type
        url
        uploadedBy
        notes
        uploadedAt
      }
    }
  `;

  const result = await executeGraphQL<{ createLoanPhoto: LoanPhoto }>(
    query,
    {
      item: {
        id: crypto.randomUUID(),
        reservationId: data.reservationId,
        type: data.type,
        url: data.url,
        uploadedBy: data.uploadedBy,
        notes: data.notes || null,
        uploadedAt: new Date().toISOString(),
      },
    },
    authToken
  );

  return result.createLoanPhoto;
}

export async function getLoanPhotos(reservationId: string, authToken?: string): Promise<LoanPhoto[]> {
  const query = `
    query GetLoanPhotos($filter: LoanPhotoFilterInput) {
      loanPhotos(filter: $filter, orderBy: { uploadedAt: ASC }) {
        items {
          id
          reservationId
          type
          url
          uploadedBy
          notes
          uploadedAt
        }
      }
    }
  `;

  const result = await executeGraphQL<{ loanPhotos: { items: LoanPhoto[] } }>(
    query,
    { filter: { reservationId: { eq: reservationId } } },
    authToken
  );

  return result.loanPhotos.items;
}

export async function getLoanPhotosByType(
  reservationId: string,
  type: 'before' | 'after',
  authToken?: string
): Promise<LoanPhoto[]> {
  const query = `
    query GetLoanPhotosByType($filter: LoanPhotoFilterInput) {
      loanPhotos(filter: $filter, orderBy: { uploadedAt: ASC }) {
        items {
          id
          reservationId
          type
          url
          uploadedBy
          notes
          uploadedAt
        }
      }
    }
  `;

  const result = await executeGraphQL<{ loanPhotos: { items: LoanPhoto[] } }>(
    query,
    {
      filter: {
        reservationId: { eq: reservationId },
        type: { eq: type }
      }
    },
    authToken
  );

  return result.loanPhotos.items;
}

// ============================================================================
// Review operations
// ============================================================================

interface Review {
  id: string;
  reservationId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: User;
  reviewee?: User;
}

export async function createReview(
  data: {
    reservationId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
  },
  authToken?: string
): Promise<Review> {
  const query = `
    mutation CreateReview($item: CreateReviewInput!) {
      createReview(item: $item) {
        id
        reservationId
        reviewerId
        revieweeId
        rating
        comment
        createdAt
      }
    }
  `;

  const result = await executeGraphQL<{ createReview: Review }>(
    query,
    {
      item: {
        id: crypto.randomUUID(),
        reservationId: data.reservationId,
        reviewerId: data.reviewerId,
        revieweeId: data.revieweeId,
        rating: data.rating,
        comment: data.comment || null,
        createdAt: new Date().toISOString(),
      },
    },
    authToken
  );

  return result.createReview;
}

export async function getReviewsForUser(userId: string, authToken?: string): Promise<Review[]> {
  const query = `
    query GetReviewsForUser($filter: ReviewFilterInput) {
      reviews(filter: $filter, orderBy: { createdAt: DESC }) {
        items {
          id
          reservationId
          reviewerId
          revieweeId
          rating
          comment
          createdAt
          reviewer {
            id
            displayName
            avatarUrl
          }
        }
      }
    }
  `;

  const result = await executeGraphQL<{ reviews: { items: Review[] } }>(
    query,
    { filter: { revieweeId: { eq: userId } } },
    authToken
  );

  return result.reviews.items;
}

export async function getReviewForReservation(
  reservationId: string,
  reviewerId: string,
  authToken?: string
): Promise<Review | null> {
  const query = `
    query GetReviewForReservation($filter: ReviewFilterInput) {
      reviews(filter: $filter) {
        items {
          id
          reservationId
          reviewerId
          revieweeId
          rating
          comment
          createdAt
        }
      }
    }
  `;

  const result = await executeGraphQL<{ reviews: { items: Review[] } }>(
    query,
    {
      filter: {
        reservationId: { eq: reservationId },
        reviewerId: { eq: reviewerId }
      }
    },
    authToken
  );

  return result.reviews.items[0] || null;
}

export async function getReviewsForReservation(reservationId: string, authToken?: string): Promise<Review[]> {
  const query = `
    query GetReviewsForReservation($filter: ReviewFilterInput) {
      reviews(filter: $filter, orderBy: { createdAt: ASC }) {
        items {
          id
          reservationId
          reviewerId
          revieweeId
          rating
          comment
          createdAt
          reviewer {
            id
            displayName
            avatarUrl
          }
          reviewee {
            id
            displayName
            avatarUrl
          }
        }
      }
    }
  `;

  const result = await executeGraphQL<{ reviews: { items: Review[] } }>(
    query,
    { filter: { reservationId: { eq: reservationId } } },
    authToken
  );

  return result.reviews.items;
}

export async function calculateUserReputationScore(userId: string, authToken?: string): Promise<number> {
  const reviews = await getReviewsForUser(userId, authToken);

  if (reviews.length === 0) {
    return 0;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal
}

export async function updateUserReputationScore(userId: string, authToken?: string): Promise<void> {
  const score = await calculateUserReputationScore(userId, authToken);

  const query = `
    mutation UpdateUserReputation($id: UUID!, $item: UpdateUserInput!) {
      updateUser(id: $id, item: $item) {
        id
        reputationScore
      }
    }
  `;

  await executeGraphQL<{ updateUser: User }>(
    query,
    {
      id: userId,
      item: {
        reputationScore: score,
        updatedAt: new Date().toISOString(),
      },
    },
    authToken
  );
}

// ============================================================================
// Notification operations
// ============================================================================

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export async function createNotification(
  data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedId?: string;
  },
  authToken?: string
): Promise<Notification> {
  const query = `
    mutation CreateNotification($item: CreateNotificationInput!) {
      createNotification(item: $item) {
        id
        userId
        type
        title
        message
        relatedId
        isRead
        createdAt
      }
    }
  `;

  const result = await executeGraphQL<{ createNotification: Notification }>(
    query,
    {
      item: {
        id: crypto.randomUUID(),
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.relatedId || null,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    },
    authToken
  );

  return result.createNotification;
}

export async function getNotificationsForUser(
  userId: string,
  limit: number = 50,
  authToken?: string
): Promise<Notification[]> {
  const query = `
    query GetNotifications($filter: NotificationFilterInput, $first: Int) {
      notifications(filter: $filter, first: $first, orderBy: { createdAt: DESC }) {
        items {
          id
          userId
          type
          title
          message
          relatedId
          isRead
          createdAt
        }
      }
    }
  `;

  const result = await executeGraphQL<{ notifications: { items: Notification[] } }>(
    query,
    {
      filter: { userId: { eq: userId } },
      first: limit,
    },
    authToken
  );

  return result.notifications.items;
}

export async function getUnreadNotificationCount(userId: string, authToken?: string): Promise<number> {
  const query = `
    query GetUnreadNotifications($filter: NotificationFilterInput) {
      notifications(filter: $filter) {
        items {
          id
        }
      }
    }
  `;

  const result = await executeGraphQL<{ notifications: { items: { id: string }[] } }>(
    query,
    {
      filter: {
        userId: { eq: userId },
        isRead: { eq: false }
      }
    },
    authToken
  );

  return result.notifications.items.length;
}

export async function markNotificationAsRead(id: string, authToken?: string): Promise<Notification> {
  const query = `
    mutation MarkNotificationRead($id: UUID!, $item: UpdateNotificationInput!) {
      updateNotification(id: $id, item: $item) {
        id
        userId
        type
        title
        message
        relatedId
        isRead
        createdAt
      }
    }
  `;

  const result = await executeGraphQL<{ updateNotification: Notification }>(
    query,
    {
      id,
      item: { isRead: true },
    },
    authToken
  );

  return result.updateNotification;
}

export async function markAllNotificationsAsRead(userId: string, authToken?: string): Promise<void> {
  // Get all unread notifications
  const notifications = await getNotificationsForUser(userId, 100, authToken);
  const unread = notifications.filter(n => !n.isRead);

  // Mark each as read
  for (const notification of unread) {
    await markNotificationAsRead(notification.id, authToken);
  }
}

// Stats for dashboard
export async function getDashboardStats(userId: string, authToken?: string): Promise<{
  toolsListed: number;
  activeLoans: number;
  pendingRequests: number;
}> {
  const toolsQuery = `
    query GetToolCount($filter: ToolFilterInput) {
      tools(filter: $filter) {
        items {
          id
        }
      }
    }
  `;

  const borrowerReservationsQuery = `
    query GetBorrowerReservations($filter: ReservationFilterInput) {
      reservations(filter: $filter) {
        items {
          id
          status
        }
      }
    }
  `;

  // Get tools count
  const toolsResult = await executeGraphQL<{ tools: { items: { id: string }[] } }>(
    toolsQuery,
    { filter: { ownerId: { eq: userId } } },
    authToken
  );

  // Get borrower reservations to count active loans
  const borrowerResult = await executeGraphQL<{ reservations: { items: { id: string; status: string }[] } }>(
    borrowerReservationsQuery,
    { filter: { borrowerId: { eq: userId } } },
    authToken
  );

  // Get pending requests for owner's tools - need to get via tools
  const ownerReservations = await getReservationsForOwner(userId, authToken);
  const pendingRequests = ownerReservations.filter(r => r.status === 'pending').length;

  const activeLoans = borrowerResult.reservations.items.filter(r => r.status === 'active').length;

  return {
    toolsListed: toolsResult.tools.items.length,
    activeLoans,
    pendingRequests,
  };
}

// ============================================================================
// Subscription operations
// ============================================================================

/**
 * Update user subscription fields
 * Used by Stripe webhooks to update subscription status
 */
export async function updateUserSubscription(
  userId: string,
  data: {
    subscriptionStatus?: string;
    subscriptionEndsAt?: string;
    stripeCustomerId?: string;
  },
  authToken?: string
): Promise<User> {
  const query = `
    mutation UpdateUserSubscription($id: UUID!, $item: UpdateUserInput!) {
      updateUser(id: $id, item: $item) {
        id
        externalId
        displayName
        email
        subscriptionStatus
        subscriptionEndsAt
        stripeCustomerId
        updatedAt
      }
    }
  `;

  const result = await executeGraphQL<{ updateUser: User }>(
    query,
    {
      id: userId,
      item: {
        ...data,
        updatedAt: new Date().toISOString(),
      },
    },
    authToken
  );

  return result.updateUser;
}

// ============================================================================
// Public profile operations
// ============================================================================

/**
 * Public user profile (hides sensitive info)
 */
interface PublicUserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  state?: string;
  reputationScore: number;
  createdAt: string;
}

/**
 * Get public user profile by ID (hides sensitive info like email, phone, address)
 */
export async function getPublicUserProfile(userId: string, authToken?: string): Promise<PublicUserProfile | null> {
  const query = `
    query GetPublicProfile($id: UUID!) {
      user_by_pk(id: $id) {
        id
        displayName
        avatarUrl
        bio
        city
        state
        reputationScore
        createdAt
      }
    }
  `;

  const result = await executeGraphQL<{ user_by_pk: PublicUserProfile | null }>(
    query,
    { id: userId },
    authToken
  );

  return result.user_by_pk;
}

// ============================================================================
// User history operations
// ============================================================================

/**
 * History item representing a completed loan
 */
interface HistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  toolCategory: string;
  startDate: string;
  endDate: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  hasReview: boolean;
}

/**
 * User history stats
 */
interface UserHistoryStats {
  totalLoans: number;
  totalLends: number;
  memberSince: string;
}

/**
 * Get user's lending history (tools they've lent to others)
 */
export async function getUserLendingHistory(userId: string, authToken?: string): Promise<HistoryItem[]> {
  const query = `
    query GetLendingHistory($filter: ToolFilterInput) {
      tools(filter: $filter) {
        items {
          id
          name
          category
          reservations(filter: { status: { eq: "completed" } }, orderBy: { endDate: DESC }) {
            items {
              id
              startDate
              endDate
              borrowerId
              borrower {
                id
                displayName
                avatarUrl
              }
            }
          }
        }
      }
    }
  `;

  const result = await executeGraphQL<{
    tools: {
      items: Array<{
        id: string;
        name: string;
        category: string;
        reservations: {
          items: Array<{
            id: string;
            startDate: string;
            endDate: string;
            borrowerId: string;
            borrower: {
              id: string;
              displayName: string;
              avatarUrl?: string;
            };
          }>;
        };
      }>;
    };
  }>(query, { filter: { ownerId: { eq: userId } } }, authToken);

  const history: HistoryItem[] = [];
  for (const tool of result.tools.items) {
    for (const reservation of tool.reservations?.items || []) {
      // Check if user has reviewed this reservation
      const review = await getReviewForReservation(reservation.id, userId, authToken);
      history.push({
        id: reservation.id,
        toolId: tool.id,
        toolName: tool.name,
        toolCategory: tool.category,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        otherUserId: reservation.borrower.id,
        otherUserName: reservation.borrower.displayName,
        otherUserAvatarUrl: reservation.borrower.avatarUrl,
        hasReview: !!review,
      });
    }
  }

  // Sort by end date descending
  return history.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
}

/**
 * Get user's borrowing history (tools they've borrowed from others)
 */
export async function getUserBorrowingHistory(userId: string, authToken?: string): Promise<HistoryItem[]> {
  const query = `
    query GetBorrowingHistory($filter: ReservationFilterInput) {
      reservations(filter: $filter, orderBy: { endDate: DESC }) {
        items {
          id
          startDate
          endDate
          tool {
            id
            name
            category
            ownerId
            owner {
              id
              displayName
              avatarUrl
            }
          }
        }
      }
    }
  `;

  const result = await executeGraphQL<{
    reservations: {
      items: Array<{
        id: string;
        startDate: string;
        endDate: string;
        tool: {
          id: string;
          name: string;
          category: string;
          ownerId: string;
          owner: {
            id: string;
            displayName: string;
            avatarUrl?: string;
          };
        };
      }>;
    };
  }>(
    query,
    { filter: { borrowerId: { eq: userId }, status: { eq: 'completed' } } },
    authToken
  );

  const history: HistoryItem[] = [];
  for (const reservation of result.reservations.items) {
    // Check if user has reviewed this reservation
    const review = await getReviewForReservation(reservation.id, userId, authToken);
    history.push({
      id: reservation.id,
      toolId: reservation.tool.id,
      toolName: reservation.tool.name,
      toolCategory: reservation.tool.category,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      otherUserId: reservation.tool.owner.id,
      otherUserName: reservation.tool.owner.displayName,
      otherUserAvatarUrl: reservation.tool.owner.avatarUrl,
      hasReview: !!review,
    });
  }

  return history;
}

/**
 * Get user history stats
 */
export async function getUserHistoryStats(userId: string, authToken?: string): Promise<UserHistoryStats> {
  // Get the user to get createdAt
  const user = await getUserById(userId, authToken);

  // Get lending history count
  const lendingQuery = `
    query GetLendingCount($filter: ToolFilterInput) {
      tools(filter: $filter) {
        items {
          id
          reservations(filter: { status: { eq: "completed" } }) {
            items {
              id
            }
          }
        }
      }
    }
  `;

  const lendingResult = await executeGraphQL<{
    tools: {
      items: Array<{
        id: string;
        reservations: { items: Array<{ id: string }> };
      }>;
    };
  }>(lendingQuery, { filter: { ownerId: { eq: userId } } }, authToken);

  let totalLends = 0;
  for (const tool of lendingResult.tools.items) {
    totalLends += tool.reservations?.items?.length || 0;
  }

  // Get borrowing history count
  const borrowingQuery = `
    query GetBorrowingCount($filter: ReservationFilterInput) {
      reservations(filter: $filter) {
        items {
          id
        }
      }
    }
  `;

  const borrowingResult = await executeGraphQL<{
    reservations: { items: Array<{ id: string }> };
  }>(
    borrowingQuery,
    { filter: { borrowerId: { eq: userId }, status: { eq: 'completed' } } },
    authToken
  );

  return {
    totalLoans: borrowingResult.reservations.items.length,
    totalLends,
    memberSince: user?.createdAt || new Date().toISOString(),
  };
}

/**
 * Get reviews by a user (reviews they have written)
 */
export async function getReviewsByUser(userId: string, authToken?: string): Promise<Review[]> {
  const query = `
    query GetReviewsByUser($filter: ReviewFilterInput) {
      reviews(filter: $filter, orderBy: { createdAt: DESC }) {
        items {
          id
          reservationId
          reviewerId
          revieweeId
          rating
          comment
          createdAt
          reviewee {
            id
            displayName
            avatarUrl
          }
        }
      }
    }
  `;

  const result = await executeGraphQL<{ reviews: { items: Review[] } }>(
    query,
    { filter: { reviewerId: { eq: userId } } },
    authToken
  );

  return result.reviews.items;
}

/**
 * Check if a user shares at least one circle with a tool
 * This determines if the user is allowed to request a reservation
 */
export async function userSharesCircleWithTool(
  userId: string,
  toolId: string,
  authToken?: string
): Promise<boolean> {
  // Get all circles the user is a member of
  const userCirclesQuery = `
    query GetUserCircles($userId: UUID!) {
      circleMembers(filter: { userId: { eq: $userId } }) {
        items {
          circleId
        }
      }
    }
  `;

  const userCirclesResult = await executeGraphQL<{
    circleMembers: { items: Array<{ circleId: string }> };
  }>(userCirclesQuery, { userId }, authToken);

  const userCircleIds = new Set(userCirclesResult.circleMembers.items.map(m => m.circleId));

  if (userCircleIds.size === 0) {
    return false;
  }

  // Get all circles the tool is shared with
  const toolCirclesQuery = `
    query GetToolCircles($toolId: UUID!) {
      toolCircles(filter: { toolId: { eq: $toolId } }) {
        items {
          circleId
        }
      }
    }
  `;

  const toolCirclesResult = await executeGraphQL<{
    toolCircles: { items: Array<{ circleId: string }> };
  }>(toolCirclesQuery, { toolId }, authToken);

  // Check if there's any intersection
  for (const toolCircle of toolCirclesResult.toolCircles.items) {
    if (userCircleIds.has(toolCircle.circleId)) {
      return true;
    }
  }

  return false;
}
