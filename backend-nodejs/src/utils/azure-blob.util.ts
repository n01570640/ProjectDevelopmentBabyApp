/**
 * Azure Blob Storage utility
 *
 * Uploads a file buffer to the configured Azure Storage container (private).
 * Returns the blob name (stored in DB), and can generate SAS URLs for display.
 *
 * Required env vars (already present in .env):
 *   AZURE_STORAGE_CONNECTION_STRING
 *   AZURE_STORAGE_CONTAINER_NAME
 */

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getConnectionString(): string {
  const cs = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!cs) throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
  return cs;
}

function getContainerName(): string {
  const name = process.env.AZURE_STORAGE_CONTAINER_NAME;
  if (!name) throw new Error("AZURE_STORAGE_CONTAINER_NAME is not set");
  return name;
}

function getBlobServiceClient(): BlobServiceClient {
  return BlobServiceClient.fromConnectionString(getConnectionString());
}

/**
 * Parse AccountName and AccountKey out of a storage connection string.
 * Format: DefaultEndpointsProtocol=...;AccountName=xxx;AccountKey=yyy;...
 */
function parseConnectionString(cs: string): { accountName: string; accountKey: string } {
  const parts: Record<string, string> = {};
  cs.split(";").forEach((seg) => {
    const idx = seg.indexOf("=");
    if (idx !== -1) {
      parts[seg.slice(0, idx)] = seg.slice(idx + 1);
    }
  });
  const accountName = parts["AccountName"];
  const accountKey = parts["AccountKey"];
  if (!accountName || !accountKey) {
    throw new Error("Could not parse AccountName/AccountKey from AZURE_STORAGE_CONNECTION_STRING");
  }
  return { accountName, accountKey };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Upload a file buffer to Azure Blob Storage.
 * The container can be private — use generateSasUrl() to get a viewable link.
 *
 * @returns The blob name (e.g. "profile-photos/uuid.jpg") — store this in the DB.
 */
export async function uploadBufferToBlob(
  buffer: Buffer,
  mimeType: string,
  extension: string,
  folder: string = "uploads"
): Promise<string> {
  const blobServiceClient = getBlobServiceClient();
  const containerName = getContainerName();
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const blobName = `${folder}/${uuidv4()}.${extension}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });

  // Return blob name — NOT the direct URL (direct URL requires public access)
  return blobName;
}

/**
 * Generate a SAS (Shared Access Signature) URL for a private blob.
 * The URL is valid for `expiryMinutes` minutes (default 60).
 *
 * @param blobName  - The blob name stored in DB, e.g. "profile-photos/uuid.jpg"
 * @returns A time-limited signed URL that can be used in <Image source={{ uri }} />
 */
export function generateSasUrl(blobNameOrUrl: string, expiryMinutes: number = 60): string {
  const cs = getConnectionString();
  const containerName = getContainerName();
  const { accountName, accountKey } = parseConnectionString(cs);

  // If the stored value is a full URL (old rows), extract just the blob name part.
  // Full URL format: https://<account>.blob.core.windows.net/<container>/<blobName>
  let blobName = blobNameOrUrl;
  if (blobNameOrUrl.startsWith("https://")) {
    try {
      const url = new URL(blobNameOrUrl);
      // pathname is "/<container>/<blobName...>" — strip the leading "/<container>/"
      const withoutContainer = url.pathname.replace(`/${containerName}/`, "");
      blobName = withoutContainer;
    } catch {
      // fallback: use as-is
    }
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

  const startsOn = new Date();
  const expiresOn = new Date(startsOn.getTime() + expiryMinutes * 60 * 1000);

  const sasQueryParams = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"), // read-only
      startsOn,
      expiresOn,
    },
    sharedKeyCredential
  );

  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasQueryParams.toString()}`;
}
