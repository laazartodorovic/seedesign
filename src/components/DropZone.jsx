import { useRef } from 'react';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

function isImageFile(file) {
  if (!file) return false;
  if (file.type && IMAGE_TYPES.includes(file.type)) return true;
  if (file.type && file.type.startsWith('image/')) return true;
  const name = (file.name || '').toLowerCase();
  return IMAGE_EXTS.some((ext) => name.endsWith(ext));
}

export default function DropZone({ onImageLoad, onError, disabled }) {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!isImageFile(file)) {
      onError?.('Please upload a PNG, JPEG, or WebP image.');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onImageLoad(img);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      onError?.('Failed to load image. Try a different file.');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleChange = (e) => {
    const file = e.target?.files?.[0];
    handleFile(file);
    e.target.value = '';
  };


  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`drop-zone ${disabled ? 'drop-zone--disabled' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleChange}
        className="drop-zone__input"
        aria-label="Upload image"
      />
      <span>Drop image here or click to upload</span>
    </div>
  );
}
