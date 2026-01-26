import { Tool, User, Reservation, Circle, CircleMember } from '../types';

// Mock current user - matches seed data "test-user-1" (John Doe)
export const mockCurrentUser: User = {
  id: '11111111-1111-1111-1111-111111111111',
  externalId: 'test-user-1',
  displayName: 'John Doe',
  email: 'john@example.com',
  city: 'San Francisco',
  state: 'CA',
  reputationScore: 4.75,
  subscriptionStatus: 'active',
  createdAt: '2024-01-01T00:00:00Z',
};

export const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: '22222222-2222-2222-2222-222222222222',
    externalId: 'test-user-2',
    displayName: 'Jane Smith',
    email: 'jane@example.com',
    city: 'Oakland',
    state: 'CA',
    reputationScore: 4.9,
    subscriptionStatus: 'active',
    createdAt: '2024-02-15T00:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    externalId: 'test-user-3',
    displayName: 'Bob Johnson',
    email: 'bob@example.com',
    city: 'Berkeley',
    state: 'CA',
    reputationScore: 4.5,
    subscriptionStatus: 'active',
    createdAt: '2024-03-01T00:00:00Z',
  },
];

export const mockTools: Tool[] = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    ownerId: '11111111-1111-1111-1111-111111111111',
    name: 'DeWalt Cordless Drill',
    description: '20V MAX cordless drill/driver. Includes 2 batteries and charger. Great for most home projects.',
    category: 'Power Tools',
    brand: 'DeWalt',
    model: 'DCD771C2',
    status: 'available',
    advanceNoticeDays: 1,
    maxLoanDays: 7,
    createdAt: '2024-01-15T00:00:00Z',
    owner: mockCurrentUser,
    photos: [
      { id: '1', toolId: '33333333-3333-3333-3333-333333333333', url: 'https://placehold.co/400x300/orange/white?text=DeWalt+Drill', isPrimary: true, uploadedAt: '2024-01-15T00:00:00Z' },
    ],
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    ownerId: '11111111-1111-1111-1111-111111111111',
    name: 'Extension Ladder',
    description: '24-foot aluminum extension ladder. Great for roof access, gutter cleaning, and exterior painting.',
    category: 'Other',
    brand: 'Werner',
    model: 'D1224-2',
    status: 'available',
    advanceNoticeDays: 2,
    maxLoanDays: 3,
    createdAt: '2024-01-20T00:00:00Z',
    owner: mockCurrentUser,
    photos: [
      { id: '2', toolId: '44444444-4444-4444-4444-444444444444', url: 'https://placehold.co/400x300/silver/black?text=Extension+Ladder', isPrimary: true, uploadedAt: '2024-01-20T00:00:00Z' },
    ],
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    ownerId: '11111111-1111-1111-1111-111111111111',
    name: 'Circular Saw',
    description: '7-1/4 inch circular saw with laser guide. Perfect for cutting plywood and lumber.',
    category: 'Power Tools',
    brand: 'Makita',
    model: '5007MGA',
    status: 'available',
    advanceNoticeDays: 1,
    maxLoanDays: 5,
    createdAt: '2024-02-01T00:00:00Z',
    owner: mockCurrentUser,
    photos: [
      { id: '3', toolId: '55555555-5555-5555-5555-555555555555', url: 'https://placehold.co/400x300/teal/white?text=Circular+Saw', isPrimary: true, uploadedAt: '2024-02-01T00:00:00Z' },
    ],
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    ownerId: '22222222-2222-2222-2222-222222222222',
    name: 'Pressure Washer',
    description: '3000 PSI gas pressure washer. Great for decks, driveways, and siding.',
    category: 'Other',
    brand: 'Honda',
    model: 'GCV190',
    status: 'available',
    advanceNoticeDays: 2,
    maxLoanDays: 2,
    createdAt: '2024-02-10T00:00:00Z',
    owner: mockUsers[1],
    photos: [
      { id: '4', toolId: '66666666-6666-6666-6666-666666666666', url: 'https://placehold.co/400x300/red/white?text=Pressure+Washer', isPrimary: true, uploadedAt: '2024-02-10T00:00:00Z' },
    ],
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    ownerId: '22222222-2222-2222-2222-222222222222',
    name: 'Tile Saw',
    description: '10-inch wet tile saw. Essential for bathroom or kitchen tile projects.',
    category: 'Power Tools',
    brand: 'DEWALT',
    model: 'D24000',
    status: 'available',
    advanceNoticeDays: 3,
    maxLoanDays: 5,
    createdAt: '2024-02-15T00:00:00Z',
    owner: mockUsers[1],
    photos: [
      { id: '5', toolId: '77777777-7777-7777-7777-777777777777', url: 'https://placehold.co/400x300/yellow/black?text=Tile+Saw', isPrimary: true, uploadedAt: '2024-02-15T00:00:00Z' },
    ],
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    ownerId: '33333333-3333-3333-3333-333333333333',
    name: 'Hedge Trimmer',
    description: 'Electric hedge trimmer with 22-inch blade. Perfect for shaping hedges and shrubs.',
    category: 'Gardening',
    brand: 'Black+Decker',
    model: 'HT22',
    status: 'available',
    advanceNoticeDays: 1,
    maxLoanDays: 3,
    createdAt: '2024-03-01T00:00:00Z',
    owner: mockUsers[2],
    photos: [
      { id: '6', toolId: '88888888-8888-8888-8888-888888888888', url: 'https://placehold.co/400x300/green/white?text=Hedge+Trimmer', isPrimary: true, uploadedAt: '2024-03-01T00:00:00Z' },
    ],
  },
];

