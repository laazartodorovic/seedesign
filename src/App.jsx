import { useState, useEffect, useMemo } from 'react';
import DropZone from './components/DropZone';
import StyleSelector from './components/StyleSelector';
import ImagePreview from './components/ImagePreview';
import ExportButton from './components/ExportButton';
import { processToSketch } from './lib/sketchProcessor';
import './App.css';

function App() {
  const [sourceImage, setSourceImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('pure');
  const [processedCanvas, setProcessedCanvas] = useState(null);
  const [error, setError] = useState(null);

  const sourceCanvas = useMemo(() => {
    if (!sourceImage) return null;
    const w = sourceImage.naturalWidth;
    const h = sourceImage.naturalHeight;
    if (!w || !h) return null;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0);
    return c;
  }, [sourceImage]);

  useEffect(() => {
    if (!sourceCanvas) {
      setProcessedCanvas(null);
      return;
    }
    setError(null);
    try {
      const result = processToSketch(sourceCanvas, selectedStyle);
      setProcessedCanvas(result);
    } catch (err) {
      setError(err?.message || 'Processing failed');
      setProcessedCanvas(null);
    }
  }, [sourceCanvas, selectedStyle]);

  const isLoading = sourceCanvas && !processedCanvas;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Outline Sketch</h1>
        <p>Convert real estate photos to black & white outline sketches</p>
      </header>

      <main className="app__main">
        {error && (
          <div className="app__error" role="alert">
            {error}
          </div>
        )}
        {!sourceImage ? (
          <DropZone
            onImageLoad={(img) => { setError(null); setSourceImage(img); }}
            onError={setError}
            disabled={false}
          />
        ) : (
          <>
            <div className="app__toolbar">
              <button
                type="button"
                className="app__change-btn"
                onClick={() => setSourceImage(null)}
              >
                Change image
              </button>
              <StyleSelector value={selectedStyle} onChange={setSelectedStyle} />
            </div>

            <ImagePreview canvas={processedCanvas} isLoading={isLoading} />

            <ExportButton canvas={processedCanvas} disabled={isLoading} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
