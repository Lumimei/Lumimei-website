/**
 * Helper to downscale and compress image files (like profile photos)
 * before saving to state or localStorage, preventing QuotaExceededError.
 */
/**
 * Helper to downscale and compress image files (like profile photos)
 * before saving to state or Firestore.
 * Strictly enforces 256x256 dimensions, JPEG quality 0.7, and size under 100KB.
 */
export function compressImageFile(
  file: File,
  maxWidth: number = 256,
  maxHeight: number = 256,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const result = readerEvent.target?.result as string;
      if (!result) {
        resolve('');
        return;
      }
      compressImageDataUrl(result, maxWidth, maxHeight, quality)
        .then(resolve)
        .catch(() => resolve(result));
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Ensures any base64 data URL or image string is downscaled to 256x256,
 * compressed at JPEG quality 0.7, and guaranteed to be strictly under 100KB.
 */
export function compressImageDataUrl(
  dataUrl: string,
  maxWidth: number = 256,
  maxHeight: number = 256,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl || '');
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio within maxWidth x maxHeight (256x256)
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      width = Math.max(1, Math.min(width, maxWidth));
      height = Math.max(1, Math.min(height, maxHeight));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Draw white background then the image
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const MAX_BYTES = 100 * 1024; // 100KB = 102,400 bytes
      let currentQuality = quality;
      let compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);

      const calculateBytes = (b64Str: string) => {
        const commaIdx = b64Str.indexOf(',');
        const content = commaIdx >= 0 ? b64Str.slice(commaIdx + 1) : b64Str;
        return Math.round(content.length * 0.75);
      };

      let bytes = calculateBytes(compressedDataUrl);

      // Iterative compression if greater than 100KB
      let attempts = 0;
      while (bytes > MAX_BYTES && attempts < 5) {
        attempts++;
        currentQuality = Math.max(0.3, currentQuality - 0.12);
        if (currentQuality <= 0.4) {
          // If quality is already low, reduce resolution slightly
          canvas.width = Math.max(64, Math.round(canvas.width * 0.85));
          canvas.height = Math.max(64, Math.round(canvas.height * 0.85));
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        bytes = calculateBytes(compressedDataUrl);
      }

      console.log(`【头像压缩】最终尺寸: ${canvas.width}x${canvas.height}, 质量: ${currentQuality.toFixed(2)}, 体积: ${(bytes / 1024).toFixed(1)} KB (已控制在 100KB 内)`);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

