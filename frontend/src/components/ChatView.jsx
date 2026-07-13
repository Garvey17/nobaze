import React from 'react';
import MessageList from './MessageList';
import InputBar from './InputBar';
import IngestPanel from './IngestPanel';

const SUGGESTIONS = [
  'What documents are currently ingested?',
  'Explain the core topics covered in this knowledge base.',
];

export default function ChatView({ chat, onIngestSuccess }) {
  const { messages, loading, sendMessage, sendVoice } = chat;

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] relative pt-14 bg-bg-primary overflow-hidden">
      {/* Scrollable message area or empty state */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="flex flex-col gap-2 max-w-md">
            <h2 className="font-mono text-xl font-bold text-text-primary uppercase tracking-widest">
              NOBAZE
            </h2>
            <p className="font-mono text-xs text-text-secondary">
              Ask anything about your knowledge base.
            </p>
          </div>

          {/* Prompt chips */}
          <div className="mt-8 flex flex-col gap-2 w-full max-w-sm">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left font-sans text-xs text-text-secondary border border-border-divider hover:border-text-primary hover:text-text-primary rounded-[4px] px-4 py-3 bg-bg-surface hover:bg-white/[0.02] transition-all cursor-pointer leading-normal select-text"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <MessageList messages={messages} loading={loading} />
      )}

      {/* Collapsible Source Ingest Panel */}
      <IngestPanel onIngestSuccess={onIngestSuccess} />

      {/* Input Bar */}
      <InputBar
        onTextSubmit={sendMessage}
        onVoiceSubmit={sendVoice}
        loading={loading}
      />
    </div>
  );
}
