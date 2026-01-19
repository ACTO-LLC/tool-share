/**
 * API Service for Tool Share
 * Handles all HTTP requests to the backend API
 */

import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { apiRequest as apiScopeConfig } from '../config/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// MSAL instance reference - set during app initialization
let msalInstance: PublicClientApplication | null = null;

/**
 * Set the MSAL instance for token acquisition
 * Call this during app initialization
 */
export function setMsalInstance(instance: PublicClientApplication): void {
  msalInstance = instance;
}

/**
 * Get the active account from MSAL
 */
function getActiveAccount() {
  if (!msalInstance) {
    return null;
  }
  const accounts = msalInstance.getAllAccounts();
  return accounts[0] || null;
}

/**
 * Acquire an access token for API calls using MSAL
 */
async function getAuthToken(): Promise<string | null> {
  // In E2E test mode, return a mock token
  if (import.meta.env.VITE_E2E_TEST === 'true') {
    return 'mock-e2e-token';
  }

  if (!msalInstance) {
    console.warn('MSAL instance not set - API calls will be unauthenticated');
    return null;
  }

  const account = getActiveAccount();
  if (!account) {
    console.warn('No active MSAL account');
    return null;
  }

  try {
    // Try silent token acquisition first (uses cache)
    const response = await msalInstance.acquireTokenSilent({
      ...apiScopeConfig,
      account,
    });
    return response.accessToken;
  } catch (error) {
    // If silent acquisition fails due to interaction required, try popup
    if (error instanceof InteractionRequiredAuthError) {
      try {
        const response = await msalInstance.acquireTokenPopup({
          ...apiScopeConfig,
          account,
        });
        return response.accessToken;
      } catch (popupError) {
        console.error('Interactive token acquisition failed:', popupError);
        return null;
      }
    }
    console.error('Token acquisition failed:', error);
    return null;
  }
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const token = await getAuthToken();
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData.code
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Make a FormData API request (for file uploads)
 */
async function apiRequestFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = await getAuthToken();
  const requestHeaders: Record<string, string> = {};

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData - browser will set it with boundary
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: requestHeaders,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData.code
    );
  }

  return response.json();
}

// Reservation types
export interface Reservation {
  id: string;
  toolId: string;
  borrowerId: string;
  status: ReservationStatus;
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

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'declined';

export interface Tool {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  upc?: string;
  status: 'available' | 'unavailable' | 'archived';
  advanceNoticeDays: number;
  maxLoanDays: number;
  createdAt: string;
  updatedAt?: string;
  owner?: User;
  photos?: ToolPhoto[];
}

export interface ToolPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  uploadedAt?: string;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  reputationScore?: number;
}

export interface ReservationListResponse {
  items: Reservation[];
  total: number;
}

export interface DashboardStats {
  toolsListed: number;
  activeLoans: number;
  pendingRequests: number;
}

export interface CreateReservationRequest {
  toolId: string;
  startDate: string;
  endDate: string;
  note?: string;
}

// ============================================================================
// Loan Photo Types
// ============================================================================

export interface LoanPhoto {
  id: string;
  reservationId: string;
  type: 'before' | 'after';
  url: string;
  uploadedBy: string;
  notes?: string;
  uploadedAt: string;
}

// ============================================================================
// Review Types
// ============================================================================

export interface Review {
  id: string;
  reservationId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  reviewee?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface UserReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType =
  | 'reservation_request'
  | 'reservation_approved'
  | 'reservation_declined'
  | 'reservation_cancelled'
  | 'pickup_reminder'
  | 'return_reminder'
  | 'loan_started'
  | 'loan_completed'
  | 'review_received';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: Notification[];
  unreadCount: number;
}

