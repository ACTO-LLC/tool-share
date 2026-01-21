import {
  BlobServiceClient,
  ContainerClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { config } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

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

class BlobStorageService {
  private containerClient: ContainerClient | null = null;
  private accountName: string = '';
  private accountKey: string = '';
  private blobEndpoint: string = '';

  private initialize(): ContainerClient {
    if (this.containerClient) {
      return this.containerClient;
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

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(config.AZURE_STORAGE_CONTAINER_NAME);

    return this.containerClient;
  }

  /**
   * Upload a file buffer to Azure Blob Storage
   * @param buffer - The file content as a Buffer
   * @param originalName - Original filename for extension extraction
   * @param folder - Folder path within the container (e.g., 'tools/{toolId}')
   * @param contentType - MIME type of the file
   * @returns Upload result with blob name and URL
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    folder: string,
    contentType: string
  ): Promise<BlobUploadResult> {
    const container = this.initialize();

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
   */
  async deleteFile(blobName: string): Promise<void> {
    const container = this.initialize();
    const blockBlobClient = container.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  }

  /**
   * Generate a SAS URL for a blob with read access
   * @param blobName - The full blob name/path
   * @param expiryMinutes - How long the URL should be valid (default: 60 minutes)
   * @returns SAS URL and expiration time
   */
  generateSasUrl(blobName: string, expiryMinutes: number = 60): SasUrlResult {
    this.initialize();

    if (!this.accountName || !this.accountKey) {
      throw new Error('Storage account credentials not available');
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    const sharedKeyCredential = new StorageSharedKeyCredential(
      this.accountName,
      this.accountKey
    );

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: config.AZURE_STORAGE_CONTAINER_NAME,
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
      baseUrl = `${this.blobEndpoint}/${config.AZURE_STORAGE_CONTAINER_NAME}/${blobName}`;
    } else {
      baseUrl = `https://${this.accountName}.blob.core.windows.net/${config.AZURE_STORAGE_CONTAINER_NAME}/${blobName}`;
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
   */
  async exists(blobName: string): Promise<boolean> {
    const container = this.initialize();
    const blockBlobClient = container.getBlockBlobClient(blobName);
    return blockBlobClient.exists();
  }

  /**
   * Ensure the container exists (useful for initialization)
   */
  async ensureContainerExists(): Promise<void> {
    const container = this.initialize();
    await container.createIfNotExists();
  }
}

// Export singleton instance
export const blobStorageService = new BlobStorageService();
