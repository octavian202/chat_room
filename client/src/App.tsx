import { useState } from 'react';
import Login from './components/Login';
import RoomEntry from './components/RoomEntry';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);

  if (!username) {
    return <Login onLogin={setUsername} />;
  }

  if (!roomId) {
    return (
      <RoomEntry
        username={username}
        onEnter={(id) => setRoomId(id)}
      />
    );
  }

  return (
    <ChatRoom
      username={username}
      roomId={roomId}
      onLeave={() => setRoomId(null)}
    />
  );
}

export default App;
