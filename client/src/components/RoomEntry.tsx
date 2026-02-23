import React, { useState } from 'react';

interface RoomEntryProps {
  username: string;
  onEnter: (roomId: string) => void;
}

export default function RoomEntry({ username, onEnter }: RoomEntryProps) {
  const [roomId, setRoomId] = useState('');

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const trimmed = roomId.trim();
    if (trimmed) onEnter(trimmed);
  };

  return (
    <div className="room-entry">
      <p className="greeting">Hi, {username}</p>
      <h2>Join a room</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Room id"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          autoFocus
        />
        <button type="submit">Enter room</button>
      </form>
    </div>
  );
}
