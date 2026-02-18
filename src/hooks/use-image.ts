"use client";

// Images are now stored as URLs in Supabase Storage.
// This hook is simplified to just return the URL directly.
export function useImage(imageUrl: string | undefined) {
  return imageUrl ?? null;
}
