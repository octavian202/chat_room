import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import { getApiUrl, getErrorMessage } from '../api';

const PAGE_SIZE = 20;

interface ChatRoomProps {
  roomId: string;
  username: string;
  onLeave?: () => void;
  onLogout?: () => void;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export default function ChatRoom({ roomId, username, onLeave, onLogout }: ChatRoomProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loadOlderError, setLoadOlderError] = useState<string | null>(null);
  const [olderPage, setOlderPage] = useState(1);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const stompClient = useRef<Client | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollHeightBeforePrepend = useRef<number>(0);
  const hasScrolledToBottomForRoom = useRef(false);

  const SCROLL_THRESHOLD = 80;

  useEffect(() => {
    hasScrolledToBottomForRoom.current = false;
  }, [roomId]);

  useLayoutEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const { scrollTop, clientHeight, scrollHeight } = el;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
    const shouldScroll =
      isNearBottom ||
      (!messagesLoading && messages.length > 0 && !hasScrolledToBottomForRoom.current);
    if (shouldScroll) {
      el.scrollTop = el.scrollHeight;
      hasScrolledToBottomForRoom.current = true;
    }
  }, [messages, messagesLoading]);

  useEffect(() => {
    setConnectionStatus('connecting');
    setConnectionError(null);
    setMessagesError(null);
    setLoadOlderError(null);
    setMessagesLoading(true);

    const wsUrl = getApiUrl('/ws');
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      onWebSocketError: (evt) => {
        const msg =
          evt instanceof ErrorEvent && evt.message
            ? evt.message
            : evt instanceof Error
              ? evt.message
              : 'Failed to connect. Please check your network and try again.';
        setConnectionError(msg);
        setConnectionStatus('error');
      },
      onConnect: () => {
        setConnectionStatus('connected');
        setConnectionError(null);
        try {
          client.subscribe(`/topic/chat/${roomId}`, (msg) => {
            try {
              const parsed = JSON.parse(msg.body) as ChatMessage;
              setMessages((prev) => [...prev, parsed]);
            } catch {
              console.error('Failed to parse incoming message');
            }
          });
          const joinedMsg: ChatMessage = {
            sender: username,
            content: 'joined',
            messageType: 'JOINED',
            roomId,
            timestamp: new Date().toISOString(),
          };
          client.publish({
            destination: `/app/chat/${roomId}`,
            body: JSON.stringify(joinedMsg),
          });
        } catch (err) {
          setConnectionError(err instanceof Error ? err.message : 'Failed to subscribe');
          setConnectionStatus('error');
        }
      },
      onStompError: (frame) => {
        const msg = frame.headers?.message ?? frame.body ?? 'WebSocket connection failed';
        setConnectionError(msg);
        setConnectionStatus('error');
      },
      onWebSocketClose: () => {
        setConnectionStatus('disconnected');
      },
      onDisconnect: () => {
        setConnectionStatus('disconnected');
      },
    });
    stompClient.current = client;
    client.activate();

    axios
      .get<ChatMessage[]>(getApiUrl(`/chat/${roomId}`), {
        params: { pageNumber: 0, pageSize: PAGE_SIZE },
      })
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setMessages([...data].reverse());
          setHasMoreOlder(data.length >= PAGE_SIZE);
          setOlderPage(1);
        } else {
          setMessagesError('Invalid response format');
        }
      })
      .catch((err) => {
        setMessagesError(getErrorMessage(err));
      })
      .finally(() => {
        setMessagesLoading(false);
      });

    return () => {
      const leftMsg: ChatMessage = {
        sender: username,
        content: 'left',
        messageType: 'LEFT',
        roomId,
        timestamp: new Date().toISOString(),
      };
      if (stompClient.current?.connected) {
        try {
          stompClient.current.publish({
            destination: `/app/chat/${roomId}`,
            body: JSON.stringify(leftMsg),
          });
        } catch {
          // Ignore cleanup errors
        }
      }
      stompClient.current?.deactivate();
      stompClient.current = null;
    };
  }, [roomId, username]);

  const loadOlderMessages = useCallback(() => {
    if (loadingOlder || !hasMoreOlder || messagesLoading) return;
    setLoadingOlder(true);
    setLoadOlderError(null);
    const el = messagesContainerRef.current;
    if (el) scrollHeightBeforePrepend.current = el.scrollHeight;

    axios
      .get<ChatMessage[]>(getApiUrl(`/chat/${roomId}`), {
        params: { pageNumber: olderPage, pageSize: PAGE_SIZE },
      })
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          const reversed = [...data].reverse();
          setMessages((prev) => [...reversed, ...prev]);
          setHasMoreOlder(data.length >= PAGE_SIZE);
          setOlderPage((p) => p + 1);
        } else {
          setLoadOlderError('Invalid response format');
        }
      })
      .catch((err) => {
        setLoadOlderError(getErrorMessage(err));
      })
      .finally(() => {
        setLoadingOlder(false);
      });
  }, [roomId, olderPage, hasMoreOlder, loadingOlder, messagesLoading]);

  useLayoutEffect(() => {
    const el = messagesContainerRef.current;
    const prevHeight = scrollHeightBeforePrepend.current;
    if (!el || prevHeight === 0) return;
    scrollHeightBeforePrepend.current = 0;
    const newHeight = el.scrollHeight;
    el.scrollTop += newHeight - prevHeight;
  }, [messages]);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (el.scrollTop < SCROLL_THRESHOLD) {
      loadOlderMessages();
    }
  }, [loadOlderMessages]);

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSendError(null);
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!stompClient.current?.connected) {
      setSendError('Not connected. Please wait for the connection or try leaving and rejoining.');
      return;
    }

    try {
      const msg: ChatMessage = {
        sender: username,
        content: trimmed,
        messageType: 'TEXT',
        roomId,
        timestamp: new Date().toISOString(),
      };
      stompClient.current.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify(msg),
      });
      setInput('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const displayError = connectionError ?? messagesError ?? sendError ?? loadOlderError;

  return (
    <div className="chat-room">
      <header className="chat-header">
        <span>Room: {roomId}</span>
        <span
          className={`status ${connectionStatus === 'connected' ? 'on' : 'off'}`}
          title={connectionStatus}
        >
          {connectionStatus === 'connected'
            ? '● Connected'
            : connectionStatus === 'connecting'
              ? '● Connecting...'
              : connectionStatus === 'error'
                ? '● Error'
                : '● Disconnected'}
        </span>
        <div className="chat-header-actions">
          {onLeave && (
            <button type="button" onClick={onLeave}>
              Leave
            </button>
          )}
          {onLogout && (
            <button type="button" onClick={onLogout}>
              Logout
            </button>
          )}
        </div>
      </header>
      {displayError && (
        <div className="error-banner" role="alert">
          {displayError}
        </div>
      )}
      <div
        ref={messagesContainerRef}
        className="messages"
        onScroll={handleMessagesScroll}
      >
        {messagesLoading ? (
          <div className="messages-loading">Loading messages...</div>
        ) : (
          <>
            {!hasMoreOlder && messages.length > 0 && (
              <div className="messages-no-more" aria-live="polite">
                No older messages
              </div>
            )}
            {loadingOlder && (
              <div className="messages-loading-older">Loading older messages...</div>
            )}
            {messages.map((msg, i) => (
            <div
              key={msg.id ?? i}
              className={`msg ${msg.messageType.toLowerCase()}${
                msg.messageType === 'TEXT' && msg.sender === username ? ' own' : ''
              }`}
            >
              {msg.messageType === 'TEXT' ? (
                <>
                  <span className="sender">{msg.sender}:</span> {msg.content}
                </>
              ) : (
                <span>
                  {msg.sender} {msg.messageType.toLowerCase()}
                </span>
              )}
            </div>
          ))}
          </>
        )}
      </div>
      <form className="send-form" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={4096}
          disabled={connectionStatus !== 'connected'}
        />
        <button type="submit" disabled={connectionStatus !== 'connected'}>
          Send
        </button>
      </form>
    </div>
  );
}
