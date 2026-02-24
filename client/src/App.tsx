import { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import RoomEntry from './components/RoomEntry';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);

  if (!username) {
    return (
      <ErrorBoundary>
        <Login onLogin={setUsername} />
      </ErrorBoundary>
    );
  }

  const onLogout = () => {
    setUsername('');
    setRoomId(null);
  };

  if (!roomId) {
    return (
      <ErrorBoundary>
        <RoomEntry
          username={username}
          onEnter={(id) => setRoomId(id)}
          onLogout={onLogout}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ChatRoom
        username={username}
        roomId={roomId}
        onLeave={() => setRoomId(null)}
        onLogout={onLogout}
      />
    </ErrorBoundary>
  );
}

export default App;
