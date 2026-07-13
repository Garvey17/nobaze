import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      sources: null,
      isVoice: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await apiClient.query(text);
      
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer || '',
        sources: data.sources || [],
        isVoice: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        sources: null,
        isVoice: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendVoice = useCallback(async (audioBlob) => {
    // 7. Add user voice placeholder
    const userVoiceMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: '[Voice query]',
      sources: null,
      isVoice: true,
    };

    setMessages((prev) => [...prev, userVoiceMessage]);
    setLoading(true);

    try {
      // 5. Send to /voice
      const audioResponseBlob = await apiClient.voice(audioBlob);
      
      // 6. Play returned streaming audio response
      const audioUrl = URL.createObjectURL(audioResponseBlob);
      const audio = new Audio(audioUrl);
      audio.play().catch((e) => console.error("Audio playback failed", e));

      // 8. Add assistant message with 🔊 Voice response and play button
      const assistantVoiceMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '🔊 Voice response',
        sources: [],
        isVoice: true,
        audioUrl: audioUrl,
      };

      setMessages((prev) => [...prev, assistantVoiceMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        sources: null,
        isVoice: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    sendVoice,
    clearChat,
  };
}