// Reservation API methods
export const reservationApi = {
  /**
   * Get all reservations for the current user
   */
  async list(params?: {
    role?: 'borrower' | 'lender' | 'all';
    status?: string;
  }): Promise<ReservationListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/api/reservations${queryString ? `?${queryString}` : ''}`;

    return apiRequest<ReservationListResponse>(endpoint);
  },

  /**
   * Get a specific reservation by ID
   */
  async get(id: string): Promise<Reservation> {
    return apiRequest<Reservation>(`/api/reservations/${id}`);
  },

  /**
   * Create a new reservation request
   */
  async create(data: CreateReservationRequest): Promise<Reservation> {
    return apiRequest<Reservation>('/api/reservations', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Approve a pending reservation (owner only)
   */
  async approve(id: string, note?: string): Promise<Reservation> {
    return apiRequest<Reservation>(`/api/reservations/${id}/approve`, {
      method: 'POST',
      body: note ? { note } : {},
    });
  },

  /**
   * Decline a pending reservation (owner only)
   */
  async decline(id: string, reason: string): Promise<Reservation> {
    return apiRequest<Reservation>(`/api/reservations/${id}/decline`, {
      method: 'POST',
      body: { reason },
    });
  },

  /**
   * Cancel a reservation (borrower or owner)
   */
  async cancel(id: string, note?: string): Promise<Reservation> {
    return apiRequest<Reservation>(`/api/reservations/${id}/cancel`, {
      method: 'POST',
      body: note ? { note } : {},
    });
  },

  /**
   * Confirm tool pickup (borrower only)
   */
  async pickup(id: string, note?: string): Promise<Reservation> {
    return apiRequest<Reservation>(`/api/reservations/${id}/pickup`, {
      method: 'POST',
      body: note ? { note } : {},
    });
  },

  /**
   * Confirm tool return (borrower only)
   */
  async return(id: string, note?: string): Promise<Reservation> {
    return apiRequest<Reservation>(`/api/reservations/${id}/return`, {
      method: 'POST',
      body: note ? { note } : {},
    });
  },

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return apiRequest<DashboardStats>('/api/reservations/stats/dashboard');
  },

  /**
   * Upload a loan photo (before or after)
   */
  async uploadPhoto(id: string, file: File, type: 'before' | 'after', notes?: string): Promise<LoanPhoto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (notes) {
      formData.append('notes', notes);
    }
    return apiRequestFormData<LoanPhoto>(`/api/reservations/${id}/photos`, formData);
  },

  /**
   * Get loan photos for a reservation
   */
  async getPhotos(id: string, type?: 'before' | 'after'): Promise<LoanPhoto[]> {
    const queryParams = type ? `?type=${type}` : '';
    return apiRequest<LoanPhoto[]>(`/api/reservations/${id}/photos${queryParams}`);
  },

  /**
   * Submit a review for a completed reservation
   */
  async submitReview(id: string, rating: number, comment?: string): Promise<Review> {
    return apiRequest<Review>(`/api/reservations/${id}/review`, {
      method: 'POST',
      body: { rating, comment },
    });
  },

  /**
   * Get reviews for a reservation
   */
  async getReviews(id: string): Promise<Review[]> {
    return apiRequest<Review[]>(`/api/reservations/${id}/reviews`);
  },
};

// ============================================================================
// Notification API
// ============================================================================

export const notificationApi = {
  /**
   * Get notifications for the current user
   */
  async list(limit?: number): Promise<NotificationListResponse> {
    const queryParams = limit ? `?limit=${limit}` : '';
    return apiRequest<NotificationListResponse>(`/api/notifications${queryParams}`);
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return apiRequest<{ count: number }>('/api/notifications/unread-count');
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    return apiRequest<Notification>(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    });
  },
};

// ============================================================================
// User Reviews API
// ============================================================================

export const reviewsApi = {
  /**
   * Get reviews for a specific user
   */
  async getUserReviews(userId: string): Promise<UserReviewsResponse> {
    return apiRequest<UserReviewsResponse>(`/api/users/${userId}/reviews`);
  },
};

// ============================================================================
// Tool Types
// ============================================================================

export interface ToolListResponse {
  tools: Tool[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ToolLookupResponse {
  found: boolean;
  name?: string;
  brand?: string;
  model?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
}

export interface CreateToolRequest {
  name: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  upc?: string;
  advanceNoticeDays?: number;
  maxLoanDays?: number;
  circleIds?: string[];
}

export interface UpdateToolRequest {
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  status?: 'available' | 'unavailable';
  advanceNoticeDays?: number;
  maxLoanDays?: number;
}

export interface PhotoUploadResponse {
  id: string;
  url: string;
  isPrimary: boolean;
}

// ============================================================================
// Tool API
// ============================================================================

export const toolsApi = {
  /**
   * Get all tool categories
   */
  async getCategories(): Promise<string[]> {
    return apiRequest<string[]>('/api/tools/categories');
  },

  /**
   * Look up tool by UPC barcode
   */
  async lookupUpc(upc: string): Promise<ToolLookupResponse> {
    return apiRequest<ToolLookupResponse>(`/api/tools/lookup?upc=${encodeURIComponent(upc)}`);
  },

  /**
   * Search products by name (UPCitemdb)
   */
  async lookupSearch(query: string): Promise<{ results: Array<{ upc: string; name: string; brand?: string }> }> {
    return apiRequest(`/api/tools/lookup/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Search available tools with filters
   */
  async search(params?: {
    q?: string;
    category?: string;
    circleId?: string;
    ownerId?: string;
    availableFrom?: string;
    availableTo?: string;
    sortBy?: 'relevance' | 'dateAdded' | 'nameAsc' | 'nameDesc';
    page?: number;
    pageSize?: number;
  }): Promise<ToolListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append('q', params.q);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.circleId) queryParams.append('circleId', params.circleId);
    if (params?.ownerId) queryParams.append('ownerId', params.ownerId);
    if (params?.availableFrom) queryParams.append('availableFrom', params.availableFrom);
    if (params?.availableTo) queryParams.append('availableTo', params.availableTo);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const queryString = queryParams.toString();
    return apiRequest<ToolListResponse>(`/api/tools/search${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Browse all available tools (with optional filters)
   */
  async browse(params?: {
    category?: string;
    circleId?: string;
    ownerId?: string;
    availableFrom?: string;
    availableTo?: string;
    sortBy?: 'relevance' | 'dateAdded' | 'nameAsc' | 'nameDesc';
    page?: number;
    pageSize?: number;
  }): Promise<ToolListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.circleId) queryParams.append('circleId', params.circleId);
    if (params?.ownerId) queryParams.append('ownerId', params.ownerId);
    if (params?.availableFrom) queryParams.append('availableFrom', params.availableFrom);
    if (params?.availableTo) queryParams.append('availableTo', params.availableTo);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const queryString = queryParams.toString();
    return apiRequest<ToolListResponse>(`/api/tools/browse${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get a specific tool by ID
   */
  async get(id: string): Promise<Tool> {
    return apiRequest<Tool>(`/api/tools/${id}`);
  },

  /**
   * Get tools owned by the current user
   */
  async getMyTools(): Promise<Tool[]> {
    return apiRequest<Tool[]>('/api/tools/my/tools');
  },

  /**
   * Create a new tool
   */
  async create(data: CreateToolRequest): Promise<Tool> {
    return apiRequest<Tool>('/api/tools', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update a tool
   */
  async update(id: string, data: UpdateToolRequest): Promise<Tool> {
    return apiRequest<Tool>(`/api/tools/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * Delete (archive) a tool
   */
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/api/tools/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Upload a photo for a tool
   */
  async uploadPhoto(toolId: string, file: File, isPrimary: boolean = false): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', isPrimary.toString());

    return apiRequestFormData<PhotoUploadResponse>(`/api/tools/${toolId}/photos`, formData);
  },

  /**
   * Delete a photo from a tool
   */
  async deletePhoto(toolId: string, photoId: string): Promise<void> {
    return apiRequest<void>(`/api/tools/${toolId}/photos/${photoId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Set a photo as primary
   */
  async setPhotoPrimary(toolId: string, photoId: string): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/api/tools/${toolId}/photos/${photoId}/primary`, {
      method: 'PUT',
    });
  },
};

// ============================================================================
// User Profile Types
// ============================================================================

export interface UserProfile {
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
  notifyEmail: boolean;
  subscriptionStatus: string;
  subscriptionEndsAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notifyEmail?: boolean;
}

// ============================================================================
// User Profile API
// ============================================================================

export const userApi = {
  /**
   * Get the current user's profile
   * Creates a new user record on first login
   */
  async getCurrentUser(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/users/me');
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/users/me', {
      method: 'PUT',
      body: data,
    });
  },
};

// ============================================================================
// Circle Types
// ============================================================================

export interface CircleMember {
  id: string;
  userId: string;
  role: 'member' | 'admin' | 'owner';
  joinedAt: string;
  user?: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    reputationScore: number;
  };
}

export interface CircleTool {
  id: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  status: string;
  owner?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  primaryPhotoUrl?: string;
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  memberCount?: number;
  currentUserRole?: 'member' | 'admin' | 'owner';
}

export interface CircleDetail extends Circle {
  members?: CircleMember[];
  tools?: CircleTool[];
}

export interface CreateCircleRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface JoinCircleRequest {
  inviteCode: string;
}

export interface UpdateMemberRoleRequest {
  role: 'member' | 'admin';
}

export interface InviteResponse {
  inviteCode: string;
  inviteUrl: string;
}

// ============================================================================
// Circles API
// ============================================================================

export const circlesApi = {
  /**
   * Get all circles the current user is a member of
   */
  async list(): Promise<Circle[]> {
    return apiRequest<Circle[]>('/api/circles');
  },

  /**
   * Get circle details including members and tools
   */
  async get(id: string): Promise<CircleDetail> {
    return apiRequest<CircleDetail>(`/api/circles/${id}`);
  },

  /**
   * Create a new circle
   */
  async create(data: CreateCircleRequest): Promise<Circle> {
    return apiRequest<Circle>('/api/circles', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Join a circle using an invite code
   */
  async join(inviteCode: string): Promise<Circle> {
    return apiRequest<Circle>('/api/circles/join', {
      method: 'POST',
      body: { inviteCode },
    });
  },

  /**
   * Join a specific circle using an invite code
   */
  async joinById(id: string, inviteCode: string): Promise<Circle> {
    return apiRequest<Circle>(`/api/circles/${id}/join`, {
      method: 'POST',
      body: { inviteCode },
    });
  },

  /**
   * Get invite code and URL for a circle (admin only)
   */
  async getInvite(id: string): Promise<InviteResponse> {
    return apiRequest<InviteResponse>(`/api/circles/${id}/invite`, {
      method: 'POST',
    });
  },

  /**
   * Remove a member from a circle (admin only)
   */
  async removeMember(circleId: string, userId: string): Promise<void> {
    return apiRequest<void>(`/api/circles/${circleId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Update a member's role (admin only)
   */
  async updateMemberRole(
    circleId: string,
    userId: string,
    role: 'member' | 'admin'
  ): Promise<CircleMember> {
    return apiRequest<CircleMember>(`/api/circles/${circleId}/members/${userId}`, {
      method: 'PUT',
      body: { role },
    });
  },

  /**
   * Leave a circle
   */
  async leave(circleId: string): Promise<void> {
    return apiRequest<void>(`/api/circles/${circleId}/members/me`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// Subscription Types
// ============================================================================

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'none';

export interface SubscriptionStatusResponse {
  status: SubscriptionStatus;
  subscriptionEndsAt?: string;
  isInGracePeriod: boolean;
  canAccessFeatures: boolean;
  stripeCustomerId?: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface PortalResponse {
  portalUrl: string;
}

// ============================================================================
// Subscription API
// ============================================================================

export const subscriptionApi = {
  /**
   * Get current subscription status
   */
  async getStatus(): Promise<SubscriptionStatusResponse> {
    return apiRequest<SubscriptionStatusResponse>('/api/subscriptions/status');
  },

  /**
   * Create a checkout session for subscription
   */
  async createCheckout(): Promise<CheckoutResponse> {
    return apiRequest<CheckoutResponse>('/api/subscriptions/checkout', {
      method: 'POST',
    });
  },

  /**
   * Get portal URL for managing subscription
   */
  async getPortal(): Promise<PortalResponse> {
    return apiRequest<PortalResponse>('/api/subscriptions/portal');
  },
};

// ============================================================================
// User Profile API (extended)
// ============================================================================

export interface PublicUserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  state?: string;
  reputationScore: number;
  memberSince: string;
}

export interface HistoryItem {
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

export interface UserHistoryResponse {
  lendingHistory: HistoryItem[];
  borrowingHistory: HistoryItem[];
  stats: {
    totalLoans: number;
    totalLends: number;
    memberSince: string;
  };
}

export const userProfileApi = {
  /**
   * Get a user's public profile
   */
  async getPublicProfile(userId: string): Promise<PublicUserProfile> {
    return apiRequest<PublicUserProfile>(`/api/users/${userId}`);
  },

  /**
   * Get current user's history
   */
  async getMyHistory(): Promise<UserHistoryResponse> {
    return apiRequest<UserHistoryResponse>('/api/users/me/history');
  },

  /**
   * Get a user's history
   */
  async getUserHistory(userId: string): Promise<UserHistoryResponse> {
    return apiRequest<UserHistoryResponse>(`/api/users/${userId}/history`);
  },

  /**
   * Get current user's reviews
   */
  async getMyReviews(): Promise<Review[]> {
    return apiRequest<Review[]>('/api/users/me/reviews');
  },

  /**
   * Get a user's reviews
   */
  async getUserReviews(userId: string): Promise<Review[]> {
    return apiRequest<Review[]>(`/api/users/${userId}/reviews`);
  },
};

export { ApiError };
export default { toolsApi, reservationApi, userApi, circlesApi, notificationApi, reviewsApi, subscriptionApi, userProfileApi };
