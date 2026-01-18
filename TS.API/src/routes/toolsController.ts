import {
  Controller,
  Get,
  Post,
  Path,
  Query,
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

interface ToolLookupResponse {
  found: boolean;
  name?: string;
  brand?: string;
  model?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
}

interface PhotoUploadResponse {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface SearchResult {
  upc: string;
  name: string;
  brand?: string;
}

@Route('api/tools')
@Tags('Tools')
export class ToolsController extends Controller {
  @Get('/lookup')
  public async lookupTool(@Query() upc: string): Promise<ToolLookupResponse> {
    const result = await lookupUpc(upc);
    return result;
  }

  @Get('/lookup/search')
  public async searchTools(@Query() q: string): Promise<{ results: SearchResult[] }> {
    const results = await searchProducts(q);
    return { results };
  }

  @Get('/search')
  @Security('Bearer')
  public async searchUserTools(
    @Query() q?: string,
    @Query() category?: string,
    @Query() circleId?: string,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<{
    results: Array<{ id: string; name: string; category: string; owner: string }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    // TODO: Query DAB with filters
    console.log('Search params:', { q, category, circleId, page, pageSize });
    return {
      results: [],
      total: 0,
      page: page || 1,
      pageSize: pageSize || 20,
    };
  }

  @Post('/{id}/photos')
  @Security('Bearer')
  @SuccessResponse(201, 'Created')
  public async uploadToolPhoto(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @UploadedFile() file: Express.Multer.File,
    @FormField() isPrimary?: boolean
  ): Promise<PhotoUploadResponse> {
    const user = request.user as AuthenticatedUser;

    // TODO: Validate tool ownership
    // TODO: Upload to Azure Blob Storage
    // TODO: Save photo record to database

    console.log('Uploading photo for tool:', id, 'user:', user.id, 'file:', file?.originalname);

    this.setStatus(201);
    return {
      id: crypto.randomUUID(),
      url: `https://placeholder.blob.core.windows.net/tools/${id}/${crypto.randomUUID()}.jpg`,
      isPrimary: isPrimary || false,
    };
  }
}
