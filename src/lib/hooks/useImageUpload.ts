'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const MAX_SIZE = 400;
const JPEG_QUALITY = 0.8;

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

interface UseImageUploadOptions {
  bucket: 'avatars' | 'group-avatars';
  path: string; // e.g. "{userId}/avatar.jpg" or "{groupId}/avatar.jpg"
}

export function useImageUpload({ bucket, path }: UseImageUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      setUploading(true);
      setError(null);

      try {
        const resized = await resizeImage(file);
        const supabase = createClient();

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, resized, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          setError(uploadError.message);
          return null;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        // Append cache-buster so browser shows new image
        const url = `${data.publicUrl}?t=${Date.now()}`;
        return url;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        return null;
      } finally {
        setUploading(false);
      }
    },
    [bucket, path],
  );

  return { uploading, error, upload };
}
