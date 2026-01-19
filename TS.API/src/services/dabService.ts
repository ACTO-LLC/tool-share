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
    query GetUser($id: ID!) {
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
    mutation UpdateUser($id: ID!, $item: UpdateUserInput!) {
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
    query GetTool($id: ID!) {
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
    query GetReservation($id: ID!) {
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
    mutation UpdateReservation($id: ID!, $item: UpdateReservationInput!) {
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
