import React, { useEffect, useRef } from 'react';
import Message from './Message';

export default function MessageList({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom of the list when messages change or loading state changes
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col w-full max-w-4xl mx-auto">
      {messages.map((message, index) => (
        <Message
          key={message.id}
          message={message}
          // The last message is streaming if the global loading is true, and it's an assistant message, and it's not a voice response.
          isStreaming={
            loading &&
            index === messages.length - 1 &&
            message.role === 'assistant' &&
            !message.isVoice
          }
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
