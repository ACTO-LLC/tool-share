import {
  BlobServiceClient,
  ContainerClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
  BlobServiceProperties,
} from '@azure/storage-blob';
import { config } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

// Container type enum for type safety
export type ContainerType = 'tools' | 'loans';

// Interface for upload result
export interface BlobUploadResult {
  blobName: string;
  url: string;
}

// Interface for SAS URL result
export interface SasUrlResult {
  url: string;
  expiresAt: Date;
}

// Interface for CORS configuration
export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAgeInSeconds: number;
}

class BlobStorageService {
  private containerClients: Map<ContainerType, ContainerClient> = new Map();
  private blobServiceClient: BlobServiceClient | null = null;
  private accountName: string = '';
  private accountKey: string = '';
  private blobEndpoint: string = '';
  private initialized: boolean = false;

  /**
   * Get the container name for a given container type
   */
  private getContainerName(containerType: ContainerType): string {
    switch (containerType) {
      case 'tools':
        return config.AZURE_STORAGE_CONTAINER_NAME;
      case 'loans':
        return config.AZURE_STORAGE_LOAN_CONTAINER_NAME;
      default:
        throw new Error(`Unknown container type: ${containerType}`);
    }
  }

  /**
   * Initialize the blob service client and parse connection string
   */
  private initializeService(): BlobServiceClient {
    if (this.blobServiceClient && this.initialized) {
      return this.blobServiceClient;
    }

    const connectionString = config.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('Azure Storage connection string not configured');
    }

    // Parse connection string to extract account name and key
    const parts = connectionString.split(';').reduce((acc, part) => {
      const [key, ...valueParts] = part.split('=');
      if (key && valueParts.length > 0) {
        acc[key] = valueParts.join('=');
      }
      return acc;
    }, {} as Record<string, string>);

    this.accountName = parts['AccountName'] || '';
    this.accountKey = parts['AccountKey'] || '';
    // BlobEndpoint is specified for Azurite local development
    this.blobEndpoint = parts['BlobEndpoint'] || '';

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.initialized = true;

