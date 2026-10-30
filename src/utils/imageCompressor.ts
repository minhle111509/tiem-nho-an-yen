/**
 * Client-side Image Optimizer for Mobile & Desktop
 * - Resizes large camera photos (e.g. 4032x3024) down to optimal e-commerce resolution (max 1200px)
 * - Compresses to high quality WebP/JPEG (target size ~100-300KB)
 * - Generates fast thumbnail
 * - Handles EXIF orientation automatically in modern browsers
 */

export interface OptimizedImageResult {
  dataUrl: string;
  thumbnailUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  fileName: string;
}

export async function optimizeImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Định dạng ảnh không được hỗ trợ hoặc bị lỗi'));
      img.onload = () => {
        try {
          // Calculate target dimensions
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          // Main canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Trình duyệt không hỗ trợ Canvas 2D'));
          }

          // Draw image smoothly
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as webp if supported, otherwise jpeg
          let dataUrl = '';
          try {
            dataUrl = canvas.toDataURL('image/webp', quality);
            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
          } catch {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // Generate thumbnail (max 240px)
          const thumbCanvas = document.createElement('canvas');
          const thumbDim = 240;
          let tw = width;
          let th = height;
          if (tw > thumbDim || th > thumbDim) {
            if (tw > th) {
              th = Math.round((th * thumbDim) / tw);
              tw = thumbDim;
            } else {
              tw = Math.round((tw * thumbDim) / th);
              th = thumbDim;
            }
          }
          thumbCanvas.width = tw;
          thumbCanvas.height = th;
          const tctx = thumbCanvas.getContext('2d');
          if (tctx) {
            tctx.imageSmoothingEnabled = true;
            tctx.drawImage(img, 0, 0, tw, th);
          }
          const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);

          // Calculate approximate compressed size in bytes
          const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
          const compressedBytes = Math.round((base64Length * 3) / 4);

          resolve({
            dataUrl,
            thumbnailUrl,
            originalSize: file.size,
            compressedSize: compressedBytes,
            width,
            height,
            fileName: file.name,
          });
        } catch (err: any) {
          reject(new Error(err.message || 'Lỗi khi nén ảnh'));
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
