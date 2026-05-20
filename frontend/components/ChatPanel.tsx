'use client';

import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const FUNCTION_APP_URL = process.env.NEXT_PUBLIC_FUNCTION_APP_URL;

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Upload a PDF on the left, then ask me anything about it.' },
  ]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // Scroll to the latest message whenever messages change.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up the SignalR connection once on mount.
  // The negotiate endpoint gives us a short-lived access token and the
  // SignalR service URL. After that, all communication is browser ↔ SignalR directly.
  useEffect(() => {
    let cancelled = false;

    async function connect() {
      const res = await fetch(`${FUNCTION_APP_URL}/api/negotiate`);
      if (!res.ok || cancelled) return;
      const { url, accessToken, userId: uid } = await res.json();
      if (cancelled) return;

      setUserId(uid);

      const conn = new signalR.HubConnectionBuilder()
        .withUrl(url, { accessTokenFactory: () => accessToken })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // Each 'token' event carries one piece of the streamed response.
      // We append it to the last message if it's still streaming,
      // or start a new message if it's the first token.
      conn.on('token', ({ content }: { content: string }) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.streaming) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + content },
            ];
          }
          return [...prev, { role: 'assistant', content, streaming: true }];
        });
      });

      // 'done' signals the stream has ended — remove the streaming flag
      // so the UI stops showing the cursor and re-enables the input.
      conn.on('done', () => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.streaming) {
            return [...prev.slice(0, -1), { ...last, streaming: false }];
          }
          return prev;
        });
        setStreaming(false);
      });

      conn.on('error', ({ message }: { message: string }) => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${message}` },
        ]);
        setStreaming(false);
      });

      conn.onclose(() => setConnected(false));
      conn.onreconnected(() => setConnected(true));

      await conn.start();
      if (!cancelled) {
        connectionRef.current = conn;
        setConnected(true);
      }
    }

    connect().catch(console.error);
    return () => {
      cancelled = true;
      connectionRef.current?.stop();
    };
  }, []);

  async function handleSend() {
    const question = input.trim();
    if (!question || !userId || streaming || !connected) return;

    setInput('');
    setStreaming(true);
    setMessages((prev) => [...prev, { role: 'user', content: question }]);

    await fetch(`${FUNCTION_APP_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, userId }),
    });
    // Response tokens arrive via SignalR — nothing more to do here.
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chat</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {connected ? 'Connected' : 'Connecting…'}
        </span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
            }`}>
              {msg.content}
              {/* Blinking cursor while streaming */}
              {msg.streaming && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-gray-400 animate-pulse align-text-bottom" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={connected ? 'Ask a question…' : 'Connecting…'}
          disabled={!connected || streaming}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !connected || streaming}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
