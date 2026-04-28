export const compressImage = (file: File, maxSize: number = 300): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Maintain aspect ratio logic
        let width = img.width;
        let height = img.height;

        // Determine target size depending on which dimension is larger, maximizing it to `maxSize`
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height *= maxSize / width));
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width *= maxSize / height));
            height = maxSize;
          }
        }

        // Alternatively, if we just want a straight square cover crop (like an avatar),
        // we can draw the original image centered into a maxSize x maxSize canvas.
        // Let's do a square crop using `object-fit: cover` logic conceptually:
        canvas.width = maxSize;
        canvas.height = maxSize;

        const scale = Math.max(maxSize / img.width, maxSize / img.height);
        const x = (maxSize / scale - img.width) / 2;
        const y = (maxSize / scale - img.height) / 2;

        ctx.drawImage(img, x, y, img.width, img.height, 0, 0, img.width * scale, img.height * scale);

        // Compress as webp
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        resolve(dataUrl);
      };

      img.onerror = (error) => reject(error);
    };

    reader.onerror = (error) => reject(error);
  });
};

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const getCroppedImg = (imageSrc: string, pixelCrop: PixelCrop, maxSize: number = 300): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Calculate scaled dimensions to fit maxSize (e.g. 300x300)
      let targetWidth = pixelCrop.width;
      let targetHeight = pixelCrop.height;
      
      if (targetWidth > maxSize || targetHeight > maxSize) {
         if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight *= maxSize / targetWidth));
            targetWidth = maxSize;
         } else {
            targetWidth = Math.round((targetWidth *= maxSize / targetHeight));
            targetHeight = maxSize;
         }
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        targetWidth,
        targetHeight
      );

      const dataUrl = canvas.toDataURL('image/webp', 0.8);
      resolve(dataUrl);
    };
    img.onerror = (error) => {
      reject(error);
    };
  });
};
