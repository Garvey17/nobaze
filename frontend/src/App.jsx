import React, { useState } from 'react';
import Header from './components/Header';
import ChatView from './components/ChatView';
import LibraryView from './components/LibraryView';
import { useChat } from './hooks/useChat';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'library'
  const chat = useChat();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans flex flex-col antialiased">
      {/* Navigation Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'chat' ? (
          <ChatView chat={chat} />
        ) : (
          <div className="pt-14 flex-1 bg-bg-primary">
            <LibraryView />
          </div>
        )}
      </main>
    </div>
  );
}
