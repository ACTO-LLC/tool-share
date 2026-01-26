/**
 * Unit tests for blobStorageService
 * Tests Azure Blob Storage operations including:
 * - Multi-container support (tools and loans)
 * - SAS token generation with 1-hour expiry
 * - Upload and delete operations
 * - CORS configuration
 */

// Set up environment variables before importing the service
process.env.AZURE_STORAGE_CONNECTION_STRING =
  'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';
process.env.AZURE_STORAGE_CONTAINER_NAME = 'tool-photos';
process.env.AZURE_STORAGE_LOAN_CONTAINER_NAME = 'loan-photos';
process.env.CORS_ORIGIN = 'http://localhost:5173';

// Mock the Azure Storage SDK before importing the service
const mockUpload = jest.fn().mockResolvedValue({});
const mockDeleteIfExists = jest.fn().mockResolvedValue({});
const mockExists = jest.fn().mockResolvedValue(true);
const mockCreateIfNotExists = jest.fn().mockResolvedValue({});
const mockSetProperties = jest.fn().mockResolvedValue({});

const mockBlockBlobClient = {
  upload: mockUpload,
  deleteIfExists: mockDeleteIfExists,
  exists: mockExists,
  url: 'http://127.0.0.1:10000/devstoreaccount1/test-container/test-blob',
};

const mockContainerClient = {
  getBlockBlobClient: jest.fn().mockReturnValue(mockBlockBlobClient),
  createIfNotExists: mockCreateIfNotExists,
};

const mockBlobServiceClient = {
  getContainerClient: jest.fn().mockReturnValue(mockContainerClient),
  setProperties: mockSetProperties,
};

jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: jest.fn().mockReturnValue(mockBlobServiceClient),
  },
  BlobSASPermissions: {
    parse: jest.fn().mockReturnValue({ toString: () => 'r' }),
  },
  generateBlobSASQueryParameters: jest.fn().mockReturnValue({
    toString: () => 'sv=2021-06-08&ss=b&srt=sco&sp=r&se=2024-01-01T00:00:00Z&st=2024-01-01T00:00:00Z&spr=https&sig=test-signature',
  }),
  StorageSharedKeyCredential: jest.fn().mockImplementation(() => ({})),
}));

// Import after mocks are set up
import { blobStorageService } from '../../services/blobStorageService';

