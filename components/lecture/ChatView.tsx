'use client';

import { useState, useEffect, useRef } from 'react';
import type { Lecture } from '../../lib/supabase/types';
import { createClient } from '../../lib/supabase/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
}

interface ChatViewProps {
  lecture: Lecture;
}

export function ChatView({ lecture }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('lecture_chats')
        .select('*')
        .eq('lecture_id', lecture.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const chatMessages: ChatMessage[] =
        data?.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          provider: msg.provider || undefined
        })) || [];

      setMessages(chatMessages);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || !lecture.transcript) return;

    const userMessage: ChatMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message
      await supabase.from('lecture_chats').insert({
        lecture_id: lecture.id,
        role: 'user',
        content: question,
        provider
      });

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          transcript: lecture.transcript,
          messages: [...messages, userMessage]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get response');

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message?.content || '',
        provider
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message
      await supabase.from('lecture_chats').insert({
        lecture_id: lecture.id,
        role: 'assistant',
        content: assistantMessage.content,
        provider
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loadingHistory) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--text-muted)'
        }}
      >
        Loading chat...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 200px)',
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Chat with your Lecture</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Ask questions about the lecture content
        </p>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: 'var(--surface-panel)',
          borderRadius: '1rem',
          border: '1px solid var(--border-medium)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <p>No messages yet. Ask a question about your lecture!</p>
            <div style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Try asking:</p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
                <li>&quot;What are the main topics covered?&quot;</li>
                <li>&quot;Explain [concept] in simpler terms&quot;</li>
                <li>&quot;What are the key takeaways?&quot;</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              style={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                padding: '1rem 1.25rem',
                borderRadius: '1rem',
                background:
                  message.role === 'user'
                    ? 'var(--accent-gradient)'
                    : 'var(--surface-panel-contrast)',
                color:
                  message.role === 'user'
                    ? 'var(--accent-text-contrast)'
                    : 'var(--text-secondary)',
                boxShadow: 'var(--shadow-panel)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8, marginBottom: '0.5rem' }}>
                {message.role === 'user' ? 'You' : message.provider === 'openai' ? 'ChatGPT' : 'Claude'}
              </div>
              {message.content}
            </div>
          ))
        )}
        {isLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '75%',
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              background: 'var(--surface-panel-contrast)',
              color: 'var(--text-muted)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'currentColor',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'currentColor',
                animation: 'pulse 1.5s ease-in-out 0.2s infinite'
              }}
            />
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'currentColor',
                animation: 'pulse 1.5s ease-in-out 0.4s infinite'
              }}
            />
          </div>
        )}
        <div ref={messagesEndRef} />
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>

      {/* Input */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end'
        }}
      >
        <div style={{ flex: 1 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about the lecture..."
            disabled={isLoading || !lecture.transcript}
            rows={3}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-stronger)',
              background: 'var(--surface-input)',
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'none'
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'openai' | 'anthropic')}
            disabled={isLoading}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-stronger)',
              background: 'var(--surface-input)',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="openai">ChatGPT</option>
            <option value="anthropic">Claude</option>
          </select>
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim() || !lecture.transcript}
            style={{
              padding: '0.875rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background:
                isLoading || !input.trim() || !lecture.transcript
                  ? 'var(--accent-gradient-muted)'
                  : 'var(--accent-gradient)',
              color: 'var(--accent-text-contrast)',
              fontWeight: 600,
              cursor:
                isLoading || !input.trim() || !lecture.transcript
                  ? 'not-allowed'
                  : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
