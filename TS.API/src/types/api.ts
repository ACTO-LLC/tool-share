/**
 * Shared API Types
 * These types are used across multiple controllers to ensure consistency
 */

// User types
export interface UserResponse {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  reputationScore?: number;
}

export interface UserProfileResponse {
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

// Photo types
export interface PhotoResponse {
  id: string;
  url: string;
  isPrimary: boolean;
  uploadedAt?: string;
}

// Tool types - common response format
export interface ToolResponseBase {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  status: string;
}

// Tool response for reservations (simplified)
export interface ToolResponseForReservation extends ToolResponseBase {
  owner?: UserResponse;
  photos?: PhotoResponse[];
}

// Tool response for tool details (full)
export interface ToolResponseFull extends ToolResponseBase {
  upc?: string;
  advanceNoticeDays: number;
  maxLoanDays: number;
  createdAt: string;
  updatedAt?: string;
  owner?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    city?: string;
    state?: string;
    reputationScore: number;
  };
  photos?: PhotoResponse[];
}

// Reservation types
export interface ReservationResponse {
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
  tool?: ToolResponseForReservation;
  borrower?: UserResponse;
}

// Error types
export interface ErrorResponse {
  message: string;
  code?: string;
}
