import React from 'react';

export default function SourceCard({ index, chunk, isExpanded, onToggle, highlighted }) {
  const truncatedDocId = chunk.document_id ? `${chunk.document_id.slice(0, 8)}...` : 'unknown';

  return (
    <div
      id={`source-card-${index}`}
      className={`border rounded-[4px] font-sans text-xs transition-all ${
        highlighted 
          ? 'border-text-primary bg-white/[0.03]' 
          : 'border-border-divider hover:border-text-secondary'
      }`}
    >
      {/* Header (Toggle area) */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between font-mono text-text-secondary hover:text-text-primary transition-all text-[11px] select-none"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold border border-state-disabled rounded-[2px] px-1.5 py-0.5 text-text-primary select-none text-[10px]">
            [{index}]
          </span>
          <span>
            chunk_{chunk.chunk_index} · doc_{truncatedDocId}
          </span>
        </div>
        <span className="text-sm font-sans">{isExpanded ? '↑' : '↓'}</span>
      </button>

      {/* Content area */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border-divider/50 pt-3 flex flex-col gap-3">
          <p className="text-text-primary leading-relaxed whitespace-pre-wrap select-text text-sm font-light">
            {chunk.content}
          </p>
          <div className="font-mono text-[10px] text-text-secondary select-none flex items-center justify-between border-t border-border-divider/30 pt-2">
            <span>RRF Score: {chunk.rrf_score?.toFixed(6) || '0.000000'}</span>
            <span>Chunk ID: {chunk.chunk_id}</span>
          </div>
        </div>
      )}
    </div>
  );
}
