import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Path,
  Query,
  Body,
  Route,
  Tags,
  Security,
  Request,
  UploadedFile,
  FormField,
  SuccessResponse,
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { AuthenticatedUser } from '../middleware/auth';
import { lookupUpc, searchProducts } from '../services/upcService';
import { dabClient, Tool, CreateToolInput, UpdateToolInput } from '../services/dabClient';
import { blobStorageService } from '../services/blobStorageService';

// ==================== Response Interfaces ====================

interface ToolLookupResponse {
  found: boolean;
  name?: string;
  brand?: string;
  model?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
}

interface SearchResult {
  upc: string;
  name: string;
  brand?: string;
}

interface PhotoUploadResponse {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface ToolResponse {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  upc?: string;
  status: string;
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
  photos?: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
    uploadedAt: string;
  }>;
}

interface ToolListResponse {
  tools: ToolResponse[];
  total: number;
  page: number;
  pageSize: number;
}

interface CreateToolRequest {
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

interface UpdateToolRequest {
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  status?: 'available' | 'unavailable';
  advanceNoticeDays?: number;
  maxLoanDays?: number;
}

// ==================== Controller ====================

@Route('api/tools')
@Tags('Tools')
export class ToolsController extends Controller {
  // ==================== UPC LOOKUP ====================

  /**
   * Look up tool information by UPC/barcode
   */
  @Get('/lookup')
  public async lookupTool(@Query() upc: string): Promise<ToolLookupResponse> {
    const result = await lookupUpc(upc);
    return result;
  }

  /**
   * Search for tools by name (UPCitemdb search)
   */
  @Get('/lookup/search')
  public async searchToolsUpc(@Query() q: string): Promise<{ results: SearchResult[] }> {
    const results = await searchProducts(q);
    return { results };
  }

  // ==================== CATEGORIES ====================

  /**
   * Get all available tool categories
   */
  @Get('/categories')
  public async getCategories(): Promise<string[]> {
    return dabClient.getCategories();
  }

  // ==================== SEARCH ====================

  /**
   * Search tools with filters
   */
  @Get('/search')
  @Security('Bearer')
  public async searchTools(
    @Request() request: ExpressRequest,
    @Query() q?: string,
    @Query() category?: string,
    @Query() circleId?: string,
    @Query() ownerId?: string,
    @Query() availableFrom?: string,
    @Query() availableTo?: string,
    @Query() sortBy?: 'relevance' | 'dateAdded' | 'nameAsc' | 'nameDesc',
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<ToolListResponse> {
    const authToken = this.getAuthToken(request);

    const result = await dabClient.searchTools(
      {
        query: q,
        category,
        circleId,
        ownerId,
        availableFrom,
        availableTo,
        sortBy: sortBy || 'relevance',
        page: page || 1,
        pageSize: pageSize || 20,
      },
      authToken
    );

    // Transform to response format with SAS URLs for photos
    const tools = result.tools.map(tool => this.transformToolResponse(tool));

    return {
      tools,
      total: result.total,
      page: page || 1,
      pageSize: pageSize || 20,
    };
  }

  /**
   * Browse all available tools (public browsing)
   */
  @Get('/browse')
  @Security('Bearer')
  public async browseTools(
    @Request() request: ExpressRequest,
    @Query() category?: string,
    @Query() circleId?: string,
    @Query() ownerId?: string,
    @Query() availableFrom?: string,
    @Query() availableTo?: string,
    @Query() sortBy?: 'relevance' | 'dateAdded' | 'nameAsc' | 'nameDesc',
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<ToolListResponse> {
    const authToken = this.getAuthToken(request);
    const allTools = await dabClient.getAllAvailableTools(authToken);

    // Apply filters
    let filteredTools = allTools;

    if (category) {
      filteredTools = filteredTools.filter(t => t.category === category);
    }

    if (ownerId) {
      filteredTools = filteredTools.filter(t => t.ownerId === ownerId);
    }

    // TODO: Circle filtering would require additional DB query to check tool-circle associations
    // For now, circleId filtering is handled in the search endpoint with DAB

    // TODO: Availability filtering would require checking reservations
    // For now, this is a placeholder - would need to query reservations table
    // and exclude tools with conflicting reservations in the date range

    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'nameAsc':
          filteredTools.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'nameDesc':
          filteredTools.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'dateAdded':
          filteredTools.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'relevance':
        default:
          // Default sorting by createdAt desc
          filteredTools.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
    }

    // Apply pagination
    const currentPage = page || 1;
    const currentPageSize = pageSize || 20;
    const start = (currentPage - 1) * currentPageSize;
    const paginatedTools = filteredTools.slice(start, start + currentPageSize);

    const tools = paginatedTools.map(tool => this.transformToolResponse(tool));

    return {
      tools,
      total: filteredTools.length,
      page: currentPage,
      pageSize: currentPageSize,
    };
  }

  // ==================== TOOL CRUD ====================

  /**
   * Create a new tool
   */
  @Post('/')
  @Security('Bearer')
  @SuccessResponse(201, 'Created')
  public async createTool(
    @Request() request: ExpressRequest,
    @Body() body: CreateToolRequest
  ): Promise<ToolResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Get the user's internal ID from their external ID
    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      this.setStatus(401);
      throw new Error('User not found');
    }

