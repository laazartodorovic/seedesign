import { useRef, useEffect } from 'react';

export default function ImagePreview({ canvas, isLoading }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !canvas) return;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(canvas);
    return () => {
      if (containerRef.current?.contains(canvas)) {
        containerRef.current.removeChild(canvas);
      }
    };
  }, [canvas]);

  if (!canvas && !isLoading) return null;

  return (
    <div className="preview">
      {isLoading && (
        <div className="preview__loading">Processing…</div>
      )}
      <div
        ref={containerRef}
        className="preview__canvas-wrap"
        style={{ visibility: isLoading ? 'hidden' : 'visible' }}
      />
    </div>
  );
}
