import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, PixelCrop } from '@/utils/imageParser';

interface AvatarCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropCompleteAction: (base64Str: string) => void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({ imageSrc, onClose, onCropCompleteAction }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: PixelCrop) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (croppedAreaPixels && imageSrc) {
      try {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 300);
        onCropCompleteAction(croppedImage);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-zinc-200 font-bold text-lg">Crop Avatar</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-red-400 transition-colors text-2xl leading-none">&times;</button>
        </div>
        
        <div className="relative w-full h-[300px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm font-medium w-12">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-accent-gold cursor-pointer"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors font-medium border border-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-yellow-600 text-black hover:bg-yellow-500 rounded-md transition-colors font-bold shadow-lg shadow-yellow-600/20"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
