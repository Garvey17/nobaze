import React from 'react';

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-bg-primary border-b border-border-divider flex items-center justify-between px-6 z-50">
      <div className="font-mono text-text-primary text-lg font-bold tracking-tight select-none">
        NOBAZE
      </div>
      <nav className="flex space-x-6 h-full items-center">
        <button
          onClick={() => setActiveTab('chat')}
          className={`h-full px-2 font-mono text-sm border-b-2 flex items-center transition-all ${
            activeTab === 'chat'
              ? 'text-text-primary border-text-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`h-full px-2 font-mono text-sm border-b-2 flex items-center transition-all ${
            activeTab === 'library'
              ? 'text-text-primary border-text-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          Library
        </button>
      </nav>
    </header>
  );
}
