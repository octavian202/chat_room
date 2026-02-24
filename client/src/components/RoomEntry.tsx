import React, { useState } from 'react';

interface RoomEntryProps {
  username: string;
  onEnter: (roomId: string) => void;
  onLogout: () => void;
}

const MAX_ROOM_ID_LENGTH = 100;

export default function RoomEntry({ username, onEnter, onLogout }: RoomEntryProps) {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = roomId.trim();
    if (!trimmed) {
      setError('Please enter a room ID.');
      return;
    }
    if (trimmed.length > MAX_ROOM_ID_LENGTH) {
      setError(`Room ID must not exceed ${MAX_ROOM_ID_LENGTH} characters.`);
      return;
    }
    onEnter(trimmed);
  };

  return (
    <div className="room-entry">
      <header className="room-entry-header">
        <p className="greeting">Hi, {username}</p>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </header>
      <h2>Join a room</h2>
      {error && (
        <div id="room-error" className="form-error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Room id"
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            if (error) setError(null);
          }}
          autoFocus
          maxLength={MAX_ROOM_ID_LENGTH}
          aria-invalid={!!error}
          aria-describedby={error ? 'room-error' : undefined}
        />
        <button type="submit">Enter room</button>
      </form>
    </div>
  );
}
