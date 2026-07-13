import React, { useState, useRef } from 'react';

export default function InputBar({ onTextSubmit, onVoiceSubmit, loading }) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading || isProcessingVoice || !inputText.trim()) return;
    onTextSubmit(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessingVoice(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          await onVoiceSubmit(audioBlob);
        } catch (err) {
          console.error("Failed to submit voice recording", err);
        } finally {
          setIsProcessingVoice(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isDisabled = loading || isProcessingVoice;

  return (
    <div className="w-full bg-bg-primary border-t border-border-divider p-4 flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {/* Microphone Button */}
        <button
          type="button"
          onClick={handleMicClick}
          disabled={loading || isProcessingVoice}
          className={`h-11 w-11 flex items-center justify-center border transition-all rounded-[4px] ${
            isRecording
              ? 'bg-text-primary text-bg-primary border-text-primary'
              : 'bg-bg-surface text-text-primary border-border-divider hover:bg-text-primary hover:text-bg-primary disabled:border-state-disabled disabled:text-state-disabled disabled:hover:bg-bg-surface'
          }`}
          title={isRecording ? 'Stop recording' : 'Record voice query'}
        >
          <span className="text-lg">🎤</span>
        </button>

        {/* Text Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder={isRecording ? 'Listening...' : 'Ask a question...'}
            className="w-full h-11 bg-bg-surface text-text-primary border border-border-divider rounded-[4px] px-4 font-sans text-sm focus:outline-none focus:border-text-primary disabled:opacity-50 select-text"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isDisabled || !inputText.trim()}
          className="h-11 px-5 bg-bg-surface text-text-primary border border-border-divider rounded-[4px] font-mono text-sm hover:bg-text-primary hover:text-bg-primary transition-all disabled:opacity-30 disabled:border-border-divider disabled:hover:bg-bg-surface disabled:hover:text-text-primary"
        >
          {loading ? '···' : '→'}
        </button>
      </form>

      {/* Voice Status Labels */}
      {isRecording && (
        <div className="text-xs font-mono text-text-secondary pl-14 animate-pulse select-none">
          Recording... click microphone to stop
        </div>
      )}
      {isProcessingVoice && (
        <div className="text-xs font-mono text-text-secondary pl-14 select-none">
          Processing...
        </div>
      )}
    </div>
  );
}
