import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export default function LibraryView() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await apiClient.getDocuments();
      // Sort by created_at descending if present
      const sortedDocs = (docs || []).sort((a, b) => {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
      setDocuments(sortedDocs);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (docId) => {
    try {
      // Send delete request with raw array [docId] as expected by API
      await apiClient.deleteDocuments([docId]);
      // Refetch document list
      fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document', err);
      alert('Failed to delete document. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-8 px-6 flex flex-col gap-6">
      {/* Title Header */}
      <div className="flex items-baseline justify-between border-b border-border-divider pb-4">
        <h1 className="font-mono text-lg font-bold text-text-primary uppercase tracking-wider">
          Knowledge Base
        </h1>
        <span className="font-mono text-xs text-text-secondary">
          {loading ? '...' : `${documents.length} sources`}
        </span>
      </div>

      {/* Main List Area */}
      {loading && documents.length === 0 ? (
        <div className="py-12 text-center font-mono text-sm text-text-secondary">
          Loading sources...
        </div>
      ) : error ? (
        <div className="py-12 text-center font-mono text-sm text-text-primary border border-border-divider rounded-[4px] p-4 bg-bg-surface">
          {error}
        </div>
      ) : documents.length === 0 ? (
        <div className="py-16 text-center font-mono text-sm text-text-secondary select-none">
          No sources yet. Add one from the Chat view.
        </div>
      ) : (
        <div className="flex flex-col border border-border-divider rounded-[4px] bg-bg-surface divide-y divide-border-divider">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all"
            >
              {/* Left Column: Badge & Name */}
              <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                <span className="font-mono text-[10px] tracking-widest text-text-secondary border border-state-disabled rounded-[2px] px-2 py-0.5 uppercase flex-shrink-0 select-none">
                  {doc.source_type}
                </span>
                <span
                  className="font-sans text-sm text-text-primary truncate select-text"
                  title={doc.source_name}
                >
                  {doc.source_name}
                </span>
              </div>

              {/* Right Column: Status & Actions */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Status Indicator */}
                <span
                  className={`font-mono text-xs select-none ${
                    doc.status === 'complete'
                      ? 'text-text-primary'
                      : doc.status === 'processing' || doc.status === 'pending'
                      ? 'text-text-secondary animate-pulse'
                      : 'text-text-primary border border-state-disabled rounded-[2px] px-1.5 py-0.5' // failed status layout
                  }`}
                >
                  {doc.status}
                </span>

                {/* Delete Trigger */}
                <button
                  onClick={() => handleDelete(doc.document_id)}
                  className="w-8 h-8 flex items-center justify-center font-sans text-lg text-text-secondary hover:text-text-primary hover:bg-white/[0.05] rounded-[4px] transition-all"
                  title="Delete source"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