export const mockReservations: Reservation[] = [
  {
    id: 'res-1',
    toolId: '66666666-6666-6666-6666-666666666666',
    borrowerId: '11111111-1111-1111-1111-111111111111',
    status: 'confirmed',
    startDate: '2026-01-20',
    endDate: '2026-01-21',
    note: 'Need it for driveway cleaning',
    createdAt: '2026-01-15T00:00:00Z',
    tool: mockTools[3],
    borrower: mockCurrentUser,
  },
  {
    id: 'res-2',
    toolId: '33333333-3333-3333-3333-333333333333',
    borrowerId: '22222222-2222-2222-2222-222222222222',
    status: 'pending',
    startDate: '2026-01-25',
    endDate: '2026-01-27',
    note: 'Building a bookshelf',
    createdAt: '2026-01-18T00:00:00Z',
    tool: mockTools[0],
    borrower: mockUsers[1],
  },
  {
    id: 'res-3',
    toolId: '55555555-5555-5555-5555-555555555555',
    borrowerId: '33333333-3333-3333-3333-333333333333',
    status: 'completed',
    startDate: '2026-01-10',
    endDate: '2026-01-12',
    note: 'Deck repairs',
    createdAt: '2026-01-05T00:00:00Z',
    tool: mockTools[2],
    borrower: mockUsers[2],
  },
];

export const mockCircles: Circle[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Friends Circle',
    description: 'A circle for close friends to share tools',
    inviteCode: 'FRIEND123',
    isPublic: false,
    createdBy: '11111111-1111-1111-1111-111111111111',
    createdAt: '2024-01-01T00:00:00Z',
    memberCount: 3,
  },
  {
    id: 'circle-2',
    name: 'Neighborhood DIY',
    description: 'Share tools with neighbors on Maple Street',
    inviteCode: 'MAPLE456',
    isPublic: false,
    createdBy: '22222222-2222-2222-2222-222222222222',
    createdAt: '2024-02-01T00:00:00Z',
    memberCount: 8,
  },
];

export const mockCircleMembers: CircleMember[] = [
  {
    id: 'cm-1',
    circleId: '22222222-2222-2222-2222-222222222222',
    userId: '11111111-1111-1111-1111-111111111111',
    role: 'owner',
    joinedAt: '2024-01-01T00:00:00Z',
    user: mockCurrentUser,
  },
  {
    id: 'cm-2',
    circleId: '22222222-2222-2222-2222-222222222222',
    userId: '22222222-2222-2222-2222-222222222222',
    role: 'member',
    joinedAt: '2024-01-05T00:00:00Z',
    user: mockUsers[1],
  },
  {
    id: 'cm-3',
    circleId: '22222222-2222-2222-2222-222222222222',
    userId: '33333333-3333-3333-3333-333333333333',
    role: 'member',
    joinedAt: '2024-01-10T00:00:00Z',
    user: mockUsers[2],
  },
];

// Helper functions
export function getToolsByOwner(ownerId: string): Tool[] {
  return mockTools.filter((t) => t.ownerId === ownerId);
}

export function getAvailableTools(): Tool[] {
  return mockTools.filter((t) => t.status === 'available');
}

export function getReservationsByBorrower(borrowerId: string): Reservation[] {
  return mockReservations.filter((r) => r.borrowerId === borrowerId);
}

export function getReservationsForOwner(ownerId: string): Reservation[] {
  return mockReservations.filter((r) => r.tool?.ownerId === ownerId);
}

export function getPendingRequestsForOwner(ownerId: string): Reservation[] {
  return mockReservations.filter(
    (r) => r.tool?.ownerId === ownerId && r.status === 'pending'
  );
}
