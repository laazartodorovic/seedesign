export default function ExportButton({ canvas, disabled }) {
  const handleExport = () => {
    if (!canvas || disabled) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sketch.png';
    a.click();
  };

  return (
    <button
      type="button"
      className="export-btn"
      onClick={handleExport}
      disabled={disabled}
    >
      Export PNG
    </button>
  );
}
