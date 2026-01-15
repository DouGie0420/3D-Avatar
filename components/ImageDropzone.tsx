import React, { useRef } from 'react';
import { UploadedImage, AvatarViewType } from '../types';

interface ImageDropzoneProps {
  viewType: AvatarViewType;
  label: string;
  image: UploadedImage | undefined;
  onUpload: (file: File, viewType: AvatarViewType) => void;
  onRemove: (viewType: AvatarViewType) => void;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ viewType, label, image, onUpload, onRemove }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0], viewType);
    }
  };

  const handleClick = () => {
    if (!image) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="relative group">
      <div 
        onClick={handleClick}
        className={`
          aspect-[3/4] rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden
          ${image 
            ? 'border-primary-500 bg-gray-800' 
            : 'border-gray-600 bg-gray-900/50 hover:border-gray-400 hover:bg-gray-800'
          }
        `}
      >
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />

        {image ? (
          <>
            <img 
              src={image.previewUrl} 
              alt={label} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(viewType); }}
                className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
             <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             <p className="text-sm font-semibold text-gray-300">{label}</p>
             <p className="text-xs text-gray-500 mt-1">Click to Upload</p>
          </div>
        )}
      </div>
      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-mono text-gray-300 pointer-events-none">
        {viewType.toUpperCase()}
      </div>
    </div>
  );
};

export default ImageDropzone;