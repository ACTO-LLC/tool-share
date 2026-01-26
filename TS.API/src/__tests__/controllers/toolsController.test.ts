/**
 * Unit tests for toolsController
 * Tests tool CRUD operations
 */

import { ToolsController } from '../../routes/toolsController';
import { dabClient } from '../../services/dabClient';
import * as upcService from '../../services/upcService';
import { blobStorageService } from '../../services/blobStorageService';
import * as imageProcessingService from '../../services/imageProcessingService';
import { Request as ExpressRequest } from 'express';

// Mock dependencies
jest.mock('../../services/dabClient');
jest.mock('../../services/upcService');
jest.mock('../../services/blobStorageService');
jest.mock('../../services/imageProcessingService');

const mockedDabClient = dabClient as jest.Mocked<typeof dabClient>;
const mockedUpcService = upcService as jest.Mocked<typeof upcService>;
const mockedBlobService = blobStorageService as jest.Mocked<typeof blobStorageService>;
const mockedImageService = imageProcessingService as jest.Mocked<typeof imageProcessingService>;

// Helper to create mock request
function createMockRequest(overrides: Partial<ExpressRequest> = {}): ExpressRequest {
  return {
    user: {
      id: 'ext-user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
    headers: {
      authorization: 'Bearer mock-token',
    },
    ...overrides,
  } as unknown as ExpressRequest;
}

// Mock factories with explicit typing
function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    externalId: 'ext-user-123',
    displayName: 'Test User',
    email: 'test@example.com',
    reputationScore: 4.0,
    subscriptionStatus: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function createMockTool(overrides = {}) {
  return {
    id: 'tool-123',
    ownerId: 'user-123',
    name: 'Power Drill',
    category: 'Power Tools',
    status: 'available' as const,
    advanceNoticeDays: 1,
    maxLoanDays: 7,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('ToolsController', () => {
  let controller: ToolsController;

  beforeEach(() => {
    controller = new ToolsController();
    jest.clearAllMocks();
  });

  describe('lookupTool', () => {
    it('should return product info from UPC lookup', async () => {
      mockedUpcService.lookupUpc.mockResolvedValueOnce({
        found: true,
        name: 'DeWalt Drill',
        brand: 'DeWalt',
        model: 'DCD771C2',
        category: 'Power Tools',
        imageUrl: 'http://example.com/drill.jpg',
      });

      const result = await controller.lookupTool('012345678901');

      expect(result.found).toBe(true);
      expect(result.name).toBe('DeWalt Drill');
      expect(result.brand).toBe('DeWalt');
    });

    it('should return not found for unknown UPC', async () => {
      mockedUpcService.lookupUpc.mockResolvedValueOnce({
        found: false,
      });

      const result = await controller.lookupTool('999999999999');

      expect(result.found).toBe(false);
    });
  });

  describe('searchToolsUpc', () => {
    it('should return search results', async () => {
      mockedUpcService.searchProducts.mockResolvedValueOnce([
        { upc: '111', name: 'Drill 1', brand: 'DeWalt' },
        { upc: '222', name: 'Drill 2', brand: 'Makita' },
      ]);

      const result = await controller.searchToolsUpc('drill');

      expect(result.results).toHaveLength(2);
      expect(result.results[0].name).toBe('Drill 1');
    });
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      const categories = [
        'Power Tools',
        'Hand Tools',
        'Garden/Yard',
        'Automotive',
        'Kitchen',
        'Camping/Outdoor',
        'Electronics',
        'Other',
      ];

      mockedDabClient.getCategories.mockReturnValueOnce(categories);

      const result = await controller.getCategories();

      expect(result).toEqual(categories);
      expect(result).toHaveLength(8);
    });
  });

  describe('createTool', () => {
    const validCategories = [
      'Power Tools',
      'Hand Tools',
      'Garden/Yard',
      'Automotive',
      'Kitchen',
      'Camping/Outdoor',
      'Electronics',
      'Other',
    ];

    it('should create a new tool', async () => {
      const mockDbUser = createMockUser();
      const mockTool = createMockTool({ id: 'tool-new', name: 'New Drill', brand: 'DeWalt' });

      mockedDabClient.getCategories.mockReturnValue(validCategories);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.createTool.mockResolvedValueOnce(mockTool as any);

      const request = createMockRequest();
      const result = await controller.createTool(request, {
        name: 'New Drill',
        category: 'Power Tools',
        brand: 'DeWalt',
      });

      expect(result.id).toBe('tool-new');
      expect(result.name).toBe('New Drill');
      expect(result.status).toBe('available');
    });

    it('should add tool to circles when circleIds provided', async () => {
      const mockDbUser = createMockUser();
      const mockTool = createMockTool({ id: 'tool-new', name: 'New Drill' });

      mockedDabClient.getCategories.mockReturnValue(validCategories);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.createTool.mockResolvedValueOnce(mockTool as any);
      mockedDabClient.addToolToCircle.mockResolvedValue({
        id: 'tc-1',
        toolId: 'tool-new',
        circleId: 'circle-1',
      });

      const request = createMockRequest();
      await controller.createTool(request, {
        name: 'New Drill',
        category: 'Power Tools',
        circleIds: ['circle-1', 'circle-2'],
      });

      expect(mockedDabClient.addToolToCircle).toHaveBeenCalledTimes(2);
    });

    it('should throw error when user not found', async () => {
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(null);
      mockedDabClient.getCategories.mockReturnValue([
        'Power Tools',
        'Hand Tools',
        'Garden/Yard',
        'Automotive',
        'Kitchen',
        'Camping/Outdoor',
        'Electronics',
        'Other',
      ]);

      const request = createMockRequest();

      await expect(
        controller.createTool(request, {
          name: 'New Drill',
          category: 'Power Tools',
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw error when name is empty', async () => {
      mockedDabClient.getCategories.mockReturnValue([
        'Power Tools',
        'Hand Tools',
        'Garden/Yard',
        'Automotive',
        'Kitchen',
        'Camping/Outdoor',
        'Electronics',
        'Other',
      ]);

      const request = createMockRequest();

      await expect(
        controller.createTool(request, {
          name: '',
          category: 'Power Tools',
        })
      ).rejects.toThrow('Tool name is required');
    });

    it('should throw error when name exceeds 100 characters', async () => {
      mockedDabClient.getCategories.mockReturnValue([
        'Power Tools',
        'Hand Tools',
        'Garden/Yard',
        'Automotive',
        'Kitchen',
        'Camping/Outdoor',
        'Electronics',
        'Other',
      ]);

      const request = createMockRequest();

      await expect(
        controller.createTool(request, {
          name: 'A'.repeat(101),
          category: 'Power Tools',
        })
      ).rejects.toThrow('Tool name must be 100 characters or less');
    });

    it('should throw error when category is invalid', async () => {
      mockedDabClient.getCategories.mockReturnValue([
        'Power Tools',
        'Hand Tools',
        'Garden/Yard',
        'Automotive',
        'Kitchen',
        'Camping/Outdoor',
        'Electronics',
        'Other',
      ]);

      const request = createMockRequest();

      await expect(
        controller.createTool(request, {
          name: 'Drill',
          category: 'Invalid Category',
        })
      ).rejects.toThrow('Invalid category');
    });
  });

  describe('getTool', () => {
    it('should return tool by id', async () => {
      const mockTool = {
        ...createMockTool(),
        owner: {
          id: 'user-123',
          displayName: 'John Doe',
          city: 'Seattle',
          state: 'WA',
          reputationScore: 4.5,
        },
        photos: [
          { id: 'photo-1', url: 'blob-name', isPrimary: true, uploadedAt: '2024-01-01T00:00:00Z', toolId: 'tool-123' },
        ],
      };

      mockedDabClient.getToolById.mockResolvedValueOnce(mockTool as any);
      mockedBlobService.generateSasUrl.mockReturnValue({
        url: 'http://example.com/photo.jpg?sas=token',
        expiresAt: new Date(),
      });

      const request = createMockRequest();
      const result = await controller.getTool(request, 'tool-123');

      expect(result.id).toBe('tool-123');
      expect(result.name).toBe('Power Drill');
      expect(result.owner?.displayName).toBe('John Doe');
    });

    it('should throw error when tool not found', async () => {
      mockedDabClient.getToolById.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(controller.getTool(request, 'nonexistent')).rejects.toThrow(
        'Tool not found'
      );
    });
  });

  describe('getMyTools', () => {
    it('should return tools owned by current user', async () => {
      const mockDbUser = createMockUser();
      const mockTools = [
        createMockTool({ id: 'tool-1', name: 'Drill' }),
        createMockTool({ id: 'tool-2', name: 'Saw' }),
      ];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getToolsByOwner.mockResolvedValueOnce(mockTools as any);

      const request = createMockRequest();
      const result = await controller.getMyTools(request);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Drill');
    });

    it('should return empty array when user not found', async () => {
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(null);

      const request = createMockRequest();
      const result = await controller.getMyTools(request);

      expect(result).toEqual([]);
    });
  });

  describe('updateTool', () => {
    it('should update tool when user is owner', async () => {
      const mockDbUser = createMockUser();
      const existingTool = createMockTool({ name: 'Old Name' });
      const updatedTool = { ...existingTool, name: 'New Name', description: 'Updated description' };

      mockedDabClient.getToolById.mockResolvedValueOnce(existingTool as any);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.updateTool.mockResolvedValueOnce(updatedTool as any);
      mockedDabClient.getToolById.mockResolvedValueOnce(updatedTool as any);

      const request = createMockRequest();
      const result = await controller.updateTool(request, 'tool-123', {
        name: 'New Name',
        description: 'Updated description',
      });

      expect(result.name).toBe('New Name');
    });

    it('should throw error when tool not found', async () => {
      mockedDabClient.getToolById.mockResolvedValueOnce(null);

      const request = createMockRequest();

      await expect(
        controller.updateTool(request, 'nonexistent', { name: 'New Name' })
      ).rejects.toThrow('Tool not found');
    });

    it('should throw error when user is not owner', async () => {
      const mockDbUser = createMockUser({ id: 'user-456' }); // Different ID
      const existingTool = createMockTool(); // ownerId is user-123

      mockedDabClient.getToolById.mockResolvedValueOnce(existingTool as any);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);

      const request = createMockRequest();

      await expect(
        controller.updateTool(request, 'tool-123', { name: 'New Name' })
      ).rejects.toThrow('Not authorized to update this tool');
    });

    it('should throw error when name is empty on update', async () => {
      const request = createMockRequest();

      await expect(
        controller.updateTool(request, 'tool-123', { name: '' })
      ).rejects.toThrow('Tool name cannot be empty');
    });

    it('should throw error when category is invalid on update', async () => {
      mockedDabClient.getCategories.mockReturnValue([
        'Power Tools',
        'Hand Tools',
        'Garden/Yard',
        'Automotive',
        'Kitchen',
        'Camping/Outdoor',
        'Electronics',
        'Other',
      ]);

      const request = createMockRequest();

      await expect(
        controller.updateTool(request, 'tool-123', { category: 'Invalid Category' })
      ).rejects.toThrow('Invalid category');
    });
  });

  describe('deleteTool', () => {
    it('should archive tool when user is owner', async () => {
      const mockDbUser = createMockUser();
      const existingTool = createMockTool();

      mockedDabClient.getToolById.mockResolvedValueOnce(existingTool as any);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.deleteTool.mockResolvedValueOnce(undefined);

      const request = createMockRequest();
      await controller.deleteTool(request, 'tool-123');

      expect(mockedDabClient.deleteTool).toHaveBeenCalledWith('tool-123', 'mock-token');
    });

    it('should throw error when not owner', async () => {
      const mockDbUser = createMockUser({ id: 'user-456' });
      const existingTool = createMockTool();

      mockedDabClient.getToolById.mockResolvedValueOnce(existingTool as any);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);

      const request = createMockRequest();

      await expect(controller.deleteTool(request, 'tool-123')).rejects.toThrow(
        'Not authorized to delete this tool'
      );
    });
  });

  describe('listTools (GET /api/tools)', () => {
    it('should return paginated available tools from user circles', async () => {
      const mockDbUser = createMockUser();
      const mockCircles = [
        { id: 'circle-1', name: 'Friends', currentUserRole: 'member' as const, memberCount: 5 },
      ];
      const mockTools = [
        createMockTool({ id: 'tool-1', name: 'Drill' }),
        createMockTool({ id: 'tool-2', name: 'Saw' }),
      ];
      const mockToolCircles = [{ id: 'circle-1', name: 'Friends' }];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles as any);
      mockedDabClient.getAllAvailableTools.mockResolvedValueOnce(mockTools as any);
      // Mock getToolCircles for each tool
      mockedDabClient.getToolCircles.mockResolvedValue(mockToolCircles as any);

      const request = createMockRequest();
      const result = await controller.listTools(request);

      expect(result.tools).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should return empty when user not found', async () => {
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(null);

      const request = createMockRequest();
      const result = await controller.listTools(request);

      expect(result.tools).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should filter by category', async () => {
      const mockDbUser = createMockUser();
      const mockCircles = [
        { id: 'circle-1', name: 'Friends', currentUserRole: 'member' as const, memberCount: 5 },
      ];
      const mockTools = [
        createMockTool({ id: 'tool-1', name: 'Drill', category: 'Power Tools' }),
        createMockTool({ id: 'tool-2', name: 'Rake', category: 'Garden/Yard' }),
      ];
      const mockToolCircles = [{ id: 'circle-1', name: 'Friends' }];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles as any);
      mockedDabClient.getAllAvailableTools.mockResolvedValueOnce(mockTools as any);
      mockedDabClient.getToolCircles.mockResolvedValue(mockToolCircles as any);

      const request = createMockRequest();
      const result = await controller.listTools(
        request,
        'Power Tools'
      );

      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].name).toBe('Drill');
    });

    it('should filter by status', async () => {
      const mockDbUser = createMockUser();
      const mockCircles = [
        { id: 'circle-1', name: 'Friends', currentUserRole: 'member' as const, memberCount: 5 },
      ];
      const mockTools = [
        createMockTool({ id: 'tool-1', name: 'Drill', status: 'available' as const }),
        createMockTool({ id: 'tool-2', name: 'Saw', status: 'unavailable' as const }),
      ];
      const mockToolCircles = [{ id: 'circle-1', name: 'Friends' }];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles as any);
      mockedDabClient.getAllAvailableTools.mockResolvedValueOnce(mockTools as any);
      mockedDabClient.getToolCircles.mockResolvedValue(mockToolCircles as any);

      const request = createMockRequest();
      const result = await controller.listTools(
        request,
        undefined,
        'unavailable'
      );

      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].name).toBe('Saw');
    });

    it('should only return tools from user circles or owned by user', async () => {
      const mockDbUser = createMockUser({ id: 'user-123' });
      const mockCircles = [
        { id: 'circle-1', name: 'Friends', currentUserRole: 'member' as const, memberCount: 5 },
      ];
      const mockTools = [
        createMockTool({ id: 'tool-1', name: 'My Drill', ownerId: 'user-123' }), // Owned by user
        createMockTool({ id: 'tool-2', name: 'Shared Saw', ownerId: 'user-456' }), // In user's circle
        createMockTool({ id: 'tool-3', name: 'Other Tool', ownerId: 'user-789' }), // Not in user's circle
      ];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles as any);
      mockedDabClient.getAllAvailableTools.mockResolvedValueOnce(mockTools as any);
      // Tool 1 is owned by user (no circle check needed)
      // Tool 2 is in user's circle
      mockedDabClient.getToolCircles.mockResolvedValueOnce([{ id: 'circle-1', name: 'Friends' }] as any);
      // Tool 3 is not in user's circle
      mockedDabClient.getToolCircles.mockResolvedValueOnce([{ id: 'circle-other', name: 'Other' }] as any);

      const request = createMockRequest();
      const result = await controller.listTools(request);

      expect(result.tools).toHaveLength(2);
      expect(result.tools.map(t => t.name).sort()).toEqual(['My Drill', 'Shared Saw']);
    });

    it('should sort by name ascending', async () => {
      const mockDbUser = createMockUser();
      const mockCircles = [
        { id: 'circle-1', name: 'Friends', currentUserRole: 'member' as const, memberCount: 5 },
      ];
      const mockTools = [
        createMockTool({ id: 'tool-1', name: 'Zebra Tool', category: 'Other' }),
        createMockTool({ id: 'tool-2', name: 'Alpha Tool', category: 'Other' }),
      ];
      const mockToolCircles = [{ id: 'circle-1', name: 'Friends' }];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles as any);
      mockedDabClient.getAllAvailableTools.mockResolvedValueOnce(mockTools as any);
      mockedDabClient.getToolCircles.mockResolvedValue(mockToolCircles as any);

      const request = createMockRequest();
      const result = await controller.listTools(
        request,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'nameAsc'
      );

      expect(result.tools[0].name).toBe('Alpha Tool');
      expect(result.tools[1].name).toBe('Zebra Tool');
    });

    it('should apply pagination correctly', async () => {
      const mockDbUser = createMockUser();
      const mockCircles = [
        { id: 'circle-1', name: 'Friends', currentUserRole: 'member' as const, memberCount: 5 },
      ];
      const mockTools = Array.from({ length: 25 }, (_, i) =>
        createMockTool({ id: `tool-${i}`, name: `Tool ${i}` })
      );
      const mockToolCircles = [{ id: 'circle-1', name: 'Friends' }];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles as any);
      mockedDabClient.getAllAvailableTools.mockResolvedValueOnce(mockTools as any);
      mockedDabClient.getToolCircles.mockResolvedValue(mockToolCircles as any);

      const request = createMockRequest();
      const result = await controller.listTools(
        request,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        2, // page 2
        10  // pageSize 10
      );

      expect(result.tools).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });
  });

  describe('browseTools (deprecated)', () => {
    it('should delegate to listTools', async () => {
      const mockDbUser = createMockUser();
      const mockCircles = [
        { id: 'circle-1', name: 'Friends', currentUserRole: 'member' as const, memberCount: 5 },
      ];
      const mockTools = [
        createMockTool({ id: 'tool-1', name: 'Drill' }),
      ];
      const mockToolCircles = [{ id: 'circle-1', name: 'Friends' }];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles as any);
      mockedDabClient.getAllAvailableTools.mockResolvedValueOnce(mockTools as any);
      mockedDabClient.getToolCircles.mockResolvedValue(mockToolCircles as any);

      const request = createMockRequest();
      const result = await controller.browseTools(request);

      expect(result.tools).toHaveLength(1);
      expect(result.page).toBe(1);
    });
  });

  describe('searchTools', () => {
    it('should search tools with query and filter by user circles', async () => {
      const mockDbUser = createMockUser();
      const mockCircles = [
        { id: 'circle-1', name: 'Friends', currentUserRole: 'member' as const, memberCount: 5 },
      ];
      const searchResult = {
        tools: [createMockTool({ id: 'tool-1', name: 'DeWalt Drill' })],
        total: 1,
      };
      const mockToolCircles = [{ id: 'circle-1', name: 'Friends' }];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles as any);
      mockedDabClient.searchTools.mockResolvedValueOnce(searchResult as any);
      mockedDabClient.getToolCircles.mockResolvedValue(mockToolCircles as any);

      const request = createMockRequest();
      const result = await controller.searchTools(request, 'drill');

      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].name).toBe('DeWalt Drill');
    });

    it('should return empty when user not found', async () => {
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(null);

      const request = createMockRequest();
      const result = await controller.searchTools(request, 'drill');

      expect(result.tools).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should filter by status', async () => {
      const mockDbUser = createMockUser();
      const mockCircles = [
        { id: 'circle-1', name: 'Friends', currentUserRole: 'member' as const, memberCount: 5 },
      ];
      const searchResult = {
        tools: [createMockTool({ id: 'tool-1', name: 'Drill', status: 'unavailable' as const })],
        total: 1,
      };
      const mockToolCircles = [{ id: 'circle-1', name: 'Friends' }];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles as any);
      mockedDabClient.searchTools.mockResolvedValueOnce(searchResult as any);
      mockedDabClient.getToolCircles.mockResolvedValue(mockToolCircles as any);

      const request = createMockRequest();
      const result = await controller.searchTools(
        request,
        'drill',
        undefined,
        'unavailable'
      );

      expect(result.tools).toHaveLength(1);
      expect(mockedDabClient.searchTools).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'unavailable' }),
        expect.any(String)
      );
    });

    it('should filter by category', async () => {
      const mockDbUser = createMockUser();
      const mockCircles = [
        { id: 'circle-1', name: 'Friends', currentUserRole: 'member' as const, memberCount: 5 },
      ];
      const searchResult = {
        tools: [createMockTool({ id: 'tool-1', name: 'Drill', category: 'Power Tools' })],
        total: 1,
      };
      const mockToolCircles = [{ id: 'circle-1', name: 'Friends' }];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles as any);
      mockedDabClient.searchTools.mockResolvedValueOnce(searchResult as any);
      mockedDabClient.getToolCircles.mockResolvedValue(mockToolCircles as any);

      const request = createMockRequest();
      const result = await controller.searchTools(
        request,
        'drill',
        'Power Tools'
      );

      expect(result.tools).toHaveLength(1);
      expect(mockedDabClient.searchTools).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Power Tools' }),
        expect.any(String)
      );
    });

    it('should include primary photo URL in results', async () => {
      const mockDbUser = createMockUser();
      const mockCircles = [
        { id: 'circle-1', name: 'Friends', currentUserRole: 'member' as const, memberCount: 5 },
      ];
      const searchResult = {
        tools: [{
          ...createMockTool({ id: 'tool-1', name: 'Drill' }),
          photos: [
            { id: 'photo-1', url: 'blob-name', isPrimary: true, uploadedAt: '2024-01-01T00:00:00Z', toolId: 'tool-1' }
          ]
        }],
        total: 1,
      };
      const mockToolCircles = [{ id: 'circle-1', name: 'Friends' }];

      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getCirclesByUser.mockResolvedValueOnce(mockCircles as any);
      mockedDabClient.searchTools.mockResolvedValueOnce(searchResult as any);
      mockedDabClient.getToolCircles.mockResolvedValue(mockToolCircles as any);
      mockedBlobService.generateSasUrl.mockReturnValue({
        url: 'http://example.com/photo.jpg?sas=token',
        expiresAt: new Date(),
      });

      const request = createMockRequest();
      const result = await controller.searchTools(request, 'drill');

      expect(result.tools[0].photos).toHaveLength(1);
      expect(result.tools[0].photos![0].url).toContain('http://example.com');
      expect(result.tools[0].photos![0].isPrimary).toBe(true);
    });
  });

  describe('uploadToolPhoto', () => {
    beforeEach(() => {
      // Mock image processing by default
      mockedImageService.processToolPhoto.mockResolvedValue({
        buffer: Buffer.from('processed'),
        width: 800,
        height: 600,
        format: 'jpeg',
        size: 1024,
      });
      mockedImageService.getMimeType.mockReturnValue('image/jpeg');
    });

    it('should upload photo when user is owner', async () => {
      const mockDbUser = createMockUser();
      const existingTool = { ...createMockTool(), photos: [] };

      mockedDabClient.getToolById.mockResolvedValueOnce(existingTool as any);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedBlobService.uploadFile.mockResolvedValueOnce({
        url: 'http://example.com/photo.jpg',
        blobName: 'tools/tool-123/photo.jpg',
      });
      mockedDabClient.createToolPhoto.mockResolvedValueOnce({
        id: 'photo-123',
        toolId: 'tool-123',
        url: 'tools/tool-123/photo.jpg',
        isPrimary: true,
        uploadedAt: '2024-06-15T00:00:00Z',
      });
      mockedBlobService.generateSasUrl.mockReturnValue({
        url: 'http://example.com/photo.jpg?sas=token',
        expiresAt: new Date(),
      });

      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      const request = createMockRequest();
      const result = await controller.uploadToolPhoto(
        request,
        'tool-123',
        mockFile,
        'true'
      );

      expect(result.id).toBe('photo-123');
      expect(result.isPrimary).toBe(true);
      expect(mockedImageService.processToolPhoto).toHaveBeenCalledWith(mockFile.buffer);
    });

    it('should reject when tool already has 5 photos', async () => {
      const mockDbUser = createMockUser();
      const existingTool = {
        ...createMockTool(),
        photos: [
          { id: 'photo-1', url: 'blob-1', isPrimary: true, uploadedAt: '2024-01-01T00:00:00Z', toolId: 'tool-123' },
          { id: 'photo-2', url: 'blob-2', isPrimary: false, uploadedAt: '2024-01-02T00:00:00Z', toolId: 'tool-123' },
          { id: 'photo-3', url: 'blob-3', isPrimary: false, uploadedAt: '2024-01-03T00:00:00Z', toolId: 'tool-123' },
          { id: 'photo-4', url: 'blob-4', isPrimary: false, uploadedAt: '2024-01-04T00:00:00Z', toolId: 'tool-123' },
          { id: 'photo-5', url: 'blob-5', isPrimary: false, uploadedAt: '2024-01-05T00:00:00Z', toolId: 'tool-123' },
        ],
      };

      mockedDabClient.getToolById.mockResolvedValueOnce(existingTool as any);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);

      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      const request = createMockRequest();

      await expect(
        controller.uploadToolPhoto(request, 'tool-123', mockFile)
      ).rejects.toThrow('Maximum 5 photos allowed per tool');
    });

    it('should allow upload when tool has 4 photos', async () => {
      const mockDbUser = createMockUser();
      const existingTool = {
        ...createMockTool(),
        photos: [
          { id: 'photo-1', url: 'blob-1', isPrimary: true, uploadedAt: '2024-01-01T00:00:00Z', toolId: 'tool-123' },
          { id: 'photo-2', url: 'blob-2', isPrimary: false, uploadedAt: '2024-01-02T00:00:00Z', toolId: 'tool-123' },
          { id: 'photo-3', url: 'blob-3', isPrimary: false, uploadedAt: '2024-01-03T00:00:00Z', toolId: 'tool-123' },
          { id: 'photo-4', url: 'blob-4', isPrimary: false, uploadedAt: '2024-01-04T00:00:00Z', toolId: 'tool-123' },
        ],
      };

      mockedDabClient.getToolById.mockResolvedValueOnce(existingTool as any);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedBlobService.uploadFile.mockResolvedValueOnce({
        url: 'http://example.com/photo.jpg',
        blobName: 'tools/tool-123/photo.jpg',
      });
      mockedDabClient.createToolPhoto.mockResolvedValueOnce({
        id: 'photo-5',
        toolId: 'tool-123',
        url: 'tools/tool-123/photo.jpg',
        isPrimary: false,
        uploadedAt: '2024-06-15T00:00:00Z',
      });
      mockedBlobService.generateSasUrl.mockReturnValue({
        url: 'http://example.com/photo.jpg?sas=token',
        expiresAt: new Date(),
      });

      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      const request = createMockRequest();
      const result = await controller.uploadToolPhoto(request, 'tool-123', mockFile);

      expect(result.id).toBe('photo-5');
    });

    it('should reject invalid file type', async () => {
      const mockDbUser = createMockUser();
      const existingTool = createMockTool();

      mockedDabClient.getToolById.mockResolvedValueOnce(existingTool as any);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);

      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File;

      const request = createMockRequest();

      await expect(
        controller.uploadToolPhoto(request, 'tool-123', mockFile)
      ).rejects.toThrow('Invalid file type');
    });

    it('should reject file over 5MB', async () => {
      const mockDbUser = createMockUser();
      const existingTool = createMockTool();

      mockedDabClient.getToolById.mockResolvedValueOnce(existingTool as any);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);

      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024, // 6MB
      } as Express.Multer.File;

      const request = createMockRequest();

      await expect(
        controller.uploadToolPhoto(request, 'tool-123', mockFile)
      ).rejects.toThrow('File too large');
    });
  });

  describe('deleteToolPhoto', () => {
    it('should delete photo when user is owner', async () => {
      const mockDbUser = createMockUser();
      const existingTool = {
        ...createMockTool(),
        photos: [
          { id: 'photo-1', url: 'blob-1', isPrimary: true, uploadedAt: '2024-01-01T00:00:00Z', toolId: 'tool-123' },
          { id: 'photo-2', url: 'blob-2', isPrimary: false, uploadedAt: '2024-01-02T00:00:00Z', toolId: 'tool-123' },
        ],
      };

      const photo = {
        id: 'photo-1',
        toolId: 'tool-123',
        url: 'blob-1',
        isPrimary: true,
        uploadedAt: '2024-01-01T00:00:00Z',
      };

      mockedDabClient.getToolById.mockResolvedValueOnce(existingTool as any);
      mockedDabClient.getUserByExternalId.mockResolvedValueOnce(mockDbUser as any);
      mockedDabClient.getToolPhoto.mockResolvedValueOnce(photo);
      mockedBlobService.deleteFile.mockResolvedValueOnce(undefined);
      mockedDabClient.deleteToolPhoto.mockResolvedValueOnce(undefined);
      mockedDabClient.setToolPhotoPrimary.mockResolvedValueOnce(undefined);

      const request = createMockRequest();
      await controller.deleteToolPhoto(request, 'tool-123', 'photo-1');

      expect(mockedBlobService.deleteFile).toHaveBeenCalledWith('blob-1');
      expect(mockedDabClient.deleteToolPhoto).toHaveBeenCalledWith('photo-1', 'mock-token');
    });
  });
});
