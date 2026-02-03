/**
 * SPAC OS - Supabase Client Configuration
 * Provides client and server-side Supabase instances for storage operations
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || '';
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';
const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || '';

// Storage bucket name for documents
export const DOCUMENTS_BUCKET = 'documents';

// Accepted file types for document uploads
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

// Maximum file size: 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// File type to MIME type mapping
export const FILE_TYPE_MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

/**
 * Client-side Supabase instance (uses anon key)
 * Use this for client-side operations that respect RLS policies
 */
let clientSideSupabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be configured');
  }

  if (!clientSideSupabase) {
    clientSideSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return clientSideSupabase;
}

/**
 * Server-side Supabase instance (uses service role key)
 * Use this for server-side operations that bypass RLS
 * NEVER expose this to the client
 */
let serverSideSupabase: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL and Service Role Key must be configured');
  }

  if (!serverSideSupabase) {
    serverSideSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serverSideSupabase;
}

/**
 * Generate a storage path for a document
 * Structure: documents/{spacId|targetId}/{documentId}_{version}.{ext}
 */
export function generateStoragePath(params: {
  spacId?: string;
  targetId?: string;
  documentId: string;
  version: number;
  fileName: string;
}): string {
  const { spacId, targetId, documentId, version, fileName } = params;

  // Get file extension
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Determine the parent folder
  const parentFolder = spacId || targetId || 'general';

  return `${parentFolder}/${documentId}_v${version}.${ext}`;
}

/**
 * Get the public URL for a document in storage
 */
export function getPublicUrl(path: string): string {
  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a file to Supabase Storage
 * Returns the storage path on success
 */
export async function uploadToStorage(
  file: File | Blob,
  path: string,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
): Promise<{ path: string; error: Error | null }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, {
      contentType: options?.contentType,
      upsert: options?.upsert ?? false,
    });

  if (error) {
    return { path: '', error: new Error(error.message) };
  }

  return { path: data.path, error: null };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFromStorage(path: string): Promise<{ error: Error | null }> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Generate a signed URL for private file download
 * @param path - The storage path of the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string; error: Error | null }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    return { url: '', error: new Error(error.message) };
  }

  return { url: data.signedUrl, error: null };
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && (supabaseAnonKey || supabaseServiceRoleKey));
}

/**
 * Validate file type
 */
export function isValidFileType(mimeType: string): boolean {
  return Object.keys(ACCEPTED_FILE_TYPES).includes(mimeType);
}

/**
 * Get file extension from mime type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const extensions = ACCEPTED_FILE_TYPES[mimeType as keyof typeof ACCEPTED_FILE_TYPES];
  return extensions?.[0]?.replace('.', '') || '';
}
