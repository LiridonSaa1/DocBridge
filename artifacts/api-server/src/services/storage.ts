/**
 * Storage Service
 * Wraps Supabase Storage for private document management.
 * All documents are stored in private buckets with signed URLs.
 */

export interface SignedUrlResult {
  signedUrl: string;
  expiresAt: Date;
}

export interface StoragePath {
  bucket: string;
  path: string;
}

export const STORAGE_BUCKETS = {
  IDENTITY_DOCUMENTS: "identity-documents",
  PROFESSIONAL_DOCUMENTS: "professional-documents",
  OFFICE_PHOTOS: "office-photos",
  TRANSLATION_FILES: "translation-files",
  COMPLETED_FILES: "completed-files",
  AVATARS: "avatars",
} as const;

// Generate a signed URL for private document access
// The frontend uses the Supabase JS client directly to upload
// The backend generates signed URLs for viewing
export function buildStoragePath(
  bucket: string,
  userId: string,
  filename: string
): string {
  const timestamp = Date.now();
  return `${userId}/${timestamp}_${filename}`;
}

// FUTURE: Generate signed URL via Supabase Admin SDK
export async function generateSignedUrl(
  _bucket: string,
  _path: string,
  _expiresInSeconds = 3600
): Promise<SignedUrlResult> {
  // Stub — in production, use Supabase Admin SDK:
  // const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, expiresInSeconds)
  throw new Error("Signed URL generation requires Supabase Admin SDK configuration");
}

// FUTURE: Delete file from storage
export async function deleteFile(_bucket: string, _path: string): Promise<void> {
  // Stub — in production, use Supabase Admin SDK
}