    const input: CreateToolInput = {
      ownerId: dbUser.id,
      name: body.name,
      description: body.description,
      category: body.category,
      brand: body.brand,
      model: body.model,
      upc: body.upc,
      status: 'available',
      advanceNoticeDays: body.advanceNoticeDays ?? 1,
      maxLoanDays: body.maxLoanDays ?? 7,
    };

    const tool = await dabClient.createTool(input, authToken);

    // Add to circles if specified
    if (body.circleIds && body.circleIds.length > 0) {
      for (const circleId of body.circleIds) {
        await dabClient.addToolToCircle(tool.id, circleId, authToken);
      }
    }

    this.setStatus(201);
    return this.transformToolResponse(tool);
  }

  /**
   * Get a specific tool by ID
   */
  @Get('/{id}')
  @Security('Bearer')
  public async getTool(
    @Request() request: ExpressRequest,
    @Path() id: string
  ): Promise<ToolResponse> {
    const authToken = this.getAuthToken(request);
    const tool = await dabClient.getToolById(id, authToken);

    if (!tool) {
      this.setStatus(404);
      throw new Error('Tool not found');
    }

    return this.transformToolResponse(tool);
  }

  /**
   * Get tools owned by the current user
   */
  @Get('/my/tools')
  @Security('Bearer')
  public async getMyTools(
    @Request() request: ExpressRequest
  ): Promise<ToolResponse[]> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Get the user's internal ID
    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser) {
      return [];
    }

    const tools = await dabClient.getToolsByOwner(dbUser.id, authToken);
    return tools.map(tool => this.transformToolResponse(tool));
  }

  /**
   * Update a tool
   */
  @Put('/{id}')
  @Security('Bearer')
  public async updateTool(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Body() body: UpdateToolRequest
  ): Promise<ToolResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Verify ownership
    const existingTool = await dabClient.getToolById(id, authToken);
    if (!existingTool) {
      this.setStatus(404);
      throw new Error('Tool not found');
    }

    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser || existingTool.ownerId !== dbUser.id) {
      this.setStatus(403);
      throw new Error('Not authorized to update this tool');
    }

    const input: UpdateToolInput = {};
    if (body.name !== undefined) input.name = body.name;
    if (body.description !== undefined) input.description = body.description;
    if (body.category !== undefined) input.category = body.category;
    if (body.brand !== undefined) input.brand = body.brand;
    if (body.model !== undefined) input.model = body.model;
    if (body.status !== undefined) input.status = body.status;
    if (body.advanceNoticeDays !== undefined) input.advanceNoticeDays = body.advanceNoticeDays;
    if (body.maxLoanDays !== undefined) input.maxLoanDays = body.maxLoanDays;

    const tool = await dabClient.updateTool(id, input, authToken);

    // Re-fetch with full details
    const updatedTool = await dabClient.getToolById(id, authToken);
    return this.transformToolResponse(updatedTool || tool);
  }

  /**
   * Delete (archive) a tool
   */
  @Delete('/{id}')
  @Security('Bearer')
  @SuccessResponse(204, 'No Content')
  public async deleteTool(
    @Request() request: ExpressRequest,
    @Path() id: string
  ): Promise<void> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Verify ownership
    const existingTool = await dabClient.getToolById(id, authToken);
    if (!existingTool) {
      this.setStatus(404);
      throw new Error('Tool not found');
    }

    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser || existingTool.ownerId !== dbUser.id) {
      this.setStatus(403);
      throw new Error('Not authorized to delete this tool');
    }

    // Soft delete by archiving
    await dabClient.deleteTool(id, authToken);
    this.setStatus(204);
  }

  // ==================== PHOTO MANAGEMENT ====================

  /**
   * Upload a photo for a tool
   */
  @Post('/{id}/photos')
  @Security('Bearer')
  @SuccessResponse(201, 'Created')
  public async uploadToolPhoto(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @UploadedFile() file: Express.Multer.File,
    @FormField() isPrimary?: string
  ): Promise<PhotoUploadResponse> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Verify tool exists and user owns it
    const tool = await dabClient.getToolById(id, authToken);
    if (!tool) {
      this.setStatus(404);
      throw new Error('Tool not found');
    }

    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser || tool.ownerId !== dbUser.id) {
      this.setStatus(403);
      throw new Error('Not authorized to upload photos for this tool');
    }

    // Validate file
    if (!file) {
      this.setStatus(400);
      throw new Error('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      this.setStatus(400);
      throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.setStatus(400);
      throw new Error('File too large. Maximum size: 5MB');
    }

    // Upload to blob storage
    const folder = `tools/${id}`;
    const uploadResult = await blobStorageService.uploadFile(
      file.buffer,
      file.originalname,
      folder,
      file.mimetype
    );

    // Check if this should be primary
    const shouldBePrimary = isPrimary === 'true' || isPrimary === '1';
    const isFirstPhoto = !tool.photos || tool.photos.length === 0;
    const setAsPrimary = shouldBePrimary || isFirstPhoto;

    // Create photo record in database
    // Store the blob name for deletion later, but use a placeholder URL
    // The actual SAS URL will be generated when fetching
    const photoRecord = await dabClient.createToolPhoto(
      {
        toolId: id,
        url: uploadResult.blobName, // Store blob name, not full URL
        isPrimary: setAsPrimary,
      },
      authToken
    );

    // If this is primary, update other photos
    if (setAsPrimary && !isFirstPhoto) {
      await dabClient.setToolPhotoPrimary(id, photoRecord.id, authToken);
    }

    // Generate SAS URL for response
    const sasResult = blobStorageService.generateSasUrl(uploadResult.blobName);

    this.setStatus(201);
    return {
      id: photoRecord.id,
      url: sasResult.url,
      isPrimary: setAsPrimary,
    };
  }

  /**
   * Delete a photo from a tool
   */
  @Delete('/{toolId}/photos/{photoId}')
  @Security('Bearer')
  @SuccessResponse(204, 'No Content')
  public async deleteToolPhoto(
    @Request() request: ExpressRequest,
    @Path() toolId: string,
    @Path() photoId: string
  ): Promise<void> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Verify tool exists and user owns it
    const tool = await dabClient.getToolById(toolId, authToken);
    if (!tool) {
      this.setStatus(404);
      throw new Error('Tool not found');
    }

    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser || tool.ownerId !== dbUser.id) {
      this.setStatus(403);
      throw new Error('Not authorized to delete photos for this tool');
    }

    // Get the photo record
    const photo = await dabClient.getToolPhoto(photoId, authToken);
    if (!photo || photo.toolId !== toolId) {
      this.setStatus(404);
      throw new Error('Photo not found');
    }

    // Delete from blob storage (url field contains the blob name)
    try {
      await blobStorageService.deleteFile(photo.url);
    } catch (error) {
      console.error('Failed to delete blob:', error);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await dabClient.deleteToolPhoto(photoId, authToken);

    // If this was the primary photo and there are other photos, set a new primary
    if (photo.isPrimary && tool.photos && tool.photos.length > 1) {
      const remainingPhotos = tool.photos.filter(p => p.id !== photoId);
      if (remainingPhotos.length > 0) {
        await dabClient.setToolPhotoPrimary(toolId, remainingPhotos[0].id, authToken);
      }
    }

    this.setStatus(204);
  }

  /**
   * Set a photo as the primary photo for a tool
   */
  @Put('/{toolId}/photos/{photoId}/primary')
  @Security('Bearer')
  public async setPhotoPrimary(
    @Request() request: ExpressRequest,
    @Path() toolId: string,
    @Path() photoId: string
  ): Promise<{ success: boolean }> {
    const user = request.user as AuthenticatedUser;
    const authToken = this.getAuthToken(request);

    // Verify tool exists and user owns it
    const tool = await dabClient.getToolById(toolId, authToken);
    if (!tool) {
      this.setStatus(404);
      throw new Error('Tool not found');
    }

    const dbUser = await dabClient.getUserByExternalId(user.id, authToken);
    if (!dbUser || tool.ownerId !== dbUser.id) {
      this.setStatus(403);
      throw new Error('Not authorized to modify photos for this tool');
    }

    // Verify photo exists and belongs to this tool
    const photo = await dabClient.getToolPhoto(photoId, authToken);
    if (!photo || photo.toolId !== toolId) {
      this.setStatus(404);
      throw new Error('Photo not found');
    }

    await dabClient.setToolPhotoPrimary(toolId, photoId, authToken);

    return { success: true };
  }

  // ==================== HELPER METHODS ====================

  private getAuthToken(request: ExpressRequest): string | undefined {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return undefined;
  }

  private transformToolResponse(tool: Tool): ToolResponse {
    // Generate SAS URLs for photos
    const photos = tool.photos?.map(photo => {
      // Check if URL is already a full URL or just a blob name
      let url = photo.url;
      if (!photo.url.startsWith('http')) {
        try {
          const sasResult = blobStorageService.generateSasUrl(photo.url);
          url = sasResult.url;
        } catch {
          // If SAS generation fails, use the stored URL (might be a placeholder)
          url = photo.url;
        }
      }
      return {
        id: photo.id,
        url,
        isPrimary: photo.isPrimary,
        uploadedAt: photo.uploadedAt,
      };
    });

    return {
      id: tool.id,
      ownerId: tool.ownerId,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      brand: tool.brand,
      model: tool.model,
      upc: tool.upc,
      status: tool.status,
      advanceNoticeDays: tool.advanceNoticeDays,
      maxLoanDays: tool.maxLoanDays,
      createdAt: tool.createdAt,
      updatedAt: tool.updatedAt,
      owner: tool.owner
        ? {
            id: tool.owner.id,
            displayName: tool.owner.displayName,
            avatarUrl: tool.owner.avatarUrl,
            city: tool.owner.city,
            state: tool.owner.state,
            reputationScore: tool.owner.reputationScore,
          }
        : undefined,
      photos,
    };
  }
}
