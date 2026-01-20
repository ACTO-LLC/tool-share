import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';

// Types matching the database schema
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
  subscriptionStatus: string;
  createdAt: string;
  updatedAt?: string;
}

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
  toolId: string;
  url: string;
  blobName?: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface ToolCircle {
  id: string;
  toolId: string;
  circleId: string;
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CircleMember {
  id: string;
  circleId: string;
  userId: string;
  role: 'member' | 'admin' | 'owner';
  joinedAt: string;
}

// GraphQL response types
interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

// Input types for mutations
export interface CreateToolInput {
  ownerId: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  upc?: string;
  status?: string;
  advanceNoticeDays?: number;
  maxLoanDays?: number;
}

export interface UpdateToolInput {
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  status?: string;
  advanceNoticeDays?: number;
  maxLoanDays?: number;
}

export interface CreateToolPhotoInput {
  toolId: string;
  url: string;
  blobName?: string;
  isPrimary?: boolean;
}

class DabClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.DAB_GRAPHQL_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async query<T>(query: string, variables?: Record<string, unknown>, authToken?: string): Promise<T> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await this.client.post<GraphQLResponse<T>>(
        '',
        { query, variables },
        { headers }
      );

      if (response.data.errors && response.data.errors.length > 0) {
        console.error('[DAB] GraphQL errors:', JSON.stringify(response.data.errors, null, 2));
        throw new Error(response.data.errors[0].message);
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { status: number; data: unknown } };
        console.error('[DAB] Request failed:', {
          status: axiosError.response?.status,
          data: JSON.stringify(axiosError.response?.data, null, 2),
        });
      }
      throw error;
    }
  }

  // ==================== USER QUERIES ====================

  async getUserByExternalId(externalId: string, authToken?: string): Promise<User | null> {
    const query = `
      query GetUserByExternalId($externalId: String!) {
        users(filter: { externalId: { eq: $externalId } }) {
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
            subscriptionStatus
            createdAt
            updatedAt
          }
        }
      }
    `;

    const result = await this.query<{ users: { items: User[] } }>(
      query,
      { externalId },
      authToken
    );

    return result.users.items[0] || null;
  }

  async getUserById(id: string, authToken?: string): Promise<User | null> {
    const query = `
      query GetUserById($id: ID!) {
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
          subscriptionStatus
          createdAt
          updatedAt
        }
      }
    `;

    const result = await this.query<{ user_by_pk: User | null }>(
      query,
      { id },
      authToken
    );

    return result.user_by_pk;
  }

  // ==================== TOOL QUERIES ====================

  async getToolById(id: string, authToken?: string): Promise<Tool | null> {
    const query = `
      query GetToolById($id: ID!) {
        tool_by_pk(id: $id) {
          id
          ownerId
          name
          description
          category
          brand
          model
          upc
          status
          advanceNoticeDays
          maxLoanDays
          createdAt
          updatedAt
          owner {
            id
            displayName
            email
            avatarUrl
            city
            state
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

    const result = await this.query<{ tool_by_pk: (Tool & { photos: { items: ToolPhoto[] } }) | null }>(
      query,
      { id },
      authToken
    );

    if (!result.tool_by_pk) {
      return null;
    }

    // Flatten photos array
    return {
      ...result.tool_by_pk,
      photos: result.tool_by_pk.photos?.items || [],
    };
  }

  async getToolsByOwner(ownerId: string, authToken?: string): Promise<Tool[]> {
    const query = `
      query GetToolsByOwner($ownerId: ID!) {
        tools(filter: { ownerId: { eq: $ownerId } }, orderBy: { createdAt: DESC }) {
          items {
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
            photos {
              items {
                id
                url
                isPrimary
                uploadedAt
              }
            }
          }
        }
      }
    `;

    const result = await this.query<{ tools: { items: Array<Tool & { photos: { items: ToolPhoto[] } }> } }>(
      query,
      { ownerId },
      authToken
    );

    // Flatten photos arrays
    return result.tools.items.map(tool => ({
      ...tool,
      photos: tool.photos?.items || [],
    }));
  }

  async searchTools(
    params: {
      query?: string;
      category?: string;
      circleId?: string;
      ownerId?: string;
      availableFrom?: string;
      availableTo?: string;
      sortBy?: 'relevance' | 'dateAdded' | 'nameAsc' | 'nameDesc';
      page?: number;
      pageSize?: number;
    },
    authToken?: string
  ): Promise<{ tools: Tool[]; total: number }> {
    // Build filter conditions
    const filters: string[] = ['status: { eq: "available" }'];

    if (params.category) {
      filters.push(`category: { eq: "${params.category}" }`);
    }

    if (params.ownerId) {
      filters.push(`ownerId: { eq: "${params.ownerId}" }`);
    }

    // Note: Full-text search on name/description would require a custom view or stored procedure
    // For now, we'll use contains filter which may not perform as well
    // In production, consider Azure Cognitive Search for better full-text search

    // Determine sort order based on sortBy parameter
    let orderBy = '{ createdAt: DESC }';
    if (params.sortBy === 'nameAsc') {
      orderBy = '{ name: ASC }';
    } else if (params.sortBy === 'nameDesc') {
      orderBy = '{ name: DESC }';
    } else if (params.sortBy === 'dateAdded') {
      orderBy = '{ createdAt: DESC }';
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const query = `
      query SearchTools($first: Int, $after: String) {
        tools(
          filter: { ${filters.join(', ')} }
          first: $first
          after: $after
          orderBy: ${orderBy}
        ) {
          items {
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
              displayName
              avatarUrl
              city
              state
              reputationScore
            }
            photos {
              items {
                id
                url
                isPrimary
                uploadedAt
              }
            }
          }
          hasNextPage
          endCursor
        }
      }
    `;

    const result = await this.query<{
      tools: {
        items: Array<Tool & { photos: { items: ToolPhoto[] } }>;
        hasNextPage: boolean;
        endCursor?: string;
      };
    }>(
      query,
      { first: pageSize, after: offset > 0 ? String(offset) : null },
      authToken
    );

    // Apply text search filter client-side if query is provided
    // This is a temporary solution - in production use Azure Cognitive Search
    let tools = result.tools.items.map(tool => ({
      ...tool,
      photos: tool.photos?.items || [],
    }));

    if (params.query) {
      const searchTerms = params.query.toLowerCase().split(' ');
      tools = tools.filter(tool => {
        const searchableText = [
          tool.name,
          tool.description,
          tool.brand,
          tool.model,
        ].filter(Boolean).join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // TODO: Circle filtering would require joining with toolCircles table
    // For now, this would need to be done client-side or with a custom view

    // TODO: Availability filtering would require checking reservations
    // Filter out tools with conflicting reservations in the date range

    return {
      tools,
      total: tools.length, // Note: DAB doesn't provide total count easily; would need separate count query
    };
  }

  async getAllAvailableTools(authToken?: string): Promise<Tool[]> {
    const query = `
      query GetAllAvailableTools {
        tools(
          filter: { status: { eq: "available" } }
          orderBy: { createdAt: DESC }
          first: 100
        ) {
          items {
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
              displayName
              avatarUrl
              city
              state
              reputationScore
            }
            photos {
              items {
                id
                url
                isPrimary
                uploadedAt
              }
            }
          }
        }
      }
    `;

    const result = await this.query<{
      tools: { items: Array<Tool & { photos: { items: ToolPhoto[] } }> };
    }>(query, {}, authToken);

    return result.tools.items.map(tool => ({
      ...tool,
      photos: tool.photos?.items || [],
    }));
  }

  // ==================== TOOL MUTATIONS ====================

  async createTool(input: CreateToolInput, authToken?: string): Promise<Tool> {
    const mutation = `
      mutation CreateTool($item: CreateToolInput!) {
        createTool(item: $item) {
          id
          ownerId
          name
          description
          category
          brand
          model
          upc
          status
          advanceNoticeDays
          maxLoanDays
          createdAt
        }
      }
    `;

    const result = await this.query<{ createTool: Tool }>(
      mutation,
      { item: input },
      authToken
    );

    return result.createTool;
  }

  async updateTool(id: string, input: UpdateToolInput, authToken?: string): Promise<Tool> {
    const mutation = `
      mutation UpdateTool($id: ID!, $item: UpdateToolInput!) {
        updateTool(id: $id, item: $item) {
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
          updatedAt
        }
      }
    `;

    const result = await this.query<{ updateTool: Tool }>(
      mutation,
      { id, item: { ...input, updatedAt: new Date().toISOString() } },
      authToken
    );

    return result.updateTool;
  }

  async deleteTool(id: string, authToken?: string): Promise<void> {
    // Soft delete by setting status to 'archived'
    const mutation = `
      mutation ArchiveTool($id: ID!, $item: UpdateToolInput!) {
        updateTool(id: $id, item: $item) {
          id
          status
        }
      }
    `;

    await this.query(
      mutation,
      { id, item: { status: 'archived', updatedAt: new Date().toISOString() } },
      authToken
    );
  }

  // ==================== TOOL PHOTO MUTATIONS ====================

  async createToolPhoto(input: CreateToolPhotoInput, authToken?: string): Promise<ToolPhoto> {
    const mutation = `
      mutation CreateToolPhoto($item: CreateToolPhotoInput!) {
        createToolPhoto(item: $item) {
          id
          toolId
          url
          isPrimary
          uploadedAt
        }
      }
    `;

    const result = await this.query<{ createToolPhoto: ToolPhoto }>(
      mutation,
      { item: { ...input, uploadedAt: new Date().toISOString() } },
      authToken
    );

    return result.createToolPhoto;
  }

  async deleteToolPhoto(id: string, authToken?: string): Promise<void> {
    const mutation = `
      mutation DeleteToolPhoto($id: ID!) {
        deleteToolPhoto(id: $id) {
          id
        }
      }
    `;

    await this.query(mutation, { id }, authToken);
  }

  async getToolPhoto(id: string, authToken?: string): Promise<ToolPhoto | null> {
    const query = `
      query GetToolPhoto($id: ID!) {
        toolPhoto_by_pk(id: $id) {
          id
          toolId
          url
          isPrimary
          uploadedAt
        }
      }
    `;

    const result = await this.query<{ toolPhoto_by_pk: ToolPhoto | null }>(
      query,
      { id },
      authToken
    );

    return result.toolPhoto_by_pk;
  }

  async setToolPhotoPrimary(toolId: string, photoId: string, authToken?: string): Promise<void> {
    // First, unset all photos as non-primary
    const query = `
      query GetToolPhotos($toolId: ID!) {
        toolPhotos(filter: { toolId: { eq: $toolId } }) {
          items {
            id
            isPrimary
          }
        }
      }
    `;

    const result = await this.query<{ toolPhotos: { items: ToolPhoto[] } }>(
      query,
      { toolId },
      authToken
    );

    // Update all photos to non-primary, then set the specified one as primary
    for (const photo of result.toolPhotos.items) {
      const mutation = `
        mutation UpdateToolPhoto($id: ID!, $item: UpdateToolPhotoInput!) {
          updateToolPhoto(id: $id, item: $item) {
            id
            isPrimary
          }
        }
      `;

      await this.query(
        mutation,
        { id: photo.id, item: { isPrimary: photo.id === photoId } },
        authToken
      );
    }
  }

  // ==================== TOOL CIRCLES ====================

  async getToolCircles(toolId: string, authToken?: string): Promise<Circle[]> {
    const query = `
      query GetToolCircles($toolId: ID!) {
        toolCircles(filter: { toolId: { eq: $toolId } }) {
          items {
            id
            circle {
              id
              name
              description
              inviteCode
              isPublic
              createdBy
              createdAt
            }
          }
        }
      }
    `;

    const result = await this.query<{
      toolCircles: { items: Array<{ id: string; circle: Circle }> };
    }>(query, { toolId }, authToken);

    return result.toolCircles.items.map(tc => tc.circle);
  }

  async addToolToCircle(toolId: string, circleId: string, authToken?: string): Promise<ToolCircle> {
    const mutation = `
      mutation AddToolToCircle($item: CreateToolCircleInput!) {
        createToolCircle(item: $item) {
          id
          toolId
          circleId
        }
      }
    `;

    const result = await this.query<{ createToolCircle: ToolCircle }>(
      mutation,
      { item: { toolId, circleId } },
      authToken
    );

    return result.createToolCircle;
  }

  async removeToolFromCircle(toolCircleId: string, authToken?: string): Promise<void> {
    const mutation = `
      mutation RemoveToolFromCircle($id: ID!) {
        deleteToolCircle(id: $id) {
          id
        }
      }
    `;

    await this.query(mutation, { id: toolCircleId }, authToken);
  }

  // ==================== CIRCLE MANAGEMENT ====================

  async createCircle(
    input: {
      name: string;
      description?: string;
      isPublic: boolean;
      createdBy: string;
      inviteCode: string;
    },
    authToken?: string
  ): Promise<Circle> {
    const mutation = `
      mutation CreateCircle($item: CreateCircleInput!) {
        createCircle(item: $item) {
          id
          name
          description
          inviteCode
          isPublic
          createdBy
          createdAt
        }
      }
    `;

    const result = await this.query<{ createCircle: Circle }>(
      mutation,
      {
        item: {
          id: crypto.randomUUID(),
          name: input.name,
          description: input.description || null,
          isPublic: input.isPublic,
          createdBy: input.createdBy,
          inviteCode: input.inviteCode,
          createdAt: new Date().toISOString(),
        },
      },
      authToken
    );

    return result.createCircle;
  }

  async getCircleById(id: string, authToken?: string): Promise<Circle | null> {
    const query = `
      query GetCircle($id: ID!) {
        circle_by_pk(id: $id) {
          id
          name
          description
          inviteCode
          isPublic
          createdBy
          createdAt
        }
      }
    `;

    const result = await this.query<{ circle_by_pk: Circle | null }>(
      query,
      { id },
      authToken
    );

    return result.circle_by_pk;
  }

  async getCircleByInviteCode(inviteCode: string, authToken?: string): Promise<Circle | null> {
    const query = `
      query GetCircleByInviteCode($inviteCode: String!) {
        circles(filter: { inviteCode: { eq: $inviteCode } }) {
          items {
            id
            name
            description
            inviteCode
            isPublic
            createdBy
            createdAt
          }
        }
      }
    `;

    const result = await this.query<{ circles: { items: Circle[] } }>(
      query,
      { inviteCode },
      authToken
    );

    return result.circles.items[0] || null;
  }

  async getCirclesByUser(
    userId: string,
    authToken?: string
  ): Promise<Array<Circle & { memberCount: number; currentUserRole: 'member' | 'admin' | 'owner' }>> {
    const query = `
      query GetCirclesByUser($userId: ID!) {
        circleMembers(filter: { userId: { eq: $userId } }) {
          items {
            id
            role
            circle {
              id
              name
              description
              inviteCode
              isPublic
              createdBy
              createdAt
              members {
                items {
                  id
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.query<{
      circleMembers: {
        items: Array<{
          id: string;
          role: 'member' | 'admin' | 'owner';
          circle: Circle & { members: { items: Array<{ id: string }> } };
        }>;
      };
    }>(query, { userId }, authToken);

    return result.circleMembers.items.map(membership => ({
      ...membership.circle,
      memberCount: membership.circle.members?.items?.length || 0,
      currentUserRole: membership.role,
    }));
  }

  async getCircleMembers(
    circleId: string,
    authToken?: string
  ): Promise<Array<CircleMember & { user?: User }>> {
    const query = `
      query GetCircleMembers($circleId: ID!) {
        circleMembers(filter: { circleId: { eq: $circleId } }) {
          items {
            id
            circleId
            userId
            role
            joinedAt
            user {
              id
              displayName
              email
              avatarUrl
              reputationScore
            }
          }
        }
      }
    `;

    const result = await this.query<{
      circleMembers: { items: Array<CircleMember & { user?: User }> };
    }>(query, { circleId }, authToken);

    return result.circleMembers.items;
  }

  async getCircleMembership(
    circleId: string,
    userId: string,
    authToken?: string
  ): Promise<CircleMember | null> {
    const query = `
      query GetCircleMembership($circleId: ID!, $userId: ID!) {
        circleMembers(filter: { circleId: { eq: $circleId }, userId: { eq: $userId } }) {
          items {
            id
            circleId
            userId
            role
            joinedAt
          }
        }
      }
    `;

    const result = await this.query<{ circleMembers: { items: CircleMember[] } }>(
      query,
      { circleId, userId },
      authToken
    );

    return result.circleMembers.items[0] || null;
  }

  async createCircleMember(
    input: {
      circleId: string;
      userId: string;
      role: 'member' | 'admin' | 'owner';
    },
    authToken?: string
  ): Promise<CircleMember> {
    const mutation = `
      mutation CreateCircleMember($item: CreateCircleMemberInput!) {
        createCircleMember(item: $item) {
          id
          circleId
          userId
          role
          joinedAt
        }
      }
    `;

    const result = await this.query<{ createCircleMember: CircleMember }>(
      mutation,
      {
        item: {
          id: crypto.randomUUID(),
          circleId: input.circleId,
          userId: input.userId,
          role: input.role,
          joinedAt: new Date().toISOString(),
        },
      },
      authToken
    );

    return result.createCircleMember;
  }

  async updateCircleMember(
    id: string,
    input: { role: 'member' | 'admin' },
    authToken?: string
  ): Promise<CircleMember> {
    const mutation = `
      mutation UpdateCircleMember($id: ID!, $item: UpdateCircleMemberInput!) {
        updateCircleMember(id: $id, item: $item) {
          id
          circleId
          userId
          role
          joinedAt
        }
      }
    `;

    const result = await this.query<{ updateCircleMember: CircleMember }>(
      mutation,
      { id, item: input },
      authToken
    );

    return result.updateCircleMember;
  }

  async deleteCircleMember(id: string, authToken?: string): Promise<void> {
    const mutation = `
      mutation DeleteCircleMember($id: ID!) {
        deleteCircleMember(id: $id) {
          id
        }
      }
    `;

    await this.query(mutation, { id }, authToken);
  }

  async getCircleTools(circleId: string, authToken?: string): Promise<Tool[]> {
    const query = `
      query GetCircleTools($circleId: ID!) {
        toolCircles(filter: { circleId: { eq: $circleId } }) {
          items {
            id
            tool {
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
                displayName
                avatarUrl
              }
              photos {
                items {
                  id
                  url
                  isPrimary
                  uploadedAt
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.query<{
      toolCircles: { items: Array<{ id: string; tool: Tool & { photos: { items: ToolPhoto[] } } }> };
    }>(query, { circleId }, authToken);

    // Extract tools and flatten photos
    return result.toolCircles.items
      .filter(tc => tc.tool && tc.tool.status !== 'archived')
      .map(tc => ({
        ...tc.tool,
        photos: tc.tool.photos?.items || [],
      }));
  }

  // ==================== CATEGORIES ====================

  getCategories(): string[] {
    return [
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
  }
}

// Export singleton instance
export const dabClient = new DabClient();
