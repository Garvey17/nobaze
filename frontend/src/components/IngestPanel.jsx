import React, { useState, useRef } from 'react';
import { apiClient } from '../api/client';

export default function IngestPanel({ onIngestSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceType, setSourceType] = useState('url'); // 'url' | 'text' | 'pdf'
  const [sourceValue, setSourceValue] = useState('');
  const [pdfFile, setPdfFile] = useState(null); // File object for PDF uploads
  const [status, setStatus] = useState('idle'); // 'idle' | 'ingesting' | 'success' | 'failed'
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const switchTab = (type) => {
    setSourceType(type);
    setSourceValue('');
    setPdfFile(null);
    setStatus('idle');
    setErrorMessage('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Only .pdf files are accepted.');
      setStatus('failed');
      setPdfFile(null);
      return;
    }
    setStatus('idle');
    setErrorMessage('');
    setPdfFile(file);
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (status === 'ingesting') return;

    // Guard: URL/Text need a value; PDF needs a file
    if (sourceType === 'pdf') {
      if (!pdfFile) return;
    } else {
      if (!sourceValue.trim()) return;
    }

    setStatus('ingesting');
    setErrorMessage('');

    try {
      if (sourceType === 'pdf') {
        await apiClient.ingestPDF(pdfFile);
        setPdfFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        await apiClient.ingest(sourceType, sourceValue.trim());
        setSourceValue('');
      }

      setStatus('success');
      if (onIngestSuccess) onIngestSuccess();

      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('failed');
      setErrorMessage(err.message || 'Ingestion failed');
    }
  };

  // Whether the submit button should be enabled
  const canSubmit =
    status !== 'ingesting' &&
    (sourceType === 'pdf' ? !!pdfFile : !!sourceValue.trim());

  return (
    <div className="w-full bg-bg-surface border-t border-border-divider">
      {/* Panel Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-6 flex items-center justify-between font-mono text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-all select-none border-b border-border-divider"
      >
        <span>SOURCES</span>
        <span>{isOpen ? '− Hide Panel' : '+ Add Source'}</span>
      </button>

      {/* Expanded Content Drawer */}
      {isOpen && (
        <form onSubmit={handleIngest} className="p-5 flex flex-col gap-4 bg-bg-surface">
          {/* Tab Selector */}
          <div className="flex gap-2">
            {['url', 'text', 'pdf'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => switchTab(type)}
                className={`px-3 py-1.5 font-mono text-xs border rounded-[4px] transition-all uppercase ${
                  sourceType === type
                    ? 'bg-text-primary text-bg-primary border-text-primary'
                    : 'bg-bg-elevated text-text-secondary border-border-divider hover:text-text-primary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Form Fields */}
          <div className="w-full">
            {sourceType === 'url' && (
              <input
                type="url"
                required
                placeholder="https://example.com/docs"
                value={sourceValue}
                onChange={(e) => setSourceValue(e.target.value)}
                disabled={status === 'ingesting'}
                className="w-full h-11 bg-bg-elevated text-text-primary border border-border-divider rounded-[4px] px-4 font-sans text-sm focus:outline-none focus:border-text-primary disabled:opacity-50 select-text"
              />
            )}

            {sourceType === 'text' && (
              <textarea
                required
                rows={5}
                placeholder="Paste plain text content here..."
                value={sourceValue}
                onChange={(e) => setSourceValue(e.target.value)}
                disabled={status === 'ingesting'}
                className="w-full bg-bg-elevated text-text-primary border border-border-divider rounded-[4px] p-4 font-sans text-sm focus:outline-none focus:border-text-primary resize-none disabled:opacity-50 select-text"
              />
            )}

            {sourceType === 'pdf' && (
              <div className="w-full">
                {/* Hidden real file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  disabled={status === 'ingesting'}
                  className="hidden"
                  id="pdf-upload-input"
                />
                {/* Styled drop zone / trigger */}
                <label
                  htmlFor="pdf-upload-input"
                  className={`flex flex-col items-center justify-center w-full h-24 border border-dashed rounded-[4px] cursor-pointer transition-all select-none ${
                    pdfFile
                      ? 'border-text-primary bg-white/[0.02]'
                      : 'border-border-divider hover:border-text-secondary'
                  } ${status === 'ingesting' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  {pdfFile ? (
                    <div className="flex flex-col items-center gap-1 text-center px-4">
                      <span className="font-mono text-xs text-text-primary truncate max-w-xs">
                        {pdfFile.name}
                      </span>
                      <span className="font-mono text-[10px] text-text-secondary">
                        {(pdfFile.size / 1024).toFixed(1)} KB · click to change
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-sm text-text-secondary">↑ Choose PDF file</span>
                      <span className="font-mono text-[10px] text-text-secondary">
                        click to browse
                      </span>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Footer Status & Actions */}
          <div className="flex items-center justify-between mt-1">
            {/* Status Display */}
            <div className="font-mono text-xs">
              {status === 'ingesting' && (
                <span className="text-text-secondary">Ingesting...</span>
              )}
              {status === 'success' && (
                <span className="text-text-primary">✓ Ingested</span>
              )}
              {status === 'failed' && (
                <span className="text-text-primary">
                  ✗ Failed {errorMessage ? `— ${errorMessage}` : ''}
                </span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-9 px-5 bg-text-primary text-bg-primary border border-text-primary rounded-[4px] font-mono text-xs hover:bg-bg-primary hover:text-text-primary transition-all disabled:opacity-30 disabled:border-state-disabled disabled:hover:bg-bg-surface disabled:hover:text-text-secondary"
            >
              Ingest →
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
