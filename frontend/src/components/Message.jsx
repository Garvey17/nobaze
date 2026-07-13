import React, { useState } from 'react';
import SourceCard from './SourceCard';

export default function Message({ message, isStreaming }) {
  const { role, content, sources, isVoice, audioUrl } = message;

  // Track expanded state for each source card locally in the message
  const [expandedSources, setExpandedSources] = useState({});
  const [highlightedSource, setHighlightedSource] = useState(null);

  const handleCitationClick = (citationNumber) => {
    const index = citationNumber - 1;
    // 1. Expand the card
    setExpandedSources((prev) => ({ ...prev, [index]: true }));
    // 2. Set highlight
    setHighlightedSource(index);
    // 3. Scroll to it
    setTimeout(() => {
      const element = document.getElementById(`source-card-${citationNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
    // 4. Remove highlight after a delay
    setTimeout(() => {
      setHighlightedSource(null);
    }, 1500);
  };

  const handleToggleSource = (index) => {
    setExpandedSources((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => console.error('Failed to replay audio:', err));
    }
  };

  // Helper to parse citations e.g. [1], [2] in answer text
  const renderContentWithCitations = (text) => {
    if (!text) return '';
    const regex = /\[(\d+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const citationNumber = match[1];

      // Push text before match
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      // Push citation button
      parts.push(
        <button
          key={`cit-${matchIndex}`}
          onClick={() => handleCitationClick(parseInt(citationNumber, 10))}
          className="mx-1 font-mono text-[11px] text-text-primary border border-state-disabled rounded-[2px] px-1.5 py-0.5 hover:bg-white/[0.08] transition-all cursor-pointer font-bold inline-block align-middle leading-none"
        >
          {citationNumber}
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return (
      <span className="whitespace-pre-wrap leading-[1.7] select-text">
        {parts}
        {isStreaming && (
          <span className="animate-blink font-sans text-text-primary ml-0.5 select-none font-bold">
            ▋
          </span>
        )}
      </span>
    );
  };

  if (role === 'user') {
    return (
      <div className="flex justify-end w-full mb-6">
        <div className="max-w-[80%] bg-bg-surface border border-state-disabled rounded-[4px] px-4 py-3 font-sans text-sm text-text-primary leading-relaxed break-words select-text">
          {content}
        </div>
      </div>
    );
  }

  // Assistant message rendering
  return (
    <div className="w-full flex flex-col items-start mb-8 border-b border-border-divider/30 pb-6 last:border-0 last:pb-0">
      {/* Answer text */}
      <div className="font-sans text-sm text-text-primary w-full leading-relaxed select-text">
        {isVoice ? (
          <div className="flex items-center gap-3 py-1 font-mono text-sm text-text-primary">
            <span>🔊 Voice response</span>
            <button
              onClick={playAudio}
              className="px-3 py-1 border border-border-divider rounded-[4px] text-xs hover:bg-white/[0.05] transition-all"
            >
              Play
            </button>
          </div>
        ) : (
          renderContentWithCitations(content)
        )}
      </div>

      {/* Sources list */}
      {sources && sources.length > 0 && (
        <div className="w-full mt-6 flex flex-col gap-3">
          <div className="font-mono text-[10px] text-text-secondary uppercase tracking-wider select-none mb-1">
            Sources
          </div>
          <div className="flex flex-col gap-2.5 w-full">
            {sources.map((chunk, idx) => (
              <SourceCard
                key={chunk.chunk_id || idx}
                index={idx + 1}
                chunk={chunk}
                isExpanded={!!expandedSources[idx]}
                onToggle={() => handleToggleSource(idx)}
                highlighted={highlightedSource === idx}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
