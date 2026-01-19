// Core entity types matching the database schema

export interface User {
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
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled';
  createdAt: string;
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
}

export interface CircleMember {
  id: string;
  circleId: string;
  userId: string;
  role: 'member' | 'admin' | 'owner';
  joinedAt: string;
  user?: User;
}

export interface Tool {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  category: ToolCategory;
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
  toolId: string;
  url: string;
  isPrimary: boolean;
  uploadedAt: string;
}

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

export type ToolCategory =
  | 'Power Tools'
  | 'Hand Tools'
  | 'Gardening'
  | 'Automotive'
  | 'Plumbing'
  | 'Electrical'
  | 'Painting'
  | 'Measuring'
  | 'Safety'
  | 'Other';

export const TOOL_CATEGORIES: ToolCategory[] = [
  'Power Tools',
  'Hand Tools',
  'Gardening',
  'Automotive',
  'Plumbing',
  'Electrical',
  'Painting',
  'Measuring',
  'Safety',
  'Other',
];

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}