    return this.blobServiceClient;
  }

  /**
   * Get or create a container client for the specified container type
   */
  private getContainerClient(containerType: ContainerType = 'tools'): ContainerClient {
    // Check cache first
    const cachedClient = this.containerClients.get(containerType);
    if (cachedClient) {
      return cachedClient;
    }

    // Initialize service if needed
    const serviceClient = this.initializeService();

    // Get container name and create client
    const containerName = this.getContainerName(containerType);
    const containerClient = serviceClient.getContainerClient(containerName);

    // Cache for future use
    this.containerClients.set(containerType, containerClient);

    return containerClient;
  }

  /**
   * Upload a file buffer to Azure Blob Storage
   * @param buffer - The file content as a Buffer
   * @param originalName - Original filename for extension extraction
   * @param folder - Folder path within the container (e.g., 'tools/{toolId}')
   * @param contentType - MIME type of the file
   * @param containerType - Which container to upload to (defaults to 'tools')
   * @returns Upload result with blob name and URL
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    folder: string,
    contentType: string,
    containerType: ContainerType = 'tools'
  ): Promise<BlobUploadResult> {
    const container = this.getContainerClient(containerType);

    // Extract file extension
    const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`Invalid file extension: ${ext}. Allowed: ${allowedExtensions.join(', ')}`);
    }

    // Generate unique blob name
    const blobName = `${folder}/${uuidv4()}.${ext}`;
    const blockBlobClient = container.getBlockBlobClient(blobName);

    // Upload with content type
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });

    // Return the blob name (not the full URL - we'll generate SAS URLs when needed)
    return {
      blobName,
      url: blockBlobClient.url,
    };
  }

  /**
   * Delete a blob from Azure Blob Storage
   * @param blobName - The full blob name/path
   * @param containerType - Which container to delete from (defaults to 'tools')
   */
  async deleteFile(blobName: string, containerType: ContainerType = 'tools'): Promise<void> {
    const container = this.getContainerClient(containerType);
    const blockBlobClient = container.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  }

  /**
   * Generate a SAS URL for a blob with read access
   * @param blobName - The full blob name/path
   * @param expiryMinutes - How long the URL should be valid (default: 60 minutes = 1 hour)
   * @param containerType - Which container the blob is in (defaults to 'tools')
   * @returns SAS URL and expiration time
   */
  generateSasUrl(
    blobName: string,
    expiryMinutes: number = 60,
    containerType: ContainerType = 'tools'
  ): SasUrlResult {
    this.initializeService();

    if (!this.accountName || !this.accountKey) {
      throw new Error('Storage account credentials not available');
    }

    const containerName = this.getContainerName(containerType);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    const sharedKeyCredential = new StorageSharedKeyCredential(
      this.accountName,
      this.accountKey
    );

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'), // Read-only
        expiresOn: expiresAt,
      },
      sharedKeyCredential
    ).toString();

    // Use BlobEndpoint if specified (for Azurite local development)
    // Otherwise use the standard Azure cloud URL format
    let baseUrl: string;
    if (this.blobEndpoint) {
      // BlobEndpoint already includes the account name, e.g., http://127.0.0.1:10000/devstoreaccount1
      baseUrl = `${this.blobEndpoint}/${containerName}/${blobName}`;
    } else {
      baseUrl = `https://${this.accountName}.blob.core.windows.net/${containerName}/${blobName}`;
    }

    const url = `${baseUrl}?${sasToken}`;

    return {
      url,
      expiresAt,
    };
  }

  /**
   * Generate a SAS URL for writing (upload) access
   * Used for direct browser uploads
   * @param blobName - The full blob name/path
   * @param expiryMinutes - How long the URL should be valid (default: 60 minutes = 1 hour)
   * @param containerType - Which container the blob will be in (defaults to 'tools')
   * @returns SAS URL and expiration time
   */
  generateUploadSasUrl(
    blobName: string,
    expiryMinutes: number = 60,
    containerType: ContainerType = 'tools'
  ): SasUrlResult {
    this.initializeService();

    if (!this.accountName || !this.accountKey) {
      throw new Error('Storage account credentials not available');
    }

    const containerName = this.getContainerName(containerType);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    const sharedKeyCredential = new StorageSharedKeyCredential(
      this.accountName,
      this.accountKey
    );

    // Create (c) and Write (w) permissions for upload
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('cw'),
        expiresOn: expiresAt,
      },
      sharedKeyCredential
    ).toString();

    // Use BlobEndpoint if specified (for Azurite local development)
    // Otherwise use the standard Azure cloud URL format
    let baseUrl: string;
    if (this.blobEndpoint) {
      baseUrl = `${this.blobEndpoint}/${containerName}/${blobName}`;
    } else {
      baseUrl = `https://${this.accountName}.blob.core.windows.net/${containerName}/${blobName}`;
    }

    const url = `${baseUrl}?${sasToken}`;

    return {
      url,
      expiresAt,
    };
  }

  /**
   * Check if a blob exists
   * @param blobName - The full blob name/path
   * @param containerType - Which container to check (defaults to 'tools')
   */
  async exists(blobName: string, containerType: ContainerType = 'tools'): Promise<boolean> {
    const container = this.getContainerClient(containerType);
    const blockBlobClient = container.getBlockBlobClient(blobName);
    return blockBlobClient.exists();
  }

  /**
   * Ensure a container exists (useful for initialization)
   * @param containerType - Which container to ensure exists
   */
  async ensureContainerExists(containerType: ContainerType = 'tools'): Promise<void> {
    const container = this.getContainerClient(containerType);
    await container.createIfNotExists({
      access: undefined, // Private access (no public access)
    });
  }

  /**
   * Ensure all containers exist (useful for application startup)
   */
  async ensureAllContainersExist(): Promise<void> {
    await Promise.all([
      this.ensureContainerExists('tools'),
      this.ensureContainerExists('loans'),
    ]);
  }

  /**
   * Configure CORS for the storage account
   * This enables browser uploads directly to blob storage
   * @param corsConfig - CORS configuration options
   */
  async configureCors(corsConfig: CorsConfig): Promise<void> {
    const serviceClient = this.initializeService();

    const properties: BlobServiceProperties = {
      cors: [
        {
          allowedOrigins: corsConfig.allowedOrigins.join(','),
          allowedMethods: corsConfig.allowedMethods.join(','),
          allowedHeaders: corsConfig.allowedHeaders.join(','),
          exposedHeaders: corsConfig.exposedHeaders.join(','),
          maxAgeInSeconds: corsConfig.maxAgeInSeconds,
        },
      ],
    };

    await serviceClient.setProperties(properties);
  }

  /**
   * Get the default CORS configuration for browser uploads
   * Allows uploads from the configured app origin
   */
  getDefaultCorsConfig(): CorsConfig {
    return {
      allowedOrigins: [config.CORS_ORIGIN],
      allowedMethods: ['GET', 'PUT', 'OPTIONS', 'HEAD'],
      allowedHeaders: ['*'],
      exposedHeaders: ['ETag', 'Content-Length', 'Content-Type'],
      maxAgeInSeconds: 3600, // 1 hour
    };
  }

  /**
   * Get the container names for documentation/configuration
   */
  getContainerNames(): { tools: string; loans: string } {
    return {
      tools: config.AZURE_STORAGE_CONTAINER_NAME,
      loans: config.AZURE_STORAGE_LOAN_CONTAINER_NAME,
    };
  }

  /**
   * Get account info for testing/verification
   */
  getAccountInfo(): { accountName: string; blobEndpoint: string; hasCredentials: boolean } {
    this.initializeService();
    return {
      accountName: this.accountName,
      blobEndpoint: this.blobEndpoint,
      hasCredentials: !!(this.accountName && this.accountKey),
    };
  }
}

// Export singleton instance
export const blobStorageService = new BlobStorageService();
