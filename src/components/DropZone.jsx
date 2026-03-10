import { useRef } from 'react';

const ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];

export default function DropZone({ onImageLoad, disabled }) {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !ACCEPT.includes(file.type)) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onImageLoad(img);
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
  };

  const handleChange = (e) => {
    const file = e.target?.files?.[0];
    handleFile(file);
    e.target.value = '';
  };

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`drop-zone ${disabled ? 'drop-zone--disabled' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(',')}
        onChange={handleChange}
        className="drop-zone__input"
      />
      <span>Drop image here or click to upload</span>
    </div>
  );
}
