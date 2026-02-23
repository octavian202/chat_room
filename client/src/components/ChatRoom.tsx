import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

interface ChatRoomProps {
  roomId: string;
  username: string;
  onLeave?: () => void;
}

export default function ChatRoom({ roomId, username, onLeave }: ChatRoomProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${window.location.origin}/ws`),
      onConnect: () => {
        client.subscribe(`/topic/chat/${roomId}`, (msg) => {
          setMessages((prev) => [...prev, JSON.parse(msg.body)]);
        });
        const joinedMsg: ChatMessage = {
          sender: username,
          content: 'joined',
          messageType: 'JOINED',
          roomId,
        };
        client.publish({
          destination: `/app/chat/${roomId}`,
          body: JSON.stringify(joinedMsg),
        });
      },
    });
    stompClient.current = client;
    client.activate();

    axios.get(`/chat/${roomId}`).then((res) => {
      setMessages(res.data.reverse());
    });

    return () => {
      const leftMsg: ChatMessage = {
        sender: username,
        content: 'left',
        messageType: 'LEFT',
        roomId,
      };
      if (stompClient.current?.connected) {
        stompClient.current.publish({
          destination: `/app/chat/${roomId}`,
          body: JSON.stringify(leftMsg),
        });
      }
      stompClient.current?.deactivate();
      stompClient.current = null;
    };
  }, [roomId, username]);

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      const msg: ChatMessage = {
        sender: username,
        content: trimmed,
        messageType: 'TEXT',
        roomId,
      };
      stompClient.current?.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify(msg),
      });
    }
    setInput('');
  };

  return (
    <div className="chat-room">
      <header className="chat-header">
        <span>Room: {roomId}</span>
        {onLeave && (
          <button type="button" onClick={onLeave}>
            Leave
          </button>
        )}
      </header>
      <div className="messages">
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
              <span>{msg.sender} {msg.messageType.toLowerCase()}</span>
            )}
          </div>
        ))}
      </div>
      <form className="send-form" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