describe('blobStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getContainerNames', () => {
    it('should return configured container names', () => {
      const names = blobStorageService.getContainerNames();

      expect(names.tools).toBe('tool-photos');
      expect(names.loans).toBe('loan-photos');
    });
  });

  describe('getAccountInfo', () => {
    it('should return account information', () => {
      const info = blobStorageService.getAccountInfo();

      expect(info.accountName).toBe('devstoreaccount1');
      expect(info.blobEndpoint).toBe('http://127.0.0.1:10000/devstoreaccount1');
      expect(info.hasCredentials).toBe(true);
    });
  });

  describe('uploadFile', () => {
    it('should upload to tools container by default', async () => {
      const buffer = Buffer.from('test image data');
      const result = await blobStorageService.uploadFile(
        buffer,
        'photo.jpg',
        'tools/tool-123',
        'image/jpeg'
      );

      expect(result.blobName).toContain('tools/tool-123/');
      expect(result.blobName).toContain('.jpg');
      expect(mockUpload).toHaveBeenCalledWith(
        buffer,
        buffer.length,
        expect.objectContaining({
          blobHTTPHeaders: { blobContentType: 'image/jpeg' },
        })
      );
    });

    it('should upload to loans container when specified', async () => {
      const buffer = Buffer.from('test image data');
      const result = await blobStorageService.uploadFile(
        buffer,
        'photo.png',
        'loans/res-123/before',
        'image/png',
        'loans'
      );

      expect(result.blobName).toContain('loans/res-123/before/');
      expect(result.blobName).toContain('.png');
      expect(mockUpload).toHaveBeenCalled();
    });

    it('should reject invalid file extensions', async () => {
      const buffer = Buffer.from('test data');

      await expect(
        blobStorageService.uploadFile(
          buffer,
          'document.pdf',
          'tools/tool-123',
          'application/pdf'
        )
      ).rejects.toThrow('Invalid file extension');
    });

    it('should accept all allowed image extensions', async () => {
      const buffer = Buffer.from('test image data');
      const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

      for (const ext of extensions) {
        const result = await blobStorageService.uploadFile(
          buffer,
          `photo.${ext}`,
          'tools/tool-123',
          `image/${ext === 'jpg' ? 'jpeg' : ext}`
        );
        expect(result.blobName).toContain(`.${ext}`);
      }
    });
  });

  describe('generateSasUrl', () => {
    it('should generate SAS URL with 1-hour expiry by default', () => {
      const result = blobStorageService.generateSasUrl('tools/tool-123/photo.jpg');

      expect(result.url).toContain('http://127.0.0.1:10000/devstoreaccount1');
      expect(result.url).toContain('tool-photos');
      expect(result.url).toContain('tools/tool-123/photo.jpg');
      expect(result.url).toContain('?'); // Has SAS token

      // Check expiry is approximately 1 hour from now
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 60 * 60 * 1000);
      const expiryDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime());
      expect(expiryDiff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should generate SAS URL for loans container', () => {
      const result = blobStorageService.generateSasUrl(
        'loans/res-123/before/photo.jpg',
        60,
        'loans'
      );

      expect(result.url).toContain('loan-photos');
      expect(result.url).toContain('loans/res-123/before/photo.jpg');
    });

    it('should support custom expiry times', () => {
      const result = blobStorageService.generateSasUrl('test.jpg', 120);

      // Check expiry is approximately 2 hours from now
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 120 * 60 * 1000);
      const expiryDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime());
      expect(expiryDiff).toBeLessThan(5000); // Within 5 seconds
    });
  });

  describe('generateUploadSasUrl', () => {
    it('should generate upload SAS URL with write permissions', () => {
      const result = blobStorageService.generateUploadSasUrl('tools/tool-123/new-photo.jpg');

      expect(result.url).toContain('http://127.0.0.1:10000/devstoreaccount1');
      expect(result.url).toContain('tool-photos');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should generate upload SAS URL for loans container', () => {
      const result = blobStorageService.generateUploadSasUrl(
        'loans/res-456/after/photo.jpg',
        60,
        'loans'
      );

      expect(result.url).toContain('loan-photos');
    });
  });

  describe('deleteFile', () => {
    it('should delete from tools container by default', async () => {
      await blobStorageService.deleteFile('tools/tool-123/photo.jpg');

      expect(mockDeleteIfExists).toHaveBeenCalled();
    });

    it('should delete from loans container when specified', async () => {
      await blobStorageService.deleteFile('loans/res-123/before/photo.jpg', 'loans');

      expect(mockDeleteIfExists).toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should check existence in tools container by default', async () => {
      const result = await blobStorageService.exists('tools/tool-123/photo.jpg');

      expect(result).toBe(true);
      expect(mockExists).toHaveBeenCalled();
    });

    it('should check existence in loans container when specified', async () => {
      const result = await blobStorageService.exists('loans/res-123/photo.jpg', 'loans');

      expect(result).toBe(true);
      expect(mockExists).toHaveBeenCalled();
    });
  });

  describe('ensureContainerExists', () => {
    it('should create tools container with private access', async () => {
      await blobStorageService.ensureContainerExists('tools');

      expect(mockCreateIfNotExists).toHaveBeenCalledWith({
        access: undefined, // Private
      });
    });

    it('should create loans container with private access', async () => {
      await blobStorageService.ensureContainerExists('loans');

      expect(mockCreateIfNotExists).toHaveBeenCalledWith({
        access: undefined, // Private
      });
    });
  });

  describe('ensureAllContainersExist', () => {
    it('should create both containers', async () => {
      mockCreateIfNotExists.mockClear();
      await blobStorageService.ensureAllContainersExist();

      // Called twice (once for each container)
      expect(mockCreateIfNotExists).toHaveBeenCalledTimes(2);
    });
  });

  describe('getDefaultCorsConfig', () => {
    it('should return CORS config with app origin', () => {
      const corsConfig = blobStorageService.getDefaultCorsConfig();

      expect(corsConfig.allowedOrigins).toContain('http://localhost:5173');
      expect(corsConfig.allowedMethods).toContain('GET');
      expect(corsConfig.allowedMethods).toContain('PUT');
      expect(corsConfig.allowedMethods).toContain('OPTIONS');
      expect(corsConfig.allowedHeaders).toContain('*');
      expect(corsConfig.maxAgeInSeconds).toBe(3600); // 1 hour
    });
  });

  describe('configureCors', () => {
    it('should set CORS properties on storage account', async () => {
      const corsConfig = blobStorageService.getDefaultCorsConfig();
      await blobStorageService.configureCors(corsConfig);

      expect(mockSetProperties).toHaveBeenCalledWith({
        cors: [
          expect.objectContaining({
            allowedOrigins: 'http://localhost:5173',
            allowedMethods: 'GET,PUT,OPTIONS,HEAD',
            maxAgeInSeconds: 3600,
          }),
        ],
      });
    });
  });

  describe('SAS token expiry verification', () => {
    it('should have 1-hour default expiry as per spec', () => {
      const beforeGenerate = new Date();
      const result = blobStorageService.generateSasUrl('test.jpg');
      const afterGenerate = new Date();

      // Expiry should be between 59 and 61 minutes from generation time
      const minExpiry = new Date(beforeGenerate.getTime() + 59 * 60 * 1000);
      const maxExpiry = new Date(afterGenerate.getTime() + 61 * 60 * 1000);

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(minExpiry.getTime());
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(maxExpiry.getTime());
    });
  });
});
