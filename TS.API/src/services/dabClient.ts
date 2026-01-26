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

  private async query<T>(query: string, variables?: Record<string, unknown>, _authToken?: string): Promise<T> {
    // Note: DAB runs without authentication - all auth is handled by TS.API
    // The authToken parameter is kept for API compatibility but not passed to DAB
    const headers: Record<string, string> = {};

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
        const axiosError = error as { response?: { status: number; data: unknown; headers?: unknown } };
        console.error('[DAB] Request failed:', {
          status: axiosError.response?.status,
          data: JSON.stringify(axiosError.response?.data, null, 2),
          headers: axiosError.response?.headers,
          query: query.substring(0, 200),
        });
      } else {
        console.error('[DAB] Request error:', error);
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
      query GetUserById($id: UUID!) {
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
      query GetToolById($id: UUID!) {
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
      query GetToolsByOwner($ownerId: UUID!) {
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
      status?: 'available' | 'unavailable';
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
    const filters: string[] = [];

    // Filter by status (default to 'available' if not specified, exclude 'archived')
    if (params.status) {
      filters.push(`status: { eq: "${params.status}" }`);
    } else {
      // Default: only show available tools (not 'unavailable' or 'archived')
      filters.push('status: { eq: "available" }');
    }

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
      const searchTerms = params.query.toLowerCase().split(' ').filter(t => t.length > 0);
      const queryLower = params.query.toLowerCase();

      // Calculate relevance score for each tool
      const toolsWithScores = tools.map(tool => {
        const nameLower = tool.name?.toLowerCase() || '';
        const brandLower = tool.brand?.toLowerCase() || '';
        const modelLower = tool.model?.toLowerCase() || '';
        const descLower = tool.description?.toLowerCase() || '';

        let score = 0;

        // Check if all search terms are found somewhere
        const allSearchableText = [nameLower, brandLower, modelLower, descLower].join(' ');
        const matchesAllTerms = searchTerms.every(term => allSearchableText.includes(term));

        if (!matchesAllTerms) {
          return { tool, score: -1 }; // Filter out
        }

        // Exact name match (highest priority)
        if (nameLower === queryLower) {
          score += 100;
        }
        // Name starts with query
        else if (nameLower.startsWith(queryLower)) {
          score += 80;
        }
        // Name contains all terms
        else if (searchTerms.every(term => nameLower.includes(term))) {
          score += 60;
        }

        // Brand/model matches
        if (brandLower === queryLower || modelLower === queryLower) {
          score += 40;
        } else if (searchTerms.some(term => brandLower.includes(term) || modelLower.includes(term))) {
          score += 20;
        }

        // Description matches (lower weight)
        if (searchTerms.some(term => descLower.includes(term))) {
          score += 10;
        }

        // Bonus for each matching term in name
        for (const term of searchTerms) {
          if (nameLower.includes(term)) score += 5;
          if (brandLower.includes(term)) score += 3;
          if (modelLower.includes(term)) score += 3;
        }

        return { tool, score };
      });

      // Filter out non-matching tools and sort by relevance score
      tools = toolsWithScores
        .filter(ts => ts.score >= 0)
        .sort((a, b) => b.score - a.score)
        .map(ts => ts.tool);

      // If sortBy is not 'relevance', apply the requested sort order
      if (params.sortBy && params.sortBy !== 'relevance') {
        if (params.sortBy === 'nameAsc') {
          tools.sort((a, b) => a.name.localeCompare(b.name));
        } else if (params.sortBy === 'nameDesc') {
          tools.sort((a, b) => b.name.localeCompare(a.name));
        } else if (params.sortBy === 'dateAdded') {
          tools.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      }
    }

    // Apply circle filtering if circleId is provided
    if (params.circleId) {
      const circleToolIds = await this.getCircleToolIds(params.circleId, authToken);
      tools = tools.filter(tool => circleToolIds.has(tool.id));
    }

    // Apply availability filtering if date range is provided
    if (params.availableFrom && params.availableTo) {
      const unavailableToolIds = await this.getUnavailableToolIds(
        params.availableFrom,
        params.availableTo,
        authToken
      );
      tools = tools.filter(tool => !unavailableToolIds.has(tool.id));
    }

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
    // Note: Using inline values instead of variables due to DAB 1.7.x bug with UUID variable parsing
    const escStr = (s?: string) => s ? `"${s.replace(/"/g, '\\"')}"` : 'null';
    const mutation = `
      mutation {
        createTool(item: {
          ownerId: "${input.ownerId}"
          name: ${escStr(input.name)}
          description: ${escStr(input.description)}
          category: ${escStr(input.category)}
          brand: ${escStr(input.brand)}
          model: ${escStr(input.model)}
          upc: ${escStr(input.upc)}
          status: ${escStr(input.status)}
          advanceNoticeDays: ${input.advanceNoticeDays ?? 'null'}
          maxLoanDays: ${input.maxLoanDays ?? 'null'}
        }) {
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
      undefined,
      authToken
    );

    return result.createTool;
  }

  async updateTool(id: string, input: UpdateToolInput, authToken?: string): Promise<Tool> {
    const mutation = `
      mutation UpdateTool($id: UUID!, $item: UpdateToolInput!) {
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
      mutation ArchiveTool($id: UUID!, $item: UpdateToolInput!) {
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
      mutation DeleteToolPhoto($id: UUID!) {
        deleteToolPhoto(id: $id) {
          id
        }
      }
    `;

    await this.query(mutation, { id }, authToken);
  }

  async getToolPhoto(id: string, authToken?: string): Promise<ToolPhoto | null> {
    const query = `
      query GetToolPhoto($id: UUID!) {
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
      query GetToolPhotos($toolId: UUID!) {
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
        mutation UpdateToolPhoto($id: UUID!, $item: UpdateToolPhotoInput!) {
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
      query GetToolCircles($toolId: UUID!) {
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
      mutation RemoveToolFromCircle($id: UUID!) {
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
      query GetCircle($id: UUID!) {
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
      query GetCirclesByUser($userId: UUID!) {
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
      query GetCircleMembers($circleId: UUID!) {
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
      query GetCircleMembership($circleId: UUID!, $userId: UUID!) {
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
      mutation UpdateCircleMember($id: UUID!, $item: UpdateCircleMemberInput!) {
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
      mutation DeleteCircleMember($id: UUID!) {
        deleteCircleMember(id: $id) {
          id
        }
      }
    `;

    await this.query(mutation, { id }, authToken);
  }

  async getCircleTools(circleId: string, authToken?: string): Promise<Tool[]> {
    const query = `
      query GetCircleTools($circleId: UUID!) {
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

  // ==================== AVAILABILITY FILTERING ====================

  /**
   * Get tool IDs that have conflicting reservations in the given date range.
   * A tool is unavailable if it has a pending, confirmed, or active reservation
   * that overlaps with the requested date range.
   */
  async getUnavailableToolIds(
    availableFrom: string,
    availableTo: string,
    authToken?: string
  ): Promise<Set<string>> {
    const query = `
      query GetConflictingReservations {
        reservations(
          filter: { status: { in: ["pending", "confirmed", "active"] } }
          first: 1000
        ) {
          items {
            toolId
            startDate
            endDate
          }
        }
      }
    `;

    const result = await this.query<{
      reservations: { items: Array<{ toolId: string; startDate: string; endDate: string }> };
    }>(query, {}, authToken);

    const unavailableToolIds = new Set<string>();
    const requestedStart = new Date(availableFrom);
    const requestedEnd = new Date(availableTo);

    for (const reservation of result.reservations.items) {
      const resStart = new Date(reservation.startDate);
      const resEnd = new Date(reservation.endDate);

      // Check for overlap: requested range starts before reservation ends AND requested range ends after reservation starts
      if (requestedStart <= resEnd && requestedEnd >= resStart) {
        unavailableToolIds.add(reservation.toolId);
      }
    }

    return unavailableToolIds;
  }

  /**
   * Get tool IDs that belong to a specific circle.
   */
  async getCircleToolIds(circleId: string, authToken?: string): Promise<Set<string>> {
    const query = `
      query GetCircleToolIds($circleId: UUID!) {
        toolCircles(filter: { circleId: { eq: $circleId } }) {
          items {
            toolId
          }
        }
      }
    `;

    const result = await this.query<{
      toolCircles: { items: Array<{ toolId: string }> };
    }>(query, { circleId }, authToken);

    return new Set(result.toolCircles.items.map(tc => tc.toolId));
  }

  // ==================== CATEGORIES ====================

  getCategories(): string[] {
    return [
      'Power Tools',
      'Hand Tools',
      'Garden/Yard',
      'Automotive',
      'Kitchen',
      'Camping/Outdoor',
      'Electronics',
      'Other',
    ];
  }
}

// Export singleton instance
export const dabClient = new DabClient();
